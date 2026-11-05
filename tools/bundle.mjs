// Bundles src/js + src/css into js/dist and css/rovard.css. The output is committed, so hosting needs no build step.
import { build, context } from 'esbuild';
import { rmSync } from 'node:fs';

const watch = process.argv.includes('--watch');
const js = {
  entryPoints: ['src/js/main.js'], outdir: 'js/dist', bundle: true, splitting: true, format: 'esm', minify: true,
  target: ['es2020'], chunkNames: 'c-[name]-[hash]', legalComments: 'none', logLevel: 'info',
};
const css = {
  entryPoints: { rovard: 'src/css/index.css' }, outdir: 'css', bundle: true, minify: true,
  external: ['fonts/*', '../img/*'], target: ['chrome100', 'safari15', 'firefox100'], logLevel: 'info',
};
if (watch) {
  for (const o of [js, css]) await (await context(o)).watch();
  console.log('watching src/ ...');
} else {
  rmSync('js/dist', { recursive: true, force: true });
  await build(js); await build(css);
}
