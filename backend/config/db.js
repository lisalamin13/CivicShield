const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not configured');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== 'production',
  });

  console.log('MongoDB connected');
};

module.exports = connectDB;
