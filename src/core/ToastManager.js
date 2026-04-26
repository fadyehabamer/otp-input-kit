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

export class ToastManager {
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

/** Singleton helper for global access */
let _defaultInstance;
export function getDefaultToast() {
  if (!_defaultInstance) _defaultInstance = new ToastManager();
  return _defaultInstance;
}
