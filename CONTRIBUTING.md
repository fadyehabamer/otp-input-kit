# Contributing to otp-input-kit

Thanks for helping out. Bug reports, fixes, tests, docs and new locales are all
welcome, and so are new features that keep the component dependency-free.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
Please report security problems privately as described in
[SECURITY.md](SECURITY.md), not in a public issue. That file also explains the
component's security model (it is a UI component, not an authentication
boundary), which is worth reading before proposing anything around lockout,
verification or masking.

## Setup

You need Node.js 20 or later (CI tests on 20 and 22) and npm.

```sh
git clone https://github.com/<your-username>/otp-input-kit.git
cd otp-input-kit
npm ci
```

## Everyday commands

```sh
npm test          # node:test + jsdom unit tests (test/*.test.js)
npm run build     # rollup -> dist/ (ESM, UMD, CJS, minified UMD, adapters)
npm run dev       # rollup in watch mode
npm run demo      # serve the repo on http://localhost:3000
```

CI runs `npm ci`, `npm test` and `npm run build` on Node 20 and 22. There is no
linter; follow the style of the surrounding code (two-space indentation,
single quotes, semicolons, ES modules).

To run one test file:

```sh
node --test test/web-component.test.js
```

## The demo pages

`npm run demo` serves the repository root. Open:

- <http://localhost:3000/demo/> for the English demo,
- <http://localhost:3000/demo/index.ar.html> for the Arabic (RTL) demo.

The demo pages import `../dist/otp-input.esm.js`, so run `npm run build` (or
keep `npm run dev` running in another terminal) to see changes to `src/`.

When you check a visual or interaction change, try it in LTR and RTL, with
`nativeNumerals` on, on a phone-sized viewport, with the keyboard only, and
with `prefers-reduced-motion` turned on if anything animates. For SMS autofill
or Web OTP changes, a real Android or iOS device is the only reliable test;
say in the PR what you tested on.

## Where things live

| Path | What it is |
| --- | --- |
| `src/core/OTPInput.js` | The component. The other `src/core/*Manager.js` files handle a11y, clipboard, undo history, timer, toasts and validation. |
| `src/web-component/OTPInputElement.js` | The `<otp-input>` custom element (form-associated). |
| `src/adapters/` | React, Vue and Svelte wrappers (built to `dist/`), and the Angular directive (shipped as TypeScript source). |
| `src/i18n/` | Locales, RTL handling and native numeral rendering. |
| `src/styles/otp-input.css` | Styles and themes. The build inlines them into the JS. |
| `types/*.d.ts` | Hand-written type declarations for the core and each adapter. |
| `test/` | `node:test` suites; `setup.js` creates the jsdom environment. |
| `demo/` | The demo pages. |
| `dist/` | Build output. **Committed** (see below). |

## Things that are easy to miss

- **`dist/` is committed** so the CDN links work straight from the repo. When
  you change anything under `src/`, run `npm run build` and commit the
  regenerated `dist/` files. Put them in their own `build:` commit at the end
  of your branch (for example `build: regenerate dist`), which keeps review of
  the source changes readable.
- **Types are written by hand.** A new option, method, event or prop needs a
  matching change in `types/index.d.ts` and, for adapters, in
  `types/react.d.ts`, `types/vue.d.ts` or `types/svelte.d.ts`.
- **Every wrapper should stay in step.** An option that only works in one
  wrapper is a bug. If you add an event, check the React, Vue and Svelte
  adapters, the Angular directive and the `<otp-input>` attributes and events.
- **README.** New options, attributes, events and methods go in the README
  tables.

## Tests

Behaviour changes need tests. The suites run the real component in jsdom:

- `otp-input.test.js` for the core,
- `web-component.test.js` and `form.test.js` for `<otp-input>` and form
  association,
- `adapters.test.js` for the React and Vue wrappers,
- `web-otp.test.js` for the Web OTP flow,
- `utils.test.js` for helpers.

jsdom doesn't do layout or real focus management in every case, so if
something can only be checked in a browser, describe how you checked it in the
PR.

## Branches and commits

Work on a branch in your fork named after the change: `feat/<topic>`,
`fix/<topic>`, `docs/<topic>`, `test/<topic>` or `chore/<topic>`.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/),
with a scope where it helps, like the existing history:

```
feat(web-otp): add webOtp option and make the first cell a full-code autofill target
fix(resend): enable the resend button when no timer is configured
fix(a11y): don't read masked codes aloud on completion
test: cover the <otp-input> web component
docs: document webOtp, SMS autofill caveats, form validity and adapter bindings
build: regenerate dist
```

Useful scopes: `core`, `web-component`, `adapters`, `a11y`, `paste`, `timer`,
`keypad`, `web-otp`, `i18n`, `security`.

## Pull requests

Open the PR against `main` and fill in the template. A PR is ready when:

- it does one thing,
- `npm test` and `npm run build` pass, and the rebuilt `dist/` is committed,
- new behaviour has tests,
- types, README and every affected wrapper are updated,
- `CHANGELOG.md` has an entry under an `## [Unreleased]` heading for anything
  users will notice (add the heading if it isn't there),
- visual changes include before/after screenshots, ideally in LTR and RTL.

Please don't bump the version in `package.json`; releases are done by the
maintainer.

## Reporting bugs

Use the **Bug report** form. The most useful details are the options you
passed, which wrapper you use (vanilla, `<otp-input>`, React, Vue, Svelte,
Angular), the browser and OS, and a minimal reproduction (a CodePen,
StackBlitz or a short HTML file).

Issues labelled
[`good first issue`](https://github.com/fadyehabamer/otp-input-kit/labels/good%20first%20issue)
are a good place to start. Leave a comment before you pick one up.

By contributing you agree that your work is licensed under the project's
[MIT License](LICENSE).
