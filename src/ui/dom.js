export const app = () => document.getElementById('app');

/** el('div.cls#id', {attrs}, ...children) */
export function el(tag, attrs = {}, ...children) {
  if (attrs == null || attrs.nodeType || Array.isArray(attrs) || typeof attrs !== 'object') { children.unshift(attrs); attrs = {}; }
  const [name, ...rest] = tag.split(/(?=[.#])/);
  const e = document.createElement(name || 'div');
  for (const r of rest) { if (r[0] === '.') e.classList.add(r.slice(1)); else if (r[0] === '#') e.id = r.slice(1); }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className += (e.className ? ' ' : '') + v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}

export function mount(node, { replace = true } = {}) {
  if (replace) app().replaceChildren(node); else app().append(node);
  return node;
}
export function clearApp() { app().replaceChildren(); }
export const remove = (n) => n && n.parentNode && n.parentNode.removeChild(n);
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
