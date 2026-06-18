/*!
 * otp-input-kit v1.0.3
 * A highly customizable, framework-agnostic OTP input component
 * (c) 2026 — MIT License
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

    inst._wrapper.appendChild(btn);
    this._suggestionEl = btn;

    // Auto-hide after 8s
    this._suggestionTimer = setTimeout(() => this._hideSuggestion(), 18000);
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
    this._progressBar = null;
    this._resendBtn = null;
    this._interval = null;
    this._remaining = 0;
    this._total = 0;
  }

  buildUI(wrapperEl) {
    const { timer, resend } = this.instance.options;
    this._wrapperEl = wrapperEl;

    if (timer?.enabled || resend?.enabled) {
      const footer = document.createElement('div');
      footer.className = 'otp-footer';

      if (timer?.enabled) {
        const timerWrap = document.createElement('div');
        timerWrap.className = 'otp-timer-wrap';
        this._isRing = timer.style === 'ring';

        this._timerEl = document.createElement('span');
        this._timerEl.setAttribute('aria-live', 'off');

        if (this._isRing) {
          // Circular countdown: a progress ring with the time in the centre.
          this._timerEl.className = 'otp-ring-label';
          const ring = document.createElement('div');
          ring.className = 'otp-timer-ring';
          ring.innerHTML =
            '<svg viewBox="0 0 48 48" aria-hidden="true">' +
            '<circle class="otp-ring-track" cx="24" cy="24" r="20"></circle>' +
            '<circle class="otp-ring-progress" cx="24" cy="24" r="20"></circle>' +
            '</svg>';
          // Reuse the same handle the bar uses → start/stop/pause logic is shared.
          this._progressBar = ring.querySelector('.otp-ring-progress');
          ring.appendChild(this._timerEl);
          timerWrap.appendChild(ring);
        } else {
          this._timerEl.className = 'otp-timer';
          if (timer.showProgress) {
            this._progressEl = document.createElement('div');
            this._progressEl.className = 'otp-timer-progress';
            this._progressBar = document.createElement('div');
            this._progressBar.className = 'otp-timer-progress-bar';
            this._progressEl.appendChild(this._progressBar);
            wrapperEl.insertBefore(this._progressEl, wrapperEl.querySelector('.otp-inputs-row'));
          }
          timerWrap.appendChild(this._timerEl);
        }

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

    if (this._progressBar) {
      this._progressBar.classList.remove('otp-timer-progress-bar--running');
      this._progressBar.style.animationDuration = '';
      // Force reflow so removing the class takes effect before re-adding.
      // (offsetWidth is undefined on SVG elements, so use getBoundingClientRect
      // which forces layout for both the bar <div> and the ring <circle>.)
      void this._progressBar.getBoundingClientRect().width;
      this._progressBar.style.animationDuration = `${durationSeconds}s`;
      this._progressBar.classList.add('otp-timer-progress-bar--running');
    }

    this._tick();
    this._isVisible = true;
    this._isOnScreen = true;
    this._startInterval();

    if (!this._visibilityHandler) {
      this._visibilityHandler = () => {
        this._isVisible = !document.hidden;
        this._syncRunState();
      };
      document.addEventListener('visibilitychange', this._visibilityHandler);
    }

    // Pause ticking and progress-bar animation when scrolled off-screen.
    if (!this._intersectionObserver && this._wrapperEl && typeof IntersectionObserver !== 'undefined') {
      this._intersectionObserver = new IntersectionObserver((entries) => {
        this._isOnScreen = entries[0].isIntersecting;
        this._syncRunState();
      });
      this._intersectionObserver.observe(this._wrapperEl);
    }
  }

  _startInterval() {
    if (this._interval) return;
    this._interval = setInterval(() => this._tick(), 1000);
    if (this._progressBar) {
      this._progressBar.style.animationPlayState = 'running';
    }
  }

  _stopInterval() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    if (this._progressBar) {
      this._progressBar.style.animationPlayState = 'paused';
    }
  }

  _syncRunState() {
    if (this._remaining <= 0) return;
    if (this._isVisible && this._isOnScreen) this._startInterval();
    else this._stopInterval();
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
      // Ring shows compact raw seconds; the bar uses mm:ss.
      this._timerEl.textContent = this._isRing
        ? String(Math.max(0, this._remaining))
        : formatTime(this._remaining);
      if (this._remaining <= 10) {
        this._timerEl.classList.add('otp-timer--urgent');
        if (this._isRing && this._progressBar) {
          this._progressBar.classList.add('otp-ring-progress--urgent');
        }
      }
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
    if (this._progressBar) {
      this._progressBar.classList.remove('otp-timer-progress-bar--running');
    }
  }

  reset(durationSeconds) {
    this.stop();
    this._timerEl?.classList.remove('otp-timer--urgent');
    this._progressBar?.classList.remove('otp-ring-progress--urgent');
    if (this._resendBtn) this._resendBtn.disabled = true;
    this.start(durationSeconds ?? this._total);
  }

  destroy() {
    this.stop();
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = null;
    }
  }
}

/**
 * Toast notification manager
 *
 * Renders animated success/error/info/warning toasts in a stacking container.
 * One container is shared per page (per position). Auto-dismiss with progress bar.
 */

const POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

// Shared container registry — one per (position + dir)
const _containers = new Map();

function getContainer(position, dir) {
  const key = `${position}|${dir}`;
  let el = _containers.get(key);
  if (el && document.body.contains(el)) return el;

  el = document.createElement('div');
  el.className = `otp-toast-container otp-toast-container--${position}`;
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Notifications');
  el.setAttribute('dir', dir);
  document.body.appendChild(el);
  _containers.set(key, el);
  return el;
}

class ToastManager {
  /**
   * @param {object} options
   * @param {'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right'} [options.position]
   * @param {'default'|'glass'|'solid'|'gradient'|'minimal'|'pill'} [options.theme]
   * @param {'ltr'|'rtl'} [options.dir]
   * @param {number} [options.duration]
   */
  constructor(options = {}) {
    this.options = {
      position: 'top-right',
      theme: 'default',
      duration: 3500,
      dir: 'ltr',
      pauseOnHover: true,
      closeButton: true,
      ...options,
    };
    if (!POSITIONS.includes(this.options.position)) this.options.position = 'top-right';
  }

  setDirection(dir) { this.options.dir = dir; }
  setTheme(theme)   { this.options.theme = theme; }

  success(message, opts) { return this.show({ type: 'success', message, ...opts }); }
  error(message, opts)   { return this.show({ type: 'error',   message, ...opts }); }
  warning(message, opts) { return this.show({ type: 'warning', message, ...opts }); }
  info(message, opts)    { return this.show({ type: 'info',    message, ...opts }); }

  /**
   * @param {object} cfg
   * @param {'success'|'error'|'warning'|'info'} cfg.type
   * @param {string} cfg.message
   * @param {string} [cfg.title]
   * @param {number} [cfg.duration]
   * @param {string} [cfg.theme]
   * @param {string} [cfg.icon]
   * @param {Array<{label: string, onClick: function}>} [cfg.actions]
   */
  show(cfg) {
    const { type = 'info', message, title, duration, theme, icon, actions = [] } = cfg;
    const finalTheme = theme || this.options.theme;
    const finalDuration = duration ?? this.options.duration;

    const container = getContainer(this.options.position, this.options.dir);
    container.setAttribute('dir', this.options.dir);

    const toast = document.createElement('div');
    toast.className = [
      'otp-toast',
      `otp-toast--${type}`,
      `otp-toast--theme-${finalTheme}`,
    ].join(' ');
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    // Icon
    const iconEl = document.createElement('span');
    iconEl.className = 'otp-toast-icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.textContent = icon || ICONS[type] || '';

    // Body
    const body = document.createElement('div');
    body.className = 'otp-toast-body';

    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'otp-toast-title';
      titleEl.textContent = title;
      body.appendChild(titleEl);
    }

