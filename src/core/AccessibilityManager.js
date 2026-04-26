import { generateId } from '../utils/helpers.js';

/**
 * Manages ARIA attributes, live regions, and screen reader announcements.
 */
export class AccessibilityManager {
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
