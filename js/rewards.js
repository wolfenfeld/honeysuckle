// Stars and cat cards. Stars are earned at the end of a round, a pack costs COST points
// and gives one random card. State lives in this browser; once a member signs in it moves to
// Firestore (rewards/{uid}) so it follows them between devices.
import { CARDS, RARITY, COST, MAX_COPIES } from "./cards.js";
export { COST, MAX_COPIES };

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
// Pick a rarity by weight, then a card of that rarity that is not already at MAX_COPIES.
function draw() {
  const open = CARDS.filter((c) => (st.cards[c.id] || 0) < MAX_COPIES);
  if (!open.length) return null;
  const rarities = [...new Set(open.map((c) => c.r))];
  const total = rarities.reduce((a, r) => a + RARITY[r].weight, 0);
  let x = Math.random() * total, rarity = rarities[0];
  for (const r of rarities) { if ((x -= RARITY[r].weight) < 0) { rarity = r; break; } }
  const pool = open.filter((c) => c.r === rarity);
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
  // Pick up changes made elsewhere (an embedded page writing to the same wallet).
  async sync() { if (mode === "cloud") return Rewards.refresh(); st = norm(rd(LKEY)); notify(); },
  async refresh() { // re-read the cloud wallet (after a trade, for example)
    if (mode !== "cloud") return;
    try { st = norm(await be.getRewards(uid)); notify(); } catch {}
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
    if (!card) return null; // every card is already at MAX_COPIES
    st.points -= COST; st.cards[card.id] = (st.cards[card.id] || 0) + 1; st.opened++;
    push({ points: -COST, cards: { [card.id]: 1 }, opened: 1 }); notify();
    return { card, isNew: st.cards[card.id] === 1, count: st.cards[card.id] };
  },
};
