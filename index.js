// CAM LIST

const URL = 'https://cams.is74.ru/api/limited-info';

const DATA = {
    CAMERA_IDS: [36693, 957, 36704, 14201, 1013, 17121, 45455, 14252, 4150, 974, 954, 12829, 997, 961, 970, 1668, 971, 15107, 21127, 14889, 4638, 995, 15044, 21960, 14980, 32670, 15159, 9530, 998, 999, 952, 101, 1005, 960, 9540, 17126, 973, 964, 966, 18598, 21883, 15155, 32648, 19385, 98, 16572, 19318, 100, 16446, 16377, 956, 19254, 953, 798, 20325, 1839, 17572, 15267, 12937, 97, 1014, 21885, 23325, 969, 9550, 3439, 1044, 19051, 959, 968, 17401, 965, 955, 23889, 102, 18802, 972, 35670, 967, 42626, 18588, 32673, 977, 14248, 23455, 35612, 958, 9531, 9536, 9537, 9517, 1003, 2618, 14413, 5523, 996, 963, 3822, 9563]
};

const TEST_DATA = {
    "36693": {
        "NAME": "250-летия Челябинска - Академика Макеева",
        "ADDRESS": "Челябинск, ул. 250-летия Челябинска, д. 63",
        "MEDIA": {
            "SNAPSHOT": {
                "LIVE": {
                    "LOSSY": "https://cdn.cams.is74.ru/snapshot?uuid=ab7346d3-b64c-4754-a02a-96f01fd2a2fa&lossy=1"
                }
            },
            "HLS": {
                "LIVE": {
                    "MAIN": "https://cdn.cams.is74.ru/hls/playlists/multivariant.m3u8?uuid=ab7346d3-b64c-4754-a02a-96f01fd2a2fa"
                }
            }
        }
    }
};

const camlistContainer = document.getElementById('camlist-container');

//let cameraList = [];

class Camera {
    constructor(data) {}
}

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
    
    camlistContainer.appendChild(gridItem);
}

function StartStream(hls_link) {
    //console.log(hls_link);
    openModal(hls_link);
}

function ForEachList(data) {
    const parsedData = data;
    
    for(const key in parsedData) {
        if(parsedData.hasOwnProperty(key)) {
            const itemData = parsedData[key];
            AddCamItem(itemData.MEDIA.SNAPSHOT.LIVE.LOSSY, itemData.NAME, itemData.ADDRESS, itemData.MEDIA.HLS.LIVE.MAIN);
        }
    }
}

function LoadCamList() {
    fetch(URL, {
        method: 'POST',
        mode: 'cors',
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
        //console.log(data);
        ForEachList(data);
    })
    .catch(error => {
        console.error(error);
    });
}

LoadCamList();

// Used for debug
//ForEachList(TEST_DATA);

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
