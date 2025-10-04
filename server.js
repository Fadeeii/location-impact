const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// NASA Small-Body Database API proxy
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running', port: PORT });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Test it: http://localhost:${PORT}/health`);
});