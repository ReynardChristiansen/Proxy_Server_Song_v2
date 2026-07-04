const app = require('./src/app');
const config = require('./src/config');

// On Vercel (@vercel/node) the exported app is used as the handler;
// listen only when started directly (local dev / VPS).
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Listening on port ${config.port}`);
  });
}

module.exports = app;
