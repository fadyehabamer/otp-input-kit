import { getNumeralSystem } from './locales.js';

/**
 * Handles rendering digits in locale-specific numeral systems
 * while storing values internally as Western digits (0-9).
 */
export class NumberRenderer {
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
