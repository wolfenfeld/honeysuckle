// Firebase backend: Google sign-in, guest list, profiles and hall-of-fame scores.
const V = "13.1.0";
const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
const {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut: fbSignOut,
} = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
const {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, getDocs, setDoc, deleteDoc, collection, writeBatch, serverTimestamp,
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
