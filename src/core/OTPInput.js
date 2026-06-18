import { EventEmitter } from '../utils/events.js';
import { mergeDeep, generateId, debounce, isFunction } from '../utils/helpers.js';
import { createElement, addClasses, removeClasses, animateElement, prefersReducedMotion } from '../utils/dom.js';
import { AccessibilityManager } from './AccessibilityManager.js';
import { ValidationManager } from './ValidationManager.js';
import { HistoryManager } from './HistoryManager.js';
import { ClipboardManager } from './ClipboardManager.js';
import { TimerManager } from './TimerManager.js';
import { ToastManager } from './ToastManager.js';
import { RTLManager } from '../i18n/RTLManager.js';
import { NumberRenderer } from '../i18n/NumberRenderer.js';

/** @type {OTPInputOptions} */
const DEFAULT_OPTIONS = {
  length: 6,
  type: 'numeric',          // 'numeric' | 'alpha' | 'alphanumeric' | 'hex' | 'custom'
  pattern: null,             // RegExp for custom type
  secure: false,             // mask input like password
  revealToggle: false,       // show an eye button to peek at masked digits (secure mode only)
  revealLabel: 'Show code',
  hideLabel: 'Hide code',
  autoFocus: true,
  autoSubmit: false,         // submit form on complete
  selectOnFocus: true,
  direction: 'auto',        // 'ltr' | 'rtl' | 'auto'
  locale: null,              // BCP 47 locale string e.g. 'ar', 'fa', 'en'
  nativeNumerals: false,     // render locale-native digits (e.g. Arabic-Indic)
  placeholder: '·',
  label: null,
  describedBy: null,
  clipboardDetection: true,
  clipboardSuggestionText: 'Paste code from clipboard',
  haptic: true,
  validate: null,            // (value: string) => string | null  (custom validator)
  animation: {
    // 'shake' | 'highlight' | 'both' | 'pulse' | 'buzz' | 'bounce' | 'glow' | 'wobble' | false
    error: 'shake',
    success: true,
    duration: 300,
  },
  timer: {
    enabled: false,
    duration: 60,            // seconds
    showProgress: true,
    onExpire: null,
  },
  resend: {
    enabled: false,
    cooldown: 60,
    label: 'Resend code',
    onResend: null,
  },
  separator: null,           // { char: '—', after: [3] }  — visual separator between digit groups
  smsAutoRead: false,        // use Web OTP API to auto-fill from SMS (requires HTTPS + correct SMS format)
  biometric: {
    enabled: false,          // require platform biometric/PIN after OTP completion
    promptText: 'Verify your identity to continue',
    cancelText: 'Biometric verification was cancelled or failed',
    userName: 'otp-user',    // label shown in the platform passkey prompt
    onConfirmed: null,       // () => void
    onCancelled: null,       // () => void
  },
  // Async verification — when set, completion triggers a loading state that
  // awaits this function, then resolves to a success or error state.
  // Return: true | undefined → success · false → fail · string → fail w/ message
  //         · { ok: boolean, message?: string } → explicit result. Throwing → fail.
  onVerify: null,            // (value: string) => boolean | string | object | Promise<…>
  loading: {
    text: 'Verifying…',      // a11y label shown while verifying
    successText: 'Verified',
    errorText: 'Verification failed',
    clearOnError: true,      // clear inputs after a failed verification
    clearDelay: 900,         // ms to keep the error visible before clearing
  },
  // Lock the input after too many failed attempts (counts failed verifies,
  // completion-validation failures, and manual setError calls).
  lockout: {
    enabled: false,
    maxAttempts: 3,
    duration: 30,            // seconds locked
    message: 'Too many attempts. Try again in {seconds}s.',
    onLock: null,            // (secondsRemaining) => void
    onUnlock: null,          // () => void
  },
  theme: 'default',          // 'default' | 'underline' | 'rounded' | 'ghost' | 'filled' | 'soft' | 'neon' | 'gradient' | 'pill'
  toast: {
    enabled: false,           // auto-show toast on complete/error/expire
    position: 'top-right',
    theme: 'default',         // 'default' | 'glass' | 'solid' | 'gradient' | 'minimal' | 'pill'
    duration: 3500,
    successMessage: 'Code verified successfully',
    errorMessage: 'Invalid code. Please try again.',
    expireMessage: 'Code expired. Please request a new one.',
    resendMessage: 'A new code has been sent.',
  },
  // Event callbacks (alternative to .on())
  onChange: null,
  onComplete: null,
  onError: null,
  onFocus: null,
  onBlur: null,
  onVerified: null,          // (value) => void  — async verify succeeded
  onFailed: null,            // (message) => void — async verify failed
  onSmsRead: null,           // (code) => void — Web OTP API auto-filled from SMS
};

