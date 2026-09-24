// Module hooks for the adapter tests: the adapters import the stylesheet, which
// rollup inlines at build time — under node:test it becomes an empty module.
export async function load(url, context, nextLoad) {
  if (url.endsWith('.css')) {
    return { format: 'module', source: 'export default "";', shortCircuit: true };
  }
  return nextLoad(url, context);
}
