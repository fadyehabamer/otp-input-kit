/**
 * Input validation utilities
 */

export const PATTERNS = {
  numeric: /^\d$/,
  alpha: /^[a-zA-Z]$/,
  alphanumeric: /^[a-zA-Z0-9]$/,
  hex: /^[0-9a-fA-F]$/,
};

export function createValidator(type, customPattern) {
  if (customPattern instanceof RegExp) return (ch) => customPattern.test(ch);
  return (ch) => (PATTERNS[type] || PATTERNS.numeric).test(ch);
}

export function isOTPLike(text) {
  // Detect if clipboard text looks like an OTP (4-8 consecutive digits/alphanums)
  const stripped = text.trim();
  return /^\d{4,8}$/.test(stripped) || /^[A-Z0-9]{4,8}$/.test(stripped);
}

/**
 * Extract an OTP of `length` characters from free-form text such as
 * "Your OTP is 123456", "123 456" or "12-34-56".
 *
 * @param {string} text
 * @param {number} length
 * @param {RegExp|((ch: string) => boolean)} [isValid] per-character validator
 *   (a RegExp or a predicate function). Defaults to western digits.
 * @returns {string|null}
 */
export function extractOTP(text, length, isValid) {
  if (typeof text !== 'string' || !text) return null;
  const test =
    typeof isValid === 'function' ? isValid
    : isValid instanceof RegExp ? (ch) => isValid.test(ch)
    : (ch) => /^\d$/.test(ch);
  const allValid = (candidate) => candidate.split('').every(test);

  // Pure digit sequence of correct length
  const exactMatch = new RegExp(`\\b\\d{${length}}\\b`).exec(text);
  if (exactMatch && allValid(exactMatch[0])) return exactMatch[0];

  // Alphanumeric sequence — skip words ("YOUR", "CODE") the validator rejects
  const alphaRe = new RegExp(`\\b[A-Z0-9]{${length}}\\b`, 'g');
  for (const m of text.toUpperCase().matchAll(alphaRe)) {
    if (allValid(m[0])) return m[0];
  }

  // Take first N valid characters (handles "123 456", "12-34-56", …)
  const valid = text.replace(/\s/g, '').split('').filter(test);
  if (valid.length >= length) return valid.slice(0, length).join('');

  return null;
}
