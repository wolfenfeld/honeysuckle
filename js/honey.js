// Honeysuckle: login, profile and hall-of-fame glue shared by every page.
// Loaded with <script type="module" src="js/honey.js">. Exposes window.Honey.
import { firebaseConfig, adminEmails } from "./firebase-config.js";
import { Rewards, COST } from "./rewards.js";
import { claimTrades, pendingCount } from "./social.js";

export const GAMES = {
  math:      { title: "חשבון ביער הגשם", icon: "🌴", unit: (b) => `${b} תרגילים`, blurb: "הכי הרבה תרגילים שנפתרו בסך הכול" },
  worksheet: { title: "תרגילי המבחן",   icon: "📐", unit: (b, t) => `${b} מתוך ${t || 30}`, blurb: "הציון הכי גבוה מתוך 30 תרגילים" },
  dictation: { title: "הכתבה",          icon: "✏️", unit: (b) => `${b} ⭐`,                   blurb: "הכי הרבה כוכבים שנאספו" },
  quiz:      { title: "בוחן מילים",     icon: "🔤", unit: (b, t) => `${b} מתוך ${t || b}`,    blurb: "הכי הרבה תשובות נכונות בסיבוב (10 מילים ומעלה)" },
};
export const AVATARS = ["🦊", "🐼", "🦄", "🐸", "🐱", "🐶", "🦋", "🐢", "🦁", "🐙", "🌸", "⭐"];

const params = new URLSearchParams(location.search);
const ss = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} },
  del: (k) => { try { sessionStorage.removeItem(k); } catch {} },
};
if (params.has("demo")) ss.set("honey-demo", "1");
if (params.get("invite")) ss.set("honey-invite", params.get("invite"));
const demo = ss.get("honey-demo") === "1";
const configured = !String(firebaseConfig.apiKey || "").startsWith("REPLACE");

let be = null;
try {
  if (demo) be = (await import("./demo.js")).createDemoBackend(adminEmails);
  else if (configured) be = (await import("./fb.js")).createBackend(firebaseConfig, adminEmails);
} catch (e) { console.warn("Honey: backend unavailable", e); be = null; }

const S = { user: null, role: null, profile: null, best: {}, error: "", loaded: false, pending: 0 };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const homeUrl = (p = "") => new URL(p, new URL("./", import.meta.url).href.replace(/js\/$/, "")).href;
let resolveReady; const ready = new Promise((r) => (resolveReady = r));