    const msgEl = document.createElement('div');
    msgEl.className = 'otp-toast-message';
    msgEl.textContent = message;
    body.appendChild(msgEl);

    // Actions
    if (actions.length) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'otp-toast-actions';
      actions.forEach(a => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'otp-toast-action';
        btn.textContent = a.label;
        btn.addEventListener('click', () => {
          a.onClick?.();
          this._dismiss(toast);
        });
        actionsEl.appendChild(btn);
      });
      body.appendChild(actionsEl);
    }

    // Close button
    let closeBtn;
    if (this.options.closeButton) {
      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'otp-toast-close';
      closeBtn.setAttribute('aria-label', 'Close notification');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', () => this._dismiss(toast));
    }

    // Progress bar
    const progress = document.createElement('div');
    progress.className = 'otp-toast-progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'otp-toast-progress-bar';
    progress.appendChild(progressBar);

    toast.appendChild(iconEl);
    toast.appendChild(body);
    if (closeBtn) toast.appendChild(closeBtn);
    if (finalDuration > 0) toast.appendChild(progress);

    // Insert at top for top-* positions, bottom for bottom-* (visual stacking)
    if (this.options.position.startsWith('top')) {
      container.insertBefore(toast, container.firstChild);
    } else {
      container.appendChild(toast);
    }

    // Trigger entrance animation on next frame
    requestAnimationFrame(() => toast.classList.add('otp-toast--visible'));

    // Auto-dismiss
    let dismissTimer;
    let progressStart;
    let remaining = finalDuration;

    const startTimer = () => {
      if (finalDuration <= 0) return;
      progressStart = Date.now();
      progressBar.style.transition = `width ${remaining}ms linear`;
      requestAnimationFrame(() => { progressBar.style.width = '0%'; });
      dismissTimer = setTimeout(() => this._dismiss(toast), remaining);
    };

    const pauseTimer = () => {
      if (!dismissTimer) return;
      clearTimeout(dismissTimer);
      dismissTimer = null;
      remaining -= Date.now() - progressStart;
      const computed = getComputedStyle(progressBar).width;
      progressBar.style.transition = 'none';
      progressBar.style.width = computed;
    };

    if (this.options.pauseOnHover && finalDuration > 0) {
      toast.addEventListener('mouseenter', pauseTimer);
      toast.addEventListener('mouseleave', startTimer);
      toast.addEventListener('focusin',    pauseTimer);
      toast.addEventListener('focusout',   startTimer);
    }

    startTimer();

    return {
      element: toast,
      dismiss: () => this._dismiss(toast),
    };
  }

  _dismiss(toast) {
    if (!toast || toast.dataset.dismissed) return;
    toast.dataset.dismissed = '1';
    toast.classList.remove('otp-toast--visible');
    toast.classList.add('otp-toast--leaving');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // Fallback removal in case transitionend doesn't fire
    setTimeout(() => toast.remove(), 500);
  }

  /** Clear all toasts in this manager's container */
  clear() {
    const container = _containers.get(`${this.options.position}|${this.options.dir}`);
    if (!container) return;
    container.querySelectorAll('.otp-toast').forEach(t => this._dismiss(t));
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
    success: true,           // true | false | 'pop' | 'glow' | 'bounce' | 'flip'
    confetti: false,         // celebratory burst on success
    duration: 300,
  },
  // On-screen virtual number pad (great for mobile/kiosk/PIN entry)
  keypad: {
    enabled: false,
    randomize: false,        // shuffle key order (anti shoulder-surfing for PINs)
    showClear: false,        // include a "clear all" key
    backspaceLabel: '⌫',
    clearLabel: 'Clear',
  },
  timer: {
    enabled: false,
    duration: 60,            // seconds
    showProgress: true,
    style: 'bar',            // 'bar' | 'ring' (circular countdown)
    onExpire: null,
  },
  // Subtle Web Audio feedback (no asset files; created lazily on first key)
  sound: {
    enabled: false,
    volume: 0.2,             // 0..1
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
class OTPInput {
  /**
   * @param {Element|string} target
   * @param {Partial<OTPInputOptions>} options
   */
  constructor(target, options = {}) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) throw new Error('[OTPInput] Container element not found');

    this.container = container;
    // Allow the `keypad: true` shorthand (mergeDeep would otherwise clobber the
    // default keypad object with the boolean).
    if (options && options.keypad === true) options = { ...options, keypad: { enabled: true } };
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

    // On-screen virtual keypad
    if (this.options.keypad?.enabled) {
      this._buildKeypad();
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

  _buildKeypad() {
    const kp = this.options.keypad;
    // Number pads read left-to-right (1,2,3…) even in RTL UIs.
    const pad = createElement('div', {
      class: 'otp-keypad',
      role: 'group',
      'aria-label': 'Number pad',
      dir: 'ltr',
    });

    let digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    if (kp.randomize) {
      for (let i = digits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [digits[i], digits[j]] = [digits[j], digits[i]];
      }
    }

    const makeKey = (content, { action, onClick, label } = {}) => {
      const key = createElement('button', {
        type: 'button',
        class: 'otp-keypad-key' + (action ? ' otp-keypad-key--action' : ''),
        'aria-label': label || content,
      });
      key.textContent = content;
      // Keep focus on the OTP inputs (don't let the button steal it).
      key.addEventListener('mousedown', (e) => e.preventDefault());
      key.addEventListener('click', onClick);
      return key;
    };

    // 9 digits, then [clear?] · 0 · backspace
    const first9 = digits.slice(0, 9);
    first9.forEach((d) => {
      const display = this.options.nativeNumerals ? this.numbers.toLocale(d) : d;
      pad.appendChild(makeKey(display, { label: d, onClick: () => this._keypadInput(d) }));
    });

    pad.appendChild(
      kp.showClear
        ? makeKey(kp.clearLabel ?? 'Clear', { action: true, label: kp.clearLabel ?? 'Clear', onClick: () => this.clear() })
        : createElement('span', { class: 'otp-keypad-key otp-keypad-key--spacer', 'aria-hidden': 'true' })
    );

    const zero = digits[9];
    const zeroDisplay = this.options.nativeNumerals ? this.numbers.toLocale(zero) : zero;
    pad.appendChild(makeKey(zeroDisplay, { label: zero, onClick: () => this._keypadInput(zero) }));

    pad.appendChild(
      makeKey(kp.backspaceLabel ?? '⌫', { action: true, label: 'Backspace', onClick: () => this._keypadBackspace() })
    );

    this._keypad = pad;
    this._wrapper.appendChild(pad);
  }

  /** Insert a digit from the on-screen keypad into the first empty cell. */
  _keypadInput(ch) {
    if (this._locked || this._expired) return;
    const western = this._normalize(ch);
    if (!this.validation.isValidChar(western)) return;
    const idx = this._values.findIndex((v) => v === '');
    if (idx === -1) return; // all cells filled

    this._setInputValue(idx, western);
    this.history.pushIfChanged([...this._values]);
    this._haptic();
    this._playSound('key');
    this._notifyChange();

    const next = this.rtl.nextIndex(idx, this.inputs);
    if (next !== null && this._values[next] === '') this._focusIndex(next);
    else this._focusIndex(idx);
    this._checkCompletion();
  }

  /** Remove the last filled cell from the on-screen keypad. */
  _keypadBackspace() {
    if (this._locked || this._expired) return;
    let idx = -1;
    for (let i = this._values.length - 1; i >= 0; i--) {
      if (this._values[i] !== '') { idx = i; break; }
    }
    if (idx === -1) return;
    this._setInputValue(idx, '');
    this.history.pushIfChanged([...this._values]);
    this._notifyChange();
    this._focusIndex(idx);
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
    this._playSound('key');
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
    this._playSound('success');
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
    this._playSound('success');
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
    this._playSound('error'); // sound isn't motion — play regardless of reduced-motion
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

  static get SUCCESS_ANIMATIONS() {
    return {
      pop:    'otp-anim-pop',
      glow:   'otp-anim-success-glow',
      bounce: 'otp-anim-success-bounce',
      flip:   'otp-anim-flip',
    };
  }

  _animateSuccess() {
    const successOpt = this.options.animation?.success;
    if (!successOpt) return;

    const reduced = prefersReducedMotion();
    const style = successOpt === true ? 'pop' : successOpt;
    const cls = OTPInput.SUCCESS_ANIMATIONS[style] || OTPInput.SUCCESS_ANIMATIONS.pop;

    this.inputs.forEach((inp, i) => {
      if (reduced) {
        // Keep the green success state, skip the motion.
        addClasses(inp, 'otp-input--success');
      } else {
        setTimeout(() => {
          addClasses(inp, 'otp-input--success', cls);
          inp.addEventListener('animationend', () => removeClasses(inp, cls), { once: true });
        }, i * 40);
      }
    });

    if (this.options.animation?.confetti && !reduced) this._burstConfetti();
  }

  _burstConfetti() {
    const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];
    const layer = createElement('div', { class: 'otp-confetti', 'aria-hidden': 'true' });
    const count = 28;
    for (let i = 0; i < count; i++) {
      const piece = createElement('span', { class: 'otp-confetti-piece' });
      const angle = (360 / count) * i + (Math.random() * 18 - 9);
      const dist = 55 + Math.random() * 55;
      const rad = (angle * Math.PI) / 180;
      piece.style.setProperty('--tx', `${Math.cos(rad) * dist}px`);
      piece.style.setProperty('--ty', `${Math.sin(rad) * dist}px`);
      piece.style.background = COLORS[i % COLORS.length];
      piece.style.animationDelay = `${Math.floor(Math.random() * 70)}ms`;
      layer.appendChild(piece);
    }
    this.container.appendChild(layer);
    setTimeout(() => layer.remove(), 1200);
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

  // ─── Audio feedback (Web Audio — no asset files) ────────────────────────────

  _playSound(type) {
    const s = this.options.sound;
    if (!s?.enabled) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!this._audioCtx) this._audioCtx = new AC();
      const ctx = this._audioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const vol = Math.max(0, Math.min(1, s.volume ?? 0.2));
      const TONES = {
        key:     [{ f: 620, d: 0.05 }],
        success: [{ f: 660, d: 0.10 }, { f: 880, d: 0.16, t: 0.09 }],
        error:   [{ f: 200, d: 0.20 }],
      };
      const seq = TONES[type] || TONES.key;

      seq.forEach(({ f, d, t = 0 }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type === 'error' ? 'sawtooth' : 'sine';
        osc.frequency.value = f;
        const start = now + t;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + d);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + d + 0.02);
      });
    } catch {
      /* Web Audio unavailable — silently ignore */
    }
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
    this._audioCtx?.close?.();
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

