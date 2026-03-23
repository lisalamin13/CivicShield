const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    // Check if the URI exists at all
    if (!uri) {
      console.error("Error: MONGO_URI is undefined. Check your .env file placement.");
      process.exit(1);
    }

    console.log("Attempting to connect to MongoDB Atlas...");
    
    // Connect to MongoDB
    const conn = await mongoose.connect(uri);
    
    console.log(`CivicShield Database Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Failed: ${error.message}`);
    
    if (error.message.includes('auth')) {
      console.log("Suggestion: Your username or password in .env is incorrect.");
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;