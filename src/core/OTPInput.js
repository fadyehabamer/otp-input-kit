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
    error: 'shake',          // 'shake' | 'highlight' | 'both' | false
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
    }

    this._wrapper.appendChild(this._inputsRow);
    this.timer.buildUI(this._wrapper);
    this.container.appendChild(this._wrapper);

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
    const { onChange, onComplete, onError, onFocus, onBlur, toast } = this.options;
    if (isFunction(onChange))   this.emitter.on('change',   onChange);
    if (isFunction(onComplete)) this.emitter.on('complete', onComplete);
    if (isFunction(onError))    this.emitter.on('error',    onError);
    if (isFunction(onFocus))    this.emitter.on('focus',    onFocus);
    if (isFunction(onBlur))     this.emitter.on('blur',     onBlur);

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
      return;
    }

    this._animateSuccess();
    this.a11y.announceCompletion(value);
    if (this.options.toast?.enabled) {
      this.toast.success(this.options.toast.successMessage);
    }
    this.emitter.emit('complete', value);

    if (this.options.autoSubmit) {
      const form = this.container.closest('form');
      if (form) {
        const hidden = form.querySelector('input[name="otp"]') || (() => {
          const h = document.createElement('input');
          h.type = 'hidden'; h.name = 'otp';
          form.appendChild(h); return h;
        })();
        hidden.value = value;
        form.requestSubmit?.() ?? form.submit();
      }
    }
  }

  // ─── Animations ────────────────────────────────────────────────────────────

  _animateError() {
    if (prefersReducedMotion()) return;
    const { animation } = this.options;
    if (!animation?.error) return;

    const targets = animation.error === 'highlight'
      ? this.inputs.filter((_, i) => this._values[i] === '')
      : this.inputs;

    if (animation.error === 'shake' || animation.error === 'both') {
      targets.forEach(inp => {
        inp.classList.remove('otp-anim-shake');
        void inp.offsetWidth; // reflow
        inp.classList.add('otp-anim-shake');
        inp.addEventListener('animationend', () => inp.classList.remove('otp-anim-shake'), { once: true });
      });
    }

    if (animation.error === 'highlight' || animation.error === 'both') {
      targets.forEach(inp => {
        inp.classList.add('otp-anim-highlight');
        inp.addEventListener('animationend', () => inp.classList.remove('otp-anim-highlight'), { once: true });
      });
    }

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
    this._values.fill('');
    this.inputs.forEach((inp, i) => {
      inp.value = '';
      this._updateInputUI(inp, i);
    });
    this.validation.clearErrors(this.inputs);
    this.inputs.forEach(inp => removeClasses(inp, 'otp-input--success'));
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
    this._animateError();
    this.inputs.forEach(inp => addClasses(inp, 'otp-input--error'));
    if (message) {
      this.a11y.announceError(message);
      if (this.options.toast?.enabled) this.toast.error(message);
    }
    this.emitter.emit('error', [{ index: -1, message }]);
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

  /** Subscribe to events */
  on(event, listener) {
    return this.emitter.on(event, listener);
  }

  /** Destroy instance and clean up DOM */
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.timer.destroy();
    this.clipboard.destroy();
    this.a11y.destroy();
    this.emitter.removeAllListeners();
    this.container.innerHTML = '';
    removeClasses(this.container, 'otp-root', 'otp-root--disabled', 'otp-root--expired');
    this.inputs = [];
  }
}
