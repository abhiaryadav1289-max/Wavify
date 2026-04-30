const YT_API_KEY = 'AlzaSyArLJC-WQUZ4UOS2kXT1CerwgDSiicrxk_w'; // Key from your image
const YT_API = 'https://www.googleapis.com/youtube/v3';

const state = {
  currentTrack: null,
  isPlaying: false,
  ytPlayer: null,
  ytReady: false
};

const $ = id => document.getElementById(id);

// YouTube API Setup
window.onYouTubeIframeAPIReady = () => {
  state.ytPlayer = new YT.Player('ytPlayer', {
    height: '0',
    width: '0',
    events: {
      onReady: () => { 
        state.ytReady = true; 
        loadSuggestions(); // Home screen pe gaane dikhane ke liye
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING) updateUI(true);
        else if (e.data === YT.PlayerState.PAUSED) updateUI(false);
      }
    }
  });
};

// Search Functionality
$('searchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') runSearch($('searchInput').value);
});

async function runSearch(query) {
  if (!query) return;
  $('searchDefault').style.display = 'none';
  $('searchResults').style.display = 'block';
  
  const tracks = await fetchYouTubeData(query);
  renderTracks(tracks, $('resultsList'));
}

async function loadSuggestions() {
  const trending = await fetchYouTubeData("latest trending songs 2026");
  renderTracks(trending, $('trendingRow'), true);
}

async function fetchYouTubeData(query) {
  try {
    const url = `${YT_API}/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=10&key=${YT_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.items || []).map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumb: item.snippet.thumbnails.high.url
    }));
  } catch (err) {
    console.error("API Error:", err);
    return [];
  }
}

function renderTracks(tracks, container, isCard = false) {
  container.innerHTML = '';
  tracks.forEach(track => {
    const div = document.createElement('div');
    div.className = isCard ? 'song-card' : 'result-item';
    div.innerHTML = `
      <img src="${track.thumb}" style="width:50px; border-radius:8px;">
      <div>
        <p><b>${track.title.substring(0, 30)}...</b></p>
        <small>${track.artist}</small>
      </div>
    `;
    div.onclick = () => playTrack(track);
    container.appendChild(div);
  });
}

function playTrack(track) {
  if (!state.ytReady) return;
  state.ytPlayer.loadVideoById(track.id);
  $('miniPlayer').classList.remove('hidden');
  $('miniTitle').textContent = track.title;
  $('miniThumb').src = track.thumb;
}

function updateUI(playing) {
  state.isPlaying = playing;
  // Play/Pause button icons change logic here
}
