/**
 * Wavify - Staff Engineer Production-Ready Logic
 * Focus: Stability, Performance, and Error Resilience
 */

const API_KEY = 'AlzaSyArLJC-WQUZ4UOS2kXT1CerwgDSiicrxk_w';

// Centralized App State
const Wavify = {
    player: null,
    isPlaying: false,
    currentQueue: [],
    currentIndex: -1,
    progressId: null,
    activePage: 'home',
    
    // Config
    shimmerHtml: Array(6).fill('<div class="shimmer-card"></div>').join('')
};

/** 1. YouTube API Lifecycle Management **/
window.onYouTubeIframeAPIReady = () => {
    Wavify.player = new YT.Player('ytPlayer', {
        height: '0',
        width: '0',
        playerVars: { 'autoplay': 0, 'controls': 0, 'disablekb': 1 },
        events: {
            'onReady': onWavifyReady,
            'onStateChange': onWavifyStateChange,
            'onError': (e) => console.error('YT Player Error:', e.data)
        }
    });
};

function onWavifyReady() {
    initAppCore();
    loadTrending(); // Critical: Load only after player is ready
}

/** 2. Data Fetching Layer **/
async function fetchFromYouTube(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Quota exceeded or Network error');
        const data = await response.json();
        
        return (data.items || []).map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumb: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url
        }));
    } catch (err) {
        console.error('Wavify API Failure:', err);
        return [];
    }
}

/** 3. UI Rendering Engine **/
function renderTracks(tracks, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (tracks.length === 0) {
        container.innerHTML = '<p class="empty-state">No music found. Try another search.</p>';
        return;
    }

    container.innerHTML = tracks.map((track, idx) => `
        <div class="song-card" data-id="${track.id}" data-index="${idx}">
            <div class="card-img-wrap">
                <img src="${track.thumb}" loading="lazy" alt="${track.title}">
                <div class="play-overlay"><span>▶</span></div>
            </div>
            <div class="card-text">
                <h3 title="${track.title}">${track.title.substring(0, 35)}...</h3>
                <p>${track.artist}</p>
            </div>
        </div>
    `).join('');

    // Event Delegation for Performance
    container.querySelectorAll('.song-card').forEach(card => {
        card.onclick = () => {
            const index = card.getAttribute('data-index');
            handleTrackSelection(tracks[index], tracks);
        };
    });
}

/** 4. Playback & State Sync **/
function handleTrackSelection(track, queue) {
    if (!Wavify.player || !track) return;

    Wavify.currentQueue = queue;
    Wavify.currentIndex = queue.findIndex(t => t.id === track.id);
    
    Wavify.player.loadVideoById(track.id);
    syncPlayerUI(track);
}

function syncPlayerUI(track) {
    const bar = document.getElementById('playerBar') || document.getElementById('miniPlayer');
    if (bar) bar.classList.remove('hidden');

    document.getElementById('playerTitle').innerText = track.title;
    document.getElementById('playerArtist').innerText = track.artist;
    document.getElementById('playerThumb').src = track.thumb;
    
    // Reset Play/Pause Icon
    const btn = document.getElementById('playPauseBtn');
    if (btn) btn.innerHTML = '⏸';
}

function onWavifyStateChange(event) {
    const btn = document.getElementById('playPauseBtn');
    
    if (event.data === YT.PlayerState.PLAYING) {
        Wavify.isPlaying = true;
        if (btn) btn.innerHTML = '⏸';
        startProgressLoop();
    } else {
        Wavify.isPlaying = false;
        if (btn) btn.innerHTML = '▶';
        cancelAnimationFrame(Wavify.progressId);
        
        if (event.data === YT.PlayerState.ENDED) handleAutoNext();
    }
}

function startProgressLoop() {
    const update = () => {
        if (!Wavify.isPlaying) return;
        
        const curr = Wavify.player.getCurrentTime();
        const dur = Wavify.player.getDuration();
        
        if (dur > 0) {
            const progress = (curr / dur) * 100;
            const fill = document.getElementById('progressFill');
            if (fill) fill.style.width = `${progress}%`;
            
            const currEl = document.getElementById('currentTime');
            const durEl = document.getElementById('duration');
            if (currEl) currEl.innerText = formatTime(curr);
            if (durEl) durEl.innerText = formatTime(dur);
        }
        Wavify.progressId = requestAnimationFrame(update);
    };
    Wavify.progressId = requestAnimationFrame(update);
}

/** 5. App Infrastructure **/
function initAppCore() {
    // Navigation Handling
    document.querySelectorAll('.nav-btn, .nav-item').forEach(btn => {
        btn.onclick = () => {
            const page = btn.getAttribute('data-page');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(`page-${page}`).classList.add('active');
            
            document.querySelectorAll('.nav-btn, .nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    // Search Handling
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.onkeypress = async (e) => {
            if (e.key === 'Enter') {
                const resultsContainer = document.getElementById('searchResults');
                if (resultsContainer) resultsContainer.style.display = 'block';
                
                const list = document.getElementById('resultsList');
                list.innerHTML = Wavify.shimmerHtml;
                
                const data = await fetchFromYouTube(searchInput.value);
                renderTracks(data, 'resultsList');
            }
        };
    }

    // Controls
    document.getElementById('playPauseBtn').onclick = () => {
        if (Wavify.isPlaying) Wavify.player.pauseVideo();
        else Wavify.player.playVideo();
    };

    document.getElementById('nextBtn').onclick = () => handleAutoNext();
    document.getElementById('prevBtn').onclick = () => {
        if (Wavify.currentIndex > 0) {
            handleTrackSelection(Wavify.currentQueue[Wavify.currentIndex - 1], Wavify.currentQueue);
        }
    };
}

async function loadTrending() {
    const trendingRow = document.getElementById('trendingRow');
    if (trendingRow) trendingRow.innerHTML = Wavify.shimmerHtml;
    
    const tracks = await fetchFromYouTube("latest 2026 global music hits");
    renderTracks(tracks, 'trendingRow');
}

function handleAutoNext() {
    if (Wavify.currentIndex < Wavify.currentQueue.length - 1) {
        handleTrackSelection(Wavify.currentQueue[Wavify.currentIndex + 1], Wavify.currentQueue);
    }
}

function formatTime(time) {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}
