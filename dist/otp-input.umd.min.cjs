/*!
 * otp-input-kit v1.0.0
 * A highly customizable, framework-agnostic OTP input component
 * (c) 2026 — MIT License
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.OTPInputLib = {}));
})(this, (function (exports) { 'use strict';

  /**
   * Lightweight event emitter for internal pub/sub
   */
  class EventEmitter {
    constructor() {
      this._events = Object.create(null);
    }

    on(event, listener) {
      if (!this._events[event]) this._events[event] = [];
      this._events[event].push(listener);
      return () => this.off(event, listener);
    }

    off(event, listener) {
      if (!this._events[event]) return;
      this._events[event] = this._events[event].filter(l => l !== listener);
    }

    emit(event, ...args) {
      if (!this._events[event]) return;
      this._events[event].forEach(l => {
        try { l(...args); } catch (e) { console.error(`[OTPInput] Event listener error on "${event}":`, e); }
      });
    }

    once(event, listener) {
      const remove = this.on(event, (...args) => {
        remove();
        listener(...args);
      });
      return remove;
    }

    removeAllListeners(event) {
      if (event) delete this._events[event];
      else this._events = Object.create(null);
    }
  }

  /**
   * General utility helpers
   */

  function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) target[key] = {};
          mergeDeep(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return mergeDeep(target, ...sources);
  }

  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  function isFunction(val) {
    return typeof val === 'function';
  }

  function generateId(prefix = 'otp') {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /**
   * DOM utility helpers
   */

  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'class') el.className = val;
      else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
      else if (key.startsWith('data-')) el.setAttribute(key, val);
      else if (key.startsWith('aria-')) el.setAttribute(key, val);
      else el[key] = val;
    }
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child instanceof Node) el.appendChild(child);
    });
    return el;
  }

  function addClasses(el, ...classes) {
    el.classList.add(...classes.filter(Boolean));
  }

  function removeClasses(el, ...classes) {
    el.classList.remove(...classes.filter(Boolean));
  }

  function getDir(el) {
    let node = el;
    while (node && node !== document.documentElement) {
      const dir = node.getAttribute('dir') || getComputedStyle(node).direction;
      if (dir === 'rtl' || dir === 'ltr') return dir;
      node = node.parentElement;
    }
    return document.dir || 'ltr';
  }

  function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Manages ARIA attributes, live regions, and screen reader announcements.
   */
  class AccessibilityManager {
    constructor(instance) {
      this.instance = instance;
      this._liveRegion = null;
      this._instanceId = generateId('otp');
    }

    setup(container, inputs) {
      const { length, label, describedBy } = this.instance.options;

      // Container role
      container.setAttribute('role', 'group');
      container.setAttribute('aria-label', label || `Enter ${length}-digit code`);

      // Create visually-hidden live region for announcements
      this._liveRegion = document.createElement('div');
      this._liveRegion.setAttribute('aria-live', 'polite');
      this._liveRegion.setAttribute('aria-atomic', 'true');
      this._liveRegion.className = 'otp-live-region';
      this._liveRegion.style.cssText =
        'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
      container.appendChild(this._liveRegion);

      // Set up each input
      inputs.forEach((input, i) => {
        const inputId = `${this._instanceId}-input-${i}`;
        input.id = inputId;
        input.setAttribute('aria-label', `Digit ${i + 1} of ${length}`);
        input.setAttribute('role', 'textbox');
        input.setAttribute('aria-required', 'true');
        if (describedBy) input.setAttribute('aria-describedby', describedBy);
      });
    }

    updateInputState(input, { filled, error, disabled }) {
      input.setAttribute('aria-invalid', error ? 'true' : 'false');
      input.disabled = !!disabled;
    }

    announce(message, priority = 'polite') {
      if (!this._liveRegion) return;
      this._liveRegion.setAttribute('aria-live', priority);
      // Clear and re-set to force announcement
      this._liveRegion.textContent = '';
      requestAnimationFrame(() => {
        this._liveRegion.textContent = message;
      });
    }

    announceCompletion(value) {
      this.announce(`OTP complete: ${value.split('').join(' ')}`, 'assertive');
    }

    announceError(message) {
      this.announce(message, 'assertive');
    }

    announceTimer(seconds) {
      if (seconds % 10 === 0 || seconds <= 5) {
        this.announce(`${seconds} seconds remaining`);
      }
    }

    announceResend() {
      this.announce('New code sent. Please enter the new code.');
    }

    destroy() {
      this._liveRegion?.remove();
      this._liveRegion = null;
    }
  }

  /**
   * Input validation utilities
   */

  const PATTERNS = {
    numeric: /^\d$/,
    alpha: /^[a-zA-Z]$/,
    alphanumeric: /^[a-zA-Z0-9]$/,
    hex: /^[0-9a-fA-F]$/,
  };

  function createValidator(type, customPattern) {
    if (customPattern instanceof RegExp) return (ch) => customPattern.test(ch);
    return (ch) => (PATTERNS[type] || PATTERNS.numeric).test(ch);
  }

  function isOTPLike(text) {
    // Detect if clipboard text looks like an OTP (4-8 consecutive digits/alphanums)
    const stripped = text.trim();
    return /^\d{4,8}$/.test(stripped) || /^[A-Z0-9]{4,8}$/.test(stripped);
  }

  function extractOTP(text, length, pattern) {
    // Try to extract OTP from various formats: "Your OTP is 123456", SMS templates, etc.
    const stripped = text.replace(/\s/g, '');

    // Pure digit sequence of correct length
    const exactMatch = new RegExp(`\\b\\d{${length}}\\b`).exec(text);
    if (exactMatch) return exactMatch[0];

    // Alphanumeric sequence
    const alphaMatch = new RegExp(`\\b[A-Z0-9]{${length}}\\b`).exec(text.toUpperCase());
    if (alphaMatch) return alphaMatch[0];

    // Take first N valid characters
    const valid = stripped.split('').filter(ch => (pattern || /\d/).test(ch));
    if (valid.length >= length) return valid.slice(0, length).join('');

    return null;
  }

  /**
   * Manages per-digit and full-OTP validation, error state, and feedback.
   */
  class ValidationManager {
    constructor(instance) {
      this.instance = instance;
      this._validator = null;
      this._errors = [];
      this._rebuild();
    }

    _rebuild() {
      const { type, pattern } = this.instance.options;
      this._validator = createValidator(type, pattern);
    }

    isValidChar(ch) {
      return this._validator(ch);
    }

    validateAll(values) {
      const opts = this.instance.options;
      this._errors = [];

      values.forEach((val, i) => {
        if (val && !this._validator(val)) {
          this._errors.push({ index: i, message: `Invalid character at position ${i + 1}` });
        }
      });

      if (opts.validate && typeof opts.validate === 'function') {
        const joined = values.join('');
        const customError = opts.validate(joined);
        if (customError) this._errors.push({ index: -1, message: customError });
      }

      return this._errors.length === 0;
    }

    markErrors(inputs) {
      inputs.forEach((input, i) => {
        const hasError = this._errors.some(e => e.index === i || e.index === -1);
        toggleError(input, hasError);
      });
      return this._errors;
    }

    clearErrors(inputs) {
      inputs.forEach(input => toggleError(input, false));
      this._errors = [];
    }

    getErrors() {
      return [...this._errors];
    }
  }

  function toggleError(input, hasError) {
    if (hasError) {
      addClasses(input, 'otp-input--error');
      input.setAttribute('aria-invalid', 'true');
    } else {
      removeClasses(input, 'otp-input--error');
      input.setAttribute('aria-invalid', 'false');
    }
  }

  /**
   * Undo/redo history for OTP input values.
   * Stores snapshots of the values array.
   */
  class HistoryManager {
    constructor(maxSize = 50) {
      this._stack = [];
      this._pointer = -1;
      this._maxSize = maxSize;
    }

    push(snapshot) {
      // Drop any redo states when new action taken
      this._stack = this._stack.slice(0, this._pointer + 1);
      this._stack.push([...snapshot]);
      if (this._stack.length > this._maxSize) this._stack.shift();
      this._pointer = this._stack.length - 1;
    }

    undo() {
      if (this._pointer <= 0) return null;
      this._pointer--;
      return [...this._stack[this._pointer]];
    }

    redo() {
      if (this._pointer >= this._stack.length - 1) return null;
      this._pointer++;
      return [...this._stack[this._pointer]];
    }

    canUndo() {
      return this._pointer > 0;
    }

    canRedo() {
      return this._pointer < this._stack.length - 1;
    }

    clear() {
      this._stack = [];
      this._pointer = -1;
    }

    /** Push only if state changed */
    pushIfChanged(snapshot) {
      const current = this._stack[this._pointer];
      if (!current || !arraysEqual(current, snapshot)) {
        this.push(snapshot);
      }
    }
  }

  function arraysEqual(a, b) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  /**
   * Handles paste events and clipboard OTP detection with suggestion UI.
   */
  class ClipboardManager {
    constructor(instance) {
      this.instance = instance;
      this._suggestionEl = null;
      this._suggestionTimer = null;
    }

    handlePaste(e, targetIndex) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      this._distribute(text, targetIndex);
    }

    _distribute(text, startIdx) {
      const inst = this.instance;
      const { length, type, pattern } = inst.options;
      const extracted = extractOTP(text, length, inst.validation._validator);

      if (!extracted) return;

      const chars = extracted.split('');
      chars.forEach((ch, i) => {
        const logicalIdx = startIdx + i;
        if (logicalIdx < inst.inputs.length && inst.validation.isValidChar(ch)) {
          inst._setInputValue(logicalIdx, ch);
        }
      });

      // Focus last filled or last input
      const lastIdx = Math.min(startIdx + chars.length - 1, inst.inputs.length - 1);
      inst._focusIndex(lastIdx + 1 < inst.inputs.length ? lastIdx + 1 : lastIdx);
      inst._notifyChange();
      inst._checkCompletion();
    }

    /** Poll clipboard (with permission) and suggest pasting if OTP-like text is found */
    async checkClipboard() {
      if (!navigator.clipboard?.readText) return;
      try {
        const text = await navigator.clipboard.readText();
        const { length } = this.instance.options;
        if (isOTPLike(text) || extractOTP(text, length)) {
          this._showSuggestion(text);
        }
      } catch (_) {
        // Permission denied or not available — silently ignore
      }
    }

    _showSuggestion(text) {
      const inst = this.instance;
      if (!inst.options.clipboardDetection) return;
      this._hideSuggestion();

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'otp-paste-suggestion';
      btn.setAttribute('aria-label', 'Paste detected OTP from clipboard');
      btn.textContent = inst.options.clipboardSuggestionText || 'Paste code from clipboard';

      btn.addEventListener('click', () => {
        this._distribute(text, 0);
        this._hideSuggestion();
      });

      inst.container.appendChild(btn);
      this._suggestionEl = btn;

      // Auto-hide after 8s
      this._suggestionTimer = setTimeout(() => this._hideSuggestion(), 8000);
    }

    _hideSuggestion() {
      clearTimeout(this._suggestionTimer);
      this._suggestionEl?.remove();
      this._suggestionEl = null;
    }

    destroy() {
      this._hideSuggestion();
    }
  }

  /**
   * Manages countdown timer UI, expiry callbacks, and resend cooldown.
   */
  class TimerManager {
    constructor(instance) {
      this.instance = instance;
      this._timerEl = null;
      this._progressEl = null;
      this._resendBtn = null;
      this._interval = null;
      this._remaining = 0;
      this._total = 0;
    }

    buildUI(wrapperEl) {
      const { timer, resend } = this.instance.options;

      if (timer?.enabled || resend?.enabled) {
        const footer = document.createElement('div');
        footer.className = 'otp-footer';

        if (timer?.enabled) {
          const timerWrap = document.createElement('div');
          timerWrap.className = 'otp-timer-wrap';

          if (timer.showProgress) {
            this._progressEl = document.createElement('div');
            this._progressEl.className = 'otp-timer-progress';
            const bar = document.createElement('div');
            bar.className = 'otp-timer-progress-bar';
            this._progressEl.appendChild(bar);
            wrapperEl.insertBefore(this._progressEl, wrapperEl.querySelector('.otp-inputs-row'));
          }

          this._timerEl = document.createElement('span');
          this._timerEl.className = 'otp-timer';
          this._timerEl.setAttribute('aria-live', 'off');
          timerWrap.appendChild(this._timerEl);
          footer.appendChild(timerWrap);
        }

        if (resend?.enabled) {
          this._resendBtn = document.createElement('button');
          this._resendBtn.type = 'button';
          this._resendBtn.className = 'otp-resend-btn';
          this._resendBtn.textContent = resend.label || 'Resend code';
          this._resendBtn.disabled = true;
          this._resendBtn.addEventListener('click', () => this._handleResend());
          footer.appendChild(this._resendBtn);
        }

        wrapperEl.appendChild(footer);
      }
    }

    start(durationSeconds) {
      this.stop();
      this._total = durationSeconds;
      this._remaining = durationSeconds;
      this._tick();
      this._interval = setInterval(() => this._tick(), 1000);
    }

    _tick() {
      const inst = this.instance;
      const { timer, resend } = inst.options;

      this._updateDisplay();
      inst.a11y.announceTimer(this._remaining);

      if (this._remaining <= 0) {
        this.stop();
        if (timer?.onExpire) timer.onExpire();
        inst.emitter.emit('expire');
        inst._setExpired(true);
        if (this._resendBtn) this._resendBtn.disabled = false;
        return;
      }
      this._remaining--;
    }

    _updateDisplay() {
      if (this._timerEl) {
        this._timerEl.textContent = formatTime(this._remaining);
        if (this._remaining <= 10) {
          this._timerEl.classList.add('otp-timer--urgent');
        }
      }
      if (this._progressEl) {
        const pct = (this._remaining / this._total) * 100;
        const bar = this._progressEl.querySelector('.otp-timer-progress-bar');
        if (bar) bar.style.width = `${pct}%`;
      }
    }

    _handleResend() {
      const inst = this.instance;
      const { resend, timer } = inst.options;

      inst._setExpired(false);
      inst.clear();
      this._resendBtn.disabled = true;

      const cooldown = resend.cooldown ?? timer?.duration ?? 30;
      this.start(cooldown);

      if (resend.onResend) resend.onResend();
      inst.emitter.emit('resend');
      inst.a11y.announceResend();
    }

    stop() {
      clearInterval(this._interval);
      this._interval = null;
    }

    reset(durationSeconds) {
      this.stop();
      this._timerEl?.classList.remove('otp-timer--urgent');
      if (this._resendBtn) this._resendBtn.disabled = true;
      this.start(durationSeconds ?? this._total);
    }

    destroy() {
      this.stop();
    }
  }

  /**
   * Locale definitions for number rendering and RTL detection
   */

  const RTL_LOCALES = new Set([
    'ar', 'arc', 'dv', 'fa', 'ha', 'he', 'khw', 'ks', 'ku', 'ps', 'ur', 'yi',
  ]);

  const NUMERAL_SYSTEMS = {
    // Western Arabic (default)
    en: { digits: '0123456789', dir: 'ltr' },
    // Eastern Arabic
    ar: { digits: '٠١٢٣٤٥٦٧٨٩', dir: 'rtl' },
    // Persian/Farsi
    fa: { digits: '۰۱۲۳۴۵۶۷۸۹', dir: 'rtl' },
    // Hindi/Devanagari
    hi: { digits: '०१२३४५६७८९', dir: 'ltr' },
    // Bengali
    bn: { digits: '০১২৩৪৫৬৭৮৯', dir: 'ltr' },
    // Tamil
    ta: { digits: '௦௧௨௩௪௫௬௭௮௯', dir: 'ltr' },
    // Thai
    th: { digits: '๐๑๒๓๔๕๖๗๘๙', dir: 'ltr' },
  };

  function isRTLLocale(locale) {
    if (!locale) return false;
    const base = locale.split('-')[0].toLowerCase();
    return RTL_LOCALES.has(base);
  }

  function getNumeralSystem(locale) {
    if (!locale) return NUMERAL_SYSTEMS.en;
    const base = locale.split('-')[0].toLowerCase();
    return NUMERAL_SYSTEMS[base] || NUMERAL_SYSTEMS.en;
  }

  /**
   * Manages RTL layout, navigation direction, and mirrored animations.
   */
  class RTLManager {
    constructor(instance) {
      this.instance = instance;
    }

    /** Resolve effective direction from options, locale, and DOM context */
    resolveDirection() {
      const { direction, locale } = this.instance.options;

      if (direction === 'rtl') return 'rtl';
      if (direction === 'ltr') return 'ltr';

      // 'auto' or unset: check locale, then DOM
      if (direction === 'auto' || !direction) {
        if (locale && isRTLLocale(locale)) return 'rtl';
        return getDir(this.instance.container);
      }
      return 'ltr';
    }

    get isRTL() {
      return this.resolveDirection() === 'rtl';
    }

    applyDirection(container) {
      const dir = this.resolveDirection();
      container.setAttribute('dir', dir);
      container.dataset.dir = dir;
    }

    /**
     * Convert visual index to logical index.
     * In RTL mode, the first visual slot (leftmost) is the LAST logical digit.
     */
    visualToLogical(visualIdx, length) {
      return this.isRTL ? length - 1 - visualIdx : visualIdx;
    }

    logicalToVisual(logicalIdx, length) {
      return this.isRTL ? length - 1 - logicalIdx : logicalIdx;
    }

    /**
     * Get the next focus target index given a "forward" movement.
     * Forward = toward the end of the OTP value (higher logical index).
     */
    nextIndex(currentIdx, inputs) {
      const next = currentIdx + 1;
      return next < inputs.length ? next : null;
    }

    prevIndex(currentIdx) {
      const prev = currentIdx - 1;
      return prev >= 0 ? prev : null;
    }

    /**
     * Arrow key mapping: in RTL, Left arrow = forward, Right = backward (visually reversed)
     */
    arrowKeyDirection(key, isRTL) {
      if (key === 'ArrowRight') return isRTL ? 'prev' : 'next';
      if (key === 'ArrowLeft')  return isRTL ? 'next' : 'prev';
      return null;
    }

    getMirroredAnimation(animName) {
      const mirrored = { fadeInRight: 'fadeInLeft', slideInRight: 'slideInLeft' };
      return this.isRTL ? (mirrored[animName] || animName) : animName;
    }
  }

  /**
   * Handles rendering digits in locale-specific numeral systems
   * while storing values internally as Western digits (0-9).
   */
  class NumberRenderer {
    constructor(locale = 'en') {
      this.setLocale(locale);
    }

    setLocale(locale) {
      this.locale = locale;
      this.system = getNumeralSystem(locale);
    }

    /** Convert Western digit to locale numeral */
    toLocale(westernChar) {
      if (!westernChar || westernChar.length !== 1) return westernChar;
      const idx = '0123456789'.indexOf(westernChar);
      if (idx === -1) return westernChar; // non-digit, return as-is
      return this.system.digits[idx];
    }

    /** Convert locale numeral back to Western digit */
    toWestern(localeChar) {
      if (!localeChar || localeChar.length !== 1) return localeChar;
      const idx = this.system.digits.indexOf(localeChar);
      if (idx === -1) {
        // Already western or not a digit
        return localeChar;
      }
      return String(idx);
    }

    /** Convert a full string from locale to western */
    stringToWestern(str) {
      return str.split('').map(ch => this.toWestern(ch)).join('');
    }

    /** Convert a full string from western to locale */
    stringToLocale(str) {
      return str.split('').map(ch => this.toLocale(ch)).join('');
    }

    isNativeNumeral(ch) {
      return this.system.digits.includes(ch);
    }
  }

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
  class OTPInput {
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
      const { onChange, onComplete, onError, onFocus, onBlur } = this.options;
      if (isFunction(onChange))   this.emitter.on('change',   onChange);
      if (isFunction(onComplete)) this.emitter.on('complete', onComplete);
      if (isFunction(onError))    this.emitter.on('error',    onError);
      if (isFunction(onFocus))    this.emitter.on('focus',    onFocus);
      if (isFunction(onBlur))     this.emitter.on('blur',     onBlur);
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
      this.inputs[index];
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
        this.emitter.emit('error', errors);
        return;
      }

      this._animateSuccess();
      this.a11y.announceCompletion(value);
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
      if (message) this.a11y.announceError(message);
      this.emitter.emit('error', [{ index: -1, message }]);
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
  class OTPInputElement extends _HTMLElement {
    static get observedAttributes() {
      return [
        'length', 'type', 'secure', 'auto-focus', 'auto-submit',
        'direction', 'locale', 'native-numerals', 'placeholder',
        'haptic', 'timer-duration', 'resend-enabled', 'resend-cooldown',
        'clipboard-detection', 'label',
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
  function registerOTPInputElement(tagName = 'otp-input') {
    if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
      customElements.define(tagName, OTPInputElement);
    }
  }

  // Auto-register <otp-input> web component
  registerOTPInputElement();

  exports.EventEmitter = EventEmitter;
  exports.OTPInput = OTPInput;
  exports.OTPInputElement = OTPInputElement;
  exports.default = OTPInput;
  exports.registerOTPInputElement = registerOTPInputElement;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
