import './setup.js';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { OTPInput } = await import('../src/core/OTPInput.js');
const { registerOTPInputElement } = await import('../src/web-component/OTPInputElement.js');
registerOTPInputElement();

const instances = [];
function mount(options = {}) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const otp = new OTPInput(el, { autoFocus: false, clipboardDetection: false, ...options });
  instances.push(otp);
  return otp;
}
const flush = () => new Promise((r) => setTimeout(r, 0));

/**
 * Install a fake Web OTP API. `get` resolves when `deliver(code)` is called and
 * rejects with an AbortError when its signal aborts, like the real API.
 */
function mockWebOtp() {
  const calls = [];
  let pending = null;
  window.OTPCredential = function OTPCredential() {};
  Object.defineProperty(navigator, 'credentials', {
    configurable: true,
    value: {
      get(opts) {
        calls.push(opts);
        return new Promise((resolve, reject) => {
          pending = { resolve };
          opts.signal.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      },
    },
  });
  return {
    calls,
    deliver(code) { pending.resolve({ type: 'otp', code }); },
  };
}

function unmockWebOtp() {
  delete window.OTPCredential;
  delete navigator.credentials;
}

afterEach(() => {
  while (instances.length) instances.pop().destroy();
  document.body.innerHTML = '';
  unmockWebOtp();
});

describe('Web OTP (webOtp option)', () => {
  let api;
  beforeEach(() => { api = mockWebOtp(); });

  test('requests an SMS credential with an abort signal', async () => {
    const otp = mount({ webOtp: true });
    const pending = [];
    otp.on('sms-pending', () => pending.push(true));
    await flush();
    assert.equal(api.calls.length, 1);
    assert.deepEqual(api.calls[0].otp, { transport: ['sms'] });
    assert.equal(api.calls[0].signal.aborted, false);
    assert.deepEqual(pending, [true]);
  });

  test('fills and completes the code when the SMS arrives', async () => {
    const events = [];
    const otp = mount({ length: 6, webOtp: true, onSmsRead: (c) => events.push(['cb', c]), onComplete: (v) => events.push(['complete', v]) });
    otp.on('sms-read', (c) => events.push(['event', c]));
    await flush();
    api.deliver('123456');
    await flush();
    assert.equal(otp.getValue(), '123456');
    assert.deepEqual(events, [['complete', '123456'], ['cb', '123456'], ['event', '123456']]);
  });

  test('normalises native digits and drops characters the input rejects', async () => {
    const otp = mount({ length: 4, webOtp: true });
    await flush();
    api.deliver('١٢-٣٤');
    await flush();
    assert.equal(otp.getValue(), '1234');
  });

  test('aborts the pending request on destroy without reporting an error', async () => {
    const errors = [];
    const otp = mount({ webOtp: true });
    otp.on('sms-error', (e) => errors.push(e));
    await flush();
    const { signal } = api.calls[0];
    otp.destroy();
    assert.equal(signal.aborted, true);
    await flush();
    assert.deepEqual(errors, []);
  });

  test('stops listening once the code is typed, and listens again after a resend', async () => {
    const otp = mount({ length: 4, webOtp: true, resend: { enabled: true, cooldown: 0 } });
    await flush();
    const first = api.calls[0].signal;
    otp.setValue('1234');
    assert.equal(first.aborted, true);
    otp.container.querySelector('.otp-resend-btn').click();
    assert.equal(api.calls.length, 2);
    api.deliver('9876');
    await flush();
    assert.equal(otp.getValue(), '9876');
  });

  test('smsAutoRead remains an alias', async () => {
    mount({ smsAutoRead: true });
    await flush();
    assert.equal(api.calls.length, 1);
  });

  test('reports non-abort failures as sms-error', async () => {
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { get: () => Promise.reject(Object.assign(new Error('nope'), { name: 'NotAllowedError' })) },
    });
    const errors = [];
    const otp = mount({ webOtp: true });
    otp.on('sms-error', (e) => errors.push(e.name));
    await flush();
    assert.deepEqual(errors, ['NotAllowedError']);
  });

  test('<otp-input web-otp> fills itself and dispatches otp-sms-read', async () => {
    document.body.innerHTML = '<otp-input length="4" web-otp></otp-input>';
    const el = document.querySelector('otp-input');
    const got = [];
    el.addEventListener('otp-sms-read', (e) => got.push(e.detail));
    await flush();
    assert.equal(api.calls.length, 1);
    api.deliver('4321');
    await flush();
    assert.equal(el.value, '4321');
    assert.deepEqual(got, ['4321']);
  });

  test('does nothing unless enabled', async () => {
    mount({});
    await flush();
    assert.equal(api.calls.length, 0);
  });
});

