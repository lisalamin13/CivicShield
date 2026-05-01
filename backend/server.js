const dns = require('node:dns');

dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`CivicShield API listening on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start CivicShield API', error);
  process.exit(1);
});
