// Vercel entrypoint — CJS wrapper that exports the Express app for serverless
// esbuild bundles src/server.ts as CJS to dist/server.cjs; the default export is the app
const bundle = require('./dist/server.cjs');
const app = bundle.default || bundle;
module.exports = app;
