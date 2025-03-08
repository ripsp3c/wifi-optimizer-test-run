const enableBtn = document.getElementById('enable-btn');
const applyRoutesBtn = document.getElementById('apply-routes-btn');
const regionSelect = document.getElementById('region-select');
const fpsBoostBtn = document.getElementById('fps-boost-btn');
const gameSelect = document.getElementById('game-select');
const customServer = document.getElementById('custom-server');
const userLocationInput = document.getElementById('user-location');
const internetSpeedInput = document.getElementById('internet-speed');
const overlay = document.getElementById('overlay');
const overlayPing = document.getElementById('overlay-ping');
const overlayLoss = document.getElementById('overlay-loss');
const overlayHops = document.getElementById('overlay-hops');
const resultsDiv = document.getElementById('results');
const serverTableBody = document.getElementById('server-table-body');
const recommendation = document.getElementById('recommendation');

// Game server regions (approximate locations for simulation)
const gameServers = {
    valorant: [
        { region: 'US East (Virginia)', coords: { lat: 38.9, lon: -77.0 } },
        { region: 'US West (California)', coords: { lat: 37.8, lon: -122.4 } },
        { region: 'EU (Frankfurt)', coords: { lat: 50.1, lon: 8.7 } },
        { region: 'Asia (Singapore)', coords: { lat: 1.3, lon: 103.8 } },
        { region: 'South America (São Paulo)', coords: { lat: -23.5, lon: -46.6 } },
    ],
    fortnite: [
        { region: 'US East (Virginia)', coords: { lat: 38.9, lon: -77.0 } },
        { region: 'US West (Oregon)', coords: { lat: 45.5, lon: -122.7 } },
        { region: 'EU (London)', coords: { lat: 51.5, lon: -0.1 } },
        { region: 'Asia (Tokyo)', coords: { lat: 35.7, lon: 139.7 } },
        { region: 'South America (São Paulo)', coords: { lat: -23.5, lon: -46.6 } },
    ],
    league: [
        { region: 'US East (Ohio)', coords: { lat: 40.1, lon: -82.9 } },
        { region: 'EU West (Amsterdam)', coords: { lat: 52.4, lon: 4.9 } },
        { region: 'Asia (Seoul)', coords: { lat: 37.6, lon: 127.0 } },
        { region: 'Oceania (Sydney)', coords: { lat: -33.9, lon: 151.2 } },
    ],
    custom: [] // Populated dynamically based on user input
};

// Simulate user location coordinates
const locationCoords = {
    'new york': { lat: 40.7, lon: -74.0 },
    'los angeles': { lat: 34.0, lon: -118.2 },
    'london': { lat: 51.5, lon: -0.1 },
    'singapore': { lat: 1.3, lon: 103.8 },
    'são paulo': { lat: -23.5, lon: -46.6 },
    'tokyo': { lat: 35.7, lon: 139.7 },
    'default': { lat: 0, lon: 0 }
};

// Calculate distance (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Simulate network route analysis
function analyzeRoute(game, userLocation, internetSpeed, manualRegion = '') {
    const userLoc = userLocation.toLowerCase();
    const userCoords = locationCoords[userLoc.split(',')[0]] || locationCoords['default'];
    const speed = parseInt(internetSpeed) || 50;
    let servers = gameServers[game] || [];

    if (game === 'custom' && customServer.value) {
        servers = [{ region: customServer.value, coords: userCoords }]; // Use user-defined region
    }

    const results = servers.map(server => {
        const distance = calculateDistance(userCoords.lat, userCoords.lon, server.coords.lat, server.coords.lon);
        let basePing = distance / 10; // Rough estimate: 10 km = 1 ms
        const speedFactor = speed > 100 ? 0.9 : speed < 25 ? 1.2 : 1.0;
        basePing *= speedFactor;
        const packetLoss = Math.min(5, Math.random() * (distance / 1000) * (speed < 25 ? 2 : 1));
        const hops = Math.min(20, Math.max(5, Math.floor(distance / 500)));
        const score = (basePing * 0.6) + (packetLoss * 10) + (hops * 2);
        return {
            region: server.region,
            ping: Math.round(basePing),
            packetLoss: packetLoss.toFixed(1),
            hops: hops,
            score: score.toFixed(2)
        };
    }).filter(r => manualRegion ? r.region.toLowerCase().includes(manualRegion) : true);

    results.sort((a, b) => a.score - b.score);
    return results;
}

// Display results
function displayResults(results) {
    serverTableBody.innerHTML = '';
    results.forEach((result, index) => {
        const row = document.createElement('tr');
        if (index === 0) row.classList.add('best');
        row.innerHTML = `
            <td>${result.region}</td>
            <td>${result.ping}</td>
            <td>${result.packetLoss}%</td>
            <td>${result.hops}</td>
            <td>${result.score}</td>
        `;
        serverTableBody.appendChild(row);
    });
    const best = results[0];
    recommendation.textContent = `Recommended Server: ${best.region} (Ping: ${best.ping}ms, Packet Loss: ${best.packetLoss}%, Hops: ${best.hops})`;
    overlayPing.textContent = best.ping;
    overlayLoss.textContent = best.packetLoss;
    overlayHops.textContent = best.hops;
    resultsDiv.style.display = 'block';
}

// Event listeners
let optimizationEnabled = false;

enableBtn.addEventListener('click', () => {
    optimizationEnabled = !optimizationEnabled;
    enableBtn.textContent = optimizationEnabled ? 'Disable Optimization' : 'Enable Optimization';
    applyRoutesBtn.disabled = !optimizationEnabled;
    regionSelect.disabled = !optimizationEnabled;
    fpsBoostBtn.disabled = !optimizationEnabled;
    overlay.style.display = optimizationEnabled ? 'block' : 'none';
    if (optimizationEnabled) {
        const game = gameSelect.value;
        const userLocation = userLocationInput.value.trim();
        const internetSpeed = internetSpeedInput.value;
        if (!userLocation) {
            alert('Please enter your location (e.g., New York, USA).');
            optimizationEnabled = false;
            enableBtn.textContent = 'Enable Optimization';
            return;
        }
        if (game === 'custom' && !customServer.value) {
            alert('Please enter a custom server region (e.g., US East).');
            optimizationEnabled = false;
            enableBtn.textContent = 'Enable Optimization';
            return;
        }
        const results = analyzeRoute(game, userLocation, internetSpeed);
        displayResults(results);
    } else {
        resultsDiv.style.display = 'none';
    }
});

applyRoutesBtn.addEventListener('click', () => {
    const game = gameSelect.value;
    const userLocation = userLocationInput.value.trim();
    const internetSpeed = internetSpeedInput.value;
    const manualRegion = regionSelect.value || '';
    if (!userLocation) {
        alert('Please enter your location (e.g., New York, USA).');
        return;
    }
    if (game === 'custom' && !customServer.value) {
        alert('Please enter a custom server region (e.g., US East).');
        return;
    }
    const results = analyzeRoute(game, userLocation, internetSpeed, manualRegion);
    displayResults(results);
});

fpsBoostBtn.addEventListener('click', () => {
    alert('FPS Boost Enabled: Close background apps, set game.exe to High priority in Task Manager, and lower in-game graphics settings.');
});

gameSelect.addEventListener('change', () => {
    customServer.style.display = gameSelect.value === 'custom' ? 'inline' : 'none';
    if (gameSelect.value !== 'custom') customServer.value = '';
});
