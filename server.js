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

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

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

app.use('/api/config', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'BookMySofa API is running.' });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

//  serve index.html 
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error.',
  });
});

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