export const Honey = {
  enabled: !!be, demo, ready, GAMES, AVATARS,
  get user() { return S.user; }, get profile() { return S.profile; }, get role() { return S.role; },
  get best() { return S.best; },
  get isMember() { return !!S.role; }, get isAdmin() { return S.role === "admin"; },
  backend: be, homeUrl, Rewards,
  signIn: () => be.signIn().catch((e) => toast("הכניסה לא הצליחה: " + (e.message || e))),
  signOut: () => be.signOut(),
  editProfile: () => profileDialog(false),
  // One tap: share your personal invite link (WhatsApp etc. via the share sheet, or copy it).
  async invite() {
    if (!S.user || !S.role) return toast("צריך להיכנס כדי להזמין חברים");
    try {
      const code = await be.ensureInviteLink(S.user.uid);
      const url = homeUrl("index.html?invite=" + encodeURIComponent(code));
      const text = `בואו לשחק איתי ב"הלמידה של יערה"! 🐱 אוספים קלפי חתולים ומאתגרים חברים.`;
      if (navigator.share) { try { await navigator.share({ title: "הלמידה של יערה", text, url }); return; } catch (e) { if (e.name === "AbortError") return; } }
      try { await navigator.clipboard.writeText(`${text}\n${url}`); toast("הקישור הועתק. אפשר להדביק בוואטסאפ 📋"); }
      catch { prompt("העתיקי ושלחי לחברים:", url); }
    } catch (e) { console.warn(e); toast("לא הצלחנו ליצור קישור. נסי שוב."); }
  },
  onChange(cb) { listeners.push(cb); },
  async leaderboard() {
    const { scores, profiles } = await be.leaderboard();
    const out = Object.fromEntries(Object.keys(GAMES).map((g) => [g, []]));
    scores.filter((x) => out[x.game]).forEach((x) => {
      const p = profiles[x.uid] || {};
      out[x.game].push({ uid: x.uid, name: p.name || "שחקנית", avatar: p.avatar || "⭐", best: x.best, total: x.total, at: x.at || 0 });
    });
    Object.values(out).forEach((a) => a.sort((m, n) => n.best - m.best || m.at - n.at));
    return out;
  },
  async submit(game, best, total) {
    await be.saveScore(S.user.uid, game, best, total);
    S.best[game] = best;
  },
  // Called by the games when a round ends: pays points (once per key) and shows a small "+N" toast.
  award(key, points, opts) {
    const d = Rewards.award(key, points, opts);
    if (d > 0) pointsToast(d);
    return d;
  },
  // Called by the games when a round ends. Shows a "post to hall of fame" card if it's a new personal best.
  offer(game, best, total) {
    if (!be || !GAMES[game] || !(best > 0)) return;
    const label = `${GAMES[game].icon} ${GAMES[game].title}: ${GAMES[game].unit(best, total)}`;
    if (!S.loaded) return;
    if (!S.user) return card(`<b>${esc(label)}</b><span>התחברי כדי לפרסם בהיכל התהילה</span>`, [["כניסה", () => Honey.signIn(), true]]);
    if (!S.role) return;
    if (best <= (S.best[game] ?? 0)) return;
    const name = S.profile?.name ? `, <bdi>${esc(S.profile.name)}</bdi>` : "";
    card(`<b>כל הכבוד${name}! 🎉</b><span>${esc(label)}. זה שיא אישי חדש.</span>`, [
      ["פרסום בהיכל התהילה 🏆", async (btn) => {
        btn.disabled = true;
        try { await Honey.submit(game, best, total); card(`<b>פורסם! 🏆</b><span>${esc(label)}</span>`, [["להיכל התהילה", () => (location.href = homeUrl("hall.html")), true]], 6000); }
        catch (e) { btn.disabled = false; toast("לא הצלחנו לפרסם. נסי שוב בעוד רגע."); }
      }, true],
      ["לא עכשיו", () => closeCard(), false],
    ]);
  },
};
const listeners = [];
window.Honey = Honey;

