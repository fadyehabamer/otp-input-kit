# otp-input-kit
![otp-input-kit preview](image.png)

A highly customizable, framework-agnostic OTP input component with full RTL support, i18n, accessibility, countdown timer, toast notifications, and Web Component support — zero dependencies.

[![npm version](https://img.shields.io/npm/v/otp-input-kit.svg)](https://www.npmjs.com/package/otp-input-kit)
[![license](https://img.shields.io/npm/l/otp-input-kit.svg)](LICENSE)

---

## Features

- **Zero dependencies** — pure vanilla JS, ~17 KB gzipped (CSS inlined)
- **10 built-in themes** — default, underline, rounded, pill, ghost, filled, soft, neon, gradient, elevated
- **Full RTL & i18n** — 12+ RTL locales, 8 numeral systems (Arabic-Indic, Persian, Hindi, Bengali, Tamil, Thai…)
- **WCAG 2.1 AA accessible** — ARIA labels, live error regions, keyboard navigation, high-contrast & reduced-motion support
- **Countdown timer** with progress bar and expiry callback
- **Resend button** with configurable cooldown
- **Toast notifications** — 6 themes, 9 positions, auto-dismiss
- **Clipboard paste detection** with smart OTP extraction
- **Undo/Redo** (Ctrl+Z / Ctrl+Shift+Z)
- **Haptic feedback** (mobile vibration)
- **Async verification** — built-in loading spinner that awaits your server and resolves to a success or error state
- **Secure mode** — password masking with optional 👁 reveal toggle and brute-force attempt lockout
- **On-screen keypad** — optional built-in virtual number pad (mobile / kiosk / PIN), with shuffle-to-obscure
- **Success celebration** — success animation styles (pop / glow / bounce / flip) + optional 🎉 confetti burst
- **Web Component** `<otp-input>` — drop in anywhere
- **Framework adapters** — first-class React, Vue 3, Svelte, and Angular wrappers
- **TypeScript** — ships full type declarations for the core, Web Component, and every adapter
- **Form-associated** — `<otp-input name="otp">` submits, validates, and resets natively inside a `<form>`
- **ESM + UMD + CJS** builds for every environment

---

## Installation

### npm

```bash
npm install otp-input-kit
```

### CDN (no build step)

```html
<script src="https://unpkg.com/otp-input-kit/dist/otp-input.umd.min.js"></script>
```

---

## Quick Start

### ES Module (bundler / Vite / Webpack)

```js
import OTPInput from 'otp-input-kit';

const otp = OTPInput.create('#container', {
  length: 6,
  onComplete: (value) => console.log('OTP:', value),
});
```

### UMD via `<script>` tag

```html
<div id="container"></div>
<script src="https://unpkg.com/otp-input-kit/dist/otp-input.umd.min.js"></script>
<script>
  OTPInput.create('#container', {
    length: 6,
    onComplete: (value) => verifyOTP(value),
  });
</script>
```

### Web Component

```html
<script type="module">
  import 'otp-input-kit';
</script>

<otp-input length="6" theme="rounded" direction="rtl" locale="ar" native-numerals></otp-input>
```

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `length` | `number` | `6` | Number of OTP digits |
| `type` | `'numeric' \| 'alpha' \| 'alphanumeric' \| 'hex' \| 'custom'` | `'numeric'` | Allowed character type |
| `pattern` | `RegExp` | `null` | Custom pattern (requires `type: 'custom'`) |
| `secure` | `boolean` | `false` | Mask input like a password field |
| `revealToggle` | `boolean` | `false` | Add an 👁 button to peek at masked digits (secure mode) |
| `lockout` | `object` | see below | Lock input after too many failed attempts |
| `autoFocus` | `boolean` | `true` | Focus first input on init |
| `autoSubmit` | `boolean` | `false` | Submit parent `<form>` on completion |
| `selectOnFocus` | `boolean` | `true` | Select digit text on focus |
| `direction` | `'ltr' \| 'rtl' \| 'auto'` | `'auto'` | Input reading direction |
| `locale` | `string` | `null` | BCP 47 locale tag (e.g. `'ar'`, `'fa'`, `'he'`) |
| `nativeNumerals` | `boolean` | `false` | Render locale-specific digit glyphs |
| `placeholder` | `string` | `'·'` | Empty cell placeholder character |
| `clipboardDetection` | `boolean` | `true` | Detect and auto-fill pasted OTPs |
| `haptic` | `boolean` | `true` | Vibration feedback on mobile |
| `theme` | `string` | `'default'` | Input theme (see [Themes](#themes)) |
| `validate` | `Function` | `null` | `(value) => errorString \| null` |
| `animation` | `object` | see below | Error/success animation + confetti config |
| `keypad` | `boolean \| object` | `false` | On-screen virtual number pad (see below) |
| `timer` | `object` | see below | Countdown timer config |
| `resend` | `object` | see below | Resend button config |
| `toast` | `object` | see below | Toast notification config |
| `onVerify` | `Function` | `null` | `async (value) => result` — drives the loading→success/error flow (see [Async Verification](#async-verification)) |
| `loading` | `object` | see below | Loading/verifying state config |

### `animation`

```js
animation: {
  // 'shake' | 'highlight' | 'both' | 'pulse' | 'buzz' | 'bounce' | 'glow' | 'wobble' | false
  error: 'shake',
  // true | false | 'pop' | 'glow' | 'bounce' | 'flip'
  success: true,
  confetti: false,  // 🎉 burst on success
  duration: 300,    // ms
}
```

All error styles animate **every** cell (errors normally fire when the code is
complete), respect `prefers-reduced-motion`, and trigger a haptic buzz on mobile.

### `keypad`

An optional on-screen number pad — great for mobile, kiosks, and PIN entry.

```js
keypad: {
  enabled: false,
  randomize: false,      // shuffle key order (anti shoulder-surfing for PINs)
  showClear: false,      // include a "clear all" key
  backspaceLabel: '⌫',
  clearLabel: 'Clear',
}
// shorthand: keypad: true
```

### `timer`

```js
timer: {
  enabled: true,
  duration: 60,          // seconds
  showProgress: true,    // animated progress bar
  style: 'bar',          // 'bar' | 'ring' (circular countdown)
  onExpire: () => {},    // callback when time runs out
}
```

### `sound`

Subtle Web Audio feedback (keypress / success / error) — no asset files, created
lazily on first key, off by default.

```js
sound: {
  enabled: false,
  volume: 0.2,           // 0..1
}
```

### `resend`

```js
resend: {
  enabled: true,
  cooldown: 60,                // seconds between resends
  label: 'Resend code',
  onResend: () => {},          // called when user clicks resend
}
```

### `toast`

```js
toast: {
  enabled: true,
  position: 'top-right',      // see positions below
  theme: 'default',           // see themes below
  duration: 3500,             // auto-dismiss delay in ms
  successMessage: 'Verified!',
  errorMessage: 'Invalid code',
}
```

### `loading`

```js
loading: {
  text: 'Verifying…',                   // a11y label shown while verifying
  successText: 'Verified',
  errorText: 'Verification failed',     // shown when onVerify rejects/returns false
  clearOnError: true,                   // wipe the inputs after a failed verify
  clearDelay: 900,                      // ms to keep the error visible before clearing
}
```

### `lockout`

```js
lockout: {
  enabled: false,
  maxAttempts: 3,        // failed tries before locking
  duration: 30,          // seconds the input stays locked
  message: 'Too many attempts. Try again in {seconds}s.', // {seconds} counts down
  onLock:   (secondsRemaining) => {},
  onUnlock: () => {},
}
```

A failed attempt is counted on a rejected `onVerify`, a completion-validation
failure, or a manual `setError()`. The counter resets on success or unlock.

---

## Callbacks

```js
OTPInput.create('#container', {
  onChange:   (value) => {},              // fires on every keystroke
  onComplete: (value) => {},             // fires when all digits filled
  onError:    (errors) => {},            // fires on validation failure
  onFocus:    ({ index, input }) => {},  // fires when a cell is focused
  onBlur:     ({ index, input }) => {},  // fires when a cell loses focus
  onExpire:   () => {},                  // fires when timer expires
  onResend:   () => {},                  // fires when resend is clicked
  onVerified: (value) => {},             // fires when async verify succeeds
  onFailed:   (message) => {},           // fires when async verify fails
});
```

---

## Methods

```js
const otp = OTPInput.create('#container', options);

otp.getValue()           // → string of current digits
otp.setValue('123456')   // fill all cells programmatically
otp.clear()              // clear all cells
otp.focus()              // focus first empty cell
otp.setError('msg')      // show error state with message
otp.clearError()         // remove error state
otp.setLoading(true)     // toggle the verifying spinner + disable inputs
otp.setSuccess('msg')    // manually enter the verified/success state
otp.toggleReveal()       // peek at masked digits (secure mode); pass a boolean to force
otp.lock()               // lock the input for the cooldown
otp.unlock()             // release a lock early and reset the attempt counter
otp.isLocked()           // → boolean
otp.destroy()            // unmount and clean up DOM
otp.startTimer()         // start / restart countdown
otp.stopTimer()          // stop countdown
```

---

## Events (EventEmitter API)

```js
otp.on('complete',      (value) => {});
otp.on('change',        (value) => {});
otp.on('error',         (errors) => {});
otp.on('focus',         ({ index }) => {});
otp.on('blur',          ({ index }) => {});
otp.on('expire',        () => {});
otp.on('resend',        () => {});
otp.on('verify-start',  (value) => {});   // async verification began
otp.on('verified',      (value) => {});   // async verification succeeded
otp.on('verify-failed', (message) => {}); // async verification failed
otp.on('sms-read',      (code) => {});    // Web OTP API auto-filled from SMS
otp.on('sms-unsupported', (reason) => {}); // 'no-api' | 'insecure-context'
otp.on('attempt', ({ attempts, max }) => {}); // a failed attempt was counted
otp.on('lock',    (secondsRemaining) => {});  // input locked out
otp.on('unlock',  () => {});                   // lock released

otp.off('complete', handler);
otp.once('complete', handler);
```

---

## Web Component Attributes

```html
<otp-input
  length="6"
  type="numeric"
  direction="rtl"
  locale="ar"
  native-numerals
  secure
  auto-focus
  auto-submit
  haptic
  placeholder="·"
  theme="rounded"
  timer-duration="60"
  resend-enabled
  resend-cooldown="60"
  clipboard-detection
  reveal-toggle
  lockout-attempts="3"
  lockout-duration="30"
  keypad
  keypad-randomize
  confetti
  success-animation="bounce"
  toast-enabled
  toast-theme="glass"
  toast-position="top-right"
  label="Enter verification code"
></otp-input>
```

### Web Component Events

```js
const el = document.querySelector('otp-input');
el.addEventListener('otp-complete',     (e) => console.log(e.detail));
el.addEventListener('otp-change',       (e) => console.log(e.detail));
el.addEventListener('otp-error',        (e) => console.log(e.detail));
el.addEventListener('otp-expire',       () => {});
el.addEventListener('otp-resend',       () => {});
el.addEventListener('otp-verify-start', (e) => {});
el.addEventListener('otp-verified',     (e) => console.log(e.detail));
el.addEventListener('otp-failed',       (e) => console.log(e.detail));
el.addEventListener('otp-lock',         (e) => console.log(e.detail));
el.addEventListener('otp-unlock',       () => {});
el.addEventListener('otp-attempt',      (e) => console.log(e.detail));
```

Because functions can't be HTML attributes, attach `onVerify` as a property:

```js
el.onVerify = async (code) => (await fetch(`/verify/${code}`)).ok;
```

### Form integration

`<otp-input>` is a **form-associated** custom element, so it behaves like a
native control inside a `<form>`:

```html
<form id="login">
  <otp-input name="otp" length="6" required></otp-input>
  <button type="submit">Verify</button>
</form>

<script type="module">
  document.getElementById('login').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    console.log(data.get('otp')); // → the entered code
  });
</script>
```

- The value is submitted under the element's `name`.
- `required` makes the form invalid until the code is complete (`:invalid`,
  `checkValidity()`, `reportValidity()` all work).
- Form **reset** clears it; browser autofill **restore** repopulates it.

---

## Framework Adapters

The core is framework-agnostic, but first-class wrappers ship in the box.

### React

```jsx
import { OtpInput } from 'otp-input-kit/react';

function Login() {
  const ref = useRef(null);
  return (
    <OtpInput
      ref={ref}
      length={6}
      theme="rounded"
      onVerify={async (code) => (await api.verify(code)).ok}
      onVerified={() => navigate('/home')}
      onFailed={(msg) => toast.error(msg)}
    />
  );
}

// ref exposes: getValue, setValue, clear, focus, setError,
// setLoading, setSuccess, setTheme, resetTimer, getInstance
```

There's also a lightweight hook:

```jsx
import { useOtp } from 'otp-input-kit/react';

const [ref, otp] = useOtp({ length: 6, onComplete: console.log });
return <div ref={ref} />;   // otp.current is the OTPInput instance
```

### Vue 3

```vue
<script setup>
import { ref } from 'vue';
import { OtpInput } from 'otp-input-kit/vue';

const otp = ref(null);
const verify = async (code) => (await api.verify(code)).ok;
</script>

<template>
  <OtpInput
    ref="otp"
    :length="6"
    theme="pill"
    :on-verify="verify"
    @complete="onComplete"
    @verified="goHome"
    @failed="showError"
  />
</template>
```

### Svelte

```svelte
<script>
  import { otp } from 'otp-input-kit/svelte';
  const options = {
    length: 6,
    onVerify: async (code) => (await fetch(`/verify/${code}`)).ok,
  };
</script>

<div
  use:otp={options}
  on:complete={(e) => console.log(e.detail)}
  on:verified={goHome}
  on:failed={(e) => toast(e.detail)}
/>
```

### Angular

A standalone directive ships as TypeScript source (Angular always compiles TS):

```ts
import { Component } from '@angular/core';
import { OtpInputDirective } from 'otp-input-kit/angular';

@Component({
  standalone: true,
  imports: [OtpInputDirective],
  template: `
    <div otpInput
         [length]="6"
         theme="rounded"
         [onVerify]="verify"
         (verified)="goHome()"
         (failed)="showError($event)"
         #otp="otpInput"></div>
  `,
})
export class LoginComponent {
  verify = async (code: string) => (await this.api.verify(code)).ok;
}
```

Prefer zero setup? The `<otp-input>` Web Component works in Angular out of the
box — just add `CUSTOM_ELEMENTS_SCHEMA` to your component/module.

> `react`, `vue`, and `@angular/core` are optional peer dependencies — install
> whichever you use. The Svelte adapter is a plain action with no dependency.

---

## Themes

Pass via the `theme` option or the `theme` attribute on `<otp-input>`.

| Value | Preview description |
|-------|-------------------|
| `default` | Bordered boxes |
| `underline` | Bottom border only |
| `rounded` | Softly rounded corners |
| `pill` | Fully rounded pill shape |
| `ghost` | Transparent background |
| `filled` | Solid fill background |
| `soft` | Pastel/muted fill |
| `neon` | Glowing accent border |
| `gradient` | Gradient border |
| `elevated` | Drop-shadow depth |

### CSS Custom Properties

```css
#my-container {
  --otp-input-width:    52px;
  --otp-input-height:   60px;
  --otp-font-size:      1.5rem;
  --otp-gap:            10px;
  --otp-radius:         10px;
  --otp-border-color:   #e2e8f0;
  --otp-active-color:   #3b82f6;
  --otp-error-color:    #ef4444;
  --otp-success-color:  #22c55e;
  --otp-bg:             #ffffff;
  --otp-text:           #0f172a;
}
```

---

## RTL & Locale Examples

```js
// Arabic — right-to-left with Eastern Arabic numerals
OTPInput.create('#ar', {
  length: 6, direction: 'rtl',
  locale: 'ar', nativeNumerals: true,
});

// Persian / Farsi
OTPInput.create('#fa', {
  length: 6, direction: 'rtl',
  locale: 'fa', nativeNumerals: true,
});

// Hebrew — RTL, Western numerals
OTPInput.create('#he', {
  length: 6, direction: 'rtl', locale: 'he',
});
```

Supported numeral systems: `ar` (Arabic-Indic ٠١٢٣٤٥٦٧٨٩), `fa` (Persian ۰۱۲۳۴۵۶۷۸۹), `hi` (Hindi ०१२३४५६७८९), `bn` (Bengali ০১২৩৪৫৬৭৮৯), `ta` (Tamil ௦௧௨௩௪௫௬௭௮௯), `th` (Thai ๐๑๒๓๔๕๖๗๘๙).

---

## Validation

```js
OTPInput.create('#container', {
  validate: (value) => {
    if (value === '000000') return 'This code is not allowed';
    if (!/^\d+$/.test(value)) return 'Numeric only';
    return null; // valid
  },
  onError: (errors) => console.error(errors),
});
```

---

## Async Verification

Pass an `onVerify` function and the component takes over the full verify lifecycle:
when the code completes it shows a **loading spinner** (and disables the inputs),
awaits your function, then resolves to a **success** or **error** state automatically.

```js
OTPInput.create('#container', {
  length: 6,
  onVerify: async (code) => {
    const res = await fetch('/api/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return res.ok;                 // see "Return values" below
  },
  onVerified: (code) => location.assign('/dashboard'),
  onFailed:   (msg)  => console.warn('Rejected:', msg),
});
```

### Return values

`onVerify` may return (or resolve to) any of:

| Return | Result |
|--------|--------|
| `true` / `undefined` | ✅ success — `verified` event |
| `false` | ❌ failure with the default message |
| `'Some message'` | ❌ failure showing that message |
| `{ ok: true }` | ✅ success |
| `{ ok: false, message }` | ❌ failure with a custom message |
| *throws* | ❌ failure using the thrown error's message |

On failure the inputs shake, show the error state, and (by default) clear after
`loading.clearDelay` ms so the user can retry. Tune via the [`loading`](#loading) option.

### Manual control

Don't want the automatic flow? Drive it yourself:

```js
const otp = OTPInput.create('#container', {
  onComplete: async (code) => {
    otp.setLoading(true);
    try {
      await api.verify(code);
      otp.setSuccess('Welcome back!');
    } catch (e) {
      otp.setError('That code is incorrect');
    }
  },
});
```

---

## Secure Mode & Lockout

```js
OTPInput.create('#container', {
  length: 4,
  secure: true,         // mask digits like a password
  revealToggle: true,   // adds an 👁 button to peek
  onVerify: (code) => code === '4242',
  lockout: {
    enabled: true,
    maxAttempts: 3,     // after 3 wrong codes…
    duration: 30,       // …lock for 30s with a live countdown
    onLock:   () => analytics.track('otp_locked'),
    onUnlock: () => {},
  },
});

// Programmatic control
otp.toggleReveal(true); // force-show the digits
otp.lock();             // lock immediately
otp.unlock();           // release early
```

---

## Timer + Resend

```js
OTPInput.create('#container', {
  length: 6,
  timer: {
    enabled: true,
    duration: 60,
    showProgress: true,
    onExpire: () => console.log('Code expired'),
  },
  resend: {
    enabled: true,
    cooldown: 60,
    label: 'Resend code',
    onResend: () => sendNewCode(),
  },
});
```

---

## Package Formats

| Format | File | Use case |
|--------|------|----------|
| ESM | `dist/otp-input.esm.js` | Vite, Webpack, Rollup |
| UMD | `dist/otp-input.umd.js` | `<script>` tag |
| CJS | `dist/otp-input.umd.cjs` | Node.js `require()` |
| Minified UMD | `dist/otp-input.umd.min.js` | CDN / production |

---

## Browser Support

Chrome 80+, Firefox 75+, Safari 14+, Edge 80+. No IE11 support.

---

## License

MIT © Fady Ehab
