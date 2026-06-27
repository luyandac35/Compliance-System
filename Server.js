// server.js – CompliTrack SA (Supabase client‑side)
// This server only serves static files – all logic is handled by Supabase directly.

require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve all static files from the current directory
// (Adjust if your HTML files are inside a 'public' folder)
app.use(express.static(__dirname));

// Optional: API endpoint for health checks
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Catch‑all route: serve index.html for any unknown path
// This is useful if you want to support client‑side routing (e.g., /dashboard, /employees)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ CompliTrack SA server running at http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${__dirname}`);
});
