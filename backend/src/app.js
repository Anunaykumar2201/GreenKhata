const express = require('express');
const cors = require('cors');
const testRoutes = require('./routes/testRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api', testRoutes);
app.use("/api/aa", require("./routes/aaRoutes"));

// Root route for quick health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    project: 'GreenKhata API',
  });
});

module.exports = app;
