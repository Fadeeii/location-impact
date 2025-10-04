// Configuration
const NASA_API_KEY = 'DEMO_KEY';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Global state
let liveAsteroidData = [];
let allAsteroidData = [];
let clickedLocation = null;
let historicalMap = null;
let simulatorMap = null;
let impactMarker = null;
let impactZones = [];

// Historical impact data
const historicalImpacts = [
    { name: 'Chicxulub Crater', location: 'Yucatan Peninsula, Mexico', lat: 21.3, lng: -89.5, year: '66 million years ago', diameter: '180 km', size: '10-15 km asteroid', impact: 'Caused mass extinction event including dinosaurs', energy: '100 million megatons TNT' },
    { name: 'Vredefort Crater', location: 'Free State, South Africa', lat: -27.0, lng: 27.5, year: '2.02 billion years ago', diameter: '300 km', size: '10-15 km asteroid', impact: 'Largest verified impact structure on Earth', energy: '> 100 million megatons TNT' },
    { name: 'Sudbury Basin', location: 'Ontario, Canada', lat: 46.6, lng: -81.2, year: '1.85 billion years ago', diameter: '250 km', size: '10-15 km asteroid', impact: 'Second largest impact structure, nickel deposits', energy: '> 100 million megatons TNT' },
    { name: 'Tunguska Event', location: 'Siberia, Russia', lat: 60.9, lng: 101.9, year: '1908', diameter: '0 km (airburst)', size: '60-190 m asteroid/comet', impact: 'Flattened 2,000 km² of forest', energy: '10-15 megatons TNT' },
    { name: 'Barringer Crater', location: 'Arizona, USA', lat: 35.0, lng: -111.0, year: '50,000 years ago', diameter: '1.2 km', size: '50 m iron meteorite', impact: 'Best preserved impact crater on Earth', energy: '10 megatons TNT' },
    { name: 'Chelyabinsk Meteor', location: 'Chelyabinsk, Russia', lat: 55.2, lng: 61.4, year: '2013', diameter: '0 km (airburst)', size: '20 m asteroid', impact: 'Injured 1,500+ people, damaged 7,200 buildings', energy: '0.5 megatons TNT' },
    { name: 'Popigai Crater', location: 'Siberia, Russia', lat: 71.7, lng: 111.2, year: '35 million years ago', diameter: '100 km', size: '8 km asteroid', impact: 'Created industrial-grade diamonds', energy: '> 50 million megatons TNT' },
    { name: 'Manicouagan Crater', location: 'Quebec, Canada', lat: 51.4, lng: -68.7, year: '214 million years ago', diameter: '100 km', size: '5 km asteroid', impact: 'Visible from space, now a reservoir', energy: '> 50 million megatons TNT' }
];

// Future predictions data
const futurePredictions = [
    { name: '99942 Apophis', size: '340 m', approach: 'April 13, 2029', distance: '31,860 km', probability: '0%', torino: 0, impact: 'Will pass closer than some satellites. No impact threat.' },
    { name: 'Bennu (101955)', size: '490 m', approach: 'September 24, 2182', distance: 'TBD', probability: '0.037%', torino: 1, impact: 'Long-term monitoring required. OSIRIS-REx mission target.' },
    { name: '2023 DW', size: '50 m', approach: 'February 14, 2046', distance: 'TBD', probability: '0.00033%', torino: 1, impact: 'Very low risk. Continued observation needed.' },
    { name: '2000 SG344', size: '37 m', approach: 'September 16, 2071', distance: 'TBD', probability: '0.00017%', torino: 1, impact: 'Potential virtual impactor. Under monitoring.' }
];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadHistoricalImpacts();
    loadPredictions();
    fetchLiveData();
    initSearch();
    setInterval(fetchLiveData, 600000);
});

