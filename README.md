# OTPInput.js

A highly customizable, framework-agnostic OTP input component with full RTL support, i18n, accessibility, countdown timer, toast notifications, and Web Component support — zero dependencies.

[![npm version](https://img.shields.io/npm/v/otp-input-kit.svg)](https://www.npmjs.com/package/otp-input-kit)
[![license](https://img.shields.io/npm/l/otp-input-kit.svg)](LICENSE)

---

## Features

- **Zero dependencies** — pure vanilla JS, ~30 KB minified
- **10 built-in themes** — default, underline, rounded, pill, ghost, filled, soft, neon, gradient, elevated
- **Full RTL & i18n** — 12+ RTL locales, 8 numeral systems (Arabic-Indic, Persian, Hindi, Bengali, Tamil, Thai…)
- **WCAG 2.1 AA accessible** — ARIA labels, live error regions, keyboard navigation, high-contrast & reduced-motion support
- **Countdown timer** with progress bar and expiry callback
- **Resend button** with configurable cooldown
- **Toast notifications** — 6 themes, 9 positions, auto-dismiss
- **Clipboard paste detection** with smart OTP extraction
- **Undo/Redo** (Ctrl+Z / Ctrl+Shift+Z)
- **Haptic feedback** (mobile vibration)
- **Web Component** `<otp-input>` — drop in anywhere
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
| `animation` | `object` | see below | Error animation config |
| `timer` | `object` | see below | Countdown timer config |
| `resend` | `object` | see below | Resend button config |
| `toast` | `object` | see below | Toast notification config |

### `animation`

```js
animation: {
  error: 'shake',   // 'shake' | 'highlight' | 'both' | false
  duration: 300,    // ms
}
```

### `timer`

```js
timer: {
  enabled: true,
  duration: 60,          // seconds
  showProgress: true,    // animated progress bar
  onExpire: () => {},    // callback when time runs out
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
otp.destroy()            // unmount and clean up DOM
otp.startTimer()         // start / restart countdown
otp.stopTimer()          // stop countdown
```

---

## Events (EventEmitter API)

```js
otp.on('complete', (value) => {});
otp.on('change',   (value) => {});
otp.on('error',    (errors) => {});
otp.on('focus',    ({ index }) => {});
otp.on('blur',     ({ index }) => {});
otp.on('expire',   () => {});
otp.on('resend',   () => {});

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
  toast-enabled
  toast-theme="glass"
  toast-position="top-right"
  label="Enter verification code"
></otp-input>
```

### Web Component Events

```js
const el = document.querySelector('otp-input');
el.addEventListener('otp-complete', (e) => console.log(e.detail));
el.addEventListener('otp-change',   (e) => console.log(e.detail));
el.addEventListener('otp-error',    (e) => console.log(e.detail));
el.addEventListener('otp-expire',   () => {});
el.addEventListener('otp-resend',   () => {});
```

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
