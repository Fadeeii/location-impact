// Configuration
const NASA_API_KEY = 'DEMO_KEY';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// USGS API Endpoints
const USGS_ELEVATION_API = 'https://epqs.nationalmap.gov/v1/json';

// Global state
let liveAsteroidData = [];
let allAsteroidData = [];
let clickedLocation = null;
let historicalMap = null;
let simulatorMap = null;
let impactMarker = null;
let impactZones = [];
let currentImpactData = null;

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

// Asteroid database for search
const asteroidDatabase = {
    'ceres': { name: '1 Ceres', diameter: 939000, composition: 'ice' },
    '1': { name: '1 Ceres', diameter: 939000, composition: 'ice' },
    'vesta': { name: '4 Vesta', diameter: 525000, composition: 'stone' },
    '4': { name: '4 Vesta', diameter: 525000, composition: 'stone' },
    'pallas': { name: '2 Pallas', diameter: 512000, composition: 'stone' },
    '2': { name: '2 Pallas', diameter: 512000, composition: 'stone' },
    'juno': { name: '3 Juno', diameter: 233000, composition: 'stone' },
    '3': { name: '3 Juno', diameter: 233000, composition: 'stone' },
    'eros': { name: '433 Eros', diameter: 16800, composition: 'stone' },
    '433': { name: '433 Eros', diameter: 16800, composition: 'stone' },
    'apophis': { name: '99942 Apophis', diameter: 340, composition: 'stone' },
    '99942': { name: '99942 Apophis', diameter: 340, composition: 'stone' },
    'bennu': { name: '101955 Bennu', diameter: 490, composition: 'stone' },
    '101955': { name: '101955 Bennu', diameter: 490, composition: 'stone' },
    'ryugu': { name: '162173 Ryugu', diameter: 900, composition: 'stone' },
    '162173': { name: '162173 Ryugu', diameter: 900, composition: 'stone' },
    'itokawa': { name: '25143 Itokawa', diameter: 330, composition: 'stone' },
    '25143': { name: '25143 Itokawa', diameter: 330, composition: 'stone' },
    'psyche': { name: '16 Psyche', diameter: 226000, composition: 'iron' },
    '16': { name: '16 Psyche', diameter: 226000, composition: 'iron' },
    'hygiea': { name: '10 Hygiea', diameter: 434000, composition: 'stone' },
    '10': { name: '10 Hygiea', diameter: 434000, composition: 'stone' },
    'barbara': { name: '234 Barbara', diameter: 44000, composition: 'stone' },
    '234': { name: '234 Barbara', diameter: 44000, composition: 'stone' }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTooltips();
    loadHistoricalImpacts();
    loadPredictions();
    fetchLiveData();
    initSearch();
    initAsteroidSearchDialog();
    setInterval(fetchLiveData, 600000);
});

// Initialize asteroid search dialog
function initAsteroidSearchDialog() {
    const searchBtn = document.getElementById('searchAsteroidBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', showAsteroidSearchDialog);
    }
    
    const searchInput = document.getElementById('asteroidSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchAsteroidData();
            }
        });
    }
}

function showAsteroidSearchDialog() {
    const dialog = document.getElementById('asteroidSearchDialog');
    const overlay = document.getElementById('asteroidSearchOverlay');
    if (dialog && overlay) {
        dialog.style.display = 'block';
        overlay.style.display = 'block';
        document.getElementById('asteroidSearchInput')?.focus();
    }
}

function closeAsteroidSearchDialog() {
    const dialog = document.getElementById('asteroidSearchDialog');
    const overlay = document.getElementById('asteroidSearchOverlay');
    if (dialog && overlay) {
        dialog.style.display = 'none';
        overlay.style.display = 'none';
        document.getElementById('asteroidSearchStatus').textContent = '';
    }
}

