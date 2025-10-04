const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Cache for NASA API responses
let cache = {
    neoData: null,
    lastFetch: null,
    cacheTimeout: 10 * 60 * 1000 // 10 minutes
};

// Root route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Proxy endpoint for NASA NEO API
app.get('/api/neo/feed', async (req, res) => {
    try {
        // Check cache
        const now = Date.now();
        if (cache.neoData && cache.lastFetch && (now - cache.lastFetch < cache.cacheTimeout)) {
            console.log('Returning cached NASA data');
            return res.json(cache.neoData);
        }

        // Calculate date range (today + 7 days)
        const startDate = req.query.start_date || new Date().toISOString().split('T')[0];
        const endDate = req.query.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        console.log(`Fetching NASA NEO data from ${startDate} to ${endDate}`);

        // Fetch from NASA API
        const response = await axios.get('https://api.nasa.gov/neo/rest/v1/feed', {
            params: {
                start_date: startDate,
                end_date: endDate,
                api_key: NASA_API_KEY
            },
            timeout: 10000
        });

        // Update cache
        cache.neoData = response.data;
        cache.lastFetch = now;

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching NASA data:', error.message);
        
        // Return fallback data if API fails
        res.status(200).json(getFallbackNEOData());
    }
});

// Get asteroid statistics
app.get('/api/neo/stats', async (req, res) => {
    try {
        const response = await axios.get('https://api.nasa.gov/neo/rest/v1/stats', {
            params: {
                api_key: NASA_API_KEY
            },
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching NEO stats:', error.message);
        res.status(200).json({
            near_earth_object_count: 34000,
            close_approach_count: 160,
            last_updated: new Date().toISOString()
        });
    }
});

// Get specific asteroid details
app.get('/api/neo/:id', async (req, res) => {
    try {
        const asteroidId = req.params.id;
        const response = await axios.get(`https://api.nasa.gov/neo/rest/v1/neo/${asteroidId}`, {
            params: {
                api_key: NASA_API_KEY
            },
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching asteroid details:', error.message);
        res.status(404).json({ error: 'Asteroid not found' });
    }
});

// Sentry API proxy (for potentially hazardous asteroids)
app.get('/api/sentry', async (req, res) => {
    try {
        const response = await axios.get('https://api.nasa.gov/neo/rest/v1/neo/sentry', {
            params: {
                api_key: NASA_API_KEY
            },
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching Sentry data:', error.message);
        res.status(200).json({ sentry_objects: [] });
    }
});

// Impact calculator endpoint
app.post('/api/calculate-impact', (req, res) => {
    try {
        const { diameter, velocity, angle, composition, latitude, longitude } = req.body;

        // Validate inputs
        if (!diameter || !velocity || !angle || !composition) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Densities in kg/m³
        const densities = {
            iron: 7800,
            stone: 3000,
            ice: 917
        };

        const density = densities[composition] || 3000;

        // Calculate impact effects
        const radius = diameter / 2;
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        const mass = volume * density;

        // Kinetic energy
        const velocityMs = velocity * 1000;
        const kineticEnergy = 0.5 * mass * Math.pow(velocityMs, 2);
        const energyMT = kineticEnergy / 4.184e15; // Convert to megatons TNT

        // Impact effects calculations
        const craterDiameter = Math.pow(energyMT, 0.3) * 1.8 * Math.sin(angle * Math.PI / 180);
        const craterDepth = craterDiameter / 5;
        const magnitude = 0.67 * Math.log10(energyMT) + 5.87;
        const devastationRadius = craterDiameter * 10;
        const fireballDiameter = diameter * 2.5;
        const thermalRadius = Math.pow(energyMT, 0.41) * 2.5;
        const shockwaveRange = devastationRadius * 3;
        const ejectaVolume = Math.pow(craterDiameter, 3);

        // Overpressure zones (psi)
        const overpressure20psi = Math.pow(energyMT, 0.33) * 0.28; // Severe damage
        const overpressure5psi = Math.pow(energyMT, 0.33) * 0.84;  // Moderate damage
        const overpressure1psi = Math.pow(energyMT, 0.33) * 2.2;   // Light damage

        res.json({
            input: {
                diameter,
                velocity,
                angle,
                composition,
                location: { latitude, longitude }
            },
            results: {
                energy_megatons: parseFloat(energyMT.toFixed(2)),
                crater_diameter_km: parseFloat(craterDiameter.toFixed(2)),
                crater_depth_km: parseFloat(craterDepth.toFixed(2)),
                earthquake_magnitude: parseFloat(magnitude.toFixed(1)),
                devastation_radius_km: parseFloat(devastationRadius.toFixed(1)),
                fireball_diameter_m: parseFloat(fireballDiameter.toFixed(0)),
                thermal_radiation_km: parseFloat(thermalRadius.toFixed(1)),
                shockwave_range_km: parseFloat(shockwaveRange.toFixed(1)),
                ejecta_volume_km3: parseFloat(ejectaVolume.toFixed(0)),
                overpressure_zones: {
                    severe_damage_km: parseFloat(overpressure20psi.toFixed(1)),
                    moderate_damage_km: parseFloat(overpressure5psi.toFixed(1)),
                    light_damage_km: parseFloat(overpressure1psi.toFixed(1))
                }
            },
            interpretation: getImpactInterpretation(energyMT, diameter)
        });
    } catch (error) {
        console.error('Error calculating impact:', error);
        res.status(500).json({ error: 'Impact calculation failed' });
    }
});

// Helper function to get impact interpretation
function getImpactInterpretation(energyMT, diameter) {
    if (energyMT < 1) {
        return 'Small impact - localized damage, similar to Chelyabinsk meteor (2013)';
    } else if (energyMT < 100) {
        return 'Medium impact - city-scale destruction, similar to Tunguska event (1908)';
    } else if (energyMT < 10000) {
        return 'Large impact - regional devastation, comparable to largest nuclear weapons';
    } else if (energyMT < 1000000) {
        return 'Major impact - continental-scale effects, climate disruption';
    } else {
        return 'Catastrophic impact - global mass extinction event, similar to Chicxulub (66 million years ago)';
    }
}

// Fallback NEO data if NASA API is unavailable
function getFallbackNEOData() {
    const today = new Date();
    const dates = [];
    const neoObjects = {};

    // Generate 7 days of sample data
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dates.push(dateStr);
        neoObjects[dateStr] = generateSampleNEOs(dateStr, 2 + Math.floor(Math.random() * 4));
    }

    return {
        links: {
            self: 'http://localhost:3000/api/neo/feed'
        },
        element_count: Object.values(neoObjects).flat().length,
        near_earth_objects: neoObjects
    };
}

function generateSampleNEOs(date, count) {
    const names = ['Apophis', 'Bennu', 'Eros', 'Itokawa', 'Ryugu', 'Didymos', 'Pallas'];
    const neos = [];

    for (let i = 0; i < count; i++) {
        const id = Math.floor(Math.random() * 1000000) + 2000000;
        const size = Math.floor(Math.random() * 800) + 50;
        const distance = Math.floor(Math.random() * 50000000) + 1000000;
        
        neos.push({
            links: {
                self: `https://api.nasa.gov/neo/rest/v1/neo/${id}`
            },
            id: id.toString(),
            neo_reference_id: id.toString(),
            name: `(${2000 + Math.floor(Math.random() * 25)}) ${names[Math.floor(Math.random() * names.length)]}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
            nasa_jpl_url: `http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=${id}`,
            absolute_magnitude_h: (Math.random() * 10 + 15).toFixed(2),
            estimated_diameter: {
                kilometers: {
                    estimated_diameter_min: size / 1000 * 0.8,
                    estimated_diameter_max: size / 1000 * 1.2
                },
                meters: {
                    estimated_diameter_min: size * 0.8,
                    estimated_diameter_max: size * 1.2
                },
                miles: {
                    estimated_diameter_min: size / 1609 * 0.8,
                    estimated_diameter_max: size / 1609 * 1.2
                },
                feet: {
                    estimated_diameter_min: size * 3.28 * 0.8,
                    estimated_diameter_max: size * 3.28 * 1.2
                }
            },
            is_potentially_hazardous_asteroid: Math.random() > 0.85,
            close_approach_data: [
                {
                    close_approach_date: date,
                    close_approach_date_full: `${date}T${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                    epoch_date_close_approach: new Date(date).getTime(),
                    relative_velocity: {
                        kilometers_per_second: (Math.random() * 30 + 10).toFixed(2),
                        kilometers_per_hour: (Math.random() * 108000 + 36000).toFixed(2),
                        miles_per_hour: (Math.random() * 67000 + 22000).toFixed(2)
                    },
                    miss_distance: {
                        astronomical: (distance / 149597870.7).toFixed(4),
                        lunar: (distance / 384400).toFixed(4),
                        kilometers: distance.toFixed(2),
                        miles: (distance * 0.621371).toFixed(2)
                    },
                    orbiting_body: 'Earth'
                }
            ],
            is_sentry_object: false
        });
    }

    return neos;
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        nasa_api_key: NASA_API_KEY !== 'DEMO_KEY' ? 'configured' : 'using demo key'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Asteroid Impact Tracker Server running on http://localhost:${PORT}`);
    console.log(`📡 NASA API Key: ${NASA_API_KEY === 'DEMO_KEY' ? 'DEMO_KEY (limited rate)' : 'Custom key configured'}`);
    console.log(`🌍 Visit http://localhost:${PORT} to view the application`);
    console.log('\n💡 Get your free NASA API key at: https://api.nasa.gov');
});