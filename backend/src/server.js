const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Initialize Database connection (Safe fallback if URI not set)
connectDB();

// Start Express Server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🌱 GreenKhata Backend Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🧪 Test Endpoint: http://localhost:${PORT}/api/test`);
  console.log(`========================================`);
});