const __css = ":root {\n--otp-gap: 10px;\n--otp-input-width: 52px;\n--otp-input-height: 60px;\n--otp-border-radius: 10px;\n--otp-border-width: 2px;\n--otp-border-color: #d1d5db;\n--otp-focus-color: #3b82f6;\n--otp-focus-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);\n--otp-error-color: #ef4444;\n--otp-error-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);\n--otp-success-color: #22c55e;\n--otp-success-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);\n--otp-bg: #ffffff;\n--otp-filled-bg: #f0f9ff;\n--otp-disabled-bg: #f3f4f6;\n--otp-text-color: #111827;\n--otp-placeholder-color: #d1d5db;\n--otp-font-size: 1.625rem;\n--otp-font-weight: 700;\n--otp-font-family: inherit;\n--otp-letter-spacing: 0.05em;\n--otp-transition: 0.18s ease;\n--otp-timer-color: #6b7280;\n--otp-timer-urgent-color: #ef4444;\n--otp-timer-font-size: 0.875rem;\n--otp-progress-height: 3px;\n--otp-progress-bg: #e5e7eb;\n--otp-progress-fill: #3b82f6;\n--otp-resend-color: #3b82f6;\n--otp-resend-disabled-color: #9ca3af;\n--otp-resend-font-size: 0.875rem;\n--otp-paste-bg: #eff6ff;\n--otp-paste-border: #bfdbfe;\n--otp-paste-color: #1d4ed8;\n--otp-paste-font-size: 0.8125rem;\n}\n@media (prefers-color-scheme: dark) {\n:root {\n--otp-bg: #1f2937;\n--otp-filled-bg: #1e3a5f;\n--otp-disabled-bg: #374151;\n--otp-border-color: #374151;\n--otp-text-color: #f9fafb;\n--otp-placeholder-color: #4b5563;\n--otp-progress-bg: #374151;\n--otp-paste-bg: #1e3a5f;\n--otp-paste-border: #1e40af;\n--otp-paste-color: #93c5fd;\n--otp-timer-color: #9ca3af;\n}\n}\n.otp-root {\nposition: relative;\ndisplay: inline-block;\nwidth: 100%;\n}\n.otp-wrapper {\ndisplay: flex;\nflex-direction: column;\nalign-items: center;\ngap: 12px;\nwidth: 100%;\n}\n.otp-inputs-row {\ndisplay: flex;\nflex-direction: row;\nalign-items: center;\njustify-content: center;\ngap: var(--otp-gap);\nwidth: 100%;\n}\n[dir=\"rtl\"] .otp-inputs-row {\nflex-direction: row;\n}\n.otp-separator {\ndisplay: flex;\nalign-items: center;\njustify-content: center;\ncolor: var(--otp-separator-color, var(--otp-border-color, #cbd5e1));\nfont-size: 1.2em;\nfont-weight: 300;\nletter-spacing: -0.02em;\nuser-select: none;\npadding: 0 2px;\nflex-shrink: 0;\ntransition: color 0.2s;\n}\n.otp-input {\nwidth: var(--otp-input-width);\nheight: var(--otp-input-height);\npadding: 0;\nborder: var(--otp-border-width) solid var(--otp-border-color);\nborder-radius: var(--otp-border-radius);\nbackground: var(--otp-bg);\ncolor: var(--otp-text-color);\nfont-size: var(--otp-font-size);\nfont-weight: var(--otp-font-weight);\nfont-family: var(--otp-font-family);\nletter-spacing: var(--otp-letter-spacing);\ntext-align: center;\noutline: none;\ncursor: text;\n-webkit-appearance: none;\nappearance: none;\ntransition:\nborder-color var(--otp-transition),\nbackground-color var(--otp-transition),\nbox-shadow var(--otp-transition),\ntransform var(--otp-transition);\nuser-select: text;\n}\n.otp-input[type=\"number\"]::-webkit-inner-spin-button,\n.otp-input[type=\"number\"]::-webkit-outer-spin-button {\n-webkit-appearance: none;\n}\n.otp-input::placeholder {\ncolor: var(--otp-placeholder-color);\nfont-size: calc(var(--otp-font-size) * 0.6);\nfont-weight: 400;\n}\n.otp-input--focused {\nborder-color: var(--otp-focus-color);\nbox-shadow: var(--otp-focus-shadow);\nz-index: 1;\n}\n.otp-input--filled {\nbackground: var(--otp-filled-bg);\nborder-color: var(--otp-border-color);\n}\n.otp-input--error {\nborder-color: var(--otp-error-color) !important;\nbox-shadow: var(--otp-error-shadow) !important;\nbackground: rgba(239, 68, 68, 0.04);\n}\n.otp-input--success {\nborder-color: var(--otp-success-color) !important;\nbox-shadow: var(--otp-success-shadow);\nbackground: rgba(34, 197, 94, 0.06);\n}\n.otp-root--disabled .otp-input,\n.otp-input:disabled {\nbackground: var(--otp-disabled-bg);\ncursor: not-allowed;\nopacity: 0.6;\n}\n.otp-root--expired .otp-input {\nopacity: 0.45;\ncursor: not-allowed;\n}\n.otp-timer-progress {\nwidth: 100%;\nmax-width: calc(var(--otp-input-width) * 6 + var(--otp-gap) * 5 + 20px);\nheight: var(--otp-progress-height);\nbackground: var(--otp-progress-bg);\nborder-radius: 999px;\noverflow: hidden;\n}\n.otp-timer-progress-bar {\nheight: 100%;\nbackground: var(--otp-progress-fill);\nborder-radius: 999px;\ntransition: background-color 0.3s ease;\nwidth: 100%;\n}\n.otp-timer-progress-bar.otp-timer-progress-bar--running {\nanimation: otpProgressCountdown linear forwards;\n}\n.otp-timer--urgent ~ .otp-timer-progress .otp-timer-progress-bar {\nbackground: var(--otp-error-color);\n}\n.otp-footer {\ndisplay: flex;\nalign-items: center;\njustify-content: space-between;\nwidth: 100%;\nmax-width: calc(var(--otp-input-width) * 6 + var(--otp-gap) * 5);\npadding: 0 2px;\ngap: 8px;\n}\n.otp-timer-wrap {\ndisplay: flex;\nalign-items: center;\ngap: 6px;\n}\n.otp-timer {\nfont-size: var(--otp-timer-font-size);\ncolor: var(--otp-timer-color);\nfont-variant-numeric: tabular-nums;\nletter-spacing: 0.02em;\nmin-width: 2.8em;\n}\n.otp-timer--urgent {\ncolor: var(--otp-timer-urgent-color);\nfont-weight: 600;\n}\n.otp-resend-btn {\nbackground: none;\nborder: none;\npadding: 4px 8px;\nfont-size: var(--otp-resend-font-size);\ncolor: var(--otp-resend-color);\ncursor: pointer;\nborder-radius: 6px;\nfont-weight: 500;\ntransition: opacity 0.15s, background-color 0.15s;\nwhite-space: nowrap;\n}\n.otp-resend-btn:hover:not(:disabled) {\nbackground: rgba(59, 130, 246, 0.1);\n}\n.otp-resend-btn:disabled {\ncolor: var(--otp-resend-disabled-color);\ncursor: not-allowed;\n}\n.otp-paste-suggestion {\ndisplay: flex;\nwidth: fit-content;\nalign-items: center;\njustify-content: center;\npadding: 8px 16px;\nmargin: 0 auto;\nbackground: var(--otp-paste-bg);\nborder: 1px solid var(--otp-paste-border);\nborder-radius: 8px;\ncolor: var(--otp-paste-color);\nfont-size: var(--otp-paste-font-size);\nfont-weight: 500;\ntext-align: center;\ncursor: pointer;\ntransition: opacity 0.2s;\nanimation: otpFadeInDown 0.25s ease;\n}\n.otp-paste-suggestion:hover {\nopacity: 0.85;\n}\n.otp-live-region {\nposition: absolute !important;\nwidth: 1px !important;\nheight: 1px !important;\npadding: 0 !important;\nmargin: -1px !important;\noverflow: hidden !important;\nclip: rect(0, 0, 0, 0) !important;\nwhite-space: nowrap !important;\nborder: 0 !important;\n}\n@keyframes otpProgressCountdown {\nfrom { width: 100%; }\nto   { width: 0%; }\n}\n@keyframes otpShake {\n0%, 100% { transform: translateX(0); }\n15%       { transform: translateX(-6px) rotate(-1deg); }\n30%       { transform: translateX(5px)  rotate(1deg); }\n45%       { transform: translateX(-4px); }\n60%       { transform: translateX(3px); }\n75%       { transform: translateX(-2px); }\n}\n@keyframes otpPop {\n0%   { transform: scale(1); }\n40%  { transform: scale(1.15); }\n70%  { transform: scale(0.95); }\n100% { transform: scale(1); }\n}\n@keyframes otpHighlight {\n0%, 100% { background-color: var(--otp-bg); }\n50%       { background-color: rgba(239, 68, 68, 0.15); }\n}\n@keyframes otpFadeInDown {\nfrom { opacity: 0; transform: translateY(-8px); }\nto   { opacity: 1; transform: translateY(0); }\n}\n.otp-anim-shake {\nanimation: otpShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);\n}\n.otp-anim-pop {\nanimation: otpPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);\n}\n.otp-anim-highlight {\nanimation: otpHighlight 0.5s ease;\n}\n[dir=\"rtl\"] .otp-anim-shake {\nanimation-name: otpShakeRTL;\n}\n@keyframes otpShakeRTL {\n0%, 100% { transform: translateX(0); }\n15%       { transform: translateX(6px) rotate(1deg); }\n30%       { transform: translateX(-5px) rotate(-1deg); }\n45%       { transform: translateX(4px); }\n60%       { transform: translateX(-3px); }\n75%       { transform: translateX(2px); }\n}\n.otp-anim-pulse {\nanimation: otpErrPulse 0.5s ease;\n}\n@keyframes otpErrPulse {\n0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0)); }\n35%       { transform: scale(1.12); filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.7)); }\n70%       { transform: scale(0.97); }\n}\n.otp-anim-buzz {\nanimation: otpBuzz 0.4s linear;\n}\n@keyframes otpBuzz {\n0%, 100% { transform: translateX(0); }\n10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }\n20%, 40%, 60%, 80%       { transform: translateX(3px); }\n}\n.otp-anim-bounce {\nanimation: otpErrBounce 0.55s cubic-bezier(0.28, 0.84, 0.42, 1);\n}\n@keyframes otpErrBounce {\n0%, 100% { transform: translateY(0); }\n30%       { transform: translateY(-10px); }\n55%       { transform: translateY(0); }\n70%       { transform: translateY(-5px); }\n85%       { transform: translateY(0); }\n}\n.otp-anim-glow {\nanimation: otpGlow 0.7s ease;\n}\n@keyframes otpGlow {\n0%, 100% { filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0)); }\n50%       { filter: drop-shadow(0 0 9px rgba(239, 68, 68, 0.9)); }\n}\n.otp-anim-wobble {\nanimation: otpWobble 0.6s ease;\n}\n@keyframes otpWobble {\n0%, 100% { transform: rotate(0) translateX(0); }\n15%       { transform: rotate(-5deg) translateX(-5px); }\n30%       { transform: rotate(4deg) translateX(4px); }\n45%       { transform: rotate(-3deg) translateX(-3px); }\n60%       { transform: rotate(2deg) translateX(2px); }\n75%       { transform: rotate(-1deg); }\n}\n@media (max-width: 420px) {\n:root {\n--otp-input-width: 42px;\n--otp-input-height: 50px;\n--otp-font-size: 1.35rem;\n--otp-gap: 7px;\n}\n}\n@media (max-width: 340px) {\n:root {\n--otp-input-width: 36px;\n--otp-input-height: 44px;\n--otp-font-size: 1.15rem;\n--otp-gap: 5px;\n--otp-border-radius: 7px;\n}\n}\n.otp-root[data-theme=\"underline\"] .otp-input {\nborder-width: 0;\nborder-bottom-width: var(--otp-border-width);\nborder-radius: 0;\nbackground: transparent;\nbox-shadow: none;\n}\n.otp-root[data-theme=\"underline\"] .otp-input--focused {\nborder-bottom-color: var(--otp-focus-color);\nbox-shadow: 0 2px 0 0 var(--otp-focus-color);\n}\n.otp-root[data-theme=\"rounded\"] .otp-input {\n--otp-border-radius: 999px;\n}\n.otp-root[data-theme=\"pill\"] .otp-input {\n--otp-border-radius: 999px;\n--otp-input-width: 56px;\n--otp-input-height: 56px;\nborder-width: 1.5px;\n}\n.otp-root[data-theme=\"pill\"] .otp-input--filled {\nbackground: var(--otp-focus-color);\ncolor: #fff;\nborder-color: var(--otp-focus-color);\n}\n.otp-root[data-theme=\"ghost\"] .otp-input {\nbackground: rgba(15, 23, 42, 0.05);\nborder-color: transparent;\n}\n.otp-root[data-theme=\"ghost\"] .otp-input--focused {\nbackground: transparent;\nborder-color: var(--otp-focus-color);\n}\n@media (prefers-color-scheme: dark) {\n.otp-root[data-theme=\"ghost\"] .otp-input { background: rgba(255,255,255,0.06); }\n}\n.otp-root[data-theme=\"filled\"] .otp-input {\nbackground: #f1f5f9;\nborder-color: transparent;\nborder-bottom: 2px solid #cbd5e1;\nborder-radius: 8px 8px 0 0;\n}\n.otp-root[data-theme=\"filled\"] .otp-input--focused {\nbackground: #e0f2fe;\nborder-bottom-color: var(--otp-focus-color);\nbox-shadow: none;\n}\n.otp-root[data-theme=\"filled\"] .otp-input--filled {\nbackground: #dbeafe;\nborder-bottom-color: var(--otp-focus-color);\n}\n@media (prefers-color-scheme: dark) {\n.otp-root[data-theme=\"filled\"] .otp-input { background: #334155; border-bottom-color: #475569; }\n.otp-root[data-theme=\"filled\"] .otp-input--focused { background: #1e3a5f; }\n.otp-root[data-theme=\"filled\"] .otp-input--filled  { background: #1e40af; color: #fff; }\n}\n.otp-root[data-theme=\"soft\"] .otp-input {\nbackground: #f5f3ff;\nborder-color: transparent;\n--otp-border-radius: 14px;\nbox-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.15);\n}\n.otp-root[data-theme=\"soft\"] .otp-input--focused {\nbackground: #ede9fe;\nbox-shadow: inset 0 0 0 2px #8b5cf6, 0 0 0 4px rgba(139, 92, 246, 0.15);\n}\n.otp-root[data-theme=\"soft\"] .otp-input--filled {\ncolor: #7c3aed;\nbackground: #ede9fe;\n}\n.otp-root[data-theme=\"neon\"] {\n--otp-focus-color: #06ffa5;\n--otp-focus-shadow: 0 0 16px rgba(6, 255, 165, 0.55), 0 0 0 2px rgba(6, 255, 165, 0.5);\n}\n.otp-root[data-theme=\"neon\"] .otp-input {\nbackground: #0b0f1a;\nborder-color: #1e293b;\ncolor: #06ffa5;\nfont-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;\ntext-shadow: 0 0 6px rgba(6, 255, 165, 0.6);\n}\n.otp-root[data-theme=\"neon\"] .otp-input--focused {\nborder-color: #06ffa5;\n}\n.otp-root[data-theme=\"neon\"] .otp-input--filled {\nbackground: #051219;\nborder-color: #06ffa5;\nbox-shadow: inset 0 0 8px rgba(6, 255, 165, 0.2);\n}\n.otp-root[data-theme=\"gradient\"] .otp-input {\nbackground: #fff;\nborder: none;\nposition: relative;\nbackground-image:\nlinear-gradient(#fff, #fff),\nlinear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);\nbackground-origin: border-box;\nbackground-clip: padding-box, border-box;\nborder: 2px solid transparent;\n}\n.otp-root[data-theme=\"gradient\"] .otp-input--focused {\nbox-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);\n}\n.otp-root[data-theme=\"gradient\"] .otp-input--filled {\nbackground-image:\nlinear-gradient(135deg, #eef2ff, #fdf2f8),\nlinear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);\n}\n@media (prefers-color-scheme: dark) {\n.otp-root[data-theme=\"gradient\"] .otp-input {\nbackground-image:\nlinear-gradient(#1e293b, #1e293b),\nlinear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);\n}\n.otp-root[data-theme=\"gradient\"] .otp-input--filled {\nbackground-image:\nlinear-gradient(135deg, #1e3a5f, #4c1d95),\nlinear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);\n}\n}\n.otp-root[data-theme=\"elevated\"] .otp-input {\nborder-color: transparent;\nbackground: #fff;\nbox-shadow:\n0 1px 2px rgba(0,0,0,0.06),\n0 4px 12px rgba(0,0,0,0.08);\n}\n.otp-root[data-theme=\"elevated\"] .otp-input--focused {\ntransform: translateY(-2px);\nbox-shadow:\n0 4px 6px rgba(59, 130, 246, 0.1),\n0 12px 24px rgba(59, 130, 246, 0.18),\n0 0 0 2px var(--otp-focus-color);\n}\n@media (prefers-color-scheme: dark) {\n.otp-root[data-theme=\"elevated\"] .otp-input { background: #1e293b; }\n}\n@media (prefers-contrast: more) {\n.otp-input {\nborder-width: 3px;\n}\n.otp-input--focused {\noutline: 3px solid var(--otp-focus-color);\noutline-offset: 2px;\n}\n}\n@media (prefers-reduced-motion: reduce) {\n.otp-input,\n.otp-timer-progress-bar,\n.otp-paste-suggestion,\n.otp-toast {\ntransition: none !important;\nanimation: none !important;\n}\n}\n:root {\n--otp-toast-bg:           #ffffff;\n--otp-toast-text:         #0f172a;\n--otp-toast-muted:        #64748b;\n--otp-toast-border:       #e2e8f0;\n--otp-toast-radius:       12px;\n--otp-toast-padding:      14px 16px;\n--otp-toast-min-width:    300px;\n--otp-toast-max-width:    420px;\n--otp-toast-gap:          12px;\n--otp-toast-shadow:       0 10px 25px -5px rgba(0,0,0,0.15), 0 4px 10px -2px rgba(0,0,0,0.06);\n--otp-toast-z:            10000;\n--otp-toast-success-bg:   #ecfdf5;\n--otp-toast-success-fg:   #065f46;\n--otp-toast-success-bar:  #10b981;\n--otp-toast-success-icon: #10b981;\n--otp-toast-error-bg:     #fef2f2;\n--otp-toast-error-fg:     #991b1b;\n--otp-toast-error-bar:    #ef4444;\n--otp-toast-error-icon:   #ef4444;\n--otp-toast-warning-bg:   #fffbeb;\n--otp-toast-warning-fg:   #92400e;\n--otp-toast-warning-bar:  #f59e0b;\n--otp-toast-warning-icon: #f59e0b;\n--otp-toast-info-bg:      #eff6ff;\n--otp-toast-info-fg:      #1e40af;\n--otp-toast-info-bar:     #3b82f6;\n--otp-toast-info-icon:    #3b82f6;\n}\n@media (prefers-color-scheme: dark) {\n:root {\n--otp-toast-bg:        #1e293b;\n--otp-toast-text:      #f1f5f9;\n--otp-toast-muted:     #94a3b8;\n--otp-toast-border:    #334155;\n--otp-toast-shadow:    0 10px 25px -5px rgba(0,0,0,0.5), 0 4px 10px -2px rgba(0,0,0,0.3);\n--otp-toast-success-bg: #022c22;\n--otp-toast-success-fg: #6ee7b7;\n--otp-toast-error-bg:   #2a0a0a;\n--otp-toast-error-fg:   #fca5a5;\n--otp-toast-warning-bg: #2a1a05;\n--otp-toast-warning-fg: #fcd34d;\n--otp-toast-info-bg:    #0f1e3d;\n--otp-toast-info-fg:    #93c5fd;\n}\n}\n.otp-toast-container {\nposition: fixed;\nz-index: var(--otp-toast-z);\ndisplay: flex;\nflex-direction: column;\ngap: 10px;\npadding: 16px;\npointer-events: none;\nmax-width: calc(100% - 32px);\n}\n.otp-toast-container > * { pointer-events: auto; }\n.otp-toast-container--top-left     { top: 0; left: 0; align-items: flex-start; }\n.otp-toast-container--top-center   { top: 0; left: 50%; transform: translateX(-50%); align-items: center; }\n.otp-toast-container--top-right    { top: 0; right: 0; align-items: flex-end; }\n.otp-toast-container--bottom-left  { bottom: 0; left: 0; align-items: flex-start; flex-direction: column-reverse; }\n.otp-toast-container--bottom-center{ bottom: 0; left: 50%; transform: translateX(-50%); align-items: center; flex-direction: column-reverse; }\n.otp-toast-container--bottom-right { bottom: 0; right: 0; align-items: flex-end; flex-direction: column-reverse; }\n[dir=\"rtl\"].otp-toast-container--top-left,\n[dir=\"rtl\"].otp-toast-container--bottom-left { left: auto; right: 0; align-items: flex-end; }\n[dir=\"rtl\"].otp-toast-container--top-right,\n[dir=\"rtl\"].otp-toast-container--bottom-right { right: auto; left: 0; align-items: flex-start; }\n.otp-toast {\ndisplay: flex;\nalign-items: flex-start;\ngap: var(--otp-toast-gap);\nmin-width: var(--otp-toast-min-width);\nmax-width: var(--otp-toast-max-width);\npadding: var(--otp-toast-padding);\nbackground: var(--otp-toast-bg);\ncolor: var(--otp-toast-text);\nborder-radius: var(--otp-toast-radius);\nborder: 1px solid var(--otp-toast-border);\nbox-shadow: var(--otp-toast-shadow);\nposition: relative;\noverflow: hidden;\nfont-size: 0.9rem;\nline-height: 1.45;\nopacity: 0;\ntransform: translateY(-12px) scale(0.97);\ntransition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);\n}\n.otp-toast-container--bottom-left .otp-toast,\n.otp-toast-container--bottom-center .otp-toast,\n.otp-toast-container--bottom-right .otp-toast {\ntransform: translateY(12px) scale(0.97);\n}\n.otp-toast--visible {\nopacity: 1;\ntransform: translateY(0) scale(1);\n}\n.otp-toast--leaving {\nopacity: 0;\ntransform: translateX(40px) scale(0.95);\n}\n[dir=\"rtl\"] .otp-toast--leaving { transform: translateX(-40px) scale(0.95); }\n.otp-toast-icon {\nflex-shrink: 0;\nwidth: 22px;\nheight: 22px;\nborder-radius: 50%;\ndisplay: inline-flex;\nalign-items: center;\njustify-content: center;\nfont-size: 0.78rem;\nfont-weight: 800;\ncolor: #fff;\nmargin-top: 1px;\n}\n.otp-toast-body { flex: 1; min-width: 0; }\n.otp-toast-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 2px; }\n.otp-toast-message { font-size: 0.875rem; word-break: break-word; }\n.otp-toast-actions { display: flex; gap: 8px; margin-top: 8px; }\n.otp-toast-action {\nbackground: transparent;\nborder: 1px solid currentColor;\ncolor: inherit;\npadding: 4px 10px;\nborder-radius: 6px;\nfont-size: 0.78rem;\nfont-weight: 600;\ncursor: pointer;\nopacity: 0.85;\ntransition: opacity 0.15s, background 0.15s;\n}\n.otp-toast-action:hover { opacity: 1; background: rgba(0,0,0,0.05); }\n.otp-toast-close {\nbackground: transparent;\nborder: none;\ncolor: var(--otp-toast-muted);\nfont-size: 1.25rem;\nline-height: 1;\ncursor: pointer;\npadding: 0;\nwidth: 22px;\nheight: 22px;\ndisplay: inline-flex;\nalign-items: center;\njustify-content: center;\nborder-radius: 4px;\nflex-shrink: 0;\nmargin-top: -2px;\ntransition: background 0.15s, color 0.15s;\n}\n.otp-toast-close:hover { background: rgba(0,0,0,0.06); color: var(--otp-toast-text); }\n.otp-toast-progress {\nposition: absolute;\nbottom: 0;\ninset-inline: 0;\nheight: 3px;\nbackground: rgba(0,0,0,0.06);\n}\n.otp-toast-progress-bar {\nheight: 100%;\nwidth: 100%;\nbackground: currentColor;\ntransition: width linear;\n}\n.otp-toast--success { background: var(--otp-toast-success-bg); color: var(--otp-toast-success-fg); border-color: rgba(16,185,129,0.25); }\n.otp-toast--success .otp-toast-icon          { background: var(--otp-toast-success-icon); }\n.otp-toast--success .otp-toast-progress-bar  { background: var(--otp-toast-success-bar); }\n.otp-toast--error { background: var(--otp-toast-error-bg); color: var(--otp-toast-error-fg); border-color: rgba(239,68,68,0.3); }\n.otp-toast--error .otp-toast-icon          { background: var(--otp-toast-error-icon); }\n.otp-toast--error .otp-toast-progress-bar  { background: var(--otp-toast-error-bar); }\n.otp-toast--error                          { animation: otpToastErrorPulse 0.4s ease; }\n.otp-toast--warning { background: var(--otp-toast-warning-bg); color: var(--otp-toast-warning-fg); border-color: rgba(245,158,11,0.3); }\n.otp-toast--warning .otp-toast-icon          { background: var(--otp-toast-warning-icon); }\n.otp-toast--warning .otp-toast-progress-bar  { background: var(--otp-toast-warning-bar); }\n.otp-toast--info { background: var(--otp-toast-info-bg); color: var(--otp-toast-info-fg); border-color: rgba(59,130,246,0.25); }\n.otp-toast--info .otp-toast-icon          { background: var(--otp-toast-info-icon); }\n.otp-toast--info .otp-toast-progress-bar  { background: var(--otp-toast-info-bar); }\n@keyframes otpToastErrorPulse {\n0%   { box-shadow: var(--otp-toast-shadow), 0 0 0 0 rgba(239,68,68,0.5); }\n50%  { box-shadow: var(--otp-toast-shadow), 0 0 0 8px rgba(239,68,68,0); }\n100% { box-shadow: var(--otp-toast-shadow), 0 0 0 0 rgba(239,68,68,0); }\n}\n.otp-toast--theme-glass {\nbackground: rgba(255, 255, 255, 0.72);\n-webkit-backdrop-filter: blur(14px) saturate(1.6);\nbackdrop-filter: blur(14px) saturate(1.6);\nborder: 1px solid rgba(255,255,255,0.5);\nbox-shadow:\n0 8px 32px rgba(0,0,0,0.12),\ninset 0 1px 0 rgba(255,255,255,0.6);\n}\n@media (prefers-color-scheme: dark) {\n.otp-toast--theme-glass {\nbackground: rgba(30, 41, 59, 0.65);\nborder: 1px solid rgba(255,255,255,0.08);\nbox-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);\n}\n}\n.otp-toast--theme-glass.otp-toast--success { background: rgba(236, 253, 245, 0.72); }\n.otp-toast--theme-glass.otp-toast--error   { background: rgba(254, 242, 242, 0.72); }\n.otp-toast--theme-glass.otp-toast--warning { background: rgba(255, 251, 235, 0.72); }\n.otp-toast--theme-glass.otp-toast--info    { background: rgba(239, 246, 255, 0.72); }\n.otp-toast--theme-solid           { color: #fff; border: none; }\n.otp-toast--theme-solid .otp-toast-close { color: rgba(255,255,255,0.85); }\n.otp-toast--theme-solid .otp-toast-close:hover { background: rgba(255,255,255,0.15); color:#fff; }\n.otp-toast--theme-solid .otp-toast-icon  { background: rgba(255,255,255,0.22); color:#fff; }\n.otp-toast--theme-solid.otp-toast--success { background: #10b981; }\n.otp-toast--theme-solid.otp-toast--error   { background: #ef4444; }\n.otp-toast--theme-solid.otp-toast--warning { background: #f59e0b; }\n.otp-toast--theme-solid.otp-toast--info    { background: #3b82f6; }\n.otp-toast--theme-solid .otp-toast-progress-bar { background: rgba(255,255,255,0.5); }\n.otp-toast--theme-gradient        { color: #fff; border: none; box-shadow: 0 12px 30px -8px rgba(0,0,0,0.35); }\n.otp-toast--theme-gradient .otp-toast-icon  { background: rgba(255,255,255,0.25); }\n.otp-toast--theme-gradient .otp-toast-close { color: rgba(255,255,255,0.9); }\n.otp-toast--theme-gradient.otp-toast--success { background: linear-gradient(135deg, #10b981, #059669); }\n.otp-toast--theme-gradient.otp-toast--error   { background: linear-gradient(135deg, #ef4444, #b91c1c); }\n.otp-toast--theme-gradient.otp-toast--warning { background: linear-gradient(135deg, #f59e0b, #d97706); }\n.otp-toast--theme-gradient.otp-toast--info    { background: linear-gradient(135deg, #3b82f6, #6366f1); }\n.otp-toast--theme-gradient .otp-toast-progress-bar { background: rgba(255,255,255,0.5); }\n.otp-toast--theme-minimal {\nbackground: var(--otp-toast-bg);\ncolor: var(--otp-toast-text);\nborder: 1px solid var(--otp-toast-border);\nborder-inline-start-width: 4px;\nbox-shadow: 0 4px 12px rgba(0,0,0,0.06);\n}\n.otp-toast--theme-minimal .otp-toast-icon          { background: transparent; color: currentColor; }\n.otp-toast--theme-minimal.otp-toast--success       { border-inline-start-color: var(--otp-toast-success-bar); }\n.otp-toast--theme-minimal.otp-toast--success .otp-toast-icon { color: var(--otp-toast-success-icon); }\n.otp-toast--theme-minimal.otp-toast--error         { border-inline-start-color: var(--otp-toast-error-bar); }\n.otp-toast--theme-minimal.otp-toast--error .otp-toast-icon   { color: var(--otp-toast-error-icon); }\n.otp-toast--theme-minimal.otp-toast--warning       { border-inline-start-color: var(--otp-toast-warning-bar); }\n.otp-toast--theme-minimal.otp-toast--warning .otp-toast-icon { color: var(--otp-toast-warning-icon); }\n.otp-toast--theme-minimal.otp-toast--info          { border-inline-start-color: var(--otp-toast-info-bar); }\n.otp-toast--theme-minimal.otp-toast--info .otp-toast-icon    { color: var(--otp-toast-info-icon); }\n.otp-toast--theme-pill {\nborder-radius: 999px;\npadding: 8px 16px 8px 10px;\nmin-width: auto;\nfont-size: 0.85rem;\ngap: 8px;\nborder: none;\nbackground: var(--otp-toast-bg);\n}\n.otp-toast--theme-pill .otp-toast-icon {\nwidth: 24px; height: 24px;\n}\n.otp-toast--theme-pill .otp-toast-close { display: none; }\n.otp-toast--theme-pill .otp-toast-progress { display: none; }\n.otp-toast--theme-pill .otp-toast-title { display: none; }\n.otp-toast--theme-pill.otp-toast--success { background: #10b981; color: #fff; }\n.otp-toast--theme-pill.otp-toast--error   { background: #ef4444; color: #fff; }\n.otp-toast--theme-pill.otp-toast--warning { background: #f59e0b; color: #fff; }\n.otp-toast--theme-pill.otp-toast--info    { background: #3b82f6; color: #fff; }\n.otp-toast--theme-pill .otp-toast-icon    { background: rgba(255,255,255,0.25); }\n@media (max-width: 480px) {\n.otp-toast-container {\ninset-inline: 0 !important;\nleft: 0 !important; right: 0 !important; transform: none !important;\nalign-items: stretch !important;\npadding: 10px;\n}\n.otp-toast {\nmin-width: 0;\nmax-width: 100%;\nwidth: 100%;\n}\n}\n.otp-spinner {\nposition: absolute;\ninset: 0;\ndisplay: none;\nalign-items: center;\njustify-content: center;\nz-index: 3;\npointer-events: none;\n}\n.otp-root--loading .otp-spinner {\ndisplay: flex;\n}\n.otp-root--loading .otp-inputs-row {\nopacity: 0.45;\nfilter: grayscale(0.2);\ntransition: opacity var(--otp-transition);\n}\n.otp-spinner__ring {\nwidth: 28px;\nheight: 28px;\nborder-radius: 50%;\nborder: 3px solid var(--otp-progress-bg, #e5e7eb);\nborder-top-color: var(--otp-focus-color, #3b82f6);\nanimation: otpSpin 0.7s linear infinite;\n}\n@keyframes otpSpin {\nto { transform: rotate(360deg); }\n}\n.otp-root--verified .otp-input {\nborder-color: var(--otp-success-color) !important;\n}\n@media (prefers-reduced-motion: reduce) {\n.otp-spinner__ring {\nanimation-duration: 1.4s;\n}\n}\n.otp-reveal-btn {\ndisplay: inline-flex;\nalign-items: center;\ngap: 6px;\nmargin-top: 4px;\npadding: 6px 12px;\nfont-size: 0.82rem;\nfont-family: inherit;\ncolor: var(--otp-resend-color, #3b82f6);\nbackground: transparent;\nborder: 1px solid var(--otp-border-color, #d1d5db);\nborder-radius: 999px;\ncursor: pointer;\ntransition: background-color var(--otp-transition),\nborder-color var(--otp-transition), color var(--otp-transition);\n}\n.otp-reveal-btn:hover {\nbackground: rgba(59, 130, 246, 0.08);\n}\n.otp-reveal-btn:focus-visible {\noutline: none;\nbox-shadow: var(--otp-focus-shadow);\n}\n.otp-reveal-btn svg {\nflex-shrink: 0;\n}\n.otp-reveal-btn--on {\ncolor: var(--otp-success-color, #22c55e);\nborder-color: var(--otp-success-color, #22c55e);\n}\n.otp-lock-message {\nmargin-top: 6px;\nfont-size: var(--otp-timer-font-size, 0.875rem);\nfont-weight: 600;\ncolor: var(--otp-error-color, #ef4444);\ntext-align: center;\nmin-height: 1.2em;\n}\n.otp-root--locked .otp-inputs-row {\nopacity: 0.5;\nfilter: grayscale(0.3);\n}\n.otp-keypad {\ndisplay: grid;\ngrid-template-columns: repeat(3, 1fr);\ngap: 8px;\nwidth: 100%;\nmax-width: 260px;\nmargin-top: 4px;\ndirection: ltr;\n}\n.otp-keypad-key {\nfont-family: inherit;\nfont-size: 1.25rem;\nfont-weight: 600;\ncolor: var(--otp-text-color);\nbackground: var(--otp-bg);\nborder: var(--otp-border-width) solid var(--otp-border-color);\nborder-radius: var(--otp-border-radius);\npadding: 14px 0;\ncursor: pointer;\nuser-select: none;\ntransition: background-color var(--otp-transition), transform 0.08s ease,\nborder-color var(--otp-transition);\n}\n.otp-keypad-key:hover {\nborder-color: var(--otp-focus-color);\n}\n.otp-keypad-key:active {\ntransform: scale(0.94);\nbackground: var(--otp-filled-bg);\n}\n.otp-keypad-key:focus-visible {\noutline: none;\nbox-shadow: var(--otp-focus-shadow);\n}\n.otp-keypad-key--action {\ncolor: var(--otp-resend-color);\nfont-size: 1.1rem;\n}\n.otp-keypad-key--spacer {\nborder: none;\nbackground: transparent;\ncursor: default;\n}\n.otp-root--locked .otp-keypad,\n.otp-root--expired .otp-keypad,\n.otp-root--loading .otp-keypad {\nopacity: 0.5;\npointer-events: none;\n}\n.otp-anim-success-glow {\nanimation: otpSuccessGlow 0.6s ease;\n}\n@keyframes otpSuccessGlow {\n0%, 100% { filter: drop-shadow(0 0 0 rgba(34, 197, 94, 0)); }\n50%       { filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.85)); }\n}\n.otp-anim-success-bounce {\nanimation: otpSuccessBounce 0.5s cubic-bezier(0.28, 0.84, 0.42, 1);\n}\n@keyframes otpSuccessBounce {\n0%, 100% { transform: translateY(0); }\n35%       { transform: translateY(-9px); }\n60%       { transform: translateY(0); }\n80%       { transform: translateY(-4px); }\n}\n.otp-anim-flip {\nanimation: otpFlip 0.55s ease;\n}\n@keyframes otpFlip {\n0%   { transform: rotateY(0); }\n50%  { transform: rotateY(180deg); }\n100% { transform: rotateY(360deg); }\n}\n.otp-confetti {\nposition: absolute;\ninset: 0;\noverflow: visible;\npointer-events: none;\nz-index: 5;\n}\n.otp-confetti-piece {\nposition: absolute;\ntop: 38%;\nleft: 50%;\nwidth: 8px;\nheight: 8px;\nborder-radius: 2px;\nopacity: 0;\nanimation: otpConfetti 0.95s ease-out forwards;\n}\n@keyframes otpConfetti {\n0% {\ntransform: translate(-50%, -50%) scale(1) rotate(0);\nopacity: 1;\n}\n100% {\ntransform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.3) rotate(360deg);\nopacity: 0;\n}\n}\n.otp-timer-ring {\nposition: relative;\nwidth: 48px;\nheight: 48px;\nflex-shrink: 0;\n}\n.otp-timer-ring svg {\nwidth: 100%;\nheight: 100%;\ndisplay: block;\n}\n.otp-ring-track {\nfill: none;\nstroke: var(--otp-progress-bg);\nstroke-width: 4;\n}\n.otp-ring-progress {\nfill: none;\nstroke: var(--otp-progress-fill);\nstroke-width: 4;\nstroke-linecap: round;\nstroke-dasharray: 125.7;\nstroke-dashoffset: 0;\ntransform: rotate(-90deg);\ntransform-origin: 50% 50%;\n}\n.otp-ring-progress.otp-timer-progress-bar--running {\nanimation: otpRingCountdown linear forwards;\n}\n.otp-ring-progress--urgent {\nstroke: var(--otp-error-color);\n}\n@keyframes otpRingCountdown {\nfrom { stroke-dashoffset: 0; }\nto   { stroke-dashoffset: 125.7; }\n}\n.otp-ring-label {\nposition: absolute;\ninset: 0;\ndisplay: flex;\nalign-items: center;\njustify-content: center;\nfont-size: 0.85rem;\nfont-variant-numeric: tabular-nums;\ncolor: var(--otp-timer-color);\n}\n.otp-ring-label.otp-timer--urgent {\ncolor: var(--otp-timer-urgent-color);\nfont-weight: 600;\n}";
if (typeof document !== 'undefined') {
  const __id = 'otp-input-styles';
  if (!document.getElementById(__id)) {
    const s = document.createElement('style');
    s.id = __id;
    s.textContent = __css;
    document.head.appendChild(s);
  }
}

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

function otp(node, options = {}) {
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

exports.default = otp;
exports.otp = otp;
//# sourceMappingURL=svelte.cjs.map
