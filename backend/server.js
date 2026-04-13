const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const orgRoutes = require('./routes/orgRoutes');
const authRoutes = require('./routes/authRoutes');
const grievanceRoutes = require('./routes/grievanceRoutes');
const policyRoutes = require('./routes/policyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const aiEthicsRoutes = require('./routes/aiEthicsRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json());

require('./models/Staff');
require('./models/Conversation');
require('./models/Report');
require('./models/superAdmin');

app.use('/api/v1/orgs', orgRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/grievances', grievanceRoutes);
app.use('/api/v1/policies', policyRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/ethics', aiEthicsRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('CivicShield API is running securely...');
});

app.use((req, res) => {
    console.log(`Received ${req.method} request for: ${req.originalUrl}`);
    res.status(404).send(`Route ${req.originalUrl} not found on this server.`);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`CivicShield Server is now running on port ${PORT}`);
});
