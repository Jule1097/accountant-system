/* eslint-disable @typescript-eslint/no-require-imports */
const esbuild = require('esbuild');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');

esbuild.build({
  entryPoints: [path.join(rootDir, 'src/workers/voucher-parser-worker.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  tsconfig: path.join(rootDir, 'tsconfig.json'),
  outfile: path.join(rootDir, 'dist/worker.mjs'),
  plugins: [
    {
      name: 'make-node-modules-external',
      setup(build) {
        build.onResolve({ filter: /.*/ }, args => {
          if (args.path.startsWith('.') || args.path.startsWith('/') || args.path.startsWith('src/')) {
            return null;
          }
          return { path: args.path, external: true };
        });
      }
    }
  ]
}).then(() => {
  console.log('Worker bundled successfully to dist/worker.mjs');
}).catch((err) => {
  console.error('Worker bundling failed:', err);
  process.exit(1);
});
