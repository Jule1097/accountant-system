const esbuild = require('esbuild');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');

esbuild.build({
  entryPoints: {
    'parser-batch-job': path.join(rootDir, 'src/workers/parser-batch-job.ts'),
    'persistence-batch-job': path.join(rootDir, 'src/workers/persistence-batch-job.ts'),
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  tsconfig: path.join(rootDir, 'tsconfig.json'),
  outdir: path.join(rootDir, 'dist'),
  outExtension: { '.js': '.mjs' },
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
  console.log('Batch jobs bundled successfully to dist/');
}).catch((err) => {
  console.error('Batch job bundling failed:', err);
  process.exit(1);
});
