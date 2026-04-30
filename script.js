// ════════ CONFIGURATION ════════
const YT_API_KEY = 'AlzaSyArLJC-WQUZ4UOS2kXT1CerwgDSiicrxk_w';
const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

// ════════ STATE MANAGEMENT ════════
let state = {
    currentTrack: null,
    isPlaying: false,
    player: null,
    isReady: false,
    queue: [],
    history: []
};

// ════════ INITIALIZATION ════════
function onYouTubeIframeAPIReady() {
    state.player = new YT.Player('ytPlayer', {
        height: '0',
        width: '0',
        playerVars: { 'autoplay': 0, 'controls': 0 },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady() {
    state.isReady = true;
    loadInitialContent();
}

// ════════ UI NAVIGATION ════════
document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach(btn => {
    btn.onclick = () => {
        const pageId = btn.getAttribute('data-page');
        showPage(pageId);
    };
});

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${id}`).classList.add('active');
}

// ════════ FETCHING DATA ════════
async function loadInitialContent() {
    const trending = await fetchMusic("latest hindi and english hits 2026");
    renderCards(trending, 'trendingRow');
    
    const quickPicks = await fetchMusic("lofi chill music");
    renderCards(quickPicks.slice(0, 6), 'quickPicks', true);
}

async function fetchMusic(query) {
    try {
        const response = await fetch(`${YT_API_BASE}/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${YT_API_KEY}`);
        const data = await response.json();
        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumb: item.snippet.thumbnails.high.url
        }));
    } catch (error) {
        console.error("Search Error:", error);
        return [];
    }
}

// ════════ SEARCH LOGIC ════════
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value;
        if (!query) return;

        document.getElementById('searchDefault').style.display = 'none';
        document.getElementById('searchResults').style.display = 'block';
        document.getElementById('resultsLabel').innerText = `Results for "${query}"`;

        const results = await fetchMusic(query);
        renderList(results, 'resultsList');
        
        // Update Recommendations based on search
        const recommendations = await fetchMusic(query + " similar songs");
        document.getElementById('recommendedSection').style.display = 'block';
        renderCards(recommendations, 'recommendedRow');
    }
});

// ════════ RENDERING ════════
function renderCards(songs, containerId, isQuickPick = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    songs.forEach(song => {
        const card = document.createElement('div');
        card.className = isQuickPick ? 'quick-pick-item' : 'song-card';
        card.innerHTML = `
            <img src="${song.thumb}" alt="${song.title}">
            <div class="card-info">
                <h3>${song.title.substring(0, 25)}...</h3>
                <p>${song.artist}</p>
            </div>
        `;
        card.onclick = () => playSong(song);
        container.appendChild(card);
    });
}

function renderList(songs, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    songs.forEach(song => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <img src="${song.thumb}">
            <div class="result-info">
                <h4>${song.title}</h4>
                <p>${song.artist}</p>
            </div>
        `;
        item.onclick = () => playSong(song);
        container.appendChild(item);
    });
}

// ════════ PLAYER CONTROLS ════════
function playSong(song) {
    if (!state.isReady) return;
    state.currentTrack = song;
    state.player.loadVideoById(song.id);
    
    // Update Mini Player
    document.getElementById('miniPlayer').classList.remove('hidden');
    document.getElementById('miniTitle').innerText = song.title;
    document.getElementById('miniArtist').innerText = song.artist;
    document.getElementById('miniThumb').src = song.thumb;

    // Update Full Player
    document.getElementById('playerTitle').innerText = song.title;
    document.getElementById('playerArtist').innerText = song.artist;
    document.getElementById('playerThumb').src = song.thumb;
    document.getElementById('playerBg').style.backgroundImage = `url(${song.thumb})`;
}

document.getElementById('miniPlay').onclick = togglePlay;
document.getElementById('mainPlayBtn').onclick = togglePlay;

function togglePlay() {
    if (state.isPlaying) {
        state.player.pauseVideo();
    } else {
        state.player.playVideo();
    }
}

function onPlayerStateChange(event) {
    const playIcons = document.querySelectorAll('.icon-play');
    const pauseIcons = document.querySelectorAll('.icon-pause');

    if (event.data == YT.PlayerState.PLAYING) {
        state.isPlaying = true;
        playIcons.forEach(i => i.classList.add('hidden'));
        pauseIcons.forEach(i => i.classList.remove('hidden'));
    } else {
        state.isPlaying = false;
        playIcons.forEach(i => i.classList.remove('hidden'));
        pauseIcons.forEach(i => i.classList.add('hidden'));
    }
}

// Full Player Toggle
document.getElementById('miniPlayer').onclick = (e) => {
    if (e.target.closest('.mini-controls')) return;
    document.getElementById('fullPlayer').classList.remove('hidden');
};

document.getElementById('playerDown').onclick = () => {
    document.getElementById('fullPlayer').classList.add('hidden');
};
