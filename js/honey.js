// Honeysuckle: login, profile and hall-of-fame glue shared by every page.
// Loaded with <script type="module" src="js/honey.js">. Exposes window.Honey.
import { firebaseConfig, adminEmails } from "./firebase-config.js";

export const GAMES = {
  math:      { title: "חשבון ביער הגשם", icon: "🌴", unit: (b, t) => `${b} מתוך ${t || 36}`, blurb: "הציון הכי גבוה מתוך 36 תרגילים" },
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

const S = { user: null, role: null, profile: null, best: {}, error: "", loaded: false };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const homeUrl = (p = "") => new URL(p, new URL("./", import.meta.url).href.replace(/js\/$/, "")).href;
let resolveReady; const ready = new Promise((r) => (resolveReady = r));

export const Honey = {
  enabled: !!be, demo, ready, GAMES, AVATARS,
  get user() { return S.user; }, get profile() { return S.profile; }, get role() { return S.role; },
  get isMember() { return !!S.role; }, get isAdmin() { return S.role === "admin"; },
  backend: be, homeUrl,
  signIn: () => be.signIn().catch((e) => toast("הכניסה לא הצליחה: " + (e.message || e))),
  signOut: () => be.signOut(),
  editProfile: () => profileDialog(false),
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
@media (prefers-reduced-motion:reduce){.hc-card{animation:none}}
`;
const root = document.createElement("div");
root.className = "hc";
const st = document.createElement("style"); st.textContent = CSS;
const bar = document.createElement("div"); bar.className = "hc-bar";
root.append(bar);
function mount() { document.head.append(st); document.body.append(root); }
if (be) { if (document.body) mount(); else addEventListener("DOMContentLoaded", mount); }

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

function renderBar() {
  bar.replaceChildren();
  if (!S.loaded) return;
  if (demo) bar.append(el("span", { className: "hc-btn", title: "מצב הדגמה: הכול נשמר רק בדפדפן הזה" }, "🧪 הדגמה"));
  bar.append(el("a", { className: "hc-btn gold", href: homeUrl("hall.html") }, "🏆 <span class=n>היכל התהילה</span>"));
  if (!S.user) {
    const b = el("button", { className: "hc-btn pri", type: "button" }, "🔑 כניסה"); b.onclick = Honey.signIn; bar.append(b); return;
  }
  const wrap = el("div", { style: "position:relative" });
  const b = el("button", { className: "hc-btn", type: "button", "aria-haspopup": "true" },
    `${S.role && S.profile ? esc(S.profile.avatar) : "👤"} <span class=n>${esc(S.role ? (S.profile?.name || "שלום") : "אין גישה")}</span> ▾`);
  const menu = el("div", { className: "hc-menu", hidden: true });
  if (S.role) {
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

/* ---------- auth flow ---------- */
if (be) {
  be.onAuth(async (user) => {
    S.user = user; S.role = null; S.profile = null; S.best = {}; S.error = "";
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
          S.best = S.best || {};
        }
      } catch (e) { console.warn("Honey auth", e); S.error = "הייתה בעיה בטעינה. נסי לרענן."; }
    }
    S.loaded = true; renderBar(); resolveReady(); listeners.forEach((f) => f());
    if (S.role && !S.profile) { await profileDialog(true); }
  });
} else resolveReady();
