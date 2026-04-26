import { formatTime } from '../utils/helpers.js';

/**
 * Manages countdown timer UI, expiry callbacks, and resend cooldown.
 */
export class TimerManager {
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
