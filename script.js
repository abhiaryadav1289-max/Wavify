const API_KEY = 'AlzaSyArLJC-WQUZ4UOS2kXT1CerwgDSiicrxk_w';

const state = {
    player: null,
    isPlaying: false,
    currentQueue: [],
    currentIndex: -1,
    isRepeat: false,
    isShuffle: false
};

// 1. Initialize YouTube API
function onYouTubeIframeAPIReady() {
    state.player = new YT.Player('ytIframe', {
        height: '0', width: '0',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady() {
    fetchTrending();
    initUIListeners();
}

// 2. Data Fetching Logic
async function fetchMusic(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${API_KEY}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) throw data.error;
        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumb: item.snippet.thumbnails.high.url
        }));
    } catch (err) {
        console.error("Wavify API Error:", err.message);
        return [];
    }
}

// 3. Playback Engine
function playTrack(track, queue) {
    state.currentQueue = queue;
    state.currentIndex = queue.findIndex(t => t.id === track.id);
    
    state.player.loadVideoById(track.id);
    updatePlayerUI(track);
}

function updatePlayerUI(track) {
    document.getElementById('playerBar').classList.remove('hidden');
    document.getElementById('playerTitle').innerText = track.title;
    document.getElementById('playerArtist').innerText = track.artist;
    document.getElementById('playerThumb').src = track.thumb;
    document.getElementById('playPauseBtn').innerText = '⏸';
}

// 4. Progress & Time Management
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        state.isPlaying = true;
        updateProgressLoop();
    } else {
        state.isPlaying = false;
        if (event.data === YT.PlayerState.ENDED) handleTrackEnd();
    }
}

function updateProgressLoop() {
    if (!state.isPlaying || !state.player) return;
    const current = state.player.getCurrentTime();
    const duration = state.player.getDuration();
    const progress = (current / duration) * 100;
    
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('currentTime').innerText = formatTime(current);
    document.getElementById('duration').innerText = formatTime(duration);
    
    requestAnimationFrame(updateProgressLoop);
}

// 5. UX & Search Logic
async function handleSearch(query) {
    if (!query) return;
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '<p>Searching...</p>';
    
    const results = await fetchMusic(query);
    if (results.length === 0) {
        resultsList.innerHTML = 'No results found.';
        return;
    }
    
    renderList(results, 'resultsList');
}

function renderList(songs, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = songs.map(song => `
        <div class="song-card" onclick='playTrack(${JSON.stringify(song).replace(/'/g, "&apos;")}, ${JSON.stringify(songs).replace(/'/g, "&apos;")})'>
            <img src="${song.thumb}">
            <h3>${song.title.substring(0, 35)}...</h3>
            <p>${song.artist}</p>
        </div>
    `).join('');
}

async function fetchTrending() {
    const songs = await fetchMusic("top hits 2026 trending");
    renderList(songs, 'trendingRow');
}

function formatTime(time) {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function initUIListeners() {
    // Search Debounce
    let debounce;
    document.getElementById('searchInput').oninput = (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => handleSearch(e.target.value), 600);
    };

    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.page, .nav-item').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`page-${btn.dataset.page}`).classList.add('active');
        };
    });

    // Simple Play/Pause Toggle
    document.getElementById('playPauseBtn').onclick = () => {
        if (state.isPlaying) {
            state.player.pauseVideo();
            document.getElementById('playPauseBtn').innerText = '▶';
        } else {
            state.player.playVideo();
            document.getElementById('playPauseBtn').innerText = '⏸';
        }
    };
}
