import './setup.js';
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { OTPInput } = await import('../src/core/OTPInput.js');

const instances = [];
function mount(options = {}) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const otp = new OTPInput(el, { autoFocus: false, clipboardDetection: false, ...options });
  instances.push(otp);
  return otp;
}

/** Simulate the browser writing a character into a cell and firing `input`. */
function typeInto(otp, index, ch) {
  const input = otp.inputs[index];
  input.value = ch;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}
function typeCode(otp, code) {
  [...code].forEach((ch, i) => typeInto(otp, i, ch));
}
function keydown(otp, index, key, init = {}) {
  otp.inputs[index].dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
}
function paste(otp, index, text) {
  const e = new window.Event('paste', { bubbles: true, cancelable: true });
  e.clipboardData = { getData: () => text };
  otp.inputs[index].dispatchEvent(e);
}
const nextFrame = () => new Promise((r) => setTimeout(r, 30));
const flush = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  while (instances.length) instances.pop().destroy();
  document.body.innerHTML = '';
});

describe('construction', () => {
  test('throws for a missing container', () => {
    assert.throws(() => new OTPInput('#nope'), /Container element not found/);
  });

  test('renders one input per digit with accessible labelling', () => {
    const otp = mount({ length: 4 });
    assert.equal(otp.inputs.length, 4);
    assert.equal(otp.container.getAttribute('role'), 'group');
    assert.equal(otp.container.getAttribute('aria-label'), 'Enter 4-digit code');
    assert.equal(otp.inputs[0].getAttribute('aria-label'), 'Digit 1 of 4');
    assert.equal(otp.inputs[0].autocomplete, 'one-time-code');
    assert.equal(otp.inputs[1].autocomplete, 'off');
    assert.equal(otp.inputs[0].inputMode, 'numeric');
  });

  test('secure mode renders password inputs', () => {
    const otp = mount({ length: 4, secure: true });
    assert.ok(otp.inputs.every((i) => i.type === 'password'));
  });

  test('inserts separators after the configured positions', () => {
    const otp = mount({ length: 6, separator: { char: '-', after: [3] } });
    const seps = otp.container.querySelectorAll('.otp-separator');
    assert.equal(seps.length, 1);
    assert.equal(seps[0].previousElementSibling, otp.inputs[2]);
  });

  test('derives RTL direction from an RTL locale', () => {
    const otp = mount({ locale: 'ar' });
    assert.equal(otp.container.getAttribute('dir'), 'rtl');
  });
});

describe('typing', () => {
  test('stores the value and advances focus', () => {
    const otp = mount({ length: 4 });
    typeInto(otp, 0, '1');
    assert.equal(otp.getValue(), '1');
    assert.equal(document.activeElement, otp.inputs[1]);
    assert.ok(otp.inputs[0].classList.contains('otp-input--filled'));
  });

  test('rejects characters that do not match the type', () => {
    const otp = mount({ length: 4 });
    typeInto(otp, 0, 'a');
    assert.equal(otp.getValue(), '');
    assert.equal(otp.inputs[0].value, '');
  });

  test('custom pattern option is honoured', () => {
    const otp = mount({ length: 4, type: 'custom', pattern: /^[A-C]$/ });
    typeInto(otp, 0, 'B');
    typeInto(otp, 1, '1');
    assert.equal(otp.getValue(), 'B');
  });

  test('fires complete exactly once when the last digit is typed', () => {
    const otp = mount({ length: 4 });
    const seen = [];
    otp.on('complete', (v) => seen.push(v));
    typeCode(otp, '1234');
    assert.deepEqual(seen, ['1234']);
  });

  test('fires complete when a gap in the middle is filled last', () => {
    const otp = mount({ length: 4 });
    const seen = [];
    otp.on('complete', (v) => seen.push(v));
    typeInto(otp, 0, '1');
    typeInto(otp, 1, '2');
    typeInto(otp, 3, '4');
    assert.deepEqual(seen, []);
    typeInto(otp, 2, '3');
    assert.deepEqual(seen, ['1234']);
  });

  test('emits change with the full value', () => {
    const changes = [];
    const otp = mount({ length: 3, onChange: (v) => changes.push(v) });
    typeCode(otp, '12');
    assert.deepEqual(changes, ['1', '12']);
  });

  test('native numerals are displayed but stored as western digits', () => {
    const otp = mount({ length: 4, locale: 'ar', nativeNumerals: true });
    typeInto(otp, 0, '٣');
    typeInto(otp, 1, '4');
    assert.equal(otp.getValue(), '34');
    assert.equal(otp.inputs[0].value, '٣');
    assert.equal(otp.inputs[1].value, '٤');
  });
});

