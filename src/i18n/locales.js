/**
 * Locale definitions for number rendering and RTL detection
 */

export const RTL_LOCALES = new Set([
  'ar', 'arc', 'dv', 'fa', 'ha', 'he', 'khw', 'ks', 'ku', 'ps', 'ur', 'yi',
]);

export const NUMERAL_SYSTEMS = {
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

export function isRTLLocale(locale) {
  if (!locale) return false;
  const base = locale.split('-')[0].toLowerCase();
  return RTL_LOCALES.has(base);
}

export function getNumeralSystem(locale) {
  if (!locale) return NUMERAL_SYSTEMS.en;
  const base = locale.split('-')[0].toLowerCase();
  return NUMERAL_SYSTEMS[base] || NUMERAL_SYSTEMS.en;
}

/**
 * Convert digits from ANY supported numeral system to western digits,
 * leaving every other character untouched. Used for pasted/autofilled text,
 * whose numeral system may not match the configured locale.
 */
export function toWesternDigits(str) {
  let out = '';
  for (const ch of String(str)) {
    let mapped = ch;
    for (const { digits } of Object.values(NUMERAL_SYSTEMS)) {
      const idx = digits.indexOf(ch);
      if (idx !== -1) { mapped = String(idx); break; }
    }
    out += mapped;
  }
  return out;
}