/* ---------- UI ---------- */
const CSS = `
.hc,.hc *{box-sizing:border-box;font-family:"Rubik",system-ui,sans-serif}
.hc{--i:#1f2a44;--m:#5b6782;--l:#d6dded;--c:#fff;--a:#d63b70;--g:#f2b705;direction:rtl;color:var(--i)}
.hc-bar{position:fixed;top:max(8px,env(safe-area-inset-top,0px));left:max(8px,env(safe-area-inset-left,0px));z-index:40;display:flex;gap:6px;align-items:center}
body{margin-top:46px!important}
.hc [hidden]{display:none!important}
.hc-btn{border:2px solid var(--l);background:var(--c);color:var(--i);border-radius:999px;padding:6px 12px;font-size:.9rem;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.15);max-width:60vw;line-height:1.2}
.hc-btn:hover{border-color:var(--g)}
.hc-btn.pri{background:var(--a);border-color:var(--a);color:#fff}
.hc-btn.gold{background:var(--g);border-color:var(--g);color:#3b2d00}
.hc-btn span.n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hc-menu{position:absolute;top:calc(100% + 6px);left:0;min-width:190px;background:var(--c);border:2px solid var(--l);border-radius:14px;padding:6px;box-shadow:0 10px 24px rgba(0,0,0,.25);display:flex;flex-direction:column}
.hc-menu a,.hc-menu button{border:0;background:none;text-align:right;padding:9px 12px;border-radius:10px;font-size:.95rem;color:var(--i);cursor:pointer;text-decoration:none}
.hc-menu a:hover,.hc-menu button:hover{background:#eef2fb}
.hc-menu small{padding:6px 12px;color:var(--m);overflow-wrap:anywhere}
.hc-card{position:fixed;z-index:60;bottom:max(14px,env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);width:min(440px,calc(100vw - 24px));background:var(--c);border:3px solid var(--g);border-radius:18px;padding:14px 16px;box-shadow:0 14px 34px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:6px;animation:hcup .25s ease-out}
.hc-card span{color:var(--m);font-size:.95rem}
.hc-card .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
@keyframes hcup{from{transform:translate(-50%,20px);opacity:0}}
.hc-dlg{border:0;border-radius:20px;padding:0;max-width:min(420px,calc(100vw - 24px));width:100%;background:var(--c);color:var(--i);box-shadow:0 20px 50px rgba(0,0,0,.4)}
.hc-dlg::backdrop{background:rgba(10,18,36,.55)}
.hc-dlg form,.hc-dlg .body{padding:20px;display:flex;flex-direction:column;gap:12px}
.hc-dlg h2{margin:0;font-size:1.3rem}
.hc-dlg p{margin:0;color:var(--m)}
.hc-dlg input[type=text]{font:inherit;font-size:1.1rem;padding:10px 12px;border:2px solid var(--l);border-radius:12px;width:100%;color:var(--i);background:#fff}
.hc-av{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
.hc-av label{cursor:pointer}
.hc-av input{position:absolute;opacity:0}
.hc-av span{display:grid;place-items:center;font-size:1.7rem;aspect-ratio:1;border-radius:12px;border:2px solid var(--l);background:#fff}
.hc-av input:checked+span{border-color:var(--a);background:#fde6ee}
.hc-av input:focus-visible+span{outline:3px solid var(--g)}
.hc-dlg .row{display:flex;gap:8px;justify-content:flex-start}
.hc-toast{position:fixed;z-index:70;bottom:20px;left:50%;transform:translateX(-50%);background:#1f2a44;color:#fff;padding:10px 18px;border-radius:999px;font-size:.95rem;max-width:calc(100vw - 24px)}
.hc-chip{background:#fff4c2;border-color:#f2b705}
.hc-chip.ready{animation:hcpulse 1.4s ease-in-out infinite}
@keyframes hcpulse{50%{transform:scale(1.07)}}
.hc-pts{position:fixed;z-index:65;top:calc(max(8px,env(safe-area-inset-top,0px)) + 52px);left:50%;transform:translateX(-50%);width:min(340px,calc(100vw - 24px));background:#fff;border:3px solid #f2b705;border-radius:16px;padding:10px 14px;box-shadow:0 12px 28px rgba(0,0,0,.3);display:flex;flex-direction:column;gap:6px;animation:hcdown .25s ease-out}
@keyframes hcdown{from{transform:translate(-50%,-14px);opacity:0}}
.hc-pts b{font-size:1.15rem}
.hc-pts .bar{height:10px;border-radius:99px;background:#eef2fb;overflow:hidden}
.hc-pts .bar i{display:block;height:100%;background:linear-gradient(90deg,#f2b705,#ff7a59);transition:width .4s}
.hc-pts span{color:#5b6782;font-size:.9rem}
@media (prefers-reduced-motion:reduce){.hc-card,.hc-pts,.hc-chip.ready{animation:none}}
`;
const root = document.createElement("div");
root.className = "hc";
const st = document.createElement("style"); st.textContent = CSS;
const bar = document.createElement("div"); bar.className = "hc-bar";
root.append(bar);
function mount() { document.head.append(st); document.body.append(root); }
if (document.body) mount(); else addEventListener("DOMContentLoaded", mount);

function el(tag, attrs = {}, html = "") { const e = document.createElement(tag); Object.assign(e, attrs); e.innerHTML = html; return e; }
function toast(msg) {
  const t = el("div", { className: "hc-toast", role: "status" }, esc(msg)); root.append(t); setTimeout(() => t.remove(), 3500);
}
let cardEl = null, cardTimer = 0;
function closeCard() { cardEl?.remove(); cardEl = null; clearTimeout(cardTimer); }
function card(html, actions = [], autoClose = 0) {
  closeCard();
  cardEl = el("div", { className: "hc-card", role: "status" }, html);
  const row = el("div", { className: "row" });
  actions.forEach(([label, fn, primary]) => {
    const b = el("button", { className: "hc-btn" + (primary ? " gold" : ""), type: "button" }, esc(label));
    b.onclick = () => fn(b); row.append(b);
  });
  if (actions.length) cardEl.append(row);
  root.append(cardEl);
  if (autoClose) cardTimer = setTimeout(closeCard, autoClose);
}

