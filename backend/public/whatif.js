// Known asteroid data for What-If scenarios
const knownAsteroids = {
    bennu: { name: '101955 Bennu', diameter: 490, composition: 'stone', description: 'OSIRIS-REx mission target' },
    apophis: { name: '99942 Apophis', diameter: 340, composition: 'stone', description: 'Will pass close in 2029' },
    vesta: { name: '4 Vesta', diameter: 525000, composition: 'stone', description: 'Second-largest asteroid' },
    ceres: { name: '1 Ceres', diameter: 939000, composition: 'ice', description: 'Largest asteroid, dwarf planet' },
    eros: { name: '433 Eros', diameter: 16800, composition: 'stone', description: 'Near-Earth asteroid' },
    ryugu: { name: '162173 Ryugu', diameter: 900, composition: 'stone', description: 'Hayabusa2 mission target' },
    itokawa: { name: '25143 Itokawa', diameter: 330, composition: 'stone', description: 'Hayabusa mission target' }
};

// Expanded database matching script.js
const whatifAsteroidDatabase = {
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

let whatifMap = null;
let customAsteroidData = null;
let whatifImpactZones = [];

// Initialize What-If scenario generator
document.addEventListener('DOMContentLoaded', () => {
    const whatifBtn = document.getElementById('whatifGenerateBtn');
    if (whatifBtn) {
        whatifBtn.addEventListener('click', generateWhatIfScenario);
    }
    
    // Add custom asteroid search button
    const whatifControls = document.querySelector('.whatif-controls');
    if (whatifControls) {
        const searchBtn = document.createElement('button');
        searchBtn.className = 'simulate-btn';
        searchBtn.style.background = '#4ecdc4';
        searchBtn.innerHTML = '🔍 Search Custom Asteroid';
        searchBtn.onclick = showWhatIfAsteroidSearch;
        whatifControls.appendChild(searchBtn);
    }
});

function showWhatIfAsteroidSearch() {
    const dialog = document.createElement('div');
    dialog.id = 'whatifSearchDialog';
    dialog.style.cssText = 'display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000;';
    
    dialog.innerHTML = `
        <div style="background: rgba(10, 14, 39, 0.98); padding: 2rem; width: 400px; border-radius: 15px; border: 2px solid #4ecdc4; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
            <h2 style="color: #4ecdc4; margin-top: 0;">Search Custom Asteroid</h2>
            <p style="color: #c0c0c0; font-size: 0.9rem; margin-bottom: 1rem;">Search for any asteroid to use in What-If scenarios</p>
            <input type="text" id="whatifSearchInput" placeholder="Enter name or number (e.g., Bennu, 433)" 
                style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(78, 205, 196, 0.4); 
                background: rgba(15, 23, 42, 0.6); color: white; font-size: 1rem; margin-bottom: 1rem;">
            <div id="whatifSearchStatus" style="color: #4ecdc4; margin-bottom: 1rem; min-height: 20px;"></div>
            <div style="display: flex; gap: 1rem;">
                <button onclick="searchWhatIfAsteroid()" style="flex: 1; padding: 0.75rem; background: #4ecdc4; color: #0a0e27; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">Search</button>
                <button onclick="closeWhatIfAsteroidSearch()" style="flex: 1; padding: 0.75rem; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">Cancel</button>
            </div>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.id = 'whatifSearchOverlay';
    overlay.style.cssText = 'display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 9999;';
    overlay.onclick = closeWhatIfAsteroidSearch;
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    document.getElementById('whatifSearchInput').focus();
    
    // Enter key handler
    document.getElementById('whatifSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchWhatIfAsteroid();
        }
    });
}

function closeWhatIfAsteroidSearch() {
    const dialog = document.getElementById('whatifSearchDialog');
    const overlay = document.getElementById('whatifSearchOverlay');
    if (dialog) dialog.remove();
    if (overlay) overlay.remove();
}

async function searchWhatIfAsteroid() {
    const searchInput = document.getElementById('whatifSearchInput').value.trim().toLowerCase();
    const statusDiv = document.getElementById('whatifSearchStatus');
    
    if (!searchInput) {
        statusDiv.textContent = 'Please enter an asteroid name or number';
        statusDiv.style.color = '#ef4444';
        return;
    }
    
    statusDiv.textContent = 'Searching NASA database...';
    statusDiv.style.color = '#4ecdc4';
    
    // First try local database
    if (whatifAsteroidDatabase[searchInput]) {
        const data = whatifAsteroidDatabase[searchInput];
        loadCustomAsteroid(data.name, data.diameter, data.composition);
        statusDiv.textContent = 'Found! Asteroid loaded...';
        statusDiv.style.color = '#10b981';
        setTimeout(closeWhatIfAsteroidSearch, 1500);
        return;
    }
    
    // Try NASA API
    try {
        let response;
        let data;
        
        try {
            // Try local backend proxy first (relative URL for compatibility)
            response = await fetch(`/api/asteroid/${encodeURIComponent(searchInput)}`);
            data = await response.json();
            console.log('NASA Response:', data);
        } catch (localError) {
            // Fallback to public CORS proxy
            console.log('Local proxy unavailable, trying public proxy...');
            const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
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
            
            // Extract diameter (convert from km to meters if available)
            let diameter = 100; // Default
            if (data.phys_par && data.phys_par.diameter) {
                diameter = parseFloat(data.phys_par.diameter) * 1000;
            }
            
            // Estimate composition
            let composition = 'stone';
            if (data.object.orbit_class) {
                const orbitClass = data.object.orbit_class.name.toLowerCase();
                if (orbitClass.includes('trojan') || orbitClass.includes('comet')) {
                    composition = 'ice';
                } else if (name.toLowerCase().includes('psyche')) {
                    composition = 'iron';
                }
            }
            
            loadCustomAsteroid(name, diameter, composition);
            
            statusDiv.textContent = '✅ Found! Asteroid loaded...';
            statusDiv.style.color = '#10b981';
            setTimeout(closeWhatIfAsteroidSearch, 1500);
        } else {
            throw new Error('Not found');
        }
    } catch (error) {
        console.error('Search Error:', error);
        statusDiv.innerHTML = `❌ "${searchInput}" not found.<br><br>💡 Try: Ceres, Vesta, Eros, Apophis, Bennu`;
        statusDiv.style.color = '#ef4444';
    }
}

function loadCustomAsteroid(name, diameter, composition) {
    customAsteroidData = {
        name: name,
        diameter: diameter,
        composition: composition,
        description: 'Custom asteroid loaded from NASA database'
    };
    
    // Show notification
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
    notification.innerHTML = `Loaded: ${name}<br><small>${diameter >= 1000 ? (diameter/1000).toFixed(1) + ' km' : diameter + ' m'}</small>`;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

function generateWhatIfScenario() {
    const velocity = parseFloat(document.getElementById('whatifVelocity').value);
    const angle = parseFloat(document.getElementById('whatifAngle').value);
    
    let asteroid;
    let diameter;
    let composition;
    
    // Check if custom asteroid was loaded
    if (customAsteroidData) {
        asteroid = customAsteroidData;
        diameter = asteroid.diameter;
        composition = asteroid.composition;
    } else {
        // Use dropdown selection
        const asteroidKey = document.getElementById('whatifAsteroid').value;
        asteroid = knownAsteroids[asteroidKey];
        diameter = asteroid.diameter;
        composition = asteroid.composition;
    }
    
    // Random impact location
    const randomLat = (Math.random() * 160 - 80).toFixed(2);
    const randomLng = (Math.random() * 360 - 180).toFixed(2);
    
    // Calculate impact
    const densities = { iron: 7800, stone: 3000, ice: 917 };
    const density = densities[composition];
    const targetDensity = 2700;
    
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
    
    // Classification
    let impactClass = '';
    let globalEffect = '';
    
    if (energyMT >= 100000000) {
        impactClass = 'EXTINCTION LEVEL EVENT';
        globalEffect = 'Complete global devastation. Mass extinction of most life on Earth. Nuclear winter lasting decades. Collapse of civilization.';
    } else if (energyMT >= 1000000) {
        impactClass = 'GLOBAL CATASTROPHE';
        globalEffect = 'Continental-scale destruction. Global climate disruption for years. Potential collapse of modern civilization. Billions of casualties.';
    } else if (energyMT >= 10000) {
        impactClass = 'REGIONAL CATASTROPHE';
        globalEffect = 'Destruction across multiple countries. Severe global climate effects. Worldwide economic collapse. Hundreds of millions of casualties.';
    } else if (energyMT >= 100) {
        impactClass = 'MAJOR IMPACT';
        globalEffect = 'Country-scale devastation. Regional climate effects. Global economic disruption. Millions of casualties.';
    } else {
        impactClass = 'SIGNIFICANT IMPACT';
        globalEffect = 'City-scale destruction. Local climate effects. Tens of thousands of casualties.';
    }
    
    // Display results
    const resultsDiv = document.getElementById('whatifResults');
    const contentDiv = document.getElementById('whatifContent');
    
    contentDiv.innerHTML = `
        <div style="background: rgba(244, 67, 54, 0.2); padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
            <h4 style="color: #f44336; margin: 0 0 0.5rem 0;">Impact Classification: ${impactClass}</h4>
            <p style="color: #fff; margin: 0;">${globalEffect}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <p><span>Asteroid:</span> ${asteroid.name}</p>
            <p><span>Diameter:</span> ${diameter >= 1000 ? (diameter/1000).toFixed(1) + ' km' : diameter + ' m'}</p>
            <p><span>Impact Location:</span> ${randomLat}°, ${randomLng}°</p>
            <p><span>Impact Velocity:</span> ${velocity} km/s</p>
            <p><span>Energy Released:</span> ${energyMT.toExponential(2)} MT</p>
            <p><span>Crater Diameter:</span> ${craterDiameter.toFixed(0)} km</p>
            <p><span>Crater Depth:</span> ${craterDepth.toFixed(0)} km</p>
            <p><span>Earthquake Magnitude:</span> ${magnitude.toFixed(1)}</p>
            <p><span>Devastation Radius:</span> ${devastationRadius.toFixed(0)} km</p>
        </div>
        
        <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(78, 205, 196, 0.1); border-radius: 10px;">
            <h4 style="color: var(--secondary); margin: 0 0 0.5rem 0;">What Actually Happens:</h4>
            <p style="color: #c0c0c0; line-height: 1.8;">${asteroid.description}. This asteroid is currently in a stable orbit and is being monitored by NASA. This simulation shows the catastrophic consequences if something were to alter its trajectory toward Earth, emphasizing why planetary defense missions are critical.</p>
        </div>
    `;
    
    resultsDiv.style.display = 'block';
    
    // Show map with impact location - delay to ensure section is visible
    setTimeout(() => {
        showWhatIfMap(parseFloat(randomLat), parseFloat(randomLng), devastationRadius, craterDiameter);
    }, 100);
    
    // Reset custom asteroid after use
    customAsteroidData = null;
}

function showWhatIfMap(lat, lng, devastationRadius, craterDiameter) {
    const mapContainer = document.getElementById('whatifMap');
    const mapElement = document.getElementById('whatifLeafletMap');
    
    mapContainer.style.display = 'block';
    
    // Initialize map if not already created
    if (!whatifMap) {
        whatifMap = L.map('whatifLeafletMap', {
            center: [lat, lng],
            zoom: 4,
            minZoom: 2,
            maxZoom: 12
        });
        
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri',
            maxZoom: 19
        }).addTo(whatifMap);
    } else {
        // Update view to new location
        whatifMap.setView([lat, lng], 4);
    }
    
    // Force map to recalculate size
    setTimeout(() => {
        whatifMap.invalidateSize();
    }, 100);
    
    // Clear previous layers
    whatifMap.eachLayer(layer => {
        if (layer instanceof L.Circle || layer instanceof L.Marker) {
            whatifMap.removeLayer(layer);
        }
    });
    
    whatifImpactZones.forEach(zone => whatifMap.removeLayer(zone));
    whatifImpactZones = [];
    
    // Add impact marker with explosion effect
    const markerIcon = L.divIcon({
        className: 'whatif-impact-marker',
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        html: `
            <div style="
                width: 100%; 
                height: 100%;
                background: radial-gradient(circle, #fff 0%, #ff6b6b 30%, #ff5722 60%, transparent 100%);
                border: 4px solid #ff6b6b;
                border-radius: 50%;
                box-shadow: 0 0 30px #ff6b6b, 0 0 60px rgba(255, 107, 107, 0.5);
                animation: whatif-pulse 2s infinite;
            "></div>
        `
    });
    
    const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(whatifMap);
    marker.bindPopup('<h3>Impact Point</h3><p>Click for details</p>');
    
    // Add impact zones with labels
    const zones = [
        { 
            radius: craterDiameter * 500, 
            color: '#ff5722', 
            label: `Crater Zone (${craterDiameter.toFixed(1)} km)`, 
            opacity: 0.7 
        },
        { 
            radius: devastationRadius * 1000, 
            color: '#ff9800', 
            label: `Total Devastation (${devastationRadius.toFixed(0)} km)`, 
            opacity: 0.4 
        },
        { 
            radius: devastationRadius * 3000, 
            color: '#ffc107', 
            label: `Severe Damage (${(devastationRadius * 3).toFixed(0)} km)`, 
            opacity: 0.2 
        }
    ];
    
    zones.forEach(zone => {
        const circle = L.circle([lat, lng], {
            radius: zone.radius,
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: zone.opacity,
            weight: 3
        }).addTo(whatifMap).bindPopup(zone.label);
        
        whatifImpactZones.push(circle);
    });
    
    // Add explosion animation style
    if (!document.getElementById('whatif-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'whatif-animation-styles';
        style.textContent = `
            @keyframes whatif-pulse {
                0%, 100% { 
                    opacity: 1; 
                    transform: scale(1); 
                }
                50% { 
                    opacity: 0.7; 
                    transform: scale(1.15); 
                }
            }
            .whatif-impact-marker {
                background: transparent !important;
                border: none !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Make functions globally accessible
window.showWhatIfAsteroidSearch = showWhatIfAsteroidSearch;
window.closeWhatIfAsteroidSearch = closeWhatIfAsteroidSearch;
window.searchWhatIfAsteroid = searchWhatIfAsteroid;
