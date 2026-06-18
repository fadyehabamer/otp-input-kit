import { formatTime } from '../utils/helpers.js';

/**
 * Manages countdown timer UI, expiry callbacks, and resend cooldown.
 */
export class TimerManager {
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