/**
 * OTPInput — main class
 *
 * @example
 * const otp = OTPInput.create('#container', { length: 6, onComplete: v => console.log(v) });
 */
export class OTPInput {
  /**
   * @param {Element|string} target
   * @param {Partial<OTPInputOptions>} options
   */
  constructor(target, options = {}) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) throw new Error('[OTPInput] Container element not found');

    this.container = container;
    this.options = mergeDeep({}, DEFAULT_OPTIONS, options);
    this._id = generateId('otp');
    this.inputs = [];
    this._values = Array(this.options.length).fill('');
    this._expired = false;
    this._destroyed = false;
    this._boundHandlers = {};
    this._attempts = 0;
    this._locked = false;
    this._revealed = false;

    // Sub-managers
    this.emitter    = new EventEmitter();
    this.rtl        = new RTLManager(this);
    this.numbers    = new NumberRenderer(this.options.locale || 'en');
    this.a11y       = new AccessibilityManager(this);
    this.validation = new ValidationManager(this);
    this.history    = new HistoryManager();
    this.clipboard  = new ClipboardManager(this);
    this.timer      = new TimerManager(this);
    this.toast      = new ToastManager({
      position: this.options.toast.position,
      theme:    this.options.toast.theme,
      duration: this.options.toast.duration,
      dir:      this.rtl.resolveDirection(),
    });

    this._build();
    this._bindOptionCallbacks();
    this._startIfNeeded();
    this._initSmsAutoRead();
  }

  // ─── Static factory ────────────────────────────────────────────────────────

  /**
   * @param {Element|string} target
   * @param {Partial<OTPInputOptions>} options
   * @returns {OTPInput}
   */
  static create(target, options = {}) {
    return new OTPInput(target, options);
  }

  // ─── Build DOM ─────────────────────────────────────────────────────────────

  _build() {
    this.container.innerHTML = '';
    addClasses(this.container, 'otp-root');
    if (this.options.theme) this.container.dataset.theme = this.options.theme;
    this.rtl.applyDirection(this.container);

    // Wrapper
    this._wrapper = createElement('div', { class: 'otp-wrapper' });
    if (this.options.secure) addClasses(this._wrapper, 'otp-wrapper--secure');

    // Inputs row
    this._inputsRow = createElement('div', {
      class: 'otp-inputs-row',
      role: 'presentation',
    });

    const { length, placeholder, secure, type } = this.options;

    for (let i = 0; i < length; i++) {
      const input = this._createInput(i);
      this._inputsRow.appendChild(input);
      this.inputs.push(input);

      // Separator after digit (i+1) if configured
      const sep = this.options.separator;
      if (sep && i < length - 1) {
        const positions = Array.isArray(sep.after) ? sep.after : (sep.after != null ? [sep.after] : [Math.floor(length / 2)]);
        if (positions.includes(i + 1)) {
          const sepEl = createElement('span', { class: 'otp-separator', 'aria-hidden': 'true' });
          sepEl.textContent = sep.char ?? '—';
          this._inputsRow.appendChild(sepEl);
        }
      }
    }

    this._wrapper.appendChild(this._inputsRow);

    // Reveal/peek toggle (secure mode only)
    if (this.options.secure && this.options.revealToggle) {
      this._buildRevealToggle();
    }

    this.timer.buildUI(this._wrapper);

    // Lockout message region (only when lockout is enabled)
    if (this.options.lockout?.enabled) {
      this._lockEl = createElement('div', {
        class: 'otp-lock-message',
        role: 'status',
        'aria-live': 'polite',
      });
      this._wrapper.appendChild(this._lockEl);
    }

    this.container.appendChild(this._wrapper);

    // Loading overlay (spinner) — hidden until a verification is in flight
    this._spinner = createElement('div', {
      class: 'otp-spinner',
      role: 'status',
      'aria-hidden': 'true',
    });
    this._spinner.innerHTML = '<span class="otp-spinner__ring"></span>';
    this.container.appendChild(this._spinner);

    // A11y setup
    this.a11y.setup(this.container, this.inputs);

    // Initial history snapshot
    this.history.push([...this._values]);

    if (this.options.autoFocus) {
      requestAnimationFrame(() => this._focusIndex(0));
    }

    // Clipboard detection on first focus
    if (this.options.clipboardDetection) {
      this.inputs[0].addEventListener('focus', () => this.clipboard.checkClipboard(), { once: true });
    }
  }

  _createInput(index) {
    const { secure, placeholder, type, locale } = this.options;

    const input = createElement('input', {
      type: secure ? 'password' : 'text',
      inputMode: type === 'alpha' ? 'text' : (type === 'numeric' ? 'numeric' : 'text'),
      maxLength: 1,
      autocomplete: index === 0 ? 'one-time-code' : 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: false,
      class: 'otp-input',
      'data-index': index,
      placeholder: placeholder,
    });

    if (locale) input.lang = locale;

    this._bindInputEvents(input, index);
    return input;
  }

  _buildRevealToggle() {
    const label = this.options.revealLabel;
    const btn = createElement('button', {
      type: 'button',
      class: 'otp-reveal-btn',
      'aria-pressed': 'false',
      'aria-label': label,
      title: label,
    });
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
      `<span class="otp-reveal-label">${label}</span>`;
    btn.addEventListener('click', () => this.toggleReveal());
    this._revealBtn = btn;
    this._wrapper.appendChild(btn);
  }

  // ─── Event Binding ─────────────────────────────────────────────────────────

  _bindInputEvents(input, index) {
    input.addEventListener('beforeinput', (e) => this._handleBeforeInput(e, index));
    input.addEventListener('input',       (e) => this._handleInput(e, index));
    input.addEventListener('keydown',     (e) => this._handleKeyDown(e, index));
    input.addEventListener('paste',       (e) => this.clipboard.handlePaste(e, index));
    input.addEventListener('focus',       (e) => this._handleFocus(e, index));
    input.addEventListener('blur',        (e) => this._handleBlur(e, index));
    input.addEventListener('click',       (e) => this._handleClick(e, index));
  }

  _bindOptionCallbacks() {
    const { onChange, onComplete, onError, onFocus, onBlur, onVerified, onFailed, toast } = this.options;
    if (isFunction(onChange))   this.emitter.on('change',   onChange);
    if (isFunction(onComplete)) this.emitter.on('complete', onComplete);
    if (isFunction(onError))    this.emitter.on('error',    onError);
    if (isFunction(onFocus))    this.emitter.on('focus',    onFocus);
    if (isFunction(onBlur))     this.emitter.on('blur',     onBlur);
    if (isFunction(onVerified)) this.emitter.on('verified', onVerified);
    if (isFunction(onFailed))   this.emitter.on('verify-failed', onFailed);

    if (toast?.enabled) {
      this.emitter.on('expire', () => this.toast.warning(toast.expireMessage));
      this.emitter.on('resend', () => this.toast.info(toast.resendMessage));
    }
  }

  _startIfNeeded() {
    const { timer } = this.options;
    if (timer?.enabled && timer.duration > 0) {
      this.timer.start(timer.duration);
    }
  }

  // ─── Input Handlers ────────────────────────────────────────────────────────

  _handleBeforeInput(e, index) {
    // Block invalid characters early (compositionend is handled separately)
    if (e.inputType === 'insertText' && e.data) {
      const ch = this._normalize(e.data);
      if (!this.validation.isValidChar(ch)) {
        e.preventDefault();
        this._triggerError(index);
      }
    }
  }

  _handleInput(e, index) {
    const input = this.inputs[index];
    const raw = input.value;

    if (!raw) {
      this._values[index] = '';
      this._updateInputUI(input, index);
      this._notifyChange();
      return;
    }

    // Handle multi-char input (IME, autocomplete filling whole field)
    if (raw.length > 1) {
      this.clipboard._distribute(raw, index);
      return;
    }

    const ch = this._normalize(raw);

    if (!this.validation.isValidChar(ch)) {
      input.value = this._getDisplayValue(index);
      this._triggerError(index);
      return;
    }

    const display = this.options.nativeNumerals ? this.numbers.toLocale(ch) : ch;
    input.value = display;
    this._values[index] = ch;
    this.history.pushIfChanged([...this._values]);

    this._updateInputUI(input, index);
    this._haptic();
    this._notifyChange();

    // Advance to next
    const next = this.rtl.nextIndex(index, this.inputs);
    if (next !== null) this._focusIndex(next);
    else this._checkCompletion();

    if (index === this.inputs.length - 1) this._checkCompletion();
  }

  _handleKeyDown(e, index) {
    if (this._expired) return;

    switch (e.key) {
      case 'Backspace':
        this._handleBackspace(e, index);
        break;
      case 'Delete':
        this._handleDelete(e, index);
        break;
      case 'ArrowLeft':
      case 'ArrowRight': {
        e.preventDefault();
        const dir = this.rtl.arrowKeyDirection(e.key, this.rtl.isRTL);
        if (dir === 'next') { const n = this.rtl.nextIndex(index, this.inputs); if (n !== null) this._focusIndex(n); }
        else                { const p = this.rtl.prevIndex(index);              if (p !== null) this._focusIndex(p); }
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown':
        e.preventDefault();
        break;
      case 'z':
      case 'Z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.shiftKey ? this._redo() : this._undo();
        }
        break;
      case 'a':
      case 'A':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this._selectAll();
        }
        break;
      case 'Tab':
        // Allow default tab behavior
        break;
      case 'Enter':
        if (this._isComplete()) this._checkCompletion(true);
        break;
    }
  }

  _handleBackspace(e, index) {
    const input = this.inputs[index];
    e.preventDefault();

    if (this._values[index]) {
      // Clear current
      this._setInputValue(index, '');
      this._notifyChange();
    } else {
      // Jump to previous and clear it
      const prev = this.rtl.prevIndex(index);
      if (prev !== null) {
        this._setInputValue(prev, '');
        this._focusIndex(prev);
        this._notifyChange();
      }
    }
    this.history.pushIfChanged([...this._values]);
  }

  _handleDelete(e, index) {
    e.preventDefault();
    if (this._values[index]) {
      this._setInputValue(index, '');
      this._notifyChange();
      this.history.pushIfChanged([...this._values]);
    }
  }

  _handleFocus(e, index) {
    const input = this.inputs[index];
    addClasses(input, 'otp-input--focused');
    if (this.options.selectOnFocus) {
      requestAnimationFrame(() => input.select());
    }
    this.emitter.emit('focus', { index, input });
  }

  _handleBlur(e, index) {
    const input = this.inputs[index];
    removeClasses(input, 'otp-input--focused');
    this.emitter.emit('blur', { index, input });
  }

  _handleClick(e, index) {
    // On click, move cursor to end for cleaner UX
    const input = this.inputs[index];
    requestAnimationFrame(() => {
      input.setSelectionRange(input.value.length, input.value.length);
    });
  }

  // ─── Internal Helpers ──────────────────────────────────────────────────────

  _normalize(ch) {
    // Convert native numerals to western before storing
    return this.numbers.toWestern(ch);
  }

  _getDisplayValue(index) {
    const val = this._values[index];
    if (!val) return '';
    return this.options.nativeNumerals ? this.numbers.toLocale(val) : val;
  }

  _setInputValue(index, ch) {
    this._values[index] = ch ? this._normalize(ch) : '';
    const input = this.inputs[index];
    input.value = this._getDisplayValue(index);
    this._updateInputUI(input, index);
  }

  _updateInputUI(input, index) {
    const filled = !!this._values[index];
    if (filled) {
      addClasses(input, 'otp-input--filled');
    } else {
      removeClasses(input, 'otp-input--filled');
    }
  }

  _focusIndex(index) {
    const clamped = Math.max(0, Math.min(index, this.inputs.length - 1));
    this.inputs[clamped]?.focus();
  }

  _isComplete() {
    return this._values.every(v => v !== '');
  }

  _notifyChange() {
    const val = this.getValue();
    this.emitter.emit('change', val);
    this.validation.clearErrors(this.inputs);
  }

  _checkCompletion(force = false) {
    if (this._locked) return;
    if (!this._isComplete() && !force) return;

    const value = this.getValue();
    if (!this.validation.validateAll(this._values)) {
      const errors = this.validation.markErrors(this.inputs);
      this._animateError();
      this.a11y.announceError(errors.map(e => e.message).join('. '));
      if (this.options.toast?.enabled) {
        const msg = errors[0]?.message || this.options.toast.errorMessage;
        this.toast.error(msg);
      }
      this.emitter.emit('error', errors);
      this._registerFailedAttempt();
      return;
    }

    if (this.options.biometric?.enabled) {
      this._biometricConfirm(value);
      return;
    }

    this._proceedAfterGate(value);
  }

  /** Route a locally-valid value through async verification (if configured) or straight to success. */
  _proceedAfterGate(value) {
    if (isFunction(this.options.onVerify)) {
      this._runVerify(value);
      return;
    }
    this._completeSuccess(value);
  }

  _completeSuccess(value) {
    this._attempts = 0;
    this._animateSuccess();
    this.a11y.announceCompletion(value);
    if (this.options.toast?.enabled) {
      this.toast.success(this.options.toast.successMessage);
    }
    this.emitter.emit('complete', value);

    if (this.options.autoSubmit) this._submitForm(value);
  }

  _submitForm(value) {
    const form = this.container.closest('form');
    if (!form) return;
    const hidden = form.querySelector('input[name="otp"]') || (() => {
      const h = document.createElement('input');
      h.type = 'hidden'; h.name = 'otp';
      form.appendChild(h); return h;
    })();
    hidden.value = value;
    form.requestSubmit?.() ?? form.submit();
  }

  // ─── Async Verification ─────────────────────────────────────────────────────

  async _runVerify(value) {
    // Completion can fire twice for the final digit — ignore re-entry while a
    // verification is already in flight (prevents a duplicate server call).
    if (this._loading) return;
    // Input is complete & locally valid — announce completion, then verify remotely.
    this.emitter.emit('complete', value);
    this.setLoading(true);
    this.emitter.emit('verify-start', value);

    let result;
    try {
      result = await this.options.onVerify(value);
    } catch (err) {
      if (this._destroyed) return;
      this.setLoading(false);
      this._verifyFailure(err && err.message);
      return;
    }

    if (this._destroyed) return;
    this.setLoading(false);
    const { ok, message } = this._normalizeVerifyResult(result);
    if (ok) this._verifySuccess(value, message);
    else    this._verifyFailure(message);
  }

  /** Coerce the many accepted onVerify return shapes into { ok, message }. */
  _normalizeVerifyResult(result) {
    if (result === false) return { ok: false, message: null };
    if (typeof result === 'string') return { ok: false, message: result };
    if (result && typeof result === 'object') {
      return { ok: !!result.ok, message: result.message ?? null };
    }
    // true / undefined / anything truthy → success (verify fns often resolve void on success)
    return { ok: true, message: null };
  }

  _verifySuccess(value, message) {
    this._attempts = 0;
    this.clearError();
    this._animateSuccess();
    addClasses(this.container, 'otp-root--verified');
    this.a11y.announceCompletion(value);
    if (this.options.toast?.enabled) {
      this.toast.success(message || this.options.toast.successMessage);
    }
    this.emitter.emit('verified', value);
    if (this.options.autoSubmit) this._submitForm(value);
  }

  _verifyFailure(message) {
    const msg = message || this.options.loading?.errorText || 'Verification failed';
    this._animateError();
    this.inputs.forEach(inp => addClasses(inp, 'otp-input--error'));
    this.a11y.announceError(msg);
    if (this.options.toast?.enabled) this.toast.error(msg);
    this.emitter.emit('verify-failed', msg);
    this._registerFailedAttempt();

    if (this.options.loading?.clearOnError) {
      const delay = this.options.loading.clearDelay ?? 900;
      clearTimeout(this._clearTimeout);
      this._clearTimeout = setTimeout(() => {
        if (this._destroyed || this._locked) return;
        this.clear();
        this.clearError();
      }, delay);
    }
  }

  // ─── Lockout (too many failed attempts) ─────────────────────────────────────

  _registerFailedAttempt() {
    const lk = this.options.lockout;
    if (!lk?.enabled || this._locked) return;
    this._attempts += 1;
    this.emitter.emit('attempt', { attempts: this._attempts, max: lk.maxAttempts });
    if (this._attempts >= lk.maxAttempts) this.lock();
  }

  /** Lock the input for the configured cooldown. */
  lock() {
    const lk = this.options.lockout;
    this._locked = true;
    this.disable();
    addClasses(this.container, 'otp-root--locked');

    let remaining = lk.duration;
    const text = () =>
      String(lk.message || 'Too many attempts. Try again in {seconds}s.').replace('{seconds}', remaining);

    if (this._lockEl) this._lockEl.textContent = text();
    this.a11y.announceError(text());
    if (this.options.toast?.enabled) this.toast.error(text());
    if (isFunction(lk.onLock)) lk.onLock(remaining);
    this.emitter.emit('lock', remaining);

    clearInterval(this._lockInterval);
    this._lockInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        this.unlock();
      } else if (this._lockEl) {
        this._lockEl.textContent = text();
      }
    }, 1000);
    return this;
  }

  /** Release a lock early and reset the attempt counter. */
  unlock() {
    clearInterval(this._lockInterval);
    if (!this._locked) return this;
    this._locked = false;
    this._attempts = 0;
    this.enable();
    removeClasses(this.container, 'otp-root--locked');
    if (this._lockEl) this._lockEl.textContent = '';
    this.clear();
    if (isFunction(this.options.lockout?.onUnlock)) this.options.lockout.onUnlock();
    this.emitter.emit('unlock');
    return this;
  }

  /** Whether the input is currently locked out. */
  isLocked() {
    return this._locked;
  }

  // ─── Animations ────────────────────────────────────────────────────────────

  // Each error style maps to one or more animation classes. Errors usually fire
  // when the code is COMPLETE (all cells filled), so every style animates all
  // cells — the old 'highlight' only touched empty cells and so did nothing.
  static get ERROR_ANIMATIONS() {
    return {
      shake:     ['otp-anim-shake'],
      highlight: ['otp-anim-highlight'],
      both:      ['otp-anim-shake', 'otp-anim-highlight'],
      pulse:     ['otp-anim-pulse'],
      buzz:      ['otp-anim-buzz'],
      bounce:    ['otp-anim-bounce'],
      glow:      ['otp-anim-glow'],
      wobble:    ['otp-anim-wobble'],
    };
  }

  _animateError() {
    if (prefersReducedMotion()) return;
    const style = this.options.animation?.error;
    if (!style) return;

    const classes = OTPInput.ERROR_ANIMATIONS[style] || OTPInput.ERROR_ANIMATIONS.shake;

    this.inputs.forEach((inp) => {
      classes.forEach((cls) => inp.classList.remove(cls));
      void inp.offsetWidth; // force reflow so the animation restarts
      classes.forEach((cls) => inp.classList.add(cls));
      inp.addEventListener('animationend', () => {
        classes.forEach((cls) => inp.classList.remove(cls));
      }, { once: true });
    });

    this._haptic([100, 50, 100]);
  }

  _animateSuccess() {
    if (prefersReducedMotion()) return;
    if (!this.options.animation?.success) return;
    this.inputs.forEach((inp, i) => {
      setTimeout(() => {
        addClasses(inp, 'otp-input--success', 'otp-anim-pop');
        inp.addEventListener('animationend', () => removeClasses(inp, 'otp-anim-pop'), { once: true });
      }, i * 40);
    });
  }

  // ─── SMS Auto-Read (Web OTP API) ───────────────────────────────────────────

  _initSmsAutoRead() {
    if (!this.options.smsAutoRead) return;

    // The Web OTP API only exists on supporting browsers (Android Chrome) …
    if (!('OTPCredential' in window)) {
      this.emitter.emit('sms-unsupported', 'no-api');
      return;
    }
    // … and only runs in a secure context (HTTPS or localhost).
    if (window.isSecureContext === false) {
      this.emitter.emit('sms-unsupported', 'insecure-context');
      return;
    }

    const ac = new AbortController();
    this._smsAbortController = ac;
    this.emitter.emit('sms-pending');

    navigator.credentials.get({ otp: { transport: ['sms'] }, signal: ac.signal })
      .then((otp) => {
        if (otp && otp.code) {
          this.setValue(otp.code);
          if (isFunction(this.options.onSmsRead)) this.options.onSmsRead(otp.code);
          this.emitter.emit('sms-read', otp.code);
        }
      })
      .catch((err) => {
        // AbortError fires on destroy/navigation — not a genuine failure.
        if (err && err.name === 'AbortError') return;
        this.emitter.emit('sms-error', err);
      });
  }

  // ─── Biometric Confirm (WebAuthn) ──────────────────────────────────────────

  async _biometricConfirm(value) {
    if (!window.PublicKeyCredential) {
      this._proceedAfterGate(value);
      return;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        this._proceedAfterGate(value);
        return;
      }

      if (this.options.toast?.enabled) {
        this.toast.info(this.options.biometric.promptText || 'Verify your identity to continue');
      }
      this.emitter.emit('biometric-start');

      // A registration ceremony reliably triggers the platform biometric
      // (Touch ID / Face ID / Windows Hello) WITHOUT a pre-registered credential.
      // get() with an empty allowCredentials list rejects when nothing is
      // registered — which is why the old flow always "failed". The created
      // credential is discarded; we only care that user-verification passed.
      const rpId = location.hostname || 'localhost';
      await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: document.title || rpId, id: rpId },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: this.options.biometric.userName || 'otp-user',
            displayName: this.options.biometric.userName || 'OTP User',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },   // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'discouraged',
          },
          timeout: 60000,
          attestation: 'none',
        },
      });

      if (typeof this.options.biometric.onConfirmed === 'function') this.options.biometric.onConfirmed();
      this.emitter.emit('biometric-confirmed');
      this._proceedAfterGate(value);
    } catch (err) {
      if (typeof this.options.biometric.onCancelled === 'function') this.options.biometric.onCancelled();
      this.emitter.emit('biometric-cancelled');
      this.setError(this.options.biometric.cancelText || 'Biometric verification was cancelled or failed');
    }
  }

  _triggerError(index) {
    const input = this.inputs[index];
    input.classList.remove('otp-anim-shake');
    void input.offsetWidth;
    input.classList.add('otp-anim-shake');
    input.addEventListener('animationend', () => input.classList.remove('otp-anim-shake'), { once: true });
    this._haptic([50]);
  }

  _haptic(pattern) {
    if (!this.options.haptic || !navigator.vibrate) return;
    navigator.vibrate(pattern || [10]);
  }

  // ─── Undo / Redo ───────────────────────────────────────────────────────────

  _undo() {
    const snapshot = this.history.undo();
    if (!snapshot) return;
    this._applySnapshot(snapshot);
  }

  _redo() {
    const snapshot = this.history.redo();
    if (!snapshot) return;
    this._applySnapshot(snapshot);
  }

  _applySnapshot(snapshot) {
    snapshot.forEach((v, i) => this._setInputValue(i, v));
    this._notifyChange();
    // Focus first empty or last
    const firstEmpty = this._values.findIndex(v => !v);
    this._focusIndex(firstEmpty >= 0 ? firstEmpty : this.inputs.length - 1);
  }

  _selectAll() {
    this.inputs.forEach(inp => inp.select());
  }

  _setExpired(expired) {
    this._expired = expired;
    this.inputs.forEach(inp => { inp.disabled = expired; });
    if (expired) {
      addClasses(this.container, 'otp-root--expired');
    } else {
      removeClasses(this.container, 'otp-root--expired');
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Get current OTP value (always western digits) */
  getValue() {
    return this._values.join('');
  }

  /** Set OTP value programmatically */
  setValue(value) {
    const str = String(value ?? '');
    const chars = str.split('').slice(0, this.options.length);
    chars.forEach((ch, i) => this._setInputValue(i, ch));
    // Clear remaining
    for (let i = chars.length; i < this.inputs.length; i++) this._setInputValue(i, '');
    this.history.push([...this._values]);
    this._notifyChange();
    this._checkCompletion();
  }

  /** Clear all inputs */
  clear() {
    clearTimeout(this._clearTimeout);
    this._values.fill('');
    this.inputs.forEach((inp, i) => {
      inp.value = '';
      this._updateInputUI(inp, i);
    });
    this.validation.clearErrors(this.inputs);
    this.inputs.forEach(inp => removeClasses(inp, 'otp-input--success', 'otp-input--error'));
    removeClasses(this.container, 'otp-root--verified');
    this.history.push([...this._values]);
    this._notifyChange();
    if (this.options.autoFocus) this._focusIndex(0);
  }

  /** Focus a specific digit by index */
  focus(index = 0) {
    this._focusIndex(index);
  }

  /** Disable all inputs */
  disable() {
    this.inputs.forEach(inp => { inp.disabled = true; });
    addClasses(this.container, 'otp-root--disabled');
  }

  /** Enable all inputs */
  enable() {
    this.inputs.forEach(inp => { inp.disabled = false; });
    removeClasses(this.container, 'otp-root--disabled');
  }

  /** Trigger error state with optional message */
  setError(message) {
    this.setLoading(false);
    this._animateError();
    this.inputs.forEach(inp => addClasses(inp, 'otp-input--error'));
    if (message) {
      this.a11y.announceError(message);
      if (this.options.toast?.enabled) this.toast.error(message);
    }
    this.emitter.emit('error', [{ index: -1, message }]);
    this._registerFailedAttempt();
  }

  /** Toggle peeking at masked digits (secure mode). Pass a boolean to force. */
  toggleReveal(force) {
    if (!this.options.secure) return this;
    this._revealed = typeof force === 'boolean' ? force : !this._revealed;
    const type = this._revealed ? 'text' : 'password';
    this.inputs.forEach((inp) => { inp.type = type; });
    if (this._revealBtn) {
      const label = this._revealed ? this.options.hideLabel : this.options.revealLabel;
      this._revealBtn.setAttribute('aria-pressed', String(this._revealed));
      this._revealBtn.setAttribute('aria-label', label);
      this._revealBtn.setAttribute('title', label);
      this._revealBtn.classList.toggle('otp-reveal-btn--on', this._revealed);
      const labelEl = this._revealBtn.querySelector('.otp-reveal-label');
      if (labelEl) labelEl.textContent = label;
    }
    return this;
  }

  /** Toggle the verifying/loading state — disables inputs and shows a spinner. */
  setLoading(loading = true) {
    this._loading = !!loading;
    if (this._loading) {
      addClasses(this.container, 'otp-root--loading');
      this.inputs.forEach(inp => { inp.disabled = true; });
      if (this._spinner) {
        this._spinner.setAttribute('aria-hidden', 'false');
        this._spinner.setAttribute('aria-label', this.options.loading?.text || 'Loading');
      }
    } else {
      removeClasses(this.container, 'otp-root--loading');
      if (!this._expired) this.inputs.forEach(inp => { inp.disabled = false; });
      if (this._spinner) this._spinner.setAttribute('aria-hidden', 'true');
    }
    return this;
  }

  /** Manually put the component into the verified/success state. */
  setSuccess(message) {
    this.setLoading(false);
    this._verifySuccess(this.getValue(), message);
    return this;
  }

  /** Switch theme dynamically: 'default'|'underline'|'rounded'|'ghost'|'filled'|'soft'|'neon'|'gradient'|'pill' */
  setTheme(theme) {
    this.options.theme = theme;
    if (theme) this.container.dataset.theme = theme;
    else delete this.container.dataset.theme;
  }

  /** Switch toast theme: 'default'|'glass'|'solid'|'gradient'|'minimal'|'pill' */
  setToastTheme(theme) {
    this.options.toast.theme = theme;
    this.toast.setTheme(theme);
  }

  /** Clear error state */
  clearError() {
    this.validation.clearErrors(this.inputs);
    this.inputs.forEach(inp => removeClasses(inp, 'otp-input--error'));
  }

  /** Reset timer */
  resetTimer(duration) {
    const d = duration ?? this.options.timer?.duration ?? 60;
    this._setExpired(false);
    this.timer.reset(d);
  }

  /** Update direction dynamically */
  setDirection(dir) {
    this.options.direction = dir;
    this.rtl.applyDirection(this.container);
  }

  /** Update locale dynamically */
  setLocale(locale) {
    this.options.locale = locale;
    this.numbers.setLocale(locale);
    // Re-render displayed values
    this.inputs.forEach((inp, i) => {
      inp.lang = locale;
      inp.value = this._getDisplayValue(i);
    });
  }

  /** Subscribe to an event. Returns an unsubscribe function. */
  on(event, listener) {
    return this.emitter.on(event, listener);
  }

  /** Unsubscribe a previously-registered listener. */
  off(event, listener) {
    this.emitter.off(event, listener);
    return this;
  }

  /** Subscribe to an event for a single emission. Returns an unsubscribe function. */
  once(event, listener) {
    return this.emitter.once(event, listener);
  }

  /** Destroy instance and clean up DOM */
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    clearTimeout(this._clearTimeout);
    clearInterval(this._lockInterval);
    this._smsAbortController?.abort();
    this.timer.destroy();
    this.clipboard.destroy();
    this.a11y.destroy();
    this.emitter.removeAllListeners();
    this.container.innerHTML = '';
    removeClasses(this.container, 'otp-root', 'otp-root--disabled', 'otp-root--expired');
    this.inputs = [];
  }
}