describe('keyboard', () => {
  test('Backspace on an empty cell clears the previous one and moves back', () => {
    const otp = mount({ length: 4 });
    typeCode(otp, '12');
    keydown(otp, 2, 'Backspace');
    assert.equal(otp.getValue(), '1');
    assert.equal(document.activeElement, otp.inputs[1]);
  });

  test('Backspace on a filled cell clears it in place', () => {
    const otp = mount({ length: 4 });
    typeCode(otp, '12');
    keydown(otp, 1, 'Backspace');
    assert.equal(otp.getValue(), '1');
  });

  test('arrow keys are mirrored in RTL', () => {
    const otp = mount({ length: 4, direction: 'rtl' });
    otp.inputs[1].focus();
    keydown(otp, 1, 'ArrowLeft');
    assert.equal(document.activeElement, otp.inputs[2]);
    keydown(otp, 2, 'ArrowRight');
    assert.equal(document.activeElement, otp.inputs[1]);
  });

  test('Ctrl+Z / Ctrl+Shift+Z undo and redo', () => {
    const otp = mount({ length: 4 });
    typeCode(otp, '12');
    keydown(otp, 2, 'z', { ctrlKey: true });
    assert.equal(otp.getValue(), '1');
    keydown(otp, 1, 'z', { ctrlKey: true, shiftKey: true });
    assert.equal(otp.getValue(), '12');
  });
});

describe('paste', () => {
  test('distributes a code extracted from a message', () => {
    const otp = mount({ length: 6 });
    const seen = [];
    otp.on('complete', (v) => seen.push(v));
    paste(otp, 0, 'Your code is 482913');
    assert.equal(otp.getValue(), '482913');
    assert.deepEqual(seen, ['482913']);
  });

  test('handles spaced codes', () => {
    const otp = mount({ length: 6 });
    paste(otp, 0, '123 456');
    assert.equal(otp.getValue(), '123456');
  });

  test('handles native-numeral codes regardless of locale', () => {
    const otp = mount({ length: 6 });
    paste(otp, 0, 'رمزك هو ١٢٣٤٥٦');
    assert.equal(otp.getValue(), '123456');
  });
});

describe('public API', () => {
  test('setValue / getValue / clear', () => {
    const otp = mount({ length: 4 });
    otp.setValue('12');
    assert.equal(otp.getValue(), '12');
    otp.setValue('123456789');
    assert.equal(otp.getValue(), '1234');
    otp.clear();
    assert.equal(otp.getValue(), '');
    assert.ok(otp.inputs.every((i) => i.value === ''));
  });

  test('disable / enable', () => {
    const otp = mount({ length: 4 });
    otp.disable();
    assert.ok(otp.inputs.every((i) => i.disabled));
    assert.ok(otp.container.classList.contains('otp-root--disabled'));
    otp.enable();
    assert.ok(otp.inputs.every((i) => !i.disabled));
  });

  test('setError / clearError toggle the error state', () => {
    const otp = mount({ length: 4 });
    const errors = [];
    otp.on('error', (e) => errors.push(e));
    otp.setError('Nope');
    assert.ok(otp.inputs.every((i) => i.classList.contains('otp-input--error')));
    assert.deepEqual(errors, [[{ index: -1, message: 'Nope' }]]);
    otp.clearError();
    assert.ok(otp.inputs.every((i) => !i.classList.contains('otp-input--error')));
  });

  test('toggleReveal switches masked inputs to text', () => {
    const otp = mount({ length: 4, secure: true, revealToggle: true });
    otp.toggleReveal();
    assert.ok(otp.inputs.every((i) => i.type === 'text'));
    otp.toggleReveal(false);
    assert.ok(otp.inputs.every((i) => i.type === 'password'));
  });

  test('setLocale re-renders digits', () => {
    const otp = mount({ length: 2, nativeNumerals: true });
    otp.setValue('12');
    otp.setLocale('fa');
    assert.equal(otp.inputs[0].value, '۱');
    assert.equal(otp.getValue(), '12');
  });

  test('destroy removes the rendered DOM and listeners', () => {
    const otp = mount({ length: 4 });
    let calls = 0;
    otp.on('change', () => calls++);
    otp.destroy();
    assert.equal(otp.container.children.length, 0);
    assert.ok(!otp.container.classList.contains('otp-root'));
    otp.emitter.emit('change');
    assert.equal(calls, 0);
  });
});

describe('validation', () => {
  test('a custom validate() failure emits error instead of complete', () => {
    const otp = mount({ length: 4, validate: (v) => (v === '0000' ? 'All zeros' : null) });
    let completed = false;
    const errors = [];
    otp.on('complete', () => { completed = true; });
    otp.on('error', (e) => errors.push(e));
    otp.setValue('0000');
    assert.equal(completed, false);
    assert.equal(errors[0][0].message, 'All zeros');
    assert.equal(otp.inputs[0].getAttribute('aria-invalid'), 'true');
  });
});

