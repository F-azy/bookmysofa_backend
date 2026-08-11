require('dotenv').config();

const express = require('express');
const cors = require('cors');
const initDb = require('./config/initDb');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(
  cors({
    origin: '*', // Restrict to your frontend domain in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);

// WhatsApp config endpoint (re-uses uploadRoutes router)
app.use('/api/config', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'BookMySofa API is running.' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error.',
  });
});

// Start server after DB init
const start = async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`BookMySofa server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();