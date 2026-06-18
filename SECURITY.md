# Security Policy

## Supported versions

Security fixes are released for the latest published version on npm. Please
upgrade to the most recent `1.x` release before reporting an issue.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

Report privately using either:

- **GitHub Security Advisories** — open the repository's
  [Security tab](https://github.com/fadyehabamer/otp-input-kit/security/advisories/new)
  and click *"Report a vulnerability"* (preferred), or
- **Email** — [a.chwayekh.sparkit@gmail.com](mailto:a.chwayekh.sparkit@gmail.com)

Please include:

- a description of the issue and its impact,
- steps to reproduce (a minimal repro or PoC is ideal),
- affected version(s) and environment (browser / framework),
- any suggested remediation.

### What to expect

- **Acknowledgement** within 3 business days.
- An initial assessment and severity rating within 7 business days.
- A coordinated fix and release for confirmed issues, with credit to the
  reporter (unless you prefer to remain anonymous).

Please give us a reasonable window to ship a fix before any public disclosure.

## Security model — please read

`otp-input-kit` is a **client-side UI component**. It improves the *user
experience* of entering one-time passwords; it is **not** a security boundary
and cannot enforce authentication on its own.

In particular:

- **Always verify the OTP on your server.** Any value produced by this component
  (`getValue()`, the `complete`/`verified` events, the submitted form value) is
  attacker-controllable in the browser and must be validated server-side.
- **`lockout` is a UX deterrent, not a rate limiter.** It discourages casual
  retries but can be bypassed via refresh, devtools, or scripting. Enforce real
  attempt throttling and lockouts on the server.
- **`onVerify` runs in the browser.** Treat its result as advisory; the
  authoritative check must happen on the backend.
- **`secure` / `revealToggle` only mask the display.** The entered value still
  lives in the DOM; masking prevents shoulder-surfing, not local inspection.
- **`biometric` (WebAuthn) is a local presence/verification gesture.** Without a
  server-side WebAuthn ceremony (challenge issuance + assertion verification) it
  proves nothing to your backend; use it as an extra UX gate, not as proof of
  identity.
- **SMS auto-read (Web OTP API)** requires HTTPS and a correctly formatted SMS;
  the code it fills must still be verified server-side.

### Reporting non-issues

The following are **out of scope** because they reflect the documented model
above (not vulnerabilities in the library):

- Reading the entered OTP from the DOM or via the public API.
- Bypassing the client-side `lockout` cooldown.
- The fact that `onVerify`/validation can be skipped in the browser.

If you believe one of these enables a concrete attack beyond the documented
behavior, we still want to hear about it — please report it privately.
