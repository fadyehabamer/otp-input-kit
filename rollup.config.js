import { readFileSync } from 'fs';
import { createFilter } from '@rollup/pluginutils';
import terser from '@rollup/plugin-terser';

// ── Simple CSS-inlining plugin (no extra deps) ────────────────────────────
function inlineCss() {
  const filter = createFilter(['**/*.css']);
  return {
    name: 'inline-css',
    transform(code, id) {
      if (!filter(id)) return null;
      // Lightweight, safe CSS minification: drop comments, indentation and
      // blank lines, but KEEP newlines as token separators so adjacent
      // declarations never merge (e.g. "color:red\nbackground:blue").
      const min = code
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join('\n');
      // Inject CSS as a side-effectful module that appends a <style> tag once
      const escaped = JSON.stringify(min);
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
 * otp-input-kit v1.0.3
 * A highly customizable, framework-agnostic OTP input component
 * (c) ${new Date().getFullYear()} — MIT License
 */`;

const input = 'src/index.js';

// ── Framework adapters (core is bundled in; framework is left external) ──────
const adapters = [
  { name: 'react',  external: ['react', 'react-dom'] },
  { name: 'vue',    external: ['vue'] },
  { name: 'svelte', external: [] },
];

const adapterConfigs = adapters.flatMap((a) => [
  {
    input: `src/adapters/${a.name}.js`,
    external: a.external,
    plugins: [inlineCss()],
    output: { file: `dist/${a.name}.esm.js`, format: 'es', banner, sourcemap: true },
  },
  {
    input: `src/adapters/${a.name}.js`,
    external: a.external,
    plugins: [inlineCss()],
    output: { file: `dist/${a.name}.cjs`, format: 'cjs', exports: 'named', banner, sourcemap: true },
  },
]);

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
    plugins: [inlineCss(), terser()],
    output: {
      file: 'dist/otp-input.umd.min.js',
      format: 'umd',
      name: 'OTPInputLib',
      exports: 'named',
      banner,
      sourcemap: false,
    },
  },

  // ── Framework adapters: otp-input-kit/react · /vue · /svelte ─────────────
  ...adapterConfigs,
];