describe('async verification', () => {
  test('success path: loading, then verified', async () => {
    let resolve;
    const otp = mount({ length: 4, onVerify: () => new Promise((r) => { resolve = r; }) });
    const verified = [];
    otp.on('verified', (v) => verified.push(v));
    otp.setValue('1234');
    assert.ok(otp.container.classList.contains('otp-root--loading'));
    assert.ok(otp.inputs.every((i) => i.disabled));
    resolve(true);
    await flush();
    assert.deepEqual(verified, ['1234']);
    assert.ok(otp.container.classList.contains('otp-root--verified'));
    assert.ok(otp.inputs.every((i) => !i.disabled));
  });

  test('a string result is treated as a failure message', async () => {
    const otp = mount({ length: 4, onVerify: async () => 'Wrong code', loading: { clearOnError: false } });
    const failed = [];
    otp.on('verify-failed', (m) => failed.push(m));
    otp.setValue('1234');
    await flush();
    assert.deepEqual(failed, ['Wrong code']);
    assert.equal(otp.getValue(), '1234');
  });

  test('a thrown error fails verification', async () => {
    const otp = mount({ length: 4, onVerify: async () => { throw new Error('Network'); }, loading: { clearOnError: false } });
    const failed = [];
    otp.on('verify-failed', (m) => failed.push(m));
    otp.setValue('1234');
    await flush();
    assert.deepEqual(failed, ['Network']);
  });

  test('keypad keys are ignored while verification is in flight', () => {
    const otp = mount({ length: 4, keypad: true, onVerify: () => new Promise(() => {}) });
    otp.setValue('1234');
    const backspace = otp.container.querySelector('.otp-keypad-key[aria-label="Backspace"]');
    backspace.click();
    assert.equal(otp.getValue(), '1234');
  });
});

describe('keypad', () => {
  test('digit and backspace keys edit the code', () => {
    const otp = mount({ length: 4, keypad: true });
    const key = (label) => otp.container.querySelector(`.otp-keypad-key[aria-label="${label}"]`);
    key('7').click();
    key('3').click();
    assert.equal(otp.getValue(), '73');
    key('Backspace').click();
    assert.equal(otp.getValue(), '7');
  });

  test('keys are ignored while disabled', () => {
    const otp = mount({ length: 4, keypad: true });
    otp.disable();
    otp.container.querySelector('.otp-keypad-key[aria-label="5"]').click();
    assert.equal(otp.getValue(), '');
  });
});

describe('lockout', () => {
  test('locks after maxAttempts failures and unlocks', () => {
    const otp = mount({ length: 4, lockout: { enabled: true, maxAttempts: 2, duration: 30 } });
    const locks = [];
    otp.on('lock', (s) => locks.push(s));
    otp.setError('bad');
    assert.equal(otp.isLocked(), false);
    otp.setError('bad');
    assert.equal(otp.isLocked(), true);
    assert.deepEqual(locks, [30]);
    assert.ok(otp.inputs.every((i) => i.disabled));
    otp.unlock();
    assert.equal(otp.isLocked(), false);
    assert.ok(otp.inputs.every((i) => !i.disabled));
  });
});

describe('screen reader announcements', () => {
  test('announces the digits on completion', async () => {
    const otp = mount({ length: 4 });
    otp.setValue('1234');
    await nextFrame();
    assert.equal(otp.a11y._liveRegion.textContent, 'OTP complete: 1 2 3 4');
  });

  test('does not read the code aloud in secure mode', async () => {
    const otp = mount({ length: 4, secure: true });
    otp.setValue('1234');
    await nextFrame();
    assert.equal(otp.a11y._liveRegion.textContent, 'OTP complete');
  });

  test('destroying before the announcement frame does not throw', async () => {
    const errors = [];
    const onError = (e) => { errors.push(e.error ?? e.message); e.preventDefault(); };
    window.addEventListener('error', onError);
    const otp = mount({ length: 4 });
    otp.setValue('1234');
    otp.destroy();
    await nextFrame();
    window.removeEventListener('error', onError);
    assert.deepEqual(errors, []);
  });
});

describe('timer', () => {
  test('resend restarts a non-urgent countdown', (t) => {
    t.mock.timers.enable({ apis: ['setInterval'] });
    const otp = mount({ length: 4, timer: { enabled: true, duration: 2 }, resend: { enabled: true, cooldown: 30 } });
    const timerEl = otp.container.querySelector('.otp-timer');
    t.mock.timers.tick(3000);
    assert.equal(otp._expired, true);
    assert.ok(timerEl.classList.contains('otp-timer--urgent'));
    otp.container.querySelector('.otp-resend-btn').click();
    assert.equal(otp._expired, false);
    assert.equal(timerEl.textContent, '00:30');
    assert.ok(!timerEl.classList.contains('otp-timer--urgent'));
  });
});
