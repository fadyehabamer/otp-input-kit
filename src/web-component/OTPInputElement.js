import { OTPInput } from '../core/OTPInput.js';

// Guard for non-browser environments (SSR, Node, test runners)
const _HTMLElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

/**
 * Web Component: <otp-input />
 *
 * Attributes (all optional):
 *   length, type, secure, auto-focus, auto-submit, direction, locale,
 *   native-numerals, placeholder, haptic, timer-duration, resend-enabled,
 *   resend-cooldown, clipboard-detection
 *
 * Events: otp-change, otp-complete, otp-error, otp-focus, otp-blur, otp-expire, otp-resend
 *
 * @example
 * <otp-input length="6" direction="rtl" locale="ar" native-numerals></otp-input>
 */
export class OTPInputElement extends _HTMLElement {
  static get observedAttributes() {
    return [
      'length', 'type', 'secure', 'auto-focus', 'auto-submit',
      'direction', 'locale', 'native-numerals', 'placeholder',
      'haptic', 'timer-duration', 'resend-enabled', 'resend-cooldown',
      'clipboard-detection', 'label', 'theme',
      'toast-enabled', 'toast-theme', 'toast-position',
    ];
  }

  constructor() {
    super();
    this._instance = null;
    this._initialized = false;
  }

  connectedCallback() {
    if (!this._initialized) {
      this._initialized = true;
      this._init();
    }
  }

  disconnectedCallback() {
    this._instance?.destroy();
    this._instance = null;
    this._initialized = false;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this._initialized || oldVal === newVal) return;
    // Re-initialize on relevant attribute changes
    this._instance?.destroy();
    this._instance = null;
    this._init();
  }

  _init() {
    const bool  = (attr) => this.hasAttribute(attr);
    const num   = (attr, def) => { const v = this.getAttribute(attr); return v !== null ? Number(v) : def; };
    const str   = (attr, def) => this.getAttribute(attr) ?? def;

    const options = {
      length:             num('length', 6),
      type:               str('type', 'numeric'),
      secure:             bool('secure'),
      autoFocus:          bool('auto-focus'),
      autoSubmit:         bool('auto-submit'),
      direction:          str('direction', 'auto'),
      locale:             str('locale', null),
      nativeNumerals:     bool('native-numerals'),
      placeholder:        str('placeholder', '·'),
      haptic:             !bool('no-haptic'),
      clipboardDetection: !bool('no-clipboard'),
      label:              str('label', null),
      theme:              str('theme', 'default'),
      toast: {
        enabled:  bool('toast-enabled'),
        theme:    str('toast-theme', 'default'),
        position: str('toast-position', 'top-right'),
      },
      timer: {
        enabled:  num('timer-duration', 0) > 0,
        duration: num('timer-duration', 60),
        showProgress: bool('timer-progress'),
      },
      resend: {
        enabled:  bool('resend-enabled'),
        cooldown: num('resend-cooldown', 60),
      },
      onChange:   (v)    => this.dispatchEvent(new CustomEvent('otp-change',    { detail: v,       bubbles: true, composed: true })),
      onComplete: (v)    => this.dispatchEvent(new CustomEvent('otp-complete',  { detail: v,       bubbles: true, composed: true })),
      onError:    (errs) => this.dispatchEvent(new CustomEvent('otp-error',     { detail: errs,    bubbles: true, composed: true })),
      onFocus:    (info) => this.dispatchEvent(new CustomEvent('otp-focus',     { detail: info,    bubbles: true, composed: true })),
      onBlur:     (info) => this.dispatchEvent(new CustomEvent('otp-blur',      { detail: info,    bubbles: true, composed: true })),
    };

    this._instance = new OTPInput(this, options);

    this._instance.on('expire', () =>
      this.dispatchEvent(new CustomEvent('otp-expire', { bubbles: true, composed: true }))
    );
    this._instance.on('resend', () =>
      this.dispatchEvent(new CustomEvent('otp-resend', { bubbles: true, composed: true }))
    );
  }

  // ─── Public API (proxy to OTPInput) ────────────────────────────────────────

  getValue()       { return this._instance?.getValue() ?? ''; }
  setValue(v)      { this._instance?.setValue(v); }
  clear()          { this._instance?.clear(); }
  focus(i = 0)     { this._instance?.focus(i); }
  disable()        { this._instance?.disable(); }
  enable()         { this._instance?.enable(); }
  setError(msg)    { this._instance?.setError(msg); }
  clearError()     { this._instance?.clearError(); }
  resetTimer(d)    { this._instance?.resetTimer(d); }
  setDirection(d)  { this._instance?.setDirection(d); }
  setLocale(l)     { this._instance?.setLocale(l); }
}

/** Register the custom element if not already registered */
export function registerOTPInputElement(tagName = 'otp-input') {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, OTPInputElement);
  }
}
