import { OTPInput, OTPInputOptions } from './index';

export interface OtpActionOptions extends OTPInputOptions {
  /** Receives the underlying core instance for imperative calls. */
  onInit?: (instance: OTPInput) => void;
}

export interface OtpActionReturn {
  update(options: OtpActionOptions): void;
  destroy(): void;
}

/**
 * Svelte action: `use:otp={options}`.
 * Dispatches DOM events: change, complete, error, focus, blur, verifystart,
 * verified, failed, expire, resend.
 */
export function otp(node: HTMLElement, options?: OtpActionOptions): OtpActionReturn;

export default otp;
