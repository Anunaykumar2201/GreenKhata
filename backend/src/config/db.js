const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri === 'your_mongodb_connection_string') {
    console.log('⚠️ MongoDB: MONGO_URI is not set or contains a placeholder in backend/.env.');
    console.log('ℹ️ Server will continue running without an active database connection.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('ℹ️ Server will continue running without an active database connection.');
  }
};

module.exports = connectDB;
