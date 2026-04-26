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

export function extractOTP(text, length, pattern) {
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
