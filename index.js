const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();

// 1. CORS & MANUAL HEADERS (Zaroori for Vercel)
app.use((req, res, next) => {
  // Yahan apna frontend ka live URL baad mein daal dena
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// 2. ROUTES
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/resume', require('./routes/resume'));

// 3. HEALTH CHECK
app.get('/', (req, res) => res.json({ status: '✅ Resume Builder API Running' }));

// 4. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    // Vercel ke liye PORT 5000 specify karna zaroori nahi, wo khud handle karta hai
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`✅ Server on ${PORT}`));
  })
  .catch(err => console.log('❌ DB Error:', err.message));