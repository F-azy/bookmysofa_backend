require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const initDb = require('./config/initDb');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Serve landing page from /public ─────────────────────────────────────────
// bookmysofa.shop and www.bookmysofa.shop hit port 80 → nginx → port 5000
// Express serves index.html for the root and any unmatched non-API routes
app.use(express.static(path.join(__dirname, 'public')));

// Explicit routes for Play Console URLs with anchor fallback
app.get('/privacy', (req, res) => {
  res.redirect('/#privacy');
});
app.get('/terms', (req, res) => {
  res.redirect('/#terms');
});
// ─────────────────────────────────────────────────────────────────────────────

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);

// WhatsApp config endpoint
app.use('/api/config', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'BookMySofa API is running.' });
});

// 404 — only for /api routes, everything else falls through to index.html
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Catch-all: serve index.html for any other GET (handles direct URL access)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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