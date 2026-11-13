// Friends: pending counts for the badge, and collecting the result of trades you started.
import { Rewards, MAX_COPIES } from "./rewards.js";
import { cardById } from "./cardview.js";

// Cards you offered that the other person answered: collect the card you wanted (accepted)
// or your own card back (declined). Returns a list of messages to show.
export async function claimTrades(be, uid, nameOf) {
  const { outgoing } = await be.listTrades(uid);
  const msgs = [];
  for (const tr of outgoing.filter((t) => !t.claimed && (t.status === "accepted" || t.status === "declined"))) {
    const id = tr.status === "accepted" ? tr.want : tr.give;
    const owned = Rewards.state.cards[id] || 0;
    const delta = owned >= MAX_COPIES ? { points: 5 } : { cards: { [id]: 1 } }; // already maxed: 5 stars instead
    try {
      await be.claimTrade(uid, tr, delta);
      await Rewards.refresh();
      const card = cardById[id]?.he || "קלף";
      const who = nameOf?.(tr.to) || "חבר";
      msgs.push(tr.status === "accepted"
        ? (delta.points ? `ההחלפה עם ${who} הושלמה. כבר היו לך 3 מ-${card}, אז קיבלת 5 ⭐` : `ההחלפה עם ${who} הושלמה! קיבלת את ${card} 🐱`)
        : `${who} דחה את ההצעה. ${card} חזר אליך.`);
    } catch (e) { console.warn("claim trade", e); }
  }
  return msgs;
}

// How many things are waiting for you: challenges to play and trade offers to answer.
export async function pendingCount(be, uid) {
  try {
    const [c, t] = await Promise.all([be.listChallenges(uid), be.listTrades(uid)]);
    return c.received.filter((x) => x.status === "pending").length + t.incoming.filter((x) => x.status === "open").length;
  } catch { return 0; }
}
