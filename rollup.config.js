import { readFileSync } from 'fs';
import { createFilter } from '@rollup/pluginutils';

// ── Simple CSS-inlining plugin (no extra deps) ────────────────────────────
function inlineCss() {
  const filter = createFilter(['**/*.css']);
  return {
    name: 'inline-css',
    transform(code, id) {
      if (!filter(id)) return null;
      // Inject CSS as a side-effectful module that appends a <style> tag once
      const escaped = JSON.stringify(code);
      return {
        code: `
const __css = ${escaped};
if (typeof document !== 'undefined') {
  const __id = 'otp-input-styles';
  if (!document.getElementById(__id)) {
    const s = document.createElement('style');
    s.id = __id;
    s.textContent = __css;
    document.head.appendChild(s);
  }
}
export default __css;
`,
        map: { mappings: '' },
      };
    },
  };
}

const banner = `/*!
 * otp-input-kit v1.0.2
 * A highly customizable, framework-agnostic OTP input component
 * (c) ${new Date().getFullYear()} — MIT License
 */`;

const input = 'src/index.js';

/** @type {import('rollup').RollupOptions[]} */
export default [
  // ── ES Module (tree-shakeable) ──────────────────────────────────────────
  {
    input,
    plugins: [inlineCss()],
    output: {
      file: 'dist/otp-input.esm.js',
      format: 'es',
      banner,
      sourcemap: true,
    },
  },

  // ── UMD browser (for <script src="..."> CDN usage) ─────────────────────
  {
    input,
    plugins: [inlineCss()],
    output: {
      file: 'dist/otp-input.umd.js',
      format: 'umd',
      name: 'OTPInputLib',
      exports: 'named',
      banner,
      sourcemap: true,
    },
  },

  // ── CJS (Node.js require()) ─────────────────────────────────────────────
  {
    input,
    plugins: [inlineCss()],
    output: {
      file: 'dist/otp-input.umd.cjs',
      format: 'cjs',
      exports: 'named',
      banner,
      sourcemap: true,
    },
  },

  // ── Minified UMD ────────────────────────────────────────────────────────
  {
    input,
    plugins: [
      inlineCss(),
      // Inline minification via esbuild transform if available, else terser
      (() => {
        try {
          const { minify } = require('@rollup/plugin-terser');
          return minify();
        } catch {
          // terser optional — skip if not installed
          return null;
        }
      })(),
    ].filter(Boolean),
    output: {
      file: 'dist/otp-input.umd.min.js',
      format: 'umd',
      name: 'OTPInputLib',
      exports: 'named',
      banner,
      sourcemap: false,
    },
  },
];
