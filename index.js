// CAM LIST

const URL = 'https://cors-anywhere.herokuapp.com/https://cams.is74.ru/api/limited-info';

const DATA = {
    CAMERA_IDS: [36693, 957, 36704, 14201, 1013, 17121, 45455, 14252, 4150, 974, 954, 12829, 997, 961, 970, 1668, 971, 15107, 21127, 14889, 4638, 995, 15044, 21960, 14980, 32670, 15159, 9530, 998, 999, 952, 101, 1005, 960, 9540, 17126, 973, 964, 966, 18598, 21883, 15155, 32648, 19385, 98, 16572, 19318, 100, 16446, 16377, 956, 19254, 953, 798, 20325, 1839, 17572, 15267, 12937, 97, 1014, 21885, 23325, 969, 9550, 3439, 1044, 19051, 959, 968, 17401, 965, 955, 23889, 102, 18802, 972, 35670, 967, 42626, 18588, 32673, 977, 14248, 23455, 35612, 958, 9531, 9536, 9537, 9517, 1003, 2618, 14413, 5523, 996, 963, 3822, 9563]
};

const camListContainer = document.getElementById('camlist-container');

const load_in_text = document.getElementById('load-in-text');

let currentView = false; // 0 - Camera List, 1 - Camera Map

function AddCamItem(snapshot_url, location_title, location_addr, hls_link) {
    const gridItem = document.createElement('div');
    gridItem.className = 'camlist-item';
    
    const img = document.createElement('img');
    img.src = snapshot_url;
    img.alt = '.';
    
    const h3 = document.createElement('h3');
    h3.textContent = location_title;
    
    const button = document.createElement('button');
    button.textContent = 'Open Stream';
    button.onclick = () => StartStream(hls_link);
    
    const p = document.createElement('p');
    p.textContent = location_addr;
    
    gridItem.appendChild(img);
    gridItem.appendChild(h3);
    gridItem.appendChild(button);
    gridItem.appendChild(p);
    
    camListContainer.appendChild(gridItem);
}

function StartStream(hls_link) {
    openModal(hls_link);
}

function ForEachList(data) {
    const parsedData = data;
    
    for(const key in parsedData) {
        if(parsedData.hasOwnProperty(key)) {
            const itemData = parsedData[key];
            let hls_link = itemData.MEDIA.HLS.LIVE.MAIN;

            AddCamItem(itemData.MEDIA.SNAPSHOT.LIVE.LOSSY, itemData.NAME, itemData.ADDRESS, hls_link);
            AddCameraMarker(itemData.POSITION.LATITUDE, itemData.POSITION.LONGITUDE, itemData.NAME, hls_link);
        }
    }

    load_in_text.style.display = 'none';
}

function LoadCamList() {
    fetch(URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Origin': 'https://stream.is74.ru',
            'Referer': 'https://stream.is74.ru/'
        },
        body: JSON.stringify(DATA)
    })
    .then(response => {
        if(!response.ok) throw new Error('Network error while request.');
        return response.json();
    })
    .then(data => {
        ForEachList(data);
    })
    .catch(error => {
        console.error(error);
    });
}

// MODAL WINDOW

const modal = document.getElementById('video-modal');
const video = document.getElementById('live-video');

document.querySelector('.close').onclick = function() {
    closeModal();
};

function openModal(hls_link) {
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(hls_link);
        hls.attachMedia(video);
        video.play();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hls_link;
        video.addEventListener('loadedmetadata', function() {
            video.play();
        });
    }
    
    modal.style.display = "block";
}

function closeModal() {
    video.pause();
    video.src = "";
    
    modal.style.display = "none";
}

// MAP

let map;

const trackList = new Map();

const typeColors = {
    0: '#196dc2', // Автобус
    1: '#d92c23', // Троллейбус
    3: '#16b84c', // Трамвай
    DEFAULT: '#b3b3b3'
};

let cameraLayer; // Cameras
let transportLayer; // GPS Tracking

const GPS_TRACKING_URL = 'https://cors-anywhere.herokuapp.com/https://gortrans74.ru/gps.txt';

