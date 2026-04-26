/**
 * DOM utility helpers
 */

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'class') el.className = val;
    else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
    else if (key.startsWith('data-')) el.setAttribute(key, val);
    else if (key.startsWith('aria-')) el.setAttribute(key, val);
    else el[key] = val;
  }
  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child instanceof Node) el.appendChild(child);
  });
  return el;
}

export function applyStyles(el, styles) {
  Object.assign(el.style, styles);
}

export function setCSSVar(el, name, value) {
  el.style.setProperty(name, value);
}

export function addClasses(el, ...classes) {
  el.classList.add(...classes.filter(Boolean));
}

export function removeClasses(el, ...classes) {
  el.classList.remove(...classes.filter(Boolean));
}

export function toggleClass(el, cls, force) {
  el.classList.toggle(cls, force);
}

export function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function isVisible(el) {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

export function getDir(el) {
  let node = el;
  while (node && node !== document.documentElement) {
    const dir = node.getAttribute('dir') || getComputedStyle(node).direction;
    if (dir === 'rtl' || dir === 'ltr') return dir;
    node = node.parentElement;
  }
  return document.dir || 'ltr';
}

export function animateElement(el, keyframes, options) {
  if (!el.animate) return Promise.resolve();
  return el.animate(keyframes, options).finished;
}

export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
