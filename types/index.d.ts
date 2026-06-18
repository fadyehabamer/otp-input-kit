/**
 * Type definitions for otp-input-kit
 * Project: https://github.com/fadyehabamer/otp-input-kit
 */

export type OTPType = 'numeric' | 'alpha' | 'alphanumeric' | 'hex' | 'custom';

export type OTPDirection = 'ltr' | 'rtl' | 'auto';

export type OTPTheme =
  | 'default'
  | 'underline'
  | 'rounded'
  | 'pill'
  | 'ghost'
  | 'filled'
  | 'soft'
  | 'neon'
  | 'gradient'
  | 'elevated'
  // allow custom theme strings without losing the suggestions above
  | (string & {});

export type OTPToastTheme =
  | 'default'
  | 'glass'
  | 'solid'
  | 'gradient'
  | 'minimal'
  | 'pill';

export type OTPToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'center'
  | 'top'
  | 'bottom';

export type OTPErrorAnimation =
  | 'shake'
  | 'highlight'
  | 'both'
  | 'pulse'
  | 'buzz'
  | 'bounce'
  | 'glow'
  | 'wobble';

/** Accepted return shapes for `onVerify`. */
export type VerifyResult =
  | boolean
  | string
  | { ok: boolean; message?: string }
  | void;

export interface OTPError {
  index: number;
  message: string;
}

export interface OTPFocusInfo {
  index: number;
  input: HTMLInputElement;
}

export interface OTPAnimationOptions {
  error?: OTPErrorAnimation | false;
  success?: boolean;
  duration?: number;
}

export interface OTPTimerOptions {
  enabled?: boolean;
  duration?: number;
  showProgress?: boolean;
  onExpire?: (() => void) | null;
}

export interface OTPResendOptions {
  enabled?: boolean;
  cooldown?: number;
  label?: string;
  onResend?: (() => void) | null;
}

export interface OTPSeparatorOptions {
  char?: string;
  after?: number | number[];
}

export interface OTPBiometricOptions {
  enabled?: boolean;
  promptText?: string;
  cancelText?: string;
  userName?: string;
  onConfirmed?: (() => void) | null;
  onCancelled?: (() => void) | null;
}

export interface OTPLoadingOptions {
  text?: string;
  successText?: string;
  errorText?: string;
  clearOnError?: boolean;
  clearDelay?: number;
}

export interface OTPLockoutOptions {
  enabled?: boolean;
  maxAttempts?: number;
  duration?: number;
  /** `{seconds}` is replaced with the live countdown. */
  message?: string;
  onLock?: ((secondsRemaining: number) => void) | null;
  onUnlock?: (() => void) | null;
}

export interface OTPToastOptions {
  enabled?: boolean;
  position?: OTPToastPosition;
  theme?: OTPToastTheme;
  duration?: number;
  successMessage?: string;
  errorMessage?: string;
  expireMessage?: string;
  resendMessage?: string;
}

export interface OTPInputOptions {
  length?: number;
  type?: OTPType;
  pattern?: RegExp | null;
  secure?: boolean;
  revealToggle?: boolean;
  revealLabel?: string;
  hideLabel?: string;
  autoFocus?: boolean;
  autoSubmit?: boolean;
  selectOnFocus?: boolean;
  direction?: OTPDirection;
  locale?: string | null;
  nativeNumerals?: boolean;
  placeholder?: string;
  label?: string | null;
  describedBy?: string | null;
  clipboardDetection?: boolean;
  clipboardSuggestionText?: string;
  haptic?: boolean;
  validate?: ((value: string) => string | null) | null;
  animation?: OTPAnimationOptions;
  timer?: OTPTimerOptions;
  resend?: OTPResendOptions;
  separator?: OTPSeparatorOptions | null;
  smsAutoRead?: boolean;
  biometric?: OTPBiometricOptions;
  /** Async verification — drives the loading → success/error flow. */
  onVerify?: ((value: string) => VerifyResult | Promise<VerifyResult>) | null;
  loading?: OTPLoadingOptions;
  lockout?: OTPLockoutOptions;
  theme?: OTPTheme;
  toast?: OTPToastOptions;
  onChange?: ((value: string) => void) | null;
  onComplete?: ((value: string) => void) | null;
  onError?: ((errors: OTPError[]) => void) | null;
  onFocus?: ((info: OTPFocusInfo) => void) | null;
  onBlur?: ((info: OTPFocusInfo) => void) | null;
  onVerified?: ((value: string) => void) | null;
  onFailed?: ((message: string) => void) | null;
  onSmsRead?: ((code: string) => void) | null;
}

