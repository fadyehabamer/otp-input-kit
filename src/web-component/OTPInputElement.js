import { OTPInput } from '../core/OTPInput.js';

// Guard for non-browser environments (SSR, Node, test runners)
const _HTMLElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

/**
 * Web Component: <otp-input />
 *
 * Attributes (all optional):
 *   length, type, secure, auto-focus, auto-submit, direction, locale,
 *   native-numerals, placeholder, haptic, timer-duration, resend-enabled,
 *   resend-cooldown, clipboard-detection, web-otp
 *
 * Events: otp-change, otp-complete, otp-error, otp-focus, otp-blur, otp-expire,
 *         otp-resend, otp-verify-start, otp-verified, otp-failed
 *
 * Async verification: assign a function to the `onVerify` property (functions
 * cannot be passed as HTML attributes):
 *   document.querySelector('otp-input').onVerify = async (code) => checkServer(code);
 *
 * @example
 * <otp-input length="6" direction="rtl" locale="ar" native-numerals></otp-input>
 */
export class OTPInputElement extends _HTMLElement {
  // Form-associated custom element: lets <otp-input name="otp"> participate in
  // <form> submission, validation, reset, and autofill restoration natively.
  static get formAssociated() {
    return true;
  }

  static get observedAttributes() {
    return [
      'length', 'type', 'secure', 'auto-focus', 'auto-submit',
      'direction', 'locale', 'native-numerals', 'placeholder',
      'haptic', 'timer-duration', 'resend-enabled', 'resend-cooldown',
      'clipboard-detection', 'label', 'theme',
      'toast-enabled', 'toast-theme', 'toast-position',
      'reveal-toggle', 'lockout-attempts', 'lockout-duration',
      'keypad', 'keypad-randomize', 'confetti', 'success-animation',
      'timer-style', 'sound', 'sound-volume', 'web-otp',
      // Form state only — re-validated without rebuilding the inputs.
      'required', 'validation-message',
    ];
  }

  constructor() {
    super();
    this._instance = null;
    this._initialized = false;
    this._onVerify = null;
    this._formDisabled = false;
    this._pendingValue = null;
    // attachInternals is unavailable in older browsers / SSR, and some
    // environments (e.g. jsdom) implement ElementInternals without the form
    // APIs — only use it when form association is really supported.
    const internals =
      typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    this._internals =
      internals && typeof internals.setFormValue === 'function' ? internals : null;
  }

  /** Current OTP value — also the value submitted with the form. */
  get value() {
    if (this._instance) return this._instance.getValue();
    return this._pendingValue ?? '';
  }
  set value(v) {
    // Before the element is connected there is no instance yet — keep the value
    // and apply it once the inputs are built.
    if (!this._instance) {
      this._pendingValue = v == null ? null : String(v);
      return;
    }
    this._instance.setValue(v);
    this._syncForm(this.value);
  }

  /** The form field name the value is submitted under. */
  get name() { return this.getAttribute('name'); }
  set name(v) { this.setAttribute('name', v); }

  get required() { return this.hasAttribute('required'); }
  set required(v) { this.toggleAttribute('required', !!v); }

  /** Sync the form value + validity after a change. */
  _syncForm(value = this.value) {
    if (!this._internals) return;
    this._internals.setFormValue(value);
    const length = this._instance?.options.length ?? Number(this.getAttribute('length') || 6);
    const anchor = this._instance?.inputs?.[0];
    if (this.hasAttribute('required') && value.length < length) {
      // Empty → valueMissing; partially filled → tooShort (both block submit).
      this._internals.setValidity(
        value.length === 0 ? { valueMissing: true } : { tooShort: true },
        this.getAttribute('validation-message') || 'Please complete the verification code.',
        anchor
      );
    } else {
      this._internals.setValidity({});
    }
  }

  // ─── Form lifecycle ─────────────────────────────────────────────────────────
  formResetCallback() {
    this._instance?.clear();
    this._syncForm('');
  }

  formDisabledCallback(disabled) {
    this._formDisabled = !!disabled;
    if (disabled) this._instance?.disable();
    else this._instance?.enable();
  }

  formStateRestoreCallback(state) {
    if (typeof state !== 'string') return;
    this.value = state;
  }

  // ─── Constraint-validation proxies ──────────────────────────────────────────
  get form() { return this._internals?.form ?? null; }
  get labels() { return this._internals?.labels ?? []; }
  get validity() { return this._internals?.validity; }
  get validationMessage() { return this._internals?.validationMessage ?? ''; }
  get willValidate() { return this._internals?.willValidate ?? false; }
  checkValidity() { return this._internals?.checkValidity() ?? true; }
  reportValidity() { return this._internals?.reportValidity() ?? true; }

