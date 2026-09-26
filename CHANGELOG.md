# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- UMD builds also expose `window.OTPInput` (aliasing the default export) so the
  README CDN/`<script>` examples work. `window.OTPInputLib` is unchanged for
  existing users; an already-defined `OTPInput` global is not overwritten.

## [1.2.0]

### Added

- `webOtp` option (and `web-otp` attribute) — auto-fill from an incoming SMS via
  the Web OTP API with an `AbortController`. Feature-detected: a no-op that
  emits `sms-unsupported` where the API or a secure context is missing. The
  request is aborted once the code is complete or the instance is destroyed,
  and re-armed after a resend. `smsAutoRead` remains as an alias.
- React `<OtpInput>` accepts a controlled `value` prop.
- Vue `<OtpInput>` supports `v-model`, a `webOtp` prop and an `sms-read` emit.
- `<otp-input>`: `name`, `required` and `labels` accessors; `required` and
  `validation-message` re-validate without rebuilding the inputs.
- Tests for the React and Vue wrappers, Web OTP, and form association.

### Changed

- The first cell (`autocomplete="one-time-code"`) accepts the full code length,
  so iOS/Android SMS suggestions are no longer truncated to one digit; a single
  key typed into a filled first cell still replaces it.
- `inputmode` is `numeric` for numeric codes and `text` for every other type.
- `sms-*` status events fire a microtask after construction, so listeners
  attached right after `create()` receive them.
- `<otp-input required>` reports `tooShort` (instead of `valueMissing`) while
  partially filled, and validates against the rendered length.

### Fixed

- The Resend button never became enabled when `resend` was on and `timer` off.
  It now starts enabled, and its cooldown no longer expires the code.
- `revealLabel` / `hideLabel` were inserted as HTML; they are now set as text.
- `<otp-input>` stays disabled inside a disabled `<fieldset>` across attribute
  rebuilds, applies a `value` set before it is connected, and syncs the form
  value on state restore.
- Unreleased fixes from the 2026-09 maintenance pass: paste handling of spaced,
  dashed and native-numeral codes, `RegExp` patterns surviving option merging,
  completion emitted exactly once, masked codes not announced, timer urgency
  reset on restart, keypad ignored while disabled, and `ElementInternals` used
  only when the form APIs exist.

## Earlier releases

See the [git history](https://github.com/fadyehabamer/otp-input-kit/commits/main).
