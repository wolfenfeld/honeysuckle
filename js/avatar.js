// Player picture: the Google account photo when there is one, otherwise an emoji.
import { esc } from "./cardview.js";
if (!document.getElementById("hc-avatar-css")) {
  const st = document.createElement("style"); st.id = "hc-avatar-css";
  st.textContent = ".pimg{display:inline-block;width:1.5em;height:1.5em;border-radius:50%;object-fit:cover;vertical-align:middle;background:#e6ebf5;flex:none}.pimg.big{width:2.4em;height:2.4em}";
  document.head.append(st);
}
// p = { photo, avatar }. Photos are loaded without a referrer (Google refuses some referrers) and fall back to the emoji.
export function avatarHTML(p, cls = "") {
  const fb = esc(p?.avatar || "⭐");
  if (!p?.photo) return `<span class="av-e">${fb}</span>`;
  return `<img class="pimg ${cls}" src="${esc(p.photo)}" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML='<span class=&quot;av-e&quot;>${fb}</span>'">`;
}