function pointsToast(d) {
  document.querySelector(".hc-pts")?.remove(); clearTimeout(pointsToast.t);
  const pts = Rewards.state.points, ready = pts >= COST;
  const t = el("div", { className: "hc-pts", role: "status" }, `
    <b>+${d} ⭐ כוכבים!</b>
    <div class="bar"><i style="width:${Math.min(100, (pts / COST) * 100)}%"></i></div>
    <span>${ready ? "יש מספיק כוכבים לחבילת חתולים! 🎁" : `${pts} מתוך ${COST} כוכבים. עוד ${COST - pts} לחבילה.`}</span>`);
  if (ready) { const a = el("a", { className: "hc-btn gold", href: homeUrl("cats.html#open"), style: "align-self:flex-start" }, "🎁 פתיחת חבילה"); t.append(a); }
  root.append(t); pointsToast.t = setTimeout(() => t.remove(), ready ? 9000 : 4500);
}
function chip() {
  const pts = Rewards.state.points, ready = pts >= COST;
  return el("a", { className: "hc-btn hc-chip" + (ready ? " ready" : ""), href: homeUrl("cats.html"), title: "אלבום החתולים" },
    `⭐ <span class=n>${pts}${ready ? " 🎁" : ""}</span>`);
}
Rewards.onChange(() => renderBar());

function renderBar() {
  bar.replaceChildren();
  bar.append(chip());
  if (!be) return;
  if (!S.loaded) return;
  if (demo) bar.append(el("span", { className: "hc-btn", title: "מצב הדגמה: הכול נשמר רק בדפדפן הזה" }, "🧪 הדגמה"));
  bar.append(el("a", { className: "hc-btn gold", href: homeUrl("hall.html") }, "🏆 <span class=n>היכל התהילה</span>"));
  if (S.role) bar.append(el("a", { className: "hc-btn", href: homeUrl("friends.html"), title: "חברים: אתגרים והחלפות" }, `👥${S.pending ? ` <span class=n style="background:#d63b70;color:#fff;border-radius:999px;padding:0 7px">${S.pending}</span>` : ""}`));
  if (!S.user) {
    const b = el("button", { className: "hc-btn pri", type: "button" }, "🔑 כניסה"); b.onclick = Honey.signIn; bar.append(b); return;
  }
  const wrap = el("div", { style: "position:relative" });
  const b = el("button", { className: "hc-btn", type: "button", "aria-haspopup": "true" },
    `${S.role && S.profile ? esc(S.profile.avatar) : "👤"} <span class=n>${esc(S.role ? (S.profile?.name || "שלום") : "אין גישה")}</span> ▾`);
  const menu = el("div", { className: "hc-menu", hidden: true });
  if (S.role) {
    const inv = el("button", { type: "button" }, "👋 הזמנת חברים"); inv.onclick = () => { menu.hidden = true; Honey.invite(); }; menu.append(inv);
    const e = el("button", { type: "button" }, "✏️ עריכת פרופיל"); e.onclick = () => { menu.hidden = true; profileDialog(false); }; menu.append(e);
    if (S.role === "admin") menu.append(el("a", { href: homeUrl("admin.html") }, "🔧 ניהול הזמנות"));
  } else menu.append(el("small", {}, esc(S.error || "החשבון הזה עדיין לא הוזמן. אפשר לבקש קישור הזמנה ולפתוח אותו במכשיר הזה.")));
  menu.append(el("small", {}, esc(S.user.email)));
  const o = el("button", { type: "button" }, "יציאה"); o.onclick = () => Honey.signOut(); menu.append(o);
  b.onclick = (ev) => { ev.stopPropagation(); menu.hidden = !menu.hidden; };
  document.addEventListener("click", () => (menu.hidden = true));
  wrap.append(b, menu); bar.append(wrap);
  if (!S.role) menu.hidden = false;
}

