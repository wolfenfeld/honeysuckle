// Points and cat cards. Points are earned at the end of a round, a pack costs COST points
// and gives one random card. State lives in this browser; once a member signs in it moves to
// Firestore (rewards/{uid}) so it follows them between devices.
import { CARDS, RARITY, COST } from "./cards.js";
export { COST };

const LKEY = "honey-rewards-v1", AKEY = "honey-awarded-v1";
let st = { points: 0, cards: {}, opened: 0 }, mode = "local", be = null, uid = null;
const subs = [], memAwarded = {};
const norm = (r) => ({ points: Math.max(0, +r?.points || 0), cards: { ...(r?.cards || {}) }, opened: +r?.opened || 0 });
const rd = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const notify = () => subs.forEach((f) => f(st));
const saveLocal = () => { if (mode === "local") wr(LKEY, st); };
st = norm(rd(LKEY));

function push(delta) { // delta = {points, cards, opened}
  if (mode !== "cloud") return saveLocal();
  be.addRewards(uid, delta).catch(async () => {
    console.warn("rewards: cloud write failed");
    try { st = norm(await be.getRewards(uid)); notify(); } catch {}
  });
}
function draw() {
  const total = Object.values(RARITY).reduce((a, r) => a + r.weight, 0);
  let x = Math.random() * total, rarity = 1;
  for (const [k, r] of Object.entries(RARITY)) { if ((x -= r.weight) < 0) { rarity = +k; break; } }
  const pool = CARDS.filter((c) => c.r === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

export const Rewards = {
  COST, get state() { return st; }, get mode() { return mode; },
  onChange(f) { subs.push(f); },

  // Member signed in: fold anything earned locally into the cloud doc, then use the cloud as the source.
  async attach(backend, user) {
    try {
      const local = norm(rd(LKEY));
      const has = local.points > 0 || Object.keys(local.cards).length > 0;
      if (has) { await backend.addRewards(user.uid, local); try { localStorage.removeItem(LKEY); } catch {} }
      st = norm(await backend.getRewards(user.uid));
      be = backend; uid = user.uid; mode = "cloud";
    } catch (e) { console.warn("rewards attach", e); mode = "local"; st = norm(rd(LKEY)); }
    notify();
  },
  detach() { be = null; uid = null; mode = "local"; st = norm(rd(LKEY)); notify(); },

  // Give the points of one round. The same key never pays twice: a re-check only pays the difference.
  // persist=true remembers the key across reloads (used for the once-a-day worksheet).
  award(key, points, { persist = false } = {}) {
    const book = persist ? rd(AKEY) || {} : memAwarded;
    const delta = Math.max(0, Math.floor(points) - (book[key] || 0));
    if (!delta) return 0;
    book[key] = Math.floor(points);
    if (persist) { const keep = Object.fromEntries(Object.entries(book).slice(-30)); wr(AKEY, keep); }
    st.points += delta; push({ points: delta }); notify();
    return delta;
  },

  // Spend COST points on a random card. Returns { card, isNew, count } or null.
  open() {
    if (st.points < COST) return null;
    const card = draw();
    st.points -= COST; st.cards[card.id] = (st.cards[card.id] || 0) + 1; st.opened++;
    push({ points: -COST, cards: { [card.id]: 1 }, opened: 1 }); notify();
    return { card, isNew: st.cards[card.id] === 1, count: st.cards[card.id] };
  },
};
