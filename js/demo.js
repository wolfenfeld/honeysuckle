// Local preview backend (add ?demo to any page). No Firebase: everything lives in this browser,
// with a few made-up players so the hall of fame has something to show.
export function createDemoBackend(adminEmails = []) {
  const user = { uid: "demo", email: adminEmails[0] || "demo@example.com", name: "Demo player", photo: "", verified: true };
  const K = (s) => `honey-demo-${s}`;
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(K(k))) ?? d; } catch { return d; } };
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
    async listMembers() { return [{ email: "friend@example.com", role: "member" }]; },
    async addMember() {}, async removeMember() {},
    async listInvites() { return []; },
    async createInvite() { return "demo-invite-code"; },
    async deleteInvite() {},
  };
}
