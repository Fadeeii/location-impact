const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for asteroid data
app.get('/api/asteroid/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const nasaUrl = `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${encodeURIComponent(identifier)}`;
    console.log(`Fetching: ${nasaUrl}`);
    const response = await fetch(nasaUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching from NASA:', error);
    res.status(500).json({ error: 'Failed to fetch asteroid data' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'Server running' });
});

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/asteroid/:identifier`);
});

module.exports = app;
