import './setup.js';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { registerOTPInputElement } = await import('../src/web-component/OTPInputElement.js');
registerOTPInputElement();

/**
 * jsdom implements ElementInternals without the form APIs (and never calls the
 * form-associated callbacks), so model the parts <otp-input> relies on.
 */
class FakeInternals {
  constructor(host) {
    this.host = host;
    this.formValue = null;
    this.flags = {};
    this.validationMessage = '';
    this.anchor = null;
  }
  setFormValue(v) { this.formValue = v; }
  setValidity(flags = {}, message = '', anchor) {
    this.flags = { ...flags };
    this.validationMessage = Object.values(flags).some(Boolean) ? message : '';
    this.anchor = anchor ?? null;
  }
  get validity() {
    const valid = !Object.values(this.flags).some(Boolean);
    return { ...this.flags, valid };
  }
  get form() { return this.host.closest('form'); }
  get labels() { return []; }
  get willValidate() { return true; }
  checkValidity() { return this.validity.valid; }
  reportValidity() { return this.validity.valid; }
}

const proto = window.HTMLElement.prototype;
let originalAttach;
beforeEach(() => {
  originalAttach = proto.attachInternals;
  proto.attachInternals = function attachInternals() { return new FakeInternals(this); };
});
afterEach(() => {
  proto.attachInternals = originalAttach;
  document.body.innerHTML = '';
});

function mount(html) {
  document.body.innerHTML = `<form>${html}</form>`;
  const el = document.querySelector('otp-input');
  return { el, form: document.querySelector('form'), internals: el._internals };
}
function typeInto(el, index, ch) {
  const input = el.querySelectorAll('input.otp-input')[index];
  input.value = ch;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

describe('<otp-input> form association', () => {
  test('is form-associated and exposes name/form', () => {
    const { el, form, internals } = mount('<otp-input name="otp" length="4"></otp-input>');
    assert.equal(customElements.get('otp-input').formAssociated, true);
    assert.ok(internals instanceof FakeInternals);
    assert.equal(el.name, 'otp');
    assert.equal(el.form, form);
  });

  test('submits the typed value', () => {
    const { el, internals } = mount('<otp-input name="otp" length="4"></otp-input>');
    assert.equal(internals.formValue, '');
    typeInto(el, 0, '4');
    typeInto(el, 1, '2');
    assert.equal(internals.formValue, '42');
    el.value = '9999';
    assert.equal(internals.formValue, '9999');
  });

  test('required: missing → too short → valid', () => {
    const { el, internals } = mount('<otp-input name="otp" length="4" required validation-message="Enter the code"></otp-input>');
    assert.equal(el.checkValidity(), false);
    assert.equal(el.validity.valueMissing, true);
    assert.equal(el.validationMessage, 'Enter the code');
    assert.equal(internals.anchor, el.querySelector('input.otp-input'));
    el.value = '12';
    assert.equal(el.validity.tooShort, true);
    assert.equal(el.checkValidity(), false);
    el.value = '1234';
    assert.equal(el.checkValidity(), true);
    assert.equal(el.validationMessage, '');
  });

  test('not required: always valid', () => {
    const { el } = mount('<otp-input name="otp" length="4"></otp-input>');
    assert.equal(el.checkValidity(), true);
    el.value = '1';
    assert.equal(el.checkValidity(), true);
  });

  test('toggling required re-validates without rebuilding or losing the value', () => {
    const { el } = mount('<otp-input name="otp" length="4"></otp-input>');
    el.value = '12';
    const firstInput = el.querySelector('input.otp-input');
    el.required = true;
    assert.equal(el.checkValidity(), false);
    assert.equal(el.querySelector('input.otp-input'), firstInput);
    assert.equal(el.value, '12');
    el.removeAttribute('required');
    assert.equal(el.checkValidity(), true);
  });

  test('formResetCallback clears the value and restores validity state', () => {
    const { el, internals } = mount('<otp-input name="otp" length="4" required></otp-input>');
    el.value = '1234';
    assert.equal(el.checkValidity(), true);
    el.formResetCallback();
    assert.equal(el.value, '');
    assert.equal(internals.formValue, '');
    assert.equal(el.validity.valueMissing, true);
  });

  test('formDisabledCallback disables the cells and survives a rebuild', () => {
    const { el } = mount('<otp-input name="otp" length="4"></otp-input>');
    el.formDisabledCallback(true);
    assert.ok([...el.querySelectorAll('input.otp-input')].every((i) => i.disabled));
    el.setAttribute('length', '6');
    const cells = [...el.querySelectorAll('input.otp-input')];
    assert.equal(cells.length, 6);
    assert.ok(cells.every((i) => i.disabled));
    el.formDisabledCallback(false);
    assert.ok([...el.querySelectorAll('input.otp-input')].every((i) => !i.disabled));
  });

  test('formStateRestoreCallback restores the value', () => {
    const { el, internals } = mount('<otp-input name="otp" length="4"></otp-input>');
    el.formStateRestoreCallback('5678');
    assert.equal(el.value, '5678');
    assert.equal(internals.formValue, '5678');
  });

  test('a value set before connection is applied once connected', () => {
    const el = document.createElement('otp-input');
    el.setAttribute('length', '4');
    el.setAttribute('name', 'otp');
    el.value = '8642';
    assert.equal(el.value, '8642');
    document.body.appendChild(el);
    assert.equal(el.querySelectorAll('input.otp-input')[0].value, '8');
    assert.equal(el._internals.formValue, '8642');
  });
});

describe('<otp-input> without ElementInternals form APIs', () => {
  test('degrades to a plain element', () => {
    proto.attachInternals = originalAttach; // jsdom: no setFormValue
    const { el } = mount('<otp-input name="otp" length="4" required></otp-input>');
    assert.equal(el._internals, null);
    assert.equal(el.form, null);
    assert.equal(el.checkValidity(), true);
    el.value = '1234';
    assert.equal(el.value, '1234');
  });
});
