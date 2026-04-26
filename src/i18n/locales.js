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