/** Strongly-typed event payloads. */
export interface OTPEventMap {
  change: (value: string) => void;
  complete: (value: string) => void;
  error: (errors: OTPError[]) => void;
  focus: (info: OTPFocusInfo) => void;
  blur: (info: OTPFocusInfo) => void;
  expire: () => void;
  resend: () => void;
  'verify-start': (value: string) => void;
  verified: (value: string) => void;
  'verify-failed': (message: string) => void;
  'sms-pending': () => void;
  'sms-read': (code: string) => void;
  'sms-error': (error: unknown) => void;
  'sms-unsupported': (reason: 'no-api' | 'insecure-context') => void;
  attempt: (info: { attempts: number; max: number }) => void;
  lock: (secondsRemaining: number) => void;
  unlock: () => void;
  'biometric-start': () => void;
  'biometric-confirmed': () => void;
  'biometric-cancelled': () => void;
}

export type OTPEventName = keyof OTPEventMap;
export type Unsubscribe = () => void;

export class EventEmitter {
  on(event: string, listener: (...args: any[]) => void): Unsubscribe;
  off(event: string, listener: (...args: any[]) => void): void;
  once(event: string, listener: (...args: any[]) => void): Unsubscribe;
  emit(event: string, ...args: any[]): void;
  removeAllListeners(event?: string): void;
}

export class OTPInput {
  constructor(target: Element | string, options?: OTPInputOptions);
  static create(target: Element | string, options?: OTPInputOptions): OTPInput;

  readonly options: OTPInputOptions;
  readonly inputs: HTMLInputElement[];
  readonly container: Element;

  /** Current value (always Western digits, regardless of `nativeNumerals`). */
  getValue(): string;
  setValue(value: string | number): void;
  clear(): void;
  focus(index?: number): void;
  disable(): void;
  enable(): void;

  setError(message?: string): void;
  clearError(): void;
  setLoading(loading?: boolean): this;
  setSuccess(message?: string): this;

  toggleReveal(force?: boolean): this;
  lock(): this;
  unlock(): this;
  isLocked(): boolean;

  setTheme(theme: OTPTheme): void;
  setToastTheme(theme: OTPToastTheme): void;
  resetTimer(duration?: number): void;
  setDirection(dir: OTPDirection): void;
  setLocale(locale: string): void;

  on<K extends OTPEventName>(event: K, listener: OTPEventMap[K]): Unsubscribe;
  on(event: string, listener: (...args: any[]) => void): Unsubscribe;
  off<K extends OTPEventName>(event: K, listener: OTPEventMap[K]): this;
  off(event: string, listener: (...args: any[]) => void): this;
  once<K extends OTPEventName>(event: K, listener: OTPEventMap[K]): Unsubscribe;
  once(event: string, listener: (...args: any[]) => void): Unsubscribe;

  destroy(): void;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export interface ToastConfig {
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
  position?: OTPToastPosition;
  theme?: OTPToastTheme;
  [key: string]: unknown;
}

export interface ToastManagerOptions {
  position?: OTPToastPosition;
  theme?: OTPToastTheme;
  duration?: number;
  dir?: 'ltr' | 'rtl';
}

export class ToastManager {
  constructor(options?: ToastManagerOptions);
  success(message: string, opts?: Partial<ToastConfig>): HTMLElement | undefined;
  error(message: string, opts?: Partial<ToastConfig>): HTMLElement | undefined;
  warning(message: string, opts?: Partial<ToastConfig>): HTMLElement | undefined;
  info(message: string, opts?: Partial<ToastConfig>): HTMLElement | undefined;
  show(config: ToastConfig): HTMLElement | undefined;
  setTheme(theme: OTPToastTheme): void;
}

export function getDefaultToast(): ToastManager;

// ─── Web Component ──────────────────────────────────────────────────────────────

export class OTPInputElement extends HTMLElement {
  static readonly formAssociated: boolean;

  /** Async verification callback (functions can't be HTML attributes). */
  onVerify: ((value: string) => VerifyResult | Promise<VerifyResult>) | null;

  /** Current value — also the value submitted with the enclosing form. */
  value: string;

  getValue(): string;
  setValue(v: string | number): void;
  clear(): void;
  focus(index?: number): void;
  disable(): void;
  enable(): void;
  setError(msg?: string): void;
  clearError(): void;
  setLoading(b?: boolean): void;
  setSuccess(msg?: string): void;
  toggleReveal(force?: boolean): void;
  lock(): void;
  unlock(): void;
  isLocked(): boolean;
  resetTimer(d?: number): void;
  setDirection(d: OTPDirection): void;
  setLocale(l: string): void;

  // Constraint validation (form-associated element)
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState | undefined;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
}

export function registerOTPInputElement(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    'otp-input': OTPInputElement;
  }
}

export default OTPInput;