// Navigation
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
            
            // Initialize maps when switching to map sections
            setTimeout(() => {
                if (targetSection === 'historical') {
                    if (!historicalMap) {
                        initHistoricalMap();
                    } else {
                        historicalMap.invalidateSize();
                    }
                } else if (targetSection === 'simulator') {
                    if (!simulatorMap) {
                        initSimulatorMap();
                    } else {
                        simulatorMap.invalidateSize();
                    }
                }
            }, 100);
        });
    });
}

// Initialize Historical Map with Leaflet
function initHistoricalMap() {
    const mapElement = document.getElementById('historicalMap');
    if (!mapElement || historicalMap) return;
    
    historicalMap = L.map('historicalMap', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 10,
        zoomControl: true,
        worldCopyJump: true
    });
    
    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(historicalMap);
    
    // Add impact markers
    historicalImpacts.forEach(impact => {
        const markerIcon = L.divIcon({
            className: 'impact-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            html: '<div style="width: 100%; height: 100%;"></div>'
        });
        
        const marker = L.marker([impact.lat, impact.lng], { icon: markerIcon }).addTo(historicalMap);
        
        const popupContent = `
            <h3>${impact.name}</h3>
            <p><strong>Location:</strong> ${impact.location}</p>
            <p><strong>Date:</strong> ${impact.year}</p>
            <p><strong>Crater:</strong> ${impact.diameter}</p>
            <p><strong>Size:</strong> ${impact.size}</p>
            <p><strong>Energy:</strong> ${impact.energy}</p>
            <p style="margin-top: 10px; font-style: italic;">${impact.impact}</p>
        `;
        
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'impact-popup'
        });
    });
}

// Initialize Simulator Map
function initSimulatorMap() {
    const mapElement = document.getElementById('simulatorMap');
    if (!mapElement || simulatorMap) return;
    
    simulatorMap = L.map('simulatorMap', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 12,
        zoomControl: true,
        worldCopyJump: true
    });
    
    // Add satellite imagery
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19
    }).addTo(simulatorMap);
    
    // Click handler for impact simulation
    simulatorMap.on('click', function(e) {
        clickedLocation = {
            lat: e.latlng.lat.toFixed(2),
            lng: e.latlng.lng.toFixed(2),
            latlng: e.latlng
        };
        
        // Remove previous marker and zones
        if (impactMarker) {
            simulatorMap.removeLayer(impactMarker);
        }
        
        impactZones.forEach(zone => simulatorMap.removeLayer(zone));
        impactZones = [];
        
        // Add new marker
        const markerIcon = L.divIcon({
            className: 'impact-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            html: '<div style="width: 100%; height: 100%;"></div>'
        });
        
        impactMarker = L.marker(e.latlng, { icon: markerIcon }).addTo(simulatorMap);
        
        // Trigger explosion animation
        const overlay = document.getElementById('explosionOverlay');
        const rect = overlay.getBoundingClientRect();
        const containerPoint = simulatorMap.latLngToContainerPoint(e.latlng);
        
        triggerExplosion(containerPoint.x, containerPoint.y);
    });
    
    // Initialize simulator controls
    const simulateBtn = document.getElementById('simulateBtn');
    if (simulateBtn) {
        simulateBtn.addEventListener('click', runSimulation);
    }
}

// Trigger explosion animation
function triggerExplosion(x, y) {
    const overlay = document.getElementById('explosionOverlay');
    
    // Clear previous explosions
    overlay.innerHTML = '';
    
    // Create flash
    createExplosionElement(overlay, x, y, 'explosion-flash', 0);
    
    // Create fireball
    createExplosionElement(overlay, x, y, 'explosion-fireball', 100);
    
    // Create core explosion
    createExplosionElement(overlay, x, y, 'explosion-core', 150);
    
    // Create multiple shockwave rings
    for (let i = 0; i < 3; i++) {
        createExplosionElement(overlay, x, y, 'explosion-ring', 200 + i * 300);
    }
    
    // Create shockwave
    createExplosionElement(overlay, x, y, 'explosion-shockwave', 300);
    
    // Create particles
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        const px = x + Math.cos(angle) * distance;
        const py = y + Math.sin(angle) * distance;
        
        const particle = document.createElement('div');
        particle.className = 'explosion explosion-particles';
        particle.style.left = px + 'px';
        particle.style.top = py + 'px';
        particle.style.width = (10 + Math.random() * 20) + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = `radial-gradient(circle, #ff9800, #ff5722, transparent)`;
        overlay.appendChild(particle);
    }
    
    // Create crater (appears after explosion)
    setTimeout(() => {
        createExplosionElement(overlay, x, y, 'crater-ring', 0);
    }, 1500);
    
    // Clear all explosions after animation
    setTimeout(() => {
        overlay.innerHTML = '';
    }, 4000);
}

