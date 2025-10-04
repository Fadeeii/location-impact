// Configuration
const NASA_API_KEY = 'DEMO_KEY';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// USGS API Endpoints
const USGS_ELEVATION_API = 'https://epqs.nationalmap.gov/v1/json';
const USGS_EARTHQUAKE_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

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

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTooltips();
    loadHistoricalImpacts();
    loadPredictions();
    fetchLiveData();
    initSearch();
    setInterval(fetchLiveData, 600000);
});

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
    
    // Add tooltips to existing elements
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
    
    // Calculate impact severity for sizing/coloring
    historicalImpacts.forEach(impact => {
        // Determine impact severity based on diameter and energy
        let severity = 'low';
        let markerSize = 20;
        let color = '#ff9800'; // orange
        let opacity = 0.6;
        
        const diameter = parseFloat(impact.diameter);
        
        if (diameter >= 100 || impact.energy.includes('100 million')) {
            severity = 'catastrophic'; // Mass extinction level
            markerSize = 50;
            color = '#d32f2f'; // Dark red
            opacity = 0.9;
        } else if (diameter >= 50 || impact.energy.includes('50 million')) {
            severity = 'major'; // Continental scale
            markerSize = 40;
            color = '#f44336'; // Red
            opacity = 0.85;
        } else if (diameter >= 10 || impact.energy.includes('10-15 megatons') || impact.energy.includes('10 megatons')) {
            severity = 'significant'; // Regional impact
            markerSize = 30;
            color = '#ff5722'; // Deep orange
            opacity = 0.75;
        } else if (diameter >= 1) {
            severity = 'moderate'; // Local impact
            markerSize = 25;
            color = '#ff9800'; // Orange
            opacity = 0.65;
        } else {
            severity = 'minor'; // Airburst/small
            markerSize = 18;
            color = '#ffb74d'; // Light orange
            opacity = 0.5;
        }
        
        // Create custom marker with dynamic size and color
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
    
    // Add custom animation styles
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
        
        // Fetch USGS elevation data
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
        
        const overlay = document.getElementById('explosionOverlay');
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
    overlay.innerHTML = '';
    
    createExplosionElement(overlay, x, y, 'explosion-flash', 0);
    createExplosionElement(overlay, x, y, 'explosion-fireball', 100);
    createExplosionElement(overlay, x, y, 'explosion-core', 150);
    
    for (let i = 0; i < 3; i++) {
        createExplosionElement(overlay, x, y, 'explosion-ring', 200 + i * 300);
    }
    
    createExplosionElement(overlay, x, y, 'explosion-shockwave', 300);
    
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

// Run simulation with USGS data and mitigation
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
    
    // Calculate impact
    const radius = diameter / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    const mass = volume * density;
    
    const velocityMs = velocity * 1000;
    const kineticEnergy = 0.5 * mass * Math.pow(velocityMs, 2);
    const energyMT = kineticEnergy / 4.184e15;
    
    // Improved crater scaling
    const craterDiameter = 1.8 * Math.pow(energyMT, 0.3) * 
        Math.pow(density/targetDensity, 0.17) * 
        Math.pow(Math.sin(angle * Math.PI/180), 0.33);
    const craterDepth = craterDiameter / 5;
    
    // Seismic effects
    const magnitude = 0.67 * Math.log10(energyMT * 1000) - 5.87;
    
    // Other effects
    const devastationRadius = craterDiameter * 10;
    const fireballDiameter = diameter * 2.5;
    const thermalRadius = Math.pow(energyMT, 0.41) * 2.5;
    const shockwaveRange = devastationRadius * 3;
    
    // Tsunami calculation for ocean impacts
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
    
    // Atmospheric effects
    const dustVolumeKm3 = craterDiameter * craterDepth;
    const stratosphericDust = dustVolumeKm3 * 0.3;
    const temperatureDrop = stratosphericDust > 1000 ? 10 : stratosphericDust > 100 ? 5 : 2;
    
    currentImpactData = {
        location: clickedLocation,
        diameter, velocity, angle, composition,
        energyMT, craterDiameter, magnitude,
        tsunamiData, temperatureDrop
    };
    
    // Draw zones
    drawImpactZones(craterDiameter, devastationRadius, thermalRadius, shockwaveRange, tsunamiData);
    
    // Display results
    displayResults(energyMT, craterDiameter, craterDepth, magnitude, devastationRadius, 
                   fireballDiameter, thermalRadius, shockwaveRange, dustVolumeKm3, 
                   tsunamiData, temperatureDrop);
    
    // Show mitigation options
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
    let html = '<h3>Mitigation Strategies</h3><div class="mitigation-grid">';
    
    const methods = [
        { name: 'Kinetic Impactor', efficiency: 0.8, cost: 500 },
        { name: 'Gravity Tractor', efficiency: 0.6, cost: 2000 },
        { name: 'Nuclear Deflection', efficiency: 0.95, cost: 5000 }
    ];
    
    methods.forEach(method => {
        leadTimes.forEach(years => {
            const result = simulateDeflection(currentImpactData, method, years);
            const successClass = result.success ? 'success' : 'failure';
            
            html += `
                <div class="mitigation-card ${successClass}">
                    <h4>${method.name}</h4>
                    <p><span>Lead Time:</span> ${years} years</p>
                    <p><span>Delta-V Required:</span> ${result.deltaV.toFixed(3)} m/s</p>
                    <p><span>Miss Distance:</span> ${result.missDistance.toLocaleString()} km</p>
                    <p><span>Success:</span> ${result.success ? 'YES' : 'NO'}</p>
                    <p><span>Estimated Cost:</span> $${result.cost}M</p>
                </div>
            `;
        });
    });
    
    html += '</div>';
    mitigationDiv.innerHTML = html;
    mitigationDiv.style.display = 'block';
}

function simulateDeflection(impactData, method, leadTimeYears) {
    const asteroidMass = (4/3) * Math.PI * Math.pow(impactData.diameter/2, 3) * 3000;
    
    const baseDeflection = method.efficiency * 0.01 / Math.sqrt(asteroidMass);
    const deltaV = baseDeflection * Math.sqrt(leadTimeYears);
    
    const missDistance = deltaV * leadTimeYears * 365 * 24 * 3600 * impactData.velocity;
    
    const cost = method.cost * (1 + 1/leadTimeYears);
    
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

