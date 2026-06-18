/**
 * React adapter for otp-input-kit.
 *
 * Usage:
 *   import { OtpInput } from 'otp-input-kit/react';
 *
 *   <OtpInput
 *     length={6}
 *     onComplete={(code) => console.log(code)}
 *     onVerify={async (code) => (await api.verify(code)).ok}
 *     onVerified={() => navigate('/home')}
 *   />
 *
 * A `ref` exposes the imperative API (getValue, setValue, clear, focus,
 * setError, setLoading, setSuccess, …) and `getInstance()` for the raw core.
 */
import React from 'react';
import { OTPInput } from '../core/OTPInput.js';
import '../styles/otp-input.css';

const { useRef, useEffect, useImperativeHandle, forwardRef, createElement } = React;

// Changing any of these requires rebuilding the underlying instance.
const STRUCTURAL_KEYS = [
  'length', 'type', 'pattern', 'secure', 'direction', 'locale',
  'nativeNumerals', 'placeholder', 'theme', 'separator', 'autoFocus',
  'autoSubmit', 'selectOnFocus', 'clipboardDetection', 'haptic', 'smsAutoRead',
];

export const OtpInput = forwardRef(function OtpInput(props, ref) {
  const { className, style, ...options } = props;
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  // Latest props, so callbacks always fire the current handler without rebuilds.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Rebuild only when a structural option changes.
  const structKey = STRUCTURAL_KEYS.map((k) => JSON.stringify(options[k] ?? null)).join('|');

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const built = {
      ...optionsRef.current,
      onChange:   (v) => optionsRef.current.onChange?.(v),
      onComplete: (v) => optionsRef.current.onComplete?.(v),
      onError:    (e) => optionsRef.current.onError?.(e),
      onFocus:    (i) => optionsRef.current.onFocus?.(i),
      onBlur:     (i) => optionsRef.current.onBlur?.(i),
      onVerified: (v) => optionsRef.current.onVerified?.(v),
      onFailed:   (m) => optionsRef.current.onFailed?.(m),
    };
    // Only enable the verify flow when a handler is actually supplied.
    built.onVerify = optionsRef.current.onVerify
      ? (v) => optionsRef.current.onVerify(v)
      : null;

    const inst = new OTPInput(containerRef.current, built);
    instanceRef.current = inst;

    return () => {
      inst.destroy();
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structKey]);

  // Toggle the verify flow live if onVerify is added/removed between renders.
  useEffect(() => {
    if (!instanceRef.current) return;
    instanceRef.current.options.onVerify = options.onVerify
      ? (v) => optionsRef.current.onVerify(v)
      : null;
  }, [!!options.onVerify]);

  useImperativeHandle(ref, () => ({
    getInstance: () => instanceRef.current,
    getValue:    () => instanceRef.current?.getValue() ?? '',
    setValue:    (v) => instanceRef.current?.setValue(v),
    clear:       () => instanceRef.current?.clear(),
    focus:       (i) => instanceRef.current?.focus(i),
    setError:    (m) => instanceRef.current?.setError(m),
    clearError:  () => instanceRef.current?.clearError(),
    setLoading:  (b) => instanceRef.current?.setLoading(b),
    setSuccess:  (m) => instanceRef.current?.setSuccess(m),
    setTheme:    (t) => instanceRef.current?.setTheme(t),
    resetTimer:  (d) => instanceRef.current?.resetTimer(d),
  }), []);

  return createElement('div', { ref: containerRef, className, style });
});

OtpInput.displayName = 'OtpInput';

/**
 * Lightweight hook alternative. Creates the instance once on mount.
 *   const [ref, otp] = useOtp({ length: 6 });
 *   return <div ref={ref} />;   // otp.current is the OTPInput instance
 */
export function useOtp(options = {}) {
  const ref = useRef(null);
  const instanceRef = useRef(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!ref.current) return undefined;
    const inst = new OTPInput(ref.current, optionsRef.current);
    instanceRef.current = inst;
    return () => {
      inst.destroy();
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, instanceRef];
}

export default OtpInput;