describe('Web OTP feature detection', () => {
  test('is a no-op where the API is missing', async () => {
    const otp = mount({ length: 4, webOtp: true });
    const reasons = [];
    otp.on('sms-unsupported', (r) => reasons.push(r));
    await flush();
    assert.deepEqual(reasons, ['no-api']);
    assert.equal(otp._smsAbortController, undefined);
    otp.setValue('1234');
    assert.equal(otp.getValue(), '1234');
  });

  test('requires navigator.credentials.get as well as OTPCredential', async () => {
    window.OTPCredential = function OTPCredential() {};
    const otp = mount({ webOtp: true });
    const reasons = [];
    otp.on('sms-unsupported', (r) => reasons.push(r));
    await flush();
    assert.deepEqual(reasons, ['no-api']);
  });

  test('is a no-op outside a secure context', async (t) => {
    mockWebOtp();
    const calls = [];
    const get = navigator.credentials.get;
    navigator.credentials.get = (o) => { calls.push(o); return get(o); };
    const original = Object.getOwnPropertyDescriptor(window, 'isSecureContext');
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false });
    t.after(() => {
      if (original) Object.defineProperty(window, 'isSecureContext', original);
      else delete window.isSecureContext;
    });
    const otp = mount({ webOtp: true });
    const reasons = [];
    otp.on('sms-unsupported', (r) => reasons.push(r));
    await flush();
    assert.deepEqual(reasons, ['insecure-context']);
    assert.equal(calls.length, 0);
  });
});

describe('SMS autofill attributes', () => {
  test('first cell is the one-time-code target and accepts the full code', () => {
    const otp = mount({ length: 6 });
    assert.equal(otp.inputs[0].getAttribute('autocomplete'), 'one-time-code');
    assert.equal(otp.inputs[0].maxLength, 6);
    assert.ok(otp.inputs.slice(1).every((i) => i.getAttribute('autocomplete') === 'off' && i.maxLength === 1));
    assert.ok(otp.inputs.every((i) => i.inputMode === 'numeric'));
  });

  test('non-numeric types use a text keyboard', () => {
    for (const type of ['alpha', 'alphanumeric', 'hex']) {
      const otp = mount({ length: 4, type });
      assert.ok(otp.inputs.every((i) => i.inputMode === 'text'), type);
    }
  });

  test('an autofilled full code in the first cell is distributed', () => {
    const otp = mount({ length: 6 });
    otp.inputs[0].value = '482913';
    otp.inputs[0].dispatchEvent(new window.InputEvent('input', { inputType: 'insertReplacementText', bubbles: true }));
    assert.equal(otp.getValue(), '482913');
  });

  test('typing one key into a filled first cell replaces it', () => {
    const otp = mount({ length: 4 });
    otp.inputs[0].value = '1';
    otp.inputs[0].dispatchEvent(new window.Event('input', { bubbles: true }));
    otp.inputs[0].value = '17';
    otp.inputs[0].dispatchEvent(new window.InputEvent('input', { inputType: 'insertText', data: '7', bubbles: true }));
    assert.equal(otp.getValue(), '7');
    assert.equal(otp.inputs[0].value, '7');
  });
});
