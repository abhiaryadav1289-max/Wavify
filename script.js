// Senior Dev Fix: Use provided API Key
const API_KEY = 'AlzaSyArLJC-WQUZ4UOS2kXT1CerwgDSiicrxk_w';

// State Management to prevent memory leaks and duplication
let player;
let progressFrame;
let isPlaying = false;
let currentQueue = [];

// 1. YouTube API Initialization (Crucial for page load)
window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('ytPlayer', { // Match your existing ytPlayer div ID
        height: '0',
        width: '0',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
};

function onPlayerReady() {
    fetchTrending(); // Auto-load trending on start
    initAppLogic();
}

// 2. Robust Fetch Logic
async function fetchMusic(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.items) return []; // Handle API errors or empty results safely
        
        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumb: item.snippet.thumbnails.high.url
        }));
    } catch (error) {
        console.error("Wavify Search Error:", error);
        return [];
    }
}

// 3. Stable Rendering (Using Datasets instead of JSON hacks)
function renderList(songs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (songs.length === 0) {
        container.innerHTML = '<p class="error-msg">No results found or Quota exceeded.</p>';
        return;
    }

    container.innerHTML = songs.map((song, index) => `
        <div class="song-card" data-index="${index}" data-container="${containerId}">
            <img src="${song.thumb}" alt="${song.title}">
            <div class="song-info">
                <h3>${song.title.substring(0, 40)}...</h3>
                <p>${song.artist}</p>
            </div>
        </div>
    `).join('');

    // Attach stable event listeners
    container.querySelectorAll('.song-card').forEach(card => {
        card.onclick = () => {
            const idx = card.dataset.index;
            playTrack(songs[idx], songs);
        };
    });
}

// 4. Clean Playback Logic
function playTrack(track, queue) {
    if (!player || !track) return;

    currentQueue = queue;
    player.loadVideoById(track.id);
    
    // Sync UI elements (keeping your existing IDs)
    const playerBar = document.getElementById('playerBar') || document.getElementById('miniPlayer');
    if (playerBar) playerBar.classList.remove('hidden');

    document.getElementById('playerTitle').innerText = track.title;
    document.getElementById('playerArtist').innerText = track.artist;
    document.getElementById('playerThumb').src = track.thumb;
    
    // Update play button state
    const playBtn = document.getElementById('playPauseBtn') || document.getElementById('miniPlay');
    if (playBtn) playBtn.innerText = '⏸';
}

// 5. Smooth Progress Sync (No Duplicate Loops)
function onPlayerStateChange(event) {
    const playBtn = document.getElementById('playPauseBtn') || document.getElementById('miniPlay');
    
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        if (playBtn) playBtn.innerText = '⏸';
        cancelAnimationFrame(progressFrame); // Clear previous loop
        updateProgress();
    } else {
        isPlaying = false;
        if (playBtn) playBtn.innerText = '▶';
        cancelAnimationFrame(progressFrame);
    }
}

function updateProgress() {
    if (!isPlaying || !player) return;

    const current = player.getCurrentTime();
    const duration = player.getDuration();
    const fill = document.getElementById('progressFill') || document.getElementById('miniProgressBar');

    if (fill && duration > 0) {
        const percent = (current / duration) * 100;
        fill.style.width = `${percent}%`;
    }

    // Display time updates
    if (document.getElementById('currentTime')) {
        document.getElementById('currentTime').innerText = formatTime(current);
        document.getElementById('duration').innerText = formatTime(duration);
    }

    progressFrame = requestAnimationFrame(updateProgress);
}

// 6. Helpers & Initializers
async function fetchTrending() {
    const songs = await fetchMusic("latest bollywood and global hits 2026");
    renderList(songs, 'trendingRow');
}

function formatTime(time) {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function initAppLogic() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.onkeypress = async (e) => {
            if (e.key === 'Enter') {
                const resultsContainer = document.getElementById('searchResults');
                if (resultsContainer) resultsContainer.style.display = 'block';
                
                const results = await fetchMusic(searchInput.value);
                renderList(results, 'resultsList');
            }
        };
    }
}