function profileDialog(first) {
  return new Promise((resolve) => {
    const cur = S.profile || { name: (S.user?.name || "").split(" ")[0].slice(0, 20), avatar: AVATARS[0] };
    const d = el("dialog", { className: "hc-dlg" }, `
      <form method="dialog">
        <h2>${first ? "ברוכה הבאה! מי משחקת?" : "הפרופיל שלי"}</h2>
        <p>השם והדמות יופיעו בהיכל התהילה, ורק לחברים שהוזמנו.</p>
        <label for="hc-name">איך לקרוא לך?</label>
        <input type="text" id="hc-name" maxlength="20" required value="${esc(cur.name)}" autocomplete="off">
        <div class="hc-av" role="radiogroup" aria-label="דמות">
          ${AVATARS.map((a) => `<label><input type="radio" name="av" value="${a}" ${a === cur.avatar ? "checked" : ""}><span>${a}</span></label>`).join("")}
        </div>
        <div class="row"><button class="hc-btn pri" type="submit">שמירה</button>${first ? "" : '<button class="hc-btn" type="button" id="hc-x">ביטול</button>'}</div>
      </form>`);
    root.append(d);
    d.querySelector("form").onsubmit = async (e) => {
      e.preventDefault();
      const name = d.querySelector("#hc-name").value.trim().slice(0, 20);
      const avatar = d.querySelector("input[name=av]:checked")?.value || AVATARS[0];
      if (!name) return;
      try {
        await be.saveProfile(S.user.uid, { name, avatar });
        S.profile = { name, avatar }; renderBar(); listeners.forEach((f) => f());
        d.close(); d.remove(); resolve();
      } catch { toast("לא הצלחנו לשמור. נסי שוב."); }
    };
    d.querySelector("#hc-x")?.addEventListener("click", () => { d.close(); d.remove(); resolve(); });
    d.addEventListener("cancel", (e) => { if (first) e.preventDefault(); else { d.remove(); resolve(); } });
    d.showModal();
  });
}

// Someone opened an invite link but isn't signed in yet: a friendly welcome with one button.
function welcome() {
  if (!ss.get("honey-invite") || document.querySelector(".hc-welcome")) return;
  const d = el("dialog", { className: "hc-dlg hc-welcome" }, `<div class="body"><h2>הוזמנת! 🎉</h2><p>חבר/ה הזמינו אותך ללמידה של יערה: תרגילים, קלפי חתולים ואתגרים בין חברים. כדי להצטרף נכנסים עם חשבון Google.</p><div class="row"><button class="hc-btn pri" id="hc-wj" type="button">🔑 כניסה והצטרפות</button><button class="hc-btn" id="hc-wx" type="button">אחר כך</button></div></div>`);
  root.append(d);
  d.querySelector("#hc-wj").onclick = () => { d.close(); d.remove(); Honey.signIn(); };
  d.querySelector("#hc-wx").onclick = () => { d.close(); d.remove(); };
  d.showModal();
}

/* ---------- auth flow ---------- */
if (be) {
  be.onAuth(async (user) => {
    if (!user) Rewards.detach();
    S.user = user; S.role = null; S.profile = null; S.best = {}; S.error = ""; S.pending = 0;
    if (user) {
      try {
        const code = ss.get("honey-invite");
        if (code) {
          try { await be.redeemInvite(code, user); toast("ההזמנה התקבלה. ברוכה הבאה!"); }
          catch (e) { S.error = e.message || "ההזמנה לא עבדה."; }
          ss.del("honey-invite");
          if (params.get("invite")) history.replaceState(null, "", location.pathname + location.hash);
        }
        const m = await be.membership(user);
        S.role = m ? m.role : null;
        if (S.role) {
          [S.profile, S.best] = await Promise.all([be.getProfile(user.uid), be.getScores(user.uid)]);
          await Rewards.attach(be, user);
          try {
            const people = await be.listProfiles(); const names = Object.fromEntries(people.map((p) => [p.uid, p.name]));
            (await claimTrades(be, user.uid, (id) => names[id])).forEach((m, i) => setTimeout(() => toast(m), i * 3600));
            S.pending = await pendingCount(be, user.uid);
          } catch (e) { console.warn("social", e); }
          S.best = S.best || {};
        }
      } catch (e) { console.warn("Honey auth", e); S.error = "הייתה בעיה בטעינה. נסי לרענן."; }
    }
    S.loaded = true; renderBar(); resolveReady(); listeners.forEach((f) => f());
    if (!user) welcome();
    if (S.role && !S.profile) { await profileDialog(true); }
  });
} else { S.loaded = true; renderBar(); resolveReady(); }
