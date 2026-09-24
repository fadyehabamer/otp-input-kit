import './setup.js';
import { register } from 'node:module';
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';

register('./css-hooks.js', import.meta.url);

const React = (await import('react')).default;
const { act } = React;
const { createRoot } = await import('react-dom/client');
const ReactAdapter = await import('../src/adapters/react.js');
const { createApp, h, ref, nextTick } = await import('vue');
const VueAdapter = await import('../src/adapters/vue.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise((r) => setTimeout(r, 0));
function typeInto(container, index, ch) {
  const input = container.querySelectorAll('input.otp-input')[index];
  input.value = ch;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('otp-input-kit/react', () => {
  const { OtpInput } = ReactAdapter;

  function render(element) {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(element));
    return { host, root, rerender: (el) => act(() => root.render(el)) };
  }

  test('renders the inputs and fires onChange / onComplete', () => {
    const changes = [];
    const completes = [];
    const { host, root } = render(
      React.createElement(OtpInput, {
        length: 4, autoFocus: false, clipboardDetection: false, className: 'box',
        onChange: (v) => changes.push(v), onComplete: (v) => completes.push(v),
      })
    );
    assert.ok(host.querySelector('div.box.otp-root'));
    assert.equal(host.querySelectorAll('input.otp-input').length, 4);
    '1234'.split('').forEach((ch, i) => typeInto(host, i, ch));
    assert.equal(changes.at(-1), '1234');
    assert.deepEqual(completes, ['1234']);
    act(() => root.unmount());
  });

  test('value is controlled and follows prop changes', () => {
    const el = (value) => React.createElement(OtpInput, { length: 4, autoFocus: false, clipboardDetection: false, value });
    const { host, root, rerender } = render(el('12'));
    const values = () => [...host.querySelectorAll('input.otp-input')].map((i) => i.value).join('');
    assert.equal(values(), '12');
    rerender(el('9876'));
    assert.equal(values(), '9876');
    rerender(el(''));
    assert.equal(values(), '');
    act(() => root.unmount());
  });

  test('the latest onComplete handler is used without rebuilding', () => {
    const calls = [];
    const el = (tag) => React.createElement(OtpInput, {
      length: 4, autoFocus: false, clipboardDetection: false, onComplete: (v) => calls.push([tag, v]),
    });
    const { host, root, rerender } = render(el('a'));
    const firstInput = host.querySelector('input.otp-input');
    rerender(el('b'));
    assert.equal(host.querySelector('input.otp-input'), firstInput);
    '4321'.split('').forEach((ch, i) => typeInto(host, i, ch));
    assert.deepEqual(calls, [['b', '4321']]);
    act(() => root.unmount());
  });

  test('ref exposes the imperative API', () => {
    const handle = React.createRef();
    const { root } = render(React.createElement(OtpInput, { ref: handle, length: 4, autoFocus: false, clipboardDetection: false }));
    handle.current.setValue('5555');
    assert.equal(handle.current.getValue(), '5555');
    assert.ok(handle.current.getInstance());
    act(() => root.unmount());
  });

  test('destroys the instance on unmount', async () => {
    const handle = React.createRef();
    const { host, root } = render(React.createElement(OtpInput, { ref: handle, length: 4, autoFocus: false, clipboardDetection: false }));
    const inst = handle.current.getInstance();
    const container = inst.container;
    act(() => root.unmount());
    assert.equal(inst._destroyed, true);
    assert.equal(container.children.length, 0);
    assert.equal(host.children.length, 0);
  });

  test('useOtp creates an instance on mount and destroys it on unmount', () => {
    let captured;
    function Probe() {
      const [ref, otp] = ReactAdapter.useOtp({ length: 3, autoFocus: false, clipboardDetection: false });
      captured = otp;
      return React.createElement('div', { ref });
    }
    const { root } = render(React.createElement(Probe));
    const inst = captured.current;
    assert.equal(inst.inputs.length, 3);
    act(() => root.unmount());
    assert.equal(inst._destroyed, true);
    assert.equal(captured.current, null);
  });
});

describe('otp-input-kit/vue', () => {
  const { OtpInput } = VueAdapter;

  function mountVue(setup) {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const app = createApp({ setup });
    app.mount(host);
    return { host, app };
  }

  test('renders, emits change/complete and supports v-model', async () => {
    const code = ref('');
    const completes = [];
    const { host, app } = mountVue(() => () =>
      h(OtpInput, {
        length: 4, autoFocus: false, clipboardDetection: false,
        modelValue: code.value,
        'onUpdate:modelValue': (v) => { code.value = v; },
        onComplete: (v) => completes.push(v),
      })
    );
    await nextTick();
    const inputs = () => [...host.querySelectorAll('input.otp-input')];
    assert.equal(inputs().length, 4);

    '2468'.split('').forEach((ch, i) => typeInto(host, i, ch));
    await nextTick();
    assert.equal(code.value, '2468');
    assert.deepEqual(completes, ['2468']);

    code.value = '13';
    await nextTick();
    assert.equal(inputs().map((i) => i.value).join(''), '13');
    app.unmount();
  });

  test('exposes the imperative API through a template ref', async () => {
    const otp = ref(null);
    const { app } = mountVue(() => () => h(OtpInput, { ref: otp, length: 4, autoFocus: false, clipboardDetection: false }));
    await nextTick();
    otp.value.setValue('7777');
    assert.equal(otp.value.getValue(), '7777');
    app.unmount();
  });

  test('rebuilds on structural prop changes and destroys on unmount', async () => {
    const length = ref(4);
    const otp = ref(null);
    const { host, app } = mountVue(() => () => h(OtpInput, { ref: otp, length: length.value, autoFocus: false, clipboardDetection: false }));
    await nextTick();
    const first = otp.value.getInstance();
    length.value = 6;
    await nextTick();
    await flush();
    assert.equal(first._destroyed, true);
    assert.equal(host.querySelectorAll('input.otp-input').length, 6);
    const second = otp.value.getInstance();
    app.unmount();
    assert.equal(second._destroyed, true);
  });
});
