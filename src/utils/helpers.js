/**
 * General utility helpers
 */

export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) target[key] = {};
        mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return mergeDeep(target, ...sources);
}

// Only plain objects are merged recursively. Anything else (RegExp, Date,
// arrays, DOM nodes, class instances) is copied by reference — otherwise a
// `pattern: /^[A-F]$/` option would be "merged" into an empty object.
function isObject(item) {
  if (!item || typeof item !== 'object') return false;
  const proto = Object.getPrototypeOf(item);
  return proto === Object.prototype || proto === null;
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

export function noop() {}

export function isFunction(val) {
  return typeof val === 'function';
}

export function generateId(prefix = 'otp') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
