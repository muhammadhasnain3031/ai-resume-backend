const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();

// 1. CORS & MANUAL HEADERS (Bullet-proof setup for Vercel)
app.use((req, res, next) => {
  // Aapka frontend link
  res.setHeader("Access-Control-Allow-Origin", "https://ai-resume-frontend-six.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Pre-flight requests handling
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// 2. ROUTES
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/resume', require('./routes/resume'));

// 3. HEALTH CHECK & TEST ROUTE
app.get('/', (req, res) => {
  res.json({ status: '✅ AI Resume Builder API is Running Live' });
});

// 4. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
  })
  .catch(err => {
    console.log('❌ MongoDB Connection Error:', err.message);
  });

// 5. SERVER LISTEN
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is active on port ${PORT}`);
});

// Vercel serverless functions ke liye ye laazmi hai
module.exports = app;