// Firebase backend: Google sign-in, guest list, profiles and hall-of-fame scores.
const V = "13.1.0";
const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
const {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut: fbSignOut,
} = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
const {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, getDocs, setDoc, deleteDoc, collection, writeBatch, serverTimestamp, increment, query, where, updateDoc,
} = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);

export function createBackend(config, adminEmails) {
  const app = initializeApp(config);
  const auth = getAuth(app);
  let db;
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    db = initializeFirestore(app, {});
  }
  getRedirectResult(auth).catch(() => {});

  const lower = (e) => (e || "").trim().toLowerCase();
  const isAdminEmail = (e) => adminEmails.map(lower).includes(lower(e));
  const userOf = (u) => u && ({
    uid: u.uid, email: lower(u.email), name: u.displayName || u.email, photo: u.photoURL || "",
    verified: u.emailVerified,
  });
  // Wallet change as increments, so two devices (or a retry) never overwrite each other.
  const patch = ({ points = 0, cards = {}, opened = 0 }) => {
    const d = { points: increment(points), opened: increment(opened), cards: {}, updatedAt: serverTimestamp() };
    Object.entries(cards).forEach(([id, n]) => { d.cards[id] = increment(n); });
    return d;
  };
  const rewardsRef = (uid) => doc(db, "rewards", uid);
  const withId = (d) => ({ id: d.id, ...d.data() });
  const millis = (t) => (t && t.toMillis ? t.toMillis() : 0);

  return {
    kind: "firebase",

    onAuth(cb) { return onAuthStateChanged(auth, (u) => cb(userOf(u))); },

    async signIn() {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(e.code)) {
          await signInWithRedirect(auth, provider);
        } else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
          throw e;
        }
      }
    },
    signOut() { return fbSignOut(auth); },

    async membership(user) {
      if (isAdminEmail(user.email)) return { role: "admin" };
      const snap = await getDoc(doc(db, "members", user.email));
      return snap.exists() ? { role: snap.data().role || "member" } : null;
    },

    async redeemInvite(code, user) {
      const ref = doc(db, "invites", code);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("קישור ההזמנה הזה לא תקין.");
      if (snap.data().usedBy) throw new Error("קישור ההזמנה הזה כבר נוצל.");
      const b = writeBatch(db);
      b.set(doc(db, "members", user.email), { role: "member", invite: code, joinedAt: serverTimestamp(), name: user.name || "" });
      b.update(ref, { usedBy: user.email, usedAt: serverTimestamp() });
      await b.commit();
    },

    // ----- profile & scores -----
    async getProfile(uid) {
      const s = await getDoc(doc(db, "profiles", uid));
      return s.exists() ? s.data() : null;
    },
    saveProfile(uid, p) {
      return setDoc(doc(db, "profiles", uid), { name: p.name, avatar: p.avatar, updatedAt: serverTimestamp() });
    },
    async getScores(uid) {
      const games = ["math", "worksheet", "dictation", "quiz"];
      const snaps = await Promise.all(games.map((g) => getDoc(doc(db, "scores", `${uid}_${g}`))));
      const out = {};
      snaps.forEach((d, i) => { if (d.exists()) out[games[i]] = d.data().best; });
      return out;
    },
    saveScore(uid, game, best, total) {
      return setDoc(doc(db, "scores", `${uid}_${game}`), { uid, game, best, total: total || 0, updatedAt: serverTimestamp() });
    },
    async leaderboard() {
      const [sc, pr] = await Promise.all([getDocs(collection(db, "scores")), getDocs(collection(db, "profiles"))]);
      const profiles = {};
      pr.forEach((d) => { profiles[d.id] = d.data(); });
      return { scores: sc.docs.map((d) => ({ ...d.data(), at: millis(d.data().updatedAt) })), profiles };
    },

    // ----- rewards (points + cat cards) -----
    async getRewardsOf(uid) { const s = await getDoc(rewardsRef(uid)); return s.exists() ? s.data() : { points: 0, cards: {}, opened: 0 }; },
    async getRewards(uid) {
      const s = await getDoc(doc(db, "rewards", uid));
      return s.exists() ? s.data() : null;
    },
    // Uses increments so two devices (or a retry) never overwrite each other.
    addRewards(uid, delta) { return setDoc(rewardsRef(uid), patch(delta), { merge: true }); },

    // ----- friends: challenges -----
    async listProfiles() {
      const snap = await getDocs(collection(db, "profiles"));
      return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    },
    async createChallenge(c) {
      const ref = doc(collection(db, "challenges"));
      await setDoc(ref, { from: c.from, to: c.to, game: c.game, seed: c.seed, size: c.size, status: "pending", createdAt: serverTimestamp() });
      return ref.id;
    },
    async getChallenge(id) {
      const s = await getDoc(doc(db, "challenges", id));
      return s.exists() ? withId(s) : null;
    },
    async listChallenges(uid) {
      const [r, s] = await Promise.all([
        getDocs(query(collection(db, "challenges"), where("to", "==", uid))),
        getDocs(query(collection(db, "challenges"), where("from", "==", uid))),
      ]);
      const byTime = (a, b) => millis(b.createdAt) - millis(a.createdAt);
      return { received: r.docs.map(withId).sort(byTime), sent: s.docs.map(withId).sort(byTime) };
    },
    completeChallenge(id, correct) {
      return updateDoc(doc(db, "challenges", id), { status: "done", correct, doneAt: serverTimestamp() });
    },

    // ----- friends: card trades (the offered card is held in escrow in the trade) -----
    async createTrade(uid, t) {
      const b = writeBatch(db), ref = doc(collection(db, "trades"));
      b.set(ref, { from: uid, to: t.to, give: t.give, want: t.want, status: "open", claimed: false, createdAt: serverTimestamp() });
      b.set(rewardsRef(uid), patch({ cards: { [t.give]: -1 } }), { merge: true });
      await b.commit();
      return ref.id;
    },
    async listTrades(uid) {
      const [i, o] = await Promise.all([
        getDocs(query(collection(db, "trades"), where("to", "==", uid))),
        getDocs(query(collection(db, "trades"), where("from", "==", uid))),
      ]);
      const byTime = (a, b) => millis(b.createdAt) - millis(a.createdAt);
      return { incoming: i.docs.map(withId).sort(byTime), outgoing: o.docs.map(withId).sort(byTime) };
    },
    // Recipient answers: accepting swaps cards on their side; the sender collects theirs on next visit.
    async respondTrade(uid, tr, accept) {
      const b = writeBatch(db), ref = doc(db, "trades", tr.id);
      if (accept) b.set(rewardsRef(uid), patch({ cards: { [tr.want]: -1, [tr.give]: 1 } }), { merge: true });
      b.update(ref, { status: accept ? "accepted" : "declined", doneAt: serverTimestamp() });
      await b.commit();
    },
    async cancelTrade(uid, tr) {
      const b = writeBatch(db);
      b.update(doc(db, "trades", tr.id), { status: "cancelled", claimed: true, doneAt: serverTimestamp() });
      b.set(rewardsRef(uid), patch({ cards: { [tr.give]: 1 } }), { merge: true });
      await b.commit();
    },
    // Sender collects the outcome: the wanted card (accepted) or the escrowed card back (declined).
    async claimTrade(uid, tr, delta) {
      const b = writeBatch(db);
      b.set(rewardsRef(uid), patch(delta), { merge: true });
      b.update(doc(db, "trades", tr.id), { claimed: true });
      await b.commit();
    },

    // ----- admin -----
    async listMembers() {
      const snap = await getDocs(collection(db, "members"));
      return snap.docs.map((d) => ({ email: d.id, ...d.data() }));
    },
    addMember(email, by) {
      return setDoc(doc(db, "members", lower(email)), { role: "member", addedBy: by, joinedAt: serverTimestamp() });
    },
    removeMember(email) { return deleteDoc(doc(db, "members", lower(email))); },
    async listInvites() {
      const snap = await getDocs(collection(db, "invites"));
      return snap.docs.map((d) => ({ code: d.id, ...d.data() }));
    },
    async createInvite(by, note) {
      const bytes = crypto.getRandomValues(new Uint8Array(18));
      const code = Array.from(bytes, (x) => x.toString(36).padStart(2, "0")).join("").slice(0, 24);
      await setDoc(doc(db, "invites", code), { createdBy: by, note: note || "", createdAt: serverTimestamp(), usedBy: null });
      return code;
    },
    deleteInvite(code) { return deleteDoc(doc(db, "invites", code)); },
  };
}
