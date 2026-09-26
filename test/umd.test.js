import './setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const umdSource = readFileSync(join(root, 'dist/otp-input.umd.js'), 'utf8');

/**
 * Evaluate the UMD bundle as a browser script. Node's `module`/`exports` would
 * otherwise make the UMD wrapper take the CommonJS branch and skip `window`.
 */
function loadUmdAsBrowserScript() {
  const saved = {
    module: Object.getOwnPropertyDescriptor(globalThis, 'module'),
    exports: Object.getOwnPropertyDescriptor(globalThis, 'exports'),
    define: Object.getOwnPropertyDescriptor(globalThis, 'define'),
  };
  try {
    Reflect.deleteProperty(globalThis, 'module');
    Reflect.deleteProperty(globalThis, 'exports');
    Reflect.deleteProperty(globalThis, 'define');
    const run = new Function(
      'window',
      'globalThis',
      'self',
      `${umdSource}\n//# sourceURL=otp-input.umd.js`,
    );
    run(window, window, window);
  } finally {
    for (const [key, desc] of Object.entries(saved)) {
      if (desc) Object.defineProperty(globalThis, key, desc);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

describe('UMD browser globals', () => {
  beforeEach(() => {
    delete window.OTPInput;
    delete window.OTPInputLib;
  });

  test('dist/otp-input.umd.js exposes OTPInputLib and OTPInput.create', () => {
    loadUmdAsBrowserScript();

    assert.equal(typeof window.OTPInputLib, 'object');
    assert.equal(typeof window.OTPInputLib.OTPInput, 'function');
    assert.equal(typeof window.OTPInputLib.OTPInput.create, 'function');

    assert.equal(typeof window.OTPInput, 'function');
    assert.equal(window.OTPInput, window.OTPInputLib.default);
    assert.equal(typeof window.OTPInput.create, 'function');
  });

  test('an existing window.OTPInput is not overwritten', () => {
    const sentinel = { create() { return 'kept'; } };
    window.OTPInput = sentinel;
    loadUmdAsBrowserScript();

    assert.equal(window.OTPInput, sentinel);
    assert.equal(typeof window.OTPInputLib.OTPInput.create, 'function');
  });
});
