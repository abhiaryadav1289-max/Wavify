const YT_API_KEY = 'AlzaSyArLJC-WQUZ4UOS2kXT1CerwgDSiicrxk_w'; // Aapki Key

// YouTube API ko load karne ka sahi tareeka
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;
let isReady = false;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('ytPlayer', {
        height: '0', width: '0',
        events: {
            'onReady': () => { 
                isReady = true; 
                loadTrending(); // Page khulte hi gaane load honge
            }
        }
    });
}

// Trending Songs Load Karne ka function
async function loadTrending() {
    const songs = await fetchFromYT("top bollywood songs 2024");
    displaySongs(songs, 'trendingRow');
}

// Search Logic
document.getElementById('searchInput').onkeypress = async (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value;
        document.getElementById('searchResults').style.display = 'block';
        document.getElementById('resultsLabel').innerText = `Results for: ${query}`;
        const results = await fetchFromYT(query);
        displaySongs(results, 'resultsList');
    }
};

async function fetchFromYT(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${query}&type=video&videoCategoryId=10&key=${YT_API_KEY}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumb: item.snippet.thumbnails.medium.url
        }));
    } catch (err) {
        console.error("API Error:", err);
        return [];
    }
}

function displaySongs(songs, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    songs.forEach(song => {
        const div = document.createElement('div');
        div.style.cursor = "pointer";
        div.innerHTML = `
            <div class="song-item" style="margin-bottom:10px; display:flex; gap:10px; align-items:center;">
                <img src="${song.thumb}" width="60">
                <div>
                    <p style="margin:0; font-size:14px;"><b>${song.title.substring(0,30)}</b></p>
                    <small>${song.artist}</small>
                </div>
            </div>
        `;
        div.onclick = () => {
            player.loadVideoById(song.id);
            document.getElementById('miniPlayer').classList.remove('hidden');
            document.getElementById('miniTitle').innerText = song.title;
            document.getElementById('miniThumb').src = song.thumb;
        };
        container.appendChild(div);
    });
}

