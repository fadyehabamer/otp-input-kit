import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { mergeDeep, formatTime } from '../src/utils/helpers.js';
import { extractOTP, isOTPLike, createValidator } from '../src/utils/validators.js';
import { EventEmitter } from '../src/utils/events.js';
import { HistoryManager } from '../src/core/HistoryManager.js';
import { isRTLLocale, getNumeralSystem, toWesternDigits } from '../src/i18n/locales.js';
import { NumberRenderer } from '../src/i18n/NumberRenderer.js';

describe('mergeDeep', () => {
  test('merges nested plain objects without mutating sources', () => {
    const defaults = { timer: { enabled: false, duration: 60 }, length: 6 };
    const out = mergeDeep({}, defaults, { timer: { enabled: true } });
    assert.deepEqual(out, { timer: { enabled: true, duration: 60 }, length: 6 });
    assert.equal(defaults.timer.enabled, false);
    assert.notEqual(out.timer, defaults.timer);
  });

  test('copies RegExp, arrays and functions by reference', () => {
    const pattern = /^[A-F]$/;
    const fn = () => {};
    const out = mergeDeep({}, { pattern: null }, { pattern, list: [1, 2], fn });
    assert.equal(out.pattern, pattern);
    assert.deepEqual(out.list, [1, 2]);
    assert.equal(out.fn, fn);
  });
});

describe('formatTime', () => {
  test('formats seconds as mm:ss', () => {
    assert.equal(formatTime(0), '00:00');
    assert.equal(formatTime(65), '01:05');
  });
});

describe('createValidator', () => {
  test('uses built-in patterns per type', () => {
    assert.ok(createValidator('numeric')('7'));
    assert.ok(!createValidator('numeric')('a'));
    assert.ok(createValidator('alpha')('a'));
    assert.ok(!createValidator('alpha')('1'));
    assert.ok(createValidator('hex')('F'));
    assert.ok(!createValidator('hex')('G'));
  });

  test('custom RegExp takes precedence', () => {
    const v = createValidator('custom', /^[XYZ]$/);
    assert.ok(v('X'));
    assert.ok(!v('1'));
  });
});

describe('extractOTP', () => {
  const digit = (ch) => /^\d$/.test(ch);

  test('finds a code inside a message', () => {
    assert.equal(extractOTP('Your verification code is 482913.', 6), '482913');
  });

  test('handles spaced and dashed codes with a validator function', () => {
    assert.equal(extractOTP('123 456', 6, digit), '123456');
    assert.equal(extractOTP('12-34-56', 6, digit), '123456');
  });

  test('accepts a RegExp validator', () => {
    assert.equal(extractOTP('1 2 3 4', 4, /\d/), '1234');
  });

  test('skips words the validator rejects', () => {
    assert.equal(extractOTP('Your code is 12 34', 4, digit), '1234');
  });

  test('returns null when there are not enough valid characters', () => {
    assert.equal(extractOTP('12', 6, digit), null);
    assert.equal(extractOTP('', 6), null);
  });
});

describe('isOTPLike', () => {
  test('detects 4–8 digit or upper-case alphanumeric strings', () => {
    assert.ok(isOTPLike(' 1234 '));
    assert.ok(isOTPLike('AB12CD'));
    assert.ok(!isOTPLike('hello world'));
    assert.ok(!isOTPLike('123'));
  });
});

describe('locales', () => {
  test('isRTLLocale checks the base language', () => {
    assert.ok(isRTLLocale('ar-EG'));
    assert.ok(isRTLLocale('he'));
    assert.ok(!isRTLLocale('en-US'));
    assert.ok(!isRTLLocale(null));
  });

  test('getNumeralSystem falls back to western digits', () => {
    assert.equal(getNumeralSystem('fa-IR').digits, '۰۱۲۳۴۵۶۷۸۹');
    assert.equal(getNumeralSystem('xx').digits, '0123456789');
  });

  test('toWesternDigits converts every supported numeral system', () => {
    assert.equal(toWesternDigits('٠١٢٣٤٥٦٧٨٩'), '0123456789'); // Arabic-Indic
    assert.equal(toWesternDigits('۱۲۳۴'), '1234');             // Persian
    assert.equal(toWesternDigits('code: ४२'), 'code: 42');      // Devanagari
  });
});

describe('NumberRenderer', () => {
  test('round-trips between western and locale digits', () => {
    const nr = new NumberRenderer('ar');
    assert.equal(nr.toLocale('5'), '٥');
    assert.equal(nr.toWestern('٥'), '5');
    assert.equal(nr.stringToLocale('2024'), '٢٠٢٤');
    assert.equal(nr.stringToWestern('٢٠٢٤'), '2024');
    assert.equal(nr.toLocale('a'), 'a');
  });
});

describe('EventEmitter', () => {
  test('on/off/once', () => {
    const em = new EventEmitter();
    const calls = [];
    const off = em.on('x', (v) => calls.push(['on', v]));
    em.once('x', (v) => calls.push(['once', v]));
    em.emit('x', 1);
    em.emit('x', 2);
    off();
    em.emit('x', 3);
    assert.deepEqual(calls, [['on', 1], ['once', 1], ['on', 2]]);
  });

  test('a throwing listener does not stop the others', (t) => {
    t.mock.method(console, 'error', () => {});
    const em = new EventEmitter();
    let reached = false;
    em.on('x', () => { throw new Error('boom'); });
    em.on('x', () => { reached = true; });
    em.emit('x');
    assert.ok(reached);
  });
});

describe('HistoryManager', () => {
  test('undo/redo and redo-branch truncation', () => {
    const h = new HistoryManager();
    h.push(['', '']);
    h.push(['1', '']);
    h.push(['1', '2']);
    assert.deepEqual(h.undo(), ['1', '']);
    assert.deepEqual(h.undo(), ['', '']);
    assert.equal(h.undo(), null);
    assert.deepEqual(h.redo(), ['1', '']);
    h.push(['9', '']);
    assert.equal(h.canRedo(), false);
  });

  test('pushIfChanged skips identical snapshots', () => {
    const h = new HistoryManager();
    h.push(['1']);
    h.pushIfChanged(['1']);
    assert.equal(h.canUndo(), false);
  });

  test('respects maxSize', () => {
    const h = new HistoryManager(2);
    h.push(['a']); h.push(['b']); h.push(['c']);
    assert.deepEqual(h.undo(), ['b']);
    assert.equal(h.undo(), null);
  });
});
