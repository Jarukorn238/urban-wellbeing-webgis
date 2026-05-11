/**
 * BKK Smart City - Urban Well-being Dashboard
 * Core GIS Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Map
    const map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([13.7563, 100.5018], 12);

    // Dark Map Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Layer Groups
    const layers = {
        stations: L.layerGroup().addTo(map),
        roads: L.layerGroup(),
        landuse: L.layerGroup(),
        buffer: L.layerGroup()
    };

    // 2. Load Data
    try {
        // Load Stations from JSON (already processed)
        const response = await fetch('stations.json');
        const stationData = await response.json();
        renderStations(stationData);
        
        // Generate Buffers based on stations
        renderBuffers(stationData);

        // Load MRT Lines (Small Shapefile) - Attempting to load via SHPJS
        // Note: In real scenarios, these should be zipped for shpjs. 
        // Here we simulate the effect if files aren't directly fetchable as a zip.
        loadMockLandUse();
        loadMockRoads();

    } catch (error) {
        console.error("Data loading failed:", error);
    }

    // 3. Render Functions

    function renderStations(data) {
        layers.stations.clearLayers();
        data.forEach(s => {
            const marker = L.circleMarker([s.lat, s.lng], {
                radius: 6,
                fillColor: '#2563eb', // Professional Blue
                color: '#fff',
                weight: 1.5,
                opacity: 1,
                fillOpacity: 0.9
            });

            // Popup
            const content = `
                <div class="popup-header"><h3>${s.name}</h3></div>
                <div class="popup-body">
                    <div class="popup-row"><span class="label">System:</span> <span class="value">${s.type}</span></div>
                    <div class="popup-row"><span class="label">Line:</span> <span class="value">${s.line}</span></div>
                    <div class="popup-row"><span class="label">Status:</span> <span class="value" style="color:#10b981">Active</span></div>
                </div>
            `;
            marker.bindPopup(content);

            // Hover Highlight
            marker.on('mouseover', function(e) {
                this.setStyle({ radius: 10, weight: 3, fillColor: '#60a5fa' });
            });
            marker.on('mouseout', function(e) {
                this.setStyle({ radius: 6, weight: 1.5, fillColor: '#2563eb' });
            });

            marker.addTo(layers.stations);
        });
    }

    function renderBuffers(data) {
        layers.buffer.clearLayers();
        data.forEach(s => {
            L.circle([s.lat, s.lng], {
                radius: 800, // 800m Buffer
                color: '#22d3ee',
                weight: 1,
                fillColor: '#22d3ee',
                fillOpacity: 0.15,
                interactive: false
            }).addTo(layers.buffer);
        });
    }

    function loadMockLandUse() {
        // Generating some sample polygons for Bangkok center to demonstrate Land Use
        const samples = [
            { name: "Siam Square", type: "Commercial", coords: [[13.746, 100.531], [13.746, 100.536], [13.743, 100.536], [13.743, 100.531]] },
            { name: "Lumphini Park", type: "Residential", coords: [[13.732, 100.537], [13.732, 100.547], [13.725, 100.547], [13.725, 100.537]] },
            { name: "Klong Toei", type: "Industrial", coords: [[13.712, 100.550], [13.712, 100.565], [13.705, 100.565], [13.705, 100.550]] }
        ];

        samples.forEach(poly => {
            const color = poly.type === "Commercial" ? "#ef4444" : (poly.type === "Residential" ? "#facc15" : "#a855f7");
            const layer = L.polygon(poly.coords, {
                color: color,
                weight: 1,
                fillColor: color,
                fillOpacity: 0.4
            }).addTo(layers.landuse);

            layer.bindPopup(`<strong>${poly.name}</strong><br>Type: ${poly.type}`);

            layer.on('mouseover', function() {
                this.setStyle({ fillOpacity: 0.7, weight: 3 });
            });
            layer.on('mouseout', function() {
                this.setStyle({ fillOpacity: 0.4, weight: 1 });
            });
        });
    }

    function loadMockRoads() {
        // Sample main roads to demonstrate connectivity
        const roads = [
            [[13.746, 100.500], [13.746, 100.600]], // Rama I / Sukhumvit
            [[13.700, 100.534], [13.800, 100.534]]  // Ratchadamri / Phahonyothin
        ];

        roads.forEach(line => {
            L.polyline(line, {
                color: '#64748b',
                weight: 3,
                opacity: 0.6
            }).addTo(layers.roads);
        });
    }

    // 4. UI Controls Logic

    // Layer Toggles
    document.getElementById('layer-stations').addEventListener('change', (e) => toggleLayer(layers.stations, e.target.checked));
    document.getElementById('layer-roads').addEventListener('change', (e) => toggleLayer(layers.roads, e.target.checked));
    document.getElementById('layer-landuse').addEventListener('change', (e) => toggleLayer(layers.landuse, e.target.checked));
    document.getElementById('layer-buffer').addEventListener('change', (e) => toggleLayer(layers.buffer, e.target.checked));

    function toggleLayer(layer, show) {
        if (show) map.addLayer(layer);
        else map.removeLayer(layer);
    }

    // Tools
    document.getElementById('locate-btn').addEventListener('click', () => {
        map.locate({ setView: true, maxZoom: 15 });
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        map.setView([13.7563, 100.5018], 12);
    });

    map.on('locationfound', (e) => {
        L.marker(e.latlng).addTo(map).bindPopup("Current Location").openPopup();
    });

    // District Filter (Mock interaction)
    document.getElementById('district-filter').addEventListener('change', (e) => {
        const dist = e.target.value;
        if (dist === "Pathum Wan") map.flyTo([13.746, 100.533], 14);
        else if (dist === "Bang Rak") map.flyTo([13.731, 100.523], 14);
        else if (dist === "all") map.flyTo([13.7563, 100.5018], 12);
    });
});