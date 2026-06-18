/**
 * Svelte adapter for otp-input-kit — a Svelte action (no Svelte dependency).
 *
 * Usage:
 *   <script>
 *     import { otp } from 'otp-input-kit/svelte';
 *     const options = {
 *       length: 6,
 *       onVerify: async (code) => (await fetch(`/verify/${code}`)).ok,
 *     };
 *   </script>
 *
 *   <div
 *     use:otp={options}
 *     on:complete={(e) => console.log(e.detail)}
 *     on:verified={goHome}
 *     on:failed={(e) => toast(e.detail)}
 *   />
 *
 * Dispatched DOM events (use with `on:`):
 *   change, complete, error, focus, blur, verifystart, verified, failed,
 *   expire, resend.
 *
 * Pass `onInit: (instance) => {}` in the options to capture the raw core
 * instance for imperative calls (getValue, clear, setLoading, …).
 */
import { OTPInput } from '../core/OTPInput.js';
import '../styles/otp-input.css';

export function otp(node, options = {}) {
  let instance = create(node, options);

  return {
    update(newOptions) {
      instance.destroy();
      instance = create(node, newOptions || {});
    },
    destroy() {
      instance.destroy();
    },
  };
}

function create(node, opts) {
  const fire = (name, detail) =>
    node.dispatchEvent(new CustomEvent(name, { detail }));

  const options = {
    ...opts,
    onChange:   (v) => { fire('change', v);   opts.onChange?.(v); },
    onComplete: (v) => { fire('complete', v); opts.onComplete?.(v); },
    onError:    (e) => { fire('error', e);    opts.onError?.(e); },
    onFocus:    (i) => { fire('focus', i);    opts.onFocus?.(i); },
    onBlur:     (i) => { fire('blur', i);     opts.onBlur?.(i); },
    onVerified: (v) => { fire('verified', v); opts.onVerified?.(v); },
    onFailed:   (m) => { fire('failed', m);   opts.onFailed?.(m); },
  };
  // Preserve conditional verify flow: only attach when a handler is supplied.
  options.onVerify = typeof opts.onVerify === 'function' ? opts.onVerify : null;

  const instance = new OTPInput(node, options);
  instance.on('verify-start', (v) => fire('verifystart', v));
  instance.on('expire', () => fire('expire'));
  instance.on('resend', () => fire('resend'));

  if (typeof opts.onInit === 'function') opts.onInit(instance);
  return instance;
}

export default otp;
