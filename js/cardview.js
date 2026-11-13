// Shared card rendering (album, trading, poster). Styles live in css/cards.css.
import { RARITY, CARDS, MAX_COPIES } from "./cards.js";
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const cardById = Object.fromEntries(CARDS.map((c) => [c.id, c]));
const FALLBACK = { 1: "🐱", 2: "😺", 3: "😸", 4: "😻", 5: "🦁" };
const EXTS = ["png", "webp", "jpg"];

// A missing card image falls back to .webp, .jpg, then a drawn placeholder.
document.addEventListener("error", (e) => {
  const img = e.target; if (!img.classList?.contains("art")) return;
  const i = +img.dataset.e + 1;
  if (i < EXTS.length) { img.dataset.e = i; img.src = `cards/${img.dataset.id}.${EXTS[i]}`; }
  else { const ph = document.createElement("div"); ph.className = "ph"; ph.textContent = FALLBACK[img.dataset.r]; img.replaceWith(ph); }
}, true);

export function cardHTML(c, { owned = true, count = 1, showDup = true, small = false } = {}) {
  const r = RARITY[c.r];
  const ico = "🐱".repeat(c.r) + "<s>" + "🐱".repeat(5 - c.r) + "</s>";
  const badge = owned && showDup && count > 1 ? `<span class="dup${count >= MAX_COPIES ? " max" : ""}">×${count}</span>` : "";
  return `<div class="cat r${c.r}${owned ? "" : " locked"}${small ? " small" : ""}" style="--c:${r.color}" aria-label="${owned ? esc(c.he) : "קלף נעול"}, ${r.name}, ${c.r} מתוך 5">
    <img class="art" data-id="${c.id}" data-r="${c.r}" data-e="0" src="cards/${c.id}.png" alt="" loading="lazy">
    ${badge}${owned ? "" : `<span class="lock">🔒</span>`}
    <div class="plate"><div class="nm">${owned ? esc(c.he) : "???"}</div><div class="ico" aria-hidden="true">${ico}</div><div class="rn">${r.name}</div></div>
  </div>`;
}
