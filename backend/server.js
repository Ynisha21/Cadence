const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

(async () => {
  for (const key of ['mongoUri', 'jwtSecret']) {
    if (!env[key]) {
      console.error(`Missing required environment variable for "${key}". Copy .env.example to .env and fill it in.`);
      process.exit(1);
    }
  }
  await connectDB();
  app.listen(env.port, () => console.log(`API running on http://localhost:${env.port} (${env.nodeEnv})`));
})().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
