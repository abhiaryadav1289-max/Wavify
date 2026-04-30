const YT_KEY = 'AlzaSyArLJC-WQUZ4UOS2kXT1CerwgDSiicrxk_w'; //

const state = {
    player: null,
    currentTrack: null,
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    isShuffle: false,
    isRepeat: false,
    recent: JSON.parse(localStorage.getItem('recent_wavify') || '[]')
};

// 1. YouTube Lifecycle
function onYouTubeIframeAPIReady() {
    state.player = new YT.Player('ytIframe', {
        height: '0', width: '0',
        events: {
            'onReady': () => { initApp(); },
            'onStateChange': onPlayerStateChange
        }
    });
}

function initApp() {
    fetchTrending();
    setupEventListeners();
    updateRecentUI();
}

// 2. Core Search Logic (with Debounce)
async function fetchYT(query) {
    try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${YT_KEY}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.items.map(v => ({
            id: v.id.videoId,
            title: v.snippet.title,
            artist: v.snippet.channelTitle,
            thumb: v.snippet.thumbnails.high.url
        }));
    } catch (e) {
        console.error("API Error:", e);
        return [];
    }
}

// 3. UI Rendering
function renderGrid(songs, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = songs.map((s, index) => `
        <div class="song-card" onclick="playSong(${JSON.stringify(s).replace(/"/g, '&quot;')}, '${containerId}')">
            <img src="${s.thumb}">
            <h3>${s.title}</h3>
            <p>${s.artist}</p>
        </div>
    `).join('');
}

// 4. Playback Logic
function playSong(song, sourceContainer = null) {
    state.currentTrack = song;
    state.player.loadVideoById(song.id);
    
    // Update UI
    document.getElementById('playerBar').classList.remove('hidden');
    document.getElementById('playerTitle').innerText = song.title;
    document.getElementById('playerArtist').innerText = song.artist;
    document.getElementById('playerThumb').src = song.thumb;
    document.getElementById('playPauseBtn').innerText = '⏸';
    state.isPlaying = true;

    // Save to Recent
    state.recent = [song, ...state.recent.filter(i => i.id !== song.id)].slice(0, 6);
    localStorage.setItem('recent_wavify', JSON.stringify(state.recent));
    updateRecentUI();
}

function onPlayerStateChange(e) {
    if (e.data === YT.PlayerState.PLAYING) {
        state.isPlaying = true;
        document.getElementById('playPauseBtn').innerText = '⏸';
        updateProgress();
    } else if (e.data === YT.PlayerState.PAUSED) {
        state.isPlaying = false;
        document.getElementById('playPauseBtn').innerText = '▶';
    }
}

function updateProgress() {
    if (!state.isPlaying) return;
    const curr = state.player.getCurrentTime();
    const dur = state.player.getDuration();
    const perc = (curr / dur) * 100;
    document.getElementById('progressFill').style.width = perc + '%';
    document.getElementById('currentTime').innerText = formatTime(curr);
    document.getElementById('duration').innerText = formatTime(dur);
    setTimeout(updateProgress, 1000);
}

// 5. Helpers & Events
function formatTime(s) {
    let m = Math.floor(s / 60);
    s = Math.floor(s % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nav-item, .page').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`page-${btn.dataset.page}`).classList.add('active');
        };
    });

    // Search
    let timeout;
    document.getElementById('searchInput').oninput = (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            if (e.target.value.length < 2) return;
            const results = await fetchYT(e.target.value);
            renderGrid(results, 'resultsList');
        }, 500);
    };

    // Play/Pause
    document.getElementById('playPauseBtn').onclick = () => {
        if (state.isPlaying) state.player.pauseVideo();
        else state.player.playVideo();
    };
}

async function fetchTrending() {
    const data = await fetchYT("latest trending songs 2026");
    renderGrid(data, 'trendingRow');
}

function updateRecentUI() {
    if (state.recent.length > 0) {
        document.getElementById('recentSection').style.display = 'block';
        renderGrid(state.recent, 'recentRow');
    }
}
