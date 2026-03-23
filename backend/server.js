//1.Core DNS Fix for Node.js v20+ (Critical for MongoDB Atlas)
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); 
dns.setServers(['8.8.8.8', '1.1.1.1']); 

//2. Loading Environment Variables
require('dotenv').config();

// 3. Imported Dependencies
const express = require('express');
const cors = require('cors'); 
const helmet = require('helmet');
const connectDB = require('./config/db');
const orgRoutes = require('./routes/orgRoutes');
const authRoutes = require('./routes/authRoutes');
const grievanceRoutes = require('./routes/grievanceRoutes');
const auth = require('./routes/authRoutes');
const policyRoutes = require('./routes/policyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const app = express();

// 4. Initializing Database Connection
connectDB();

// 5. Security & Request Middleware
app.use(helmet()); 
app.use(cors());
app.use(express.json());

app.use('/api/v1/orgs', orgRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/grievances', grievanceRoutes);
app.use('/api/v1/policies', policyRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/reports', reportsRoutes);

// 6. This is Basic Route for Testing
app.get('/', (req, res) => { res.send('CivicShield API is running securely...'); });
app.use((req, res) => { console.log(`Received ${req.method} request for: ${req.originalUrl}`); res.status(404).send(`Route ${req.originalUrl} not found on this server.`); });

// 7. Dynamic Port Handling
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => { console.log(`CivicShield Server is now running on port ${PORT}`); });