// Minimal jsdom environment so the library (which expects a browser) can run under node:test.
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'https://example.test/',
  pretendToBeVisual: true,
});
const { window } = dom;

const globals = [
  'window', 'document', 'navigator', 'HTMLElement', 'Node', 'Event', 'KeyboardEvent',
  'InputEvent', 'CustomEvent', 'customElements', 'getComputedStyle',
  'requestAnimationFrame', 'cancelAnimationFrame', 'Element', 'SVGElement',
];
for (const key of globals) {
  const value = key === 'window' ? window : window[key];
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
}
// Sound/haptics are opt-in and not exercised; keep the environment quiet.
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