  /** Async verification callback — `(value) => boolean | string | object | Promise`. */
  get onVerify() { return this._onVerify; }
  set onVerify(fn) {
    this._onVerify = typeof fn === 'function' ? fn : null;
    if (this._instance) {
      this._instance.options.onVerify = this._onVerify ? (v) => this._onVerify(v) : null;
    }
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
    if (name === 'required' || name === 'validation-message') {
      this._syncForm();
      return;
    }
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
      revealToggle:       bool('reveal-toggle'),
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
      webOtp:             bool('web-otp'),
      toast: {
        enabled:  bool('toast-enabled'),
        theme:    str('toast-theme', 'default'),
        position: str('toast-position', 'top-right'),
      },
      timer: {
        enabled:  num('timer-duration', 0) > 0,
        duration: num('timer-duration', 60),
        showProgress: bool('timer-progress'),
        style: str('timer-style', 'bar'),
      },
      sound: {
        enabled: bool('sound'),
        volume:  num('sound-volume', 0.2),
      },
      resend: {
        enabled:  bool('resend-enabled'),
        cooldown: num('resend-cooldown', 60),
      },
      lockout: {
        enabled:     num('lockout-attempts', 0) > 0,
        maxAttempts: num('lockout-attempts', 3),
        duration:    num('lockout-duration', 30),
      },
      keypad: {
        enabled:   bool('keypad'),
        randomize: bool('keypad-randomize'),
      },
      animation: {
        confetti: bool('confetti'),
        success:  this.hasAttribute('success-animation') ? str('success-animation', 'pop') : true,
      },
      onChange:   (v)    => { this._syncForm(v); this.dispatchEvent(new CustomEvent('otp-change', { detail: v, bubbles: true, composed: true })); },
      onComplete: (v)    => this.dispatchEvent(new CustomEvent('otp-complete',  { detail: v,       bubbles: true, composed: true })),
      onError:    (errs) => this.dispatchEvent(new CustomEvent('otp-error',     { detail: errs,    bubbles: true, composed: true })),
      onFocus:    (info) => this.dispatchEvent(new CustomEvent('otp-focus',     { detail: info,    bubbles: true, composed: true })),
      onBlur:     (info) => this.dispatchEvent(new CustomEvent('otp-blur',      { detail: info,    bubbles: true, composed: true })),
    };

    if (typeof this._onVerify === 'function') {
      options.onVerify = (v) => this._onVerify(v);
    }

    this._instance = new OTPInput(this, options);

    this._instance.on('expire', () =>
      this.dispatchEvent(new CustomEvent('otp-expire', { bubbles: true, composed: true }))
    );
    this._instance.on('resend', () =>
      this.dispatchEvent(new CustomEvent('otp-resend', { bubbles: true, composed: true }))
    );
    this._instance.on('verify-start', (v) =>
      this.dispatchEvent(new CustomEvent('otp-verify-start', { detail: v, bubbles: true, composed: true }))
    );
    this._instance.on('verified', (v) =>
      this.dispatchEvent(new CustomEvent('otp-verified', { detail: v, bubbles: true, composed: true }))
    );
    this._instance.on('verify-failed', (msg) =>
      this.dispatchEvent(new CustomEvent('otp-failed', { detail: msg, bubbles: true, composed: true }))
    );
    this._instance.on('sms-read', (code) =>
      this.dispatchEvent(new CustomEvent('otp-sms-read', { detail: code, bubbles: true, composed: true }))
    );
    this._instance.on('sms-unsupported', (reason) =>
      this.dispatchEvent(new CustomEvent('otp-sms-unsupported', { detail: reason, bubbles: true, composed: true }))
    );
    this._instance.on('lock', (secs) =>
      this.dispatchEvent(new CustomEvent('otp-lock', { detail: secs, bubbles: true, composed: true }))
    );
    this._instance.on('unlock', () =>
      this.dispatchEvent(new CustomEvent('otp-unlock', { bubbles: true, composed: true }))
    );
    this._instance.on('attempt', (info) =>
      this.dispatchEvent(new CustomEvent('otp-attempt', { detail: info, bubbles: true, composed: true }))
    );

    // A rebuild (attribute change) must not re-enable a disabled fieldset's control.
    if (this._formDisabled) this._instance.disable();
    if (this._pendingValue != null) {
      const pending = this._pendingValue;
      this._pendingValue = null;
      this._instance.setValue(pending);
    }

    // Initialise the form value/validity for the freshly-built instance.
    this._syncForm(this._instance.getValue());
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
  setLoading(b)    { this._instance?.setLoading(b); }
  setSuccess(msg)  { this._instance?.setSuccess(msg); }
  toggleReveal(f)  { this._instance?.toggleReveal(f); }
  lock()           { this._instance?.lock(); }
  unlock()         { this._instance?.unlock(); }
  isLocked()       { return this._instance?.isLocked() ?? false; }
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
