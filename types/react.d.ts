import * as React from 'react';
import { OTPInput, OTPInputOptions, OTPTheme } from './index';

export interface OtpInputProps extends OTPInputOptions {
  className?: string;
  style?: React.CSSProperties;
}

export interface OtpInputHandle {
  getInstance(): OTPInput | null;
  getValue(): string;
  setValue(v: string | number): void;
  clear(): void;
  focus(i?: number): void;
  setError(m?: string): void;
  clearError(): void;
  setLoading(b?: boolean): void;
  setSuccess(m?: string): void;
  setTheme(t: OTPTheme): void;
  resetTimer(d?: number): void;
}

export const OtpInput: React.ForwardRefExoticComponent<
  OtpInputProps & React.RefAttributes<OtpInputHandle>
>;

/**
 * Lightweight hook. Creates the instance once on mount.
 * Returns `[containerRef, instanceRef]`.
 */
export function useOtp(
  options?: OTPInputOptions
): [
  React.RefObject<HTMLDivElement>,
  React.MutableRefObject<OTPInput | null>
];

export default OtpInput;
