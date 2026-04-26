import { createValidator } from '../utils/validators.js';
import { addClasses, removeClasses } from '../utils/dom.js';

/**
 * Manages per-digit and full-OTP validation, error state, and feedback.
 */
export class ValidationManager {
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
