const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

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
  res.json({ status: 'Serverless function running on Vercel' });
});

// do NOT call app.listen() — export the app
module.exports = app;
