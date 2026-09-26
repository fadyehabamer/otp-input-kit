/**
 * UMD-only entry. Rollup's `name: 'OTPInputLib'` still exposes the named
 * exports on `window.OTPInputLib`; this also aliases `window.OTPInput` to the
 * default export so the README's `OTPInput.create(...)` example works. An
 * existing global is left alone.
 */
import OTPInput, * as named from './index.js';

if (typeof globalThis !== 'undefined') {
  globalThis.OTPInput ??= OTPInput;
}

export * from './index.js';
export default OTPInput;