const mapContainer = document.getElementById('camera-map');

function getColorByType(type) {
    return typeColors[type] || typeColors.DEFAULT;
}

function getTypeName(type) {
    if(type === 0) return 'Bus';
    if(type === 1) return 'Trolleybus';
    if(type === 3) return 'Tram';

    return 'Unknown';
}

function UpdateOrCreateTrackMarker(entry) {
    if(trackList.has(entry.id)) {
        const marker = trackList.get(entry.id);
        marker.setLatLng([entry.lat, entry.lng]);
    } else {
        const marker = AddTransportMarker(entry);
        trackList.set(entry.id, marker);
    }
}

function RemoveOutdatedTrackMarkers(validIds) {
    for(const [id, marker] of trackList.entries()) {
        if(!validIds.has(id)) {
            transportLayer.removeLayer(marker);
            trackList.delete(id);
        }
    }
}

function parseLine(line) {
    line = line.trim().replace(/\s+z$/, '');
    let parsedLine = line.split(',');

    if(parsedLine.length < 7) return null;

    const [TYPE, ROUTE_NUM, LNG, LAT, SPEED, DIR, ID] = parsedLine;

    return {
        type: TYPE,
        route: ROUTE_NUM,
        lng: LNG / 1e6,
        lat: LAT / 1e6,
        speed: SPEED,
        direction: DIR,
        id: ID
    };
}

function parseResponseText(text) {
    const lines = text.trim().split('\n');
    const validIds = new Set();

    for(const line of lines) {
        const entry = parseLine(line);

        if(!entry) continue;

        validIds.add(entry.id);

        UpdateOrCreateTrackMarker(entry);
    }

    RemoveOutdatedTrackMarkers(validIds);
}

function SwitchView() {
    if(currentView) {
        camListContainer.style.display = 'grid';
        mapContainer.style.display = 'none';
    } else {
        camListContainer.style.display = 'none';
        mapContainer.style.display = 'block';
    }

    currentView = !currentView; // Map/List View
}

function AddCameraMarker(lat, lon, title, hls_link) {
    let marker = L.marker({lat, lon}).addTo(cameraLayer).bindPopup(title);

    marker.addEventListener('click', () => {
        StartStream(hls_link);
    });
}

function AddTransportMarker(entry) {
    const color = getColorByType(entry.type);

    const markerTemplate = `
        <div class="transport-marker" style="position: relative; transform: rotate(${45 + entry.direction}deg);">
            <div class="circle" style="background-color: ${color};"></div>
            <div class="arrow" style="border-color: ${color};"></div>
        </div>
    `;

    const markerIcon = L.divIcon({
        className: '',
        html: markerTemplate,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    const marker = L.marker([entry.lat, entry.lng], { icon: markerIcon });

    marker.bindTooltip(`<div title="${getTypeName(entry.type)} - ${entry.speed} km/h"><span class="route-label">${entry.route}</span></div>`, {
        permanent: true,
        direction: 'center',
        className: 'no-background'
    });

    marker.addTo(transportLayer);

    return marker;
}

function LoadMap() {
    map = L.map('camera-map').setView([55.164440, 61.436844], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> Contributors'
    }).addTo(map);

    cameraLayer = L.layerGroup().addTo(map);
    transportLayer = L.layerGroup().addTo(map);

    L.control.layers(null, {
        'Cameras': cameraLayer,
        'City Transport': transportLayer
    }).addTo(map);
}

function FetchAndUpdateTrackData() {
    const currentTime = Date.now();

    fetch('https://cors-anywhere.herokuapp.com/https://gortrans74.ru/gps.txt', {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Origin': 'https://gortrans74.ru',
            'Referer': 'https://gortrans74.ru/'
        }
    })
    .then(response => response.text())
    .then(parseResponseText)
    .catch(error => console.error(error));
}

// LOAD

LoadMap();

LoadCamList();

// City Transport Data
FetchAndUpdateTrackData();
setInterval(FetchAndUpdateTrackData, 45000);
