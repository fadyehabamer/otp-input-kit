import { isOTPLike, extractOTP } from '../utils/validators.js';

/**
 * Handles paste events and clipboard OTP detection with suggestion UI.
 */
export class ClipboardManager {
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
