// Bundles src/ into js/oa/ and css/oa.css. Netlify has no build step, so the output is committed.
import { rmSync } from 'node:fs';
import { build } from 'esbuild';

// Old hashed chunks would otherwise pile up in the commit.
rmSync('js/oa', { recursive: true, force: true });

await build({
  entryPoints: { site: 'src/js/site.js', still: 'src/core/still.js' },
  outdir: 'js/oa',
  bundle: true,
  splitting: true,
  format: 'esm',
  minify: true,
  target: ['es2020'],
  chunkNames: 'c-[hash]',
  legalComments: 'none',
  logLevel: 'info',
});

await build({
  entryPoints: { oa: 'src/css/index.css' },
  outdir: 'css',
  bundle: true,
  minify: true,
  external: ['fonts/*'],
  target: ['chrome100', 'safari15', 'firefox100'],
  logLevel: 'info',
});