function createExplosionElement(container, x, y, className, delay) {
    setTimeout(() => {
        const element = document.createElement('div');
        element.className = `explosion ${className}`;
        element.style.left = x + 'px';
        element.style.top = y + 'px';
        container.appendChild(element);
    }, delay);
}

// Load historical impacts list
function loadHistoricalImpacts() {
    const container = document.getElementById('historicalList');
    if (!container) return;
    
    container.innerHTML = '';
    
    historicalImpacts.forEach(impact => {
        const card = document.createElement('div');
        card.className = 'impact-card';
        card.innerHTML = `
            <div class="impact-name">${impact.name}</div>
            <div class="impact-info">
                <p><span>Location:</span> ${impact.location}</p>
                <p><span>Date:</span> ${impact.year}</p>
                <p><span>Crater Diameter:</span> ${impact.diameter}</p>
                <p><span>Impactor Size:</span> ${impact.size}</p>
                <p><span>Energy:</span> ${impact.energy}</p>
                <p style="margin-top: 0.5rem; font-style: italic;">${impact.impact}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

// Load predictions
function loadPredictions() {
    const container = document.getElementById('predictionsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    futurePredictions.forEach(pred => {
        const card = document.createElement('div');
        card.className = 'impact-card';
        
        let riskClass = 'risk-low';
        if (pred.torino >= 5) riskClass = 'risk-high';
        else if (pred.torino >= 1) riskClass = 'risk-medium';
        
        card.innerHTML = `
            <div class="impact-name">${pred.name}</div>
            <div class="impact-info">
                <p><span>Size:</span> ${pred.size}</p>
                <p><span>Close Approach:</span> ${pred.approach}</p>
                <p><span>Miss Distance:</span> ${pred.distance}</p>
                <p><span>Impact Probability:</span> ${pred.probability}</p>
                <p style="margin-top: 0.5rem; font-style: italic;">${pred.impact}</p>
                <span class="risk-badge ${riskClass}">Torino Scale: ${pred.torino}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// Initialize search functionality
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterAsteroids(searchTerm);
    });
}

// Filter asteroids based on search term
function filterAsteroids(searchTerm) {
    const tableBody = document.getElementById('trackerTableBody');
    if (!tableBody) return;
    
    if (searchTerm === '') {
        // Show all asteroids
        displayAsteroids(allAsteroidData);
    } else {
        // Filter asteroids
        const filtered = allAsteroidData.filter(asteroid => 
            asteroid.name.toLowerCase().includes(searchTerm)
        );
        
        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="loading">No asteroids found matching your search.</td></tr>';
        } else {
            displayAsteroids(filtered);
        }
    }
}

