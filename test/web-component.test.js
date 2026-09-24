import './setup.js';
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { registerOTPInputElement } = await import('../src/web-component/OTPInputElement.js');
registerOTPInputElement();

afterEach(() => {
  document.body.innerHTML = '';
});

describe('<otp-input>', () => {
  test('renders from attributes', () => {
    document.body.innerHTML = '<otp-input length="4" type="alphanumeric" label="Code"></otp-input>';
    const el = document.querySelector('otp-input');
    const inputs = el.querySelectorAll('input.otp-input');
    assert.equal(inputs.length, 4);
    assert.equal(el.getAttribute('aria-label'), 'Code');
  });

  test('value property proxies the instance and dispatches otp-* events', () => {
    document.body.innerHTML = '<otp-input length="4"></otp-input>';
    const el = document.querySelector('otp-input');
    const events = [];
    el.addEventListener('otp-change', (e) => events.push(['change', e.detail]));
    el.addEventListener('otp-complete', (e) => events.push(['complete', e.detail]));
    el.value = '1234';
    assert.equal(el.value, '1234');
    assert.deepEqual(events, [['change', '1234'], ['complete', '1234']]);
  });

  test('re-renders when an observed attribute changes', () => {
    document.body.innerHTML = '<otp-input length="4"></otp-input>';
    const el = document.querySelector('otp-input');
    el.setAttribute('length', '6');
    assert.equal(el.querySelectorAll('input.otp-input').length, 6);
  });

  test('tears down when removed from the document', () => {
    document.body.innerHTML = '<otp-input length="4"></otp-input>';
    const el = document.querySelector('otp-input');
    el.remove();
    assert.equal(el.children.length, 0);
    assert.equal(el.value, '');
  });
});
