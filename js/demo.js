// Local preview backend (add ?demo to any page). No Firebase: everything lives in this browser,
// with a few made-up players so the hall of fame has something to show.
export function createDemoBackend(adminEmails = []) {
  const K = (s) => `honey-demo-${s}`;
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(K(k))) ?? d; } catch { return d; } };
  const user = { uid: "demo", email: adminEmails[0] || "demo@example.com", name: "Demo player", photo: get("photo", ""), verified: true }; // set localStorage honey-demo-photo to preview a Google picture
  const set = (k, v) => { try { localStorage.setItem(K(k), JSON.stringify(v)); } catch {} };
  let listeners = [], signedIn = get("in", true);
  const fire = () => listeners.forEach((cb) => cb(signedIn ? user : null));
  const others = {
    u1: { name: "נועה", avatar: "🦊" }, u2: { name: "איתי", avatar: "🐼" },
    u3: { name: "מאיה", avatar: "🦄" }, u4: { name: "דניאל", avatar: "🐸" }, u5: { name: "תמר", avatar: "🦋" },
  };
  const fake = [
    ["u1", "math", 33, 36], ["u2", "math", 29, 36], ["u3", "math", 36, 36], ["u4", "math", 21, 36],
    ["u1", "worksheet", 28, 30], ["u3", "worksheet", 30, 30], ["u5", "worksheet", 19, 30],
    ["u2", "dictation", 64, 0], ["u3", "dictation", 118, 0], ["u5", "dictation", 41, 0],
    ["u1", "quiz", 18, 20], ["u4", "quiz", 10, 10], ["u5", "quiz", 14, 20],
  ].map(([uid, game, best, total], i) => ({ uid, game, best, total, at: 1700000000000 + i * 1000 }));
  return {
    kind: "demo",
    onAuth(cb) { listeners.push(cb); setTimeout(() => cb(signedIn ? user : null)); return () => {}; },
    async signIn() { signedIn = true; set("in", true); fire(); },
    async signOut() { signedIn = false; set("in", false); fire(); },
    async membership() { return { role: "admin" }; },
    async redeemInvite() {},
    async inviteEmail() {},
    async ensureInviteLink(uid) { return "f" + uid; },
    async getProfile() { return get("profile", null); },
    async saveProfile(uid, p) { set("profile", p); },
    async getScores() { return get("scores", {}); },
    async saveScore(uid, game, best, total) {
      const s = get("mine", {}); s[game] = { best, total, at: Date.now() }; set("mine", s);
      const b = get("scores", {}); b[game] = best; set("scores", b);
    },
    async leaderboard() {
      const mine = Object.entries(get("mine", {})).map(([game, v]) => ({ uid: "demo", game, ...v }));
      const profiles = { ...others, demo: get("profile", { name: "אני", avatar: "⭐" }) };
      return { scores: [...fake, ...mine], profiles };
    },
    async getRewards() { return get("rewards", null); },
    async addRewards(uid, { points = 0, cards = {}, opened = 0 }) {
      const r = get("rewards", { points: 0, cards: {}, opened: 0 });
      r.points = Math.max(0, r.points + points); r.opened += opened;
      Object.entries(cards).forEach(([id, n]) => { r.cards[id] = (r.cards[id] || 0) + n; });
      set("rewards", r);
    },
    // ----- friends (simulated) -----
    async listProfiles() { return [{ uid: "demo", ...get("profile", { name: "אני", avatar: "⭐" }) }, ...Object.entries(others).map(([uid, p]) => ({ uid, ...p }))]; },
    async getRewardsOf(uid) {
      if (uid === "demo") return get("rewards", { points: 0, cards: {}, opened: 0 });
      const cards = { u1: { "03": 2, "05": 3, "12": 1, "19": 2 }, u2: { "01": 2, "08": 2, "25": 1 }, u3: { "02": 3, "29": 2, "30": 1 } }[uid] || { "04": 2 };
      return { points: 0, cards, opened: 0 };
    },
    async createChallenge(c) { const l = get("challenges", []); const id = "c" + Date.now(); l.push({ id, ...c, status: "pending", createdAt: Date.now() }); set("challenges", l); return id; },
    async getChallenge(id) { return get("challenges", []).find((c) => c.id === id) || null; },
    async listChallenges(uid) {
      let l = get("challenges", []);
      if (!l.some((c) => c.id === "seed1")) { l.push({ id: "seed1", from: "u2", to: "demo", game: "math", seed: 4242, size: 5, status: "pending", createdAt: Date.now() }); set("challenges", l); }
      return { received: l.filter((c) => c.to === uid).reverse(), sent: l.filter((c) => c.from === uid).reverse() };
    },
    async completeChallenge(id, correct) { set("challenges", get("challenges", []).map((c) => (c.id === id ? { ...c, status: "done", correct } : c))); },
    async createTrade(uid, t) {
      const l = get("trades", []); const id = "t" + Date.now();
      l.push({ id, from: uid, to: t.to, give: t.give, want: t.want, status: "accepted", claimed: false, createdAt: Date.now() }); // the demo friend says yes right away
      set("trades", l);
      const r = get("rewards", { points: 0, cards: {}, opened: 0 }); r.cards[t.give] = (r.cards[t.give] || 1) - 1; if (!r.cards[t.give]) delete r.cards[t.give]; set("rewards", r);
      return id;
    },
    async listTrades(uid) {
      let l = get("trades", []);
      if (!l.some((t) => t.id === "seedT")) { l.push({ id: "seedT", from: "u1", to: "demo", give: "03", want: "01", status: "open", claimed: false, createdAt: Date.now() }); set("trades", l); }
      return { incoming: l.filter((t) => t.to === uid).reverse(), outgoing: l.filter((t) => t.from === uid).reverse() };
    },
    async respondTrade(uid, tr, accept) {
      set("trades", get("trades", []).map((t) => (t.id === tr.id ? { ...t, status: accept ? "accepted" : "declined", claimed: accept ? true : t.claimed } : t)));
      if (accept) { const r = get("rewards", { points: 0, cards: {}, opened: 0 }); r.cards[tr.want] = (r.cards[tr.want] || 1) - 1; if (!r.cards[tr.want]) delete r.cards[tr.want]; r.cards[tr.give] = (r.cards[tr.give] || 0) + 1; set("rewards", r); }
    },
    async cancelTrade(uid, tr) {
      set("trades", get("trades", []).map((t) => (t.id === tr.id ? { ...t, status: "cancelled", claimed: true } : t)));
      const r = get("rewards", { points: 0, cards: {}, opened: 0 }); r.cards[tr.give] = (r.cards[tr.give] || 0) + 1; set("rewards", r);
    },
    async claimTrade(uid, tr, delta) {
      set("trades", get("trades", []).map((t) => (t.id === tr.id ? { ...t, claimed: true } : t)));
      const r = get("rewards", { points: 0, cards: {}, opened: 0 });
      r.points += delta.points || 0; Object.entries(delta.cards || {}).forEach(([id, n]) => { r.cards[id] = (r.cards[id] || 0) + n; }); set("rewards", r);
    },
    async listMembers() { return [{ email: "friend@example.com", role: "member" }]; },
    async addMember() {}, async removeMember() {},
    async listInvites() { return []; },
    async createInvite() { return "demo-invite-code"; },
    async deleteInvite() {},
  };
}