// Display asteroids in table
function displayAsteroids(asteroids) {
    const tableBody = document.getElementById('trackerTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    asteroids.forEach(asteroid => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="color: #4ecdc4; font-weight: 600;">${asteroid.name}</td>
            <td>${asteroid.size.toLocaleString()}</td>
            <td>${asteroid.date}</td>
            <td class="distance">${asteroid.distance.toLocaleString()}</td>
            <td>${asteroid.velocity.toLocaleString()}</td>
            <td>
                <span class="${asteroid.hazardous ? 'hazard-yes' : 'hazard-no'}">
                    ${asteroid.hazardous ? 'YES' : 'NO'}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Run simulation
function runSimulation() {
    if (!clickedLocation) {
        alert('Please click on the map to select an impact location first!');
        return;
    }
    
    const diameter = parseFloat(document.getElementById('diameter').value);
    const velocity = parseFloat(document.getElementById('velocity').value);
    const angle = parseFloat(document.getElementById('angle').value);
    const composition = document.getElementById('composition').value;
    
    // Density kg/m³
    const densities = { iron: 7800, stone: 3000, ice: 917 };
    const density = densities[composition];
    
    // Calculate mass (kg)
    const radius = diameter / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    const mass = volume * density;
    
    // Kinetic energy
    const velocityMs = velocity * 1000;
    const kineticEnergy = 0.5 * mass * Math.pow(velocityMs, 2);
    const energyMT = kineticEnergy / 4.184e15;
    
    // Impact calculations
    const craterDiameter = Math.pow(energyMT, 0.3) * 1.8;
    const magnitude = 0.67 * Math.log10(energyMT) + 5.87;
    const devastationRadius = craterDiameter * 10;
    const fireballDiameter = diameter * 2.5;
    const shockwaveRange = devastationRadius * 3;
    const thermalRadius = Math.pow(energyMT, 0.41) * 2.5;
    
    // Draw impact zones on map
    if (impactMarker && simulatorMap) {
        // Remove previous zones
        impactZones.forEach(zone => simulatorMap.removeLayer(zone));
        impactZones = [];
        
        // Add impact zones
        const craterZone = L.circle(clickedLocation.latlng, {
            radius: craterDiameter * 500,
            color: '#ff5722',
            fillColor: '#ff5722',
            fillOpacity: 0.7,
            weight: 2
        }).addTo(simulatorMap).bindPopup('Crater Zone');
        impactZones.push(craterZone);
        
        const devastationZone = L.circle(clickedLocation.latlng, {
            radius: devastationRadius * 1000,
            color: '#ff9800',
            fillColor: '#ff9800',
            fillOpacity: 0.4,
            weight: 2
        }).addTo(simulatorMap).bindPopup('Devastation Zone');
        impactZones.push(devastationZone);
        
        const thermalZone = L.circle(clickedLocation.latlng, {
            radius: thermalRadius * 1000,
            color: '#ffc107',
            fillColor: '#ffc107',
            fillOpacity: 0.2,
            weight: 2
        }).addTo(simulatorMap).bindPopup('Thermal Radiation Zone');
        impactZones.push(thermalZone);
        
        const shockwaveZone = L.circle(clickedLocation.latlng, {
            radius: shockwaveRange * 1000,
            color: '#ffeb3b',
            fillColor: '#ffeb3b',
            fillOpacity: 0.1,
            weight: 1
        }).addTo(simulatorMap).bindPopup('Shockwave Zone');
        impactZones.push(shockwaveZone);
    }
    
    // Display results
    const resultsPanel = document.getElementById('simulationResults');
    const resultsContent = document.getElementById('resultsContent');
    
    if (resultsContent) {
        resultsContent.innerHTML = `
            <p><span>Impact Location:</span> ${clickedLocation.lat}° N, ${clickedLocation.lng}° E</p>
            <p><span>Energy Released:</span> ${energyMT.toFixed(2)} Megatons TNT</p>
            <p><span>Crater Diameter:</span> ${craterDiameter.toFixed(2)} km</p>
            <p><span>Crater Depth:</span> ${(craterDiameter / 5).toFixed(2)} km</p>
            <p><span>Earthquake Magnitude:</span> ${magnitude.toFixed(1)} Richter</p>
            <p><span>Devastation Radius:</span> ${devastationRadius.toFixed(1)} km</p>
            <p><span>Fireball Diameter:</span> ${fireballDiameter.toFixed(0)} m</p>
            <p><span>Thermal Radiation Range:</span> ${thermalRadius.toFixed(1)} km</p>
            <p><span>Shockwave Range:</span> ${shockwaveRange.toFixed(1)} km</p>
            <p><span>Ejecta Volume:</span> ${Math.pow(craterDiameter, 3).toFixed(0)} km³</p>
        `;
    }
    
    if (resultsPanel) {
        resultsPanel.classList.add('visible');
    }
    
    // Zoom to impact site
    if (simulatorMap) {
        simulatorMap.setView(clickedLocation.latlng, 7, { animate: true });
    }
}

// Fetch live NASA data
async function fetchLiveData() {
    const refreshBtn = document.getElementById('refreshBtn');
    const tableBody = document.getElementById('trackerTableBody');
    
    if (refreshBtn) {
        refreshBtn.innerHTML = '<span class="icon">⏳</span> Loading...';
        refreshBtn.disabled = true;
    }
    
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="6" class="loading">Fetching real-time data from NASA NeoWs API...</td></tr>';
    }
    
    try {
        const today = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        let url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${endDate}&api_key=${NASA_API_KEY}`;
        let response = await fetch(url);
        
        if (!response.ok) {
            url = `${CORS_PROXY}${encodeURIComponent(url)}`;
            response = await fetch(url);
        }
        
        if (response.ok) {
            const data = await response.json();
            processNASAData(data);
            
            const elementCount = data.element_count || 0;
            const neoCountEl = document.getElementById('neoCount');
            const weekCountEl = document.getElementById('weekCount');
            
            if (neoCountEl) neoCountEl.textContent = '34,000+';
            if (weekCountEl) weekCountEl.textContent = elementCount;
        } else {
            throw new Error('API request failed');
        }
    } catch (error) {
        console.error('Error fetching NASA data:', error);
        loadFallbackData();
    }
    
    if (refreshBtn) {
        refreshBtn.innerHTML = '<span class="icon">🔄</span> Refresh';
        refreshBtn.disabled = false;
    }
}

function processNASAData(data) {
    allAsteroidData = [];
    
    Object.keys(data.near_earth_objects).forEach(date => {
        data.near_earth_objects[date].forEach(neo => {
            if (neo.close_approach_data && neo.close_approach_data[0]) {
                const approach = neo.close_approach_data[0];
                allAsteroidData.push({
                    name: neo.name,
                    size: Math.round(neo.estimated_diameter.meters.estimated_diameter_max),
                    date: approach.close_approach_date,
                    distance: Math.round(parseFloat(approach.miss_distance.kilometers)),
                    velocity: Math.round(parseFloat(approach.relative_velocity.kilometers_per_hour)),
                    hazardous: neo.is_potentially_hazardous_asteroid
                });
            }
        });
    });
    
    allAsteroidData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (allAsteroidData.length === 0) {
        const tableBody = document.getElementById('trackerTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" class="loading">No close approaches found for the next 7 days.</td></tr>';
        }
        return;
    }
    
    displayAsteroids(allAsteroidData);
}

function loadFallbackData() {
    const sampleData = [
        { name: '(2024 XK1)', size: 250, date: '2025-10-08', distance: 4523000, velocity: 45230, hazardous: false },
        { name: '(2025 DA4)', size: 180, date: '2025-10-09', distance: 2345000, velocity: 38900, hazardous: true },
        { name: '(2024 MN2)', size: 420, date: '2025-10-10', distance: 6780000, velocity: 52100, hazardous: false },
        { name: '(2025 BC3)', size: 95, date: '2025-10-11', distance: 1890000, velocity: 31200, hazardous: false },
        { name: '(2024 ZZ9)', size: 310, date: '2025-10-12', distance: 5432000, velocity: 47800, hazardous: true }
    ];
    
    allAsteroidData = sampleData;
    
    const weekCountEl = document.getElementById('weekCount');
    if (weekCountEl) weekCountEl.textContent = sampleData.length;
    
    const tableBody = document.getElementById('trackerTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="6" style="background: rgba(255,193,7,0.1); color: #ffc107; padding: 1rem; text-align: center;">⚠️ Using sample data - NASA API unavailable</td></tr>';
    
    displayAsteroids(sampleData);
}

// Refresh button handler
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchLiveData);
    }
});