async function searchAsteroidData() {
    const searchInput = document.getElementById('asteroidSearchInput').value.trim().toLowerCase();
    const statusDiv = document.getElementById('asteroidSearchStatus');
    
    if (!searchInput) {
        statusDiv.textContent = 'Please enter an asteroid name or number';
        statusDiv.style.color = '#ef4444';
        return;
    }
    
    statusDiv.textContent = 'Searching NASA database...';
    statusDiv.style.color = '#4ecdc4';
    
    // First try local database
    if (asteroidDatabase[searchInput]) {
        const data = asteroidDatabase[searchInput];
        loadAsteroidToSimulator(data.name, data.diameter, data.composition);
        statusDiv.textContent = 'Found! Loading asteroid data...';
        statusDiv.style.color = '#10b981';
        setTimeout(closeAsteroidSearchDialog, 1500);
        return;
    }
    
    // Try NASA API through proxy
    try {
        let response;
        let data;
        
        try {
            // Try local backend proxy first
            response = await fetch(`http://localhost:3001/api/asteroid/${encodeURIComponent(searchInput)}`);
            data = await response.json();
            console.log('NASA Response:', data);
        } catch (localError) {
            // Fallback to public CORS proxy
            console.log('Local proxy unavailable, trying public proxy...');
            const publicProxyUrl = `${CORS_PROXY}${encodeURIComponent(`https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${encodeURIComponent(searchInput)}`)}`;
            response = await fetch(publicProxyUrl);
            data = await response.json();
        }
        
        // Check if multiple matches
        if (data.code === 300 && data.list) {
            statusDiv.innerHTML = `Multiple matches. Try:<br>${data.list.slice(0, 3).map(item => item.pdes).join(', ')}`;
            statusDiv.style.color = '#f59e0b';
            return;
        }
        
        // Check if object found
        if (data.object && data.orbit) {
            const name = data.object.fullname || data.object.shortname || searchInput;
            
            // Extract diameter
            let diameter = 100;
            if (data.phys_par && data.phys_par.diameter) {
                diameter = parseFloat(data.phys_par.diameter) * 1000;
            }
            
            // Estimate composition
            let composition = 'stone';
            if (data.object.orbit_class) {
                const orbitClass = data.object.orbit_class.name.toLowerCase();
                if (orbitClass.includes('trojan')) {
                    composition = 'ice';
                }
            }
            
            loadAsteroidToSimulator(name, diameter, composition);
            
            statusDiv.textContent = '✅ Found! Loading asteroid...';
            statusDiv.style.color = '#10b981';
            setTimeout(closeAsteroidSearchDialog, 1500);
        } else {
            throw new Error('Not found');
        }
    } catch (error) {
        console.error('Search Error:', error);
        statusDiv.innerHTML = `❌ "${searchInput}" not found.<br><br>💡 Try: Ceres, Vesta, Eros, Apophis, Bennu, Ryugu`;
        statusDiv.style.color = '#ef4444';
    }
}

function loadAsteroidToSimulator(name, diameter, composition) {
    document.getElementById('diameter').value = diameter;
    document.getElementById('composition').value = composition;
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(78, 205, 196, 0.9);
        color: #0a0e27;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    `;
    notification.textContent = `Loaded: ${name} (${diameter}m)`;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// Initialize tooltips
function initTooltips() {
    const style = document.createElement('style');
    style.textContent = `
        .tooltip { position: relative; cursor: help; border-bottom: 1px dotted var(--secondary); }
        .tooltip::after {
            content: attr(data-tip);
            position: absolute;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(10, 14, 39, 0.95);
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-size: 0.85rem;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
            border: 1px solid var(--secondary);
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }
        .tooltip:hover::after { opacity: 1; }
    `;
    document.head.appendChild(style);
    
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.classList.add('tooltip');
        el.setAttribute('data-tip', el.getAttribute('data-tooltip'));
    });
}

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

// Initialize Historical Map
function initHistoricalMap() {
    const mapElement = document.getElementById('historicalMap');
    if (!mapElement || historicalMap) return;
    
    historicalMap = L.map('historicalMap', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 10
    });
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(historicalMap);
    
    historicalImpacts.forEach(impact => {
        let severity = 'low';
        let markerSize = 20;
        let color = '#ff9800';
        let opacity = 0.6;
        
        const diameter = parseFloat(impact.diameter);
        
        if (diameter >= 100 || impact.energy.includes('100 million')) {
            severity = 'catastrophic';
            markerSize = 50;
            color = '#d32f2f';
            opacity = 0.9;
        } else if (diameter >= 50 || impact.energy.includes('50 million')) {
            severity = 'major';
            markerSize = 40;
            color = '#f44336';
            opacity = 0.85;
        } else if (diameter >= 10 || impact.energy.includes('10-15 megatons') || impact.energy.includes('10 megatons')) {
            severity = 'significant';
            markerSize = 30;
            color = '#ff5722';
            opacity = 0.75;
        } else if (diameter >= 1) {
            severity = 'moderate';
            markerSize = 25;
            color = '#ff9800';
            opacity = 0.65;
        } else {
            severity = 'minor';
            markerSize = 18;
            color = '#ffb74d';
            opacity = 0.5;
        }
        
        const markerIcon = L.divIcon({
            className: 'impact-marker-custom',
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize/2, markerSize/2],
            html: `
                <div style="
                    width: 100%; 
                    height: 100%;
                    background: radial-gradient(circle, ${color} 0%, ${color}aa 50%, transparent 100%);
                    border: 3px solid ${color};
                    border-radius: 50%;
                    box-shadow: 0 0 ${markerSize}px ${color}${Math.floor(opacity * 255).toString(16)}, 
                                0 0 ${markerSize * 2}px ${color}${Math.floor(opacity * 0.4 * 255).toString(16)};
                    animation: pulse-${severity} 2s infinite;
                "></div>
            `
        });
        
        const marker = L.marker([impact.lat, impact.lng], { 
            icon: markerIcon,
            zIndexOffset: diameter >= 100 ? 1000 : diameter >= 50 ? 500 : 0
        }).addTo(historicalMap);
        
        const popupContent = `
            <h3>${impact.name}</h3>
            <p><strong>Severity:</strong> <span style="color: ${color}; font-weight: bold;">${severity.toUpperCase()}</span></p>
            <p><strong>Location:</strong> ${impact.location}</p>
            <p><strong>Date:</strong> ${impact.year}</p>
            <p><strong>Crater:</strong> ${impact.diameter}</p>
            <p><strong>Impactor Size:</strong> ${impact.size}</p>
            <p><strong>Energy:</strong> ${impact.energy}</p>
            <p style="margin-top: 10px; font-style: italic;">${impact.impact}</p>
        `;
        
        marker.bindPopup(popupContent, { maxWidth: 300 });
    });
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse-catastrophic {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes pulse-major {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.75; transform: scale(1.08); }
        }
        @keyframes pulse-significant {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes pulse-moderate {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.85; transform: scale(1.03); }
        }
        @keyframes pulse-minor {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.02); }
        }
        .impact-marker-custom {
            background: transparent !important;
            border: none !important;
        }
    `;
    document.head.appendChild(style);
}

// Initialize Simulator Map
function initSimulatorMap() {
    const mapElement = document.getElementById('simulatorMap');
    if (!mapElement || simulatorMap) return;
    
    simulatorMap = L.map('simulatorMap', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 12
    });
    
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19
    }).addTo(simulatorMap);
    
    simulatorMap.on('click', async function(e) {
        clickedLocation = {
            lat: e.latlng.lat.toFixed(2),
            lng: e.latlng.lng.toFixed(2),
            latlng: e.latlng
        };
        
        const elevation = await getUSGSElevation(e.latlng.lat, e.latlng.lng);
        clickedLocation.elevation = elevation;
        clickedLocation.isOcean = elevation < 0;
        
        if (impactMarker) simulatorMap.removeLayer(impactMarker);
        impactZones.forEach(zone => simulatorMap.removeLayer(zone));
        impactZones = [];
        
        const markerIcon = L.divIcon({
            className: 'impact-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        
        impactMarker = L.marker(e.latlng, { icon: markerIcon }).addTo(simulatorMap);
        
        const containerPoint = simulatorMap.latLngToContainerPoint(e.latlng);
        triggerExplosion(containerPoint.x, containerPoint.y);
    });
    
    document.getElementById('simulateBtn')?.addEventListener('click', runSimulation);
}

// Get USGS Elevation
async function getUSGSElevation(lat, lng) {
    try {
        const url = `${USGS_ELEVATION_API}?x=${lng}&y=${lat}&units=Meters&output=json`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.USGS_Elevation_Point_Query_Service?.Elevation_Query?.Elevation) {
            return parseFloat(data.USGS_Elevation_Point_Query_Service.Elevation_Query.Elevation);
        }
        return 0;
    } catch (error) {
        console.error('USGS elevation fetch failed:', error);
        return 0;
    }
}

// Trigger explosion animation
function triggerExplosion(x, y) {
    const overlay = document.getElementById('explosionOverlay');
    if (!overlay) return;
    
    overlay.innerHTML = '';
    
    // Create explosion effects
    createExplosionElement(overlay, x, y, 'explosion-flash', 0);
    createExplosionElement(overlay, x, y, 'explosion-fireball', 100);
    createExplosionElement(overlay, x, y, 'explosion-core', 150);
    
    for (let i = 0; i < 3; i++) {
        createExplosionElement(overlay, x, y, 'explosion-ring', 200 + i * 300);
    }
    
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
        particle.style.background = 'radial-gradient(circle, #ff9800, #ff5722, transparent)';
        overlay.appendChild(particle);
    }
    
    setTimeout(() => createExplosionElement(overlay, x, y, 'crater-ring', 0), 1500);
    setTimeout(() => overlay.innerHTML = '', 4000);
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

// Load historical impacts
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

// Initialize search
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterAsteroids(searchTerm);
    });
}

// Filter asteroids
function filterAsteroids(searchTerm) {
    if (searchTerm === '') {
        displayAsteroids(allAsteroidData);
    } else {
        const filtered = allAsteroidData.filter(asteroid => 
            asteroid.name.toLowerCase().includes(searchTerm)
        );
        
        const tableBody = document.getElementById('trackerTableBody');
        if (filtered.length === 0 && tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" class="loading">No asteroids found matching your search.</td></tr>';
        } else {
            displayAsteroids(filtered);
        }
    }
}

// Display asteroids
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
            <td><span class="${asteroid.hazardous ? 'hazard-yes' : 'hazard-no'}">${asteroid.hazardous ? 'YES' : 'NO'}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

// Run simulation
async function runSimulation() {
    if (!clickedLocation) {
        alert('Please click on the map to select an impact location first!');
        return;
    }
    
    const diameter = parseFloat(document.getElementById('diameter').value);
    const velocity = parseFloat(document.getElementById('velocity').value);
    const angle = parseFloat(document.getElementById('angle').value);
    const composition = document.getElementById('composition').value;
    
    const densities = { iron: 7800, stone: 3000, ice: 917 };
    const density = densities[composition];
    const targetDensity = clickedLocation.isOcean ? 1000 : 2700;
    
    const radius = diameter / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    const mass = volume * density;
    
    const velocityMs = velocity * 1000;
    const kineticEnergy = 0.5 * mass * Math.pow(velocityMs, 2);
    const energyMT = kineticEnergy / 4.184e15;
    
    const craterDiameter = 1.8 * Math.pow(energyMT, 0.3) * 
        Math.pow(density/targetDensity, 0.17) * 
        Math.pow(Math.sin(angle * Math.PI/180), 0.33);
    const craterDepth = craterDiameter / 5;
    
    const magnitude = 0.67 * Math.log10(energyMT * 1000) - 5.87;
    
    const devastationRadius = craterDiameter * 10;
    const fireballDiameter = diameter * 2.5;
    const thermalRadius = Math.pow(energyMT, 0.41) * 2.5;
    const shockwaveRange = devastationRadius * 3;
    
    let tsunamiData = null;
    if (clickedLocation.isOcean) {
        const waterDepth = Math.abs(clickedLocation.elevation);
        const tsunamiHeight = Math.pow(energyMT, 0.25) * 10;
        const tsunamiReach = tsunamiHeight * 100;
        
        tsunamiData = {
            initialHeight: tsunamiHeight,
            reachKm: tsunamiReach,
            waterDepth: waterDepth
        };
    }
    
    const dustVolumeKm3 = craterDiameter * craterDepth;
    const stratosphericDust = dustVolumeKm3 * 0.3;
    const temperatureDrop = stratosphericDust > 1000 ? 10 : stratosphericDust > 100 ? 5 : 2;
    
    currentImpactData = {
        location: clickedLocation,
        diameter, velocity, angle, composition,
        energyMT, craterDiameter, magnitude,
        tsunamiData, temperatureDrop
    };
    
    drawImpactZones(craterDiameter, devastationRadius, thermalRadius, shockwaveRange, tsunamiData);
    
    displayResults(energyMT, craterDiameter, craterDepth, magnitude, devastationRadius, 
                   fireballDiameter, thermalRadius, shockwaveRange, dustVolumeKm3, 
                   tsunamiData, temperatureDrop);
    
    showMitigationOptions();
    
    if (simulatorMap) {
        simulatorMap.setView(clickedLocation.latlng, 7, { animate: true });
    }
}

function drawImpactZones(craterDiameter, devastationRadius, thermalRadius, shockwaveRange, tsunamiData) {
    impactZones.forEach(zone => simulatorMap.removeLayer(zone));
    impactZones = [];
    
    const zones = [
        { radius: craterDiameter * 500, color: '#ff5722', label: 'Crater Zone', opacity: 0.7 },
        { radius: devastationRadius * 1000, color: '#ff9800', label: 'Devastation Zone', opacity: 0.4 },
        { radius: thermalRadius * 1000, color: '#ffc107', label: 'Thermal Radiation', opacity: 0.2 },
        { radius: shockwaveRange * 1000, color: '#ffeb3b', label: 'Shockwave Zone', opacity: 0.1 }
    ];
    
    if (tsunamiData) {
        zones.push({ 
            radius: tsunamiData.reachKm * 1000, 
            color: '#2196f3', 
            label: `Tsunami (${tsunamiData.initialHeight.toFixed(0)}m wave)`, 
            opacity: 0.3 
        });
    }
    
    zones.forEach(zone => {
        const circle = L.circle(clickedLocation.latlng, {
            radius: zone.radius,
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: zone.opacity,
            weight: 2
        }).addTo(simulatorMap).bindPopup(zone.label);
        impactZones.push(circle);
    });
}

function displayResults(energyMT, craterDiameter, craterDepth, magnitude, devastationRadius, 
                       fireballDiameter, thermalRadius, shockwaveRange, dustVolumeKm3, 
                       tsunamiData, temperatureDrop) {
    const resultsContent = document.getElementById('resultsContent');
    
    let html = `
        <p><span>Impact Location:</span> ${clickedLocation.lat}° N, ${clickedLocation.lng}° E</p>
        <p><span>Terrain:</span> ${clickedLocation.isOcean ? 'Ocean' : 'Land'} (${clickedLocation.elevation.toFixed(0)}m elevation)</p>
        <p><span class="tooltip" data-tip="Total energy released on impact">Energy Released:</span> ${energyMT.toFixed(2)} Megatons TNT</p>
        <p><span class="tooltip" data-tip="Diameter of the impact crater">Crater Diameter:</span> ${craterDiameter.toFixed(2)} km</p>
        <p><span>Crater Depth:</span> ${craterDepth.toFixed(2)} km</p>
        <p><span class="tooltip" data-tip="Earthquake magnitude on Richter scale">Earthquake Magnitude:</span> ${magnitude.toFixed(1)} Richter</p>
        <p><span>Devastation Radius:</span> ${devastationRadius.toFixed(1)} km</p>
        <p><span>Fireball Diameter:</span> ${fireballDiameter.toFixed(0)} m</p>
        <p><span>Thermal Radiation:</span> ${thermalRadius.toFixed(1)} km</p>
        <p><span>Shockwave Range:</span> ${shockwaveRange.toFixed(1)} km</p>
        <p><span>Ejecta Volume:</span> ${dustVolumeKm3.toFixed(0)} km³</p>
        <p><span class="tooltip" data-tip="Global temperature decrease from dust in atmosphere">Temperature Drop:</span> ${temperatureDrop}°C for ${temperatureDrop > 5 ? '2-5 years' : '6-12 months'}</p>
    `;
    
    if (tsunamiData) {
        html += `
            <p style="color: #2196f3;"><span>Tsunami Warning:</span> ${tsunamiData.initialHeight.toFixed(0)}m initial wave</p>
            <p style="color: #2196f3;"><span>Tsunami Reach:</span> ${tsunamiData.reachKm.toFixed(0)} km from coast</p>
        `;
    }
    
    resultsContent.innerHTML = html;
    document.getElementById('simulationResults').classList.add('visible');
    initTooltips();
}

function showMitigationOptions() {
    const mitigationDiv = document.getElementById('mitigationOptions');
    if (!mitigationDiv || !currentImpactData) return;
    
    const leadTimes = [1, 5, 10, 20];
    let html = '<h3>Mitigation Strategies</h3><p style="color: #a0a0a0; margin-bottom: 1.5rem;">Compare different deflection methods at various lead times</p>';
    
    const methods = [
        { name: 'Kinetic Impactor', efficiency: 0.8, cost: 500, desc: 'Spacecraft collision to alter trajectory' },
        { name: 'Gravity Tractor', efficiency: 0.6, cost: 2000, desc: 'Long-duration gravitational pull' },
        { name: 'Nuclear Deflection', efficiency: 0.95, cost: 5000, desc: 'Nuclear blast for large asteroids' }
    ];
    
    methods.forEach(method => {
        html += `<div style="margin-bottom: 2rem;">
            <h4 style="color: var(--secondary); margin-bottom: 0.5rem;">${method.name}</h4>
            <p style="color: #a0a0a0; font-size: 0.9rem; margin-bottom: 1rem;">${method.desc}</p>
            <div class="mitigation-grid">`;
        
        leadTimes.forEach(years => {
            const result = simulateDeflection(currentImpactData, method, years);
            const successClass = result.success ? 'success' : 'failure';
            
            html += `
                <div class="mitigation-card ${successClass}">
                    <h4>${years} Year${years > 1 ? 's' : ''} Lead Time</h4>
                    <p><span>Delta-V Required:</span> ${result.deltaV.toFixed(4)} m/s</p>
                    <p><span>Miss Distance:</span> ${(result.missDistance/1000).toFixed(0)}k km</p>
                    <p><span>Success:</span> <strong style="color: ${result.success ? '#4caf50' : '#f44336'}">${result.success ? 'YES ✓' : 'NO ✗'}</strong></p>
                    <p><span>Est. Cost:</span> ${result.cost}M</p>
                </div>
            `;
        });
        
        html += '</div></div>';
    });
    
    mitigationDiv.innerHTML = html;
    mitigationDiv.style.display = 'block';
}

function simulateDeflection(impactData, method, leadTimeYears) {
    const asteroidMass = (4/3) * Math.PI * Math.pow(impactData.diameter/2, 3) * 3000;
    
    // More lead time = more effective deflection
    const baseDeflection = method.efficiency * 0.01 / Math.sqrt(asteroidMass);
    const deltaV = baseDeflection * Math.sqrt(leadTimeYears);
    
    // Calculate miss distance based on delta-V and time
    const missDistance = deltaV * leadTimeYears * 365 * 24 * 3600 * impactData.velocity;
    
    // Cost decreases with more lead time (inverse relationship)
    // Short notice = urgent missions = much higher cost
    const urgencyMultiplier = Math.pow(20 / leadTimeYears, 1.5);
    const cost = method.cost * urgencyMultiplier;
    
    return {
        deltaV,
        missDistance,
        success: missDistance > 100000,
        cost: cost.toFixed(0)
    };
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
            document.getElementById('neoCount').textContent = '34,000+';
            document.getElementById('weekCount').textContent = elementCount;
        } else {
            throw new Error('API failed');
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
    document.getElementById('weekCount').textContent = sampleData.length;
    
    const tableBody = document.getElementById('trackerTableBody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="6" style="background: rgba(255,193,7,0.1); color: #ffc107; padding: 1rem; text-align: center;">⚠️ Using sample data - NASA API unavailable</td></tr>';
        displayAsteroids(sampleData);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchLiveData);
    }
});

// Add this after the initSearch() function in script.js

// Live Asteroid Tracker Search
function initLiveAsteroidSearch() {
    const trackerSection = document.getElementById('tracker');
    if (!trackerSection) return;
    
    // Add search box for specific asteroid
    const searchContainer = document.querySelector('.tracker-controls');
    if (searchContainer) {
        const liveSearchBtn = document.createElement('button');
        liveSearchBtn.className = 'refresh-btn';
        liveSearchBtn.style.background = '#4ecdc4';
        liveSearchBtn.innerHTML = '<span class="icon">🔍</span> Track Asteroid';
        liveSearchBtn.onclick = showLiveAsteroidSearch;
        searchContainer.appendChild(liveSearchBtn);
    }
}

function showLiveAsteroidSearch() {
    // Create dialog
    const dialog = document.createElement('div');
    dialog.id = 'liveAsteroidDialog';
    dialog.style.cssText = 'display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000;';
    
    dialog.innerHTML = `
        <div style="background: rgba(10, 14, 39, 0.98); padding: 2rem; width: 500px; max-width: 90vw; border-radius: 15px; border: 2px solid #4ecdc4; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
            <h2 style="color: #4ecdc4; margin-top: 0;">Track Live Asteroid</h2>
            <p style="color: #c0c0c0; font-size: 0.9rem; margin-bottom: 1rem;">Search for any asteroid to view its live tracking data</p>
            <input type="text" id="liveAsteroidInput" placeholder="e.g., Apophis, 99942, Bennu, 433 Eros" 
                style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(78, 205, 196, 0.4); 
                background: rgba(15, 23, 42, 0.6); color: white; font-size: 1rem; margin-bottom: 1rem;">
            <div id="liveAsteroidStatus" style="color: #4ecdc4; margin-bottom: 1rem; min-height: 20px; font-size: 0.9rem;"></div>
            <div id="liveAsteroidResults" style="display: none; margin-bottom: 1rem; max-height: 300px; overflow-y: auto;"></div>
            <div style="display: flex; gap: 1rem;">
                <button onclick="searchLiveAsteroid()" style="flex: 1; padding: 0.75rem; background: #4ecdc4; color: #0a0e27; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">Search</button>
                <button onclick="closeLiveAsteroidSearch()" style="flex: 1; padding: 0.75rem; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">Cancel</button>
            </div>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.id = 'liveAsteroidOverlay';
    overlay.style.cssText = 'display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 9999;';
    overlay.onclick = closeLiveAsteroidSearch;
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    document.getElementById('liveAsteroidInput').focus();
    
    // Enter key handler
    document.getElementById('liveAsteroidInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLiveAsteroid();
        }
    });
}

function closeLiveAsteroidSearch() {
    const dialog = document.getElementById('liveAsteroidDialog');
    const overlay = document.getElementById('liveAsteroidOverlay');
    if (dialog) dialog.remove();
    if (overlay) overlay.remove();
}

async function searchLiveAsteroid() {
    const searchInput = document.getElementById('liveAsteroidInput').value.trim();
    const statusDiv = document.getElementById('liveAsteroidStatus');
    const resultsDiv = document.getElementById('liveAsteroidResults');
    
    if (!searchInput) {
        statusDiv.innerHTML = '<span style="color: #ef4444;">Please enter an asteroid name or number</span>';
        resultsDiv.style.display = 'none';
        return;
    }
    
    statusDiv.innerHTML = '<span style="color: #4ecdc4;">Searching NASA database...</span>';
    resultsDiv.style.display = 'none';
    
    try {
        let response;
        let data;
        
        // Try local backend first
        try {
            response = await fetch(`http://localhost:3001/api/asteroid/${encodeURIComponent(searchInput)}`);
            data = await response.json();
        } catch (localError) {
            // Fallback to public proxy
            const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
            const publicProxyUrl = `${CORS_PROXY}${encodeURIComponent(`https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${encodeURIComponent(searchInput)}&full-prec=true`)}`;
            response = await fetch(publicProxyUrl);
            data = await response.json();
        }
        
        // Check for multiple matches
        if (data.code === 300 && data.list) {
            statusDiv.innerHTML = '<span style="color: #f59e0b;">Multiple matches found. Select one:</span>';
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = data.list.slice(0, 10).map(item => `
                <div style="padding: 0.75rem; margin: 0.5rem 0; background: rgba(78, 205, 196, 0.1); border-radius: 8px; cursor: pointer; border: 1px solid rgba(78, 205, 196, 0.3);" 
                     onclick="searchLiveAsteroid('${item.pdes}')">
                    <strong style="color: #4ecdc4;">${item.name || item.pdes}</strong>
                    <br><small style="color: #a0a0a0;">Designation: ${item.pdes}</small>
                </div>
            `).join('');
            return;
        }
        
        // Check if object found
        if (data.object && data.orbit) {
            displayLiveAsteroidData(data);
        } else {
            throw new Error('Not found');
        }
    } catch (error) {
        console.error('Live search error:', error);
        statusDiv.innerHTML = `<span style="color: #ef4444;">Asteroid "${searchInput}" not found.</span><br><small style="color: #a0a0a0;">Try: Apophis, Bennu, Eros, Ceres, Vesta</small>`;
        resultsDiv.style.display = 'none';
    }
}

function displayLiveAsteroidData(data) {
    const statusDiv = document.getElementById('liveAsteroidStatus');
    const resultsDiv = document.getElementById('liveAsteroidResults');
    
    statusDiv.innerHTML = '<span style="color: #10b981;">Found! Displaying tracking data...</span>';
    resultsDiv.style.display = 'block';
    
    // Extract data
    const name = data.object.fullname || data.object.des;
    const designation = data.object.des;
    const orbitClass = data.object.orbit_class?.name || 'Unknown';
    const isPHA = data.object.pha === 'Y';
    
    // Orbital elements
    const semiMajorAxis = data.orbit?.elements?.find(e => e.name === 'a')?.value || 'N/A';
    const eccentricity = data.orbit?.elements?.find(e => e.name === 'e')?.value || 'N/A';
    const inclination = data.orbit?.elements?.find(e => e.name === 'i')?.value || 'N/A';
    const perihelion = data.orbit?.elements?.find(e => e.name === 'q')?.value || 'N/A';
    const aphelion = data.orbit?.elements?.find(e => e.name === 'Q')?.value || 'N/A';
    const period = data.orbit?.elements?.find(e => e.name === 'per')?.value || 'N/A';
    
    // Physical parameters
    const diameter = data.phys_par?.diameter ? `${(data.phys_par.diameter * 1000).toFixed(0)} m` : 'Unknown';
    const magnitude = data.phys_par?.H || data.object.H || 'N/A';
    const albedo = data.phys_par?.albedo || 'N/A';
    
    // Close approach data
    const closeApproach = data.close_approach_data?.[0];
    const nextApproach = closeApproach ? new Date(closeApproach.cd).toLocaleDateString() : 'N/A';
    const approachDistance = closeApproach ? 
        `${(closeApproach.dist * 149597870.7).toFixed(0)} km` : 'N/A';
    const approachVelocity = closeApproach ? 
        `${(closeApproach.v_rel).toFixed(2)} km/s` : 'N/A';
    
    resultsDiv.innerHTML = `
        <div style="background: rgba(78, 205, 196, 0.05); border: 2px solid rgba(78, 205, 196, 0.3); border-radius: 10px; padding: 1.5rem;">
            <h3 style="color: #4ecdc4; margin: 0 0 1rem 0; font-size: 1.3rem;">${name}</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <strong style="color: #4ecdc4;">Designation:</strong>
                    <p style="color: white; margin: 0.25rem 0;">${designation}</p>
                </div>
                <div>
                    <strong style="color: #4ecdc4;">Orbit Class:</strong>
                    <p style="color: white; margin: 0.25rem 0;">${orbitClass}</p>
                </div>
                <div>
                    <strong style="color: #4ecdc4;">Hazardous:</strong>
                    <p style="margin: 0.25rem 0;">
                        <span style="background: ${isPHA ? '#f44336' : '#4caf50'}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: bold;">
                            ${isPHA ? 'YES' : 'NO'}
                        </span>
                    </p>
                </div>
            </div>
            
            <h4 style="color: #4ecdc4; margin: 1.5rem 0 0.75rem 0; border-top: 1px solid rgba(78, 205, 196, 0.3); padding-top: 1rem;">Physical Properties</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem;">
                <div>
                    <strong style="color: #a0a0a0; font-size: 0.85rem;">Diameter:</strong>
                    <p style="color: white; margin: 0.25rem 0;">${diameter}</p>
                </div>
                <div>
                    <strong style="color: #a0a0a0; font-size: 0.85rem;">Abs. Magnitude:</strong>
                    <p style="color: white; margin: 0.25rem 0;">${magnitude}</p>
                </div>
                <div>
                    <strong style="color: #a0a0a0; font-size: 0.85rem;">Albedo:</strong>
                    <p style="color: white; margin: 0.25rem 0;">${albedo}</p>
                </div>
            </div>
            
            <h4 style="color: #4ecdc4; margin: 1.5rem 0 0.75rem 0; border-top: 1px solid rgba(78, 205, 196, 0.3); padding-top: 1rem;">Orbital Elements</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem;">
                <div>
                    <strong style="color: #a0a0a0; font-size: 0.85rem;">Semi-major Axis:</strong>
                    <p style="color: white; margin: 0.25rem 0;">${semiMajorAxis} AU</p>
                </div>
                <div>
                    <strong style="color: #a0a0a0; font-size: 0.85rem;">Eccentricity:</strong>
                    <p style="color: white; margin: 0.25rem 0;">${eccentricity}</p>
                </div>
                <div>
                    <strong style="color: #a0a0a0; font-size: 0.85rem;">Inclination:</strong>
                    <p style="color: white; margin: 0.25rem 0;">${inclination}°</p>
                </div>
                <div>
                    <strong style="color: #a0a0a0; font-size: 0.85rem;">Perihelion:</strong>
                    <p style="color: white; margin: 0.25rem 0;">${perihelion} AU</p>
                </div>
                <div>
                    <strong style="color: #a0a0a0; font-size: 0.85rem;">Aphelion:</strong>
                    <p style="color: white; margin: 0.25rem 0;">${aphelion} AU</p>
                </div>
                <div>
                    <strong style="color: #a0a0a0; font-size: 0.85rem;">Orbital Period:</strong>
                    <p style="color: white; margin: 0.25rem 0;">${period} days</p>
                </div>
            </div>
            
            ${closeApproach ? `
                <h4 style="color: #4ecdc4; margin: 1.5rem 0 0.75rem 0; border-top: 1px solid rgba(78, 205, 196, 0.3); padding-top: 1rem;">Next Close Approach</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem;">
                    <div>
                        <strong style="color: #a0a0a0; font-size: 0.85rem;">Date:</strong>
                        <p style="color: white; margin: 0.25rem 0;">${nextApproach}</p>
                    </div>
                    <div>
                        <strong style="color: #a0a0a0; font-size: 0.85rem;">Distance:</strong>
                        <p style="color: white; margin: 0.25rem 0;">${approachDistance}</p>
                    </div>
                    <div>
                        <strong style="color: #a0a0a0; font-size: 0.85rem;">Velocity:</strong>
                        <p style="color: white; margin: 0.25rem 0;">${approachVelocity}</p>
                    </div>
                </div>
            ` : ''}
            
            <button onclick="closeLiveAsteroidSearch()" style="margin-top: 1.5rem; width: 100%; padding: 0.75rem; background: linear-gradient(45deg, #ff6b6b, #ee5a6f); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                Close
            </button>
        </div>
    `;
}

// Initialize live asteroid search on page load
document.addEventListener('DOMContentLoaded', () => {
    initLiveAsteroidSearch();
});

// Make functions globally accessible
window.showLiveAsteroidSearch = showLiveAsteroidSearch;
window.closeLiveAsteroidSearch = closeLiveAsteroidSearch;
window.searchLiveAsteroid = searchLiveAsteroid;