/* ═══════════════════════════════════════════════════════
   WAVIFY – script.js (UPDATED & FIXED)
═══════════════════════════════════════════════════════ */
const YT_API_KEY = 'AlzaSyArLJC-WQUZ4UOS2kXT1CerwgDSiicrxk_w'; 
const YT_API = 'https://www.googleapis.com/youtube/v3';

const state = {
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  isShuffle: false,
  isRepeat: false,
  progress: 0,
  duration: 0,
  lastSearch: localStorage.getItem('wavify_lastSearch') || '',
  likedSongs:     JSON.parse(localStorage.getItem('wavify_liked')     || '[]'),
  recentlyPlayed: JSON.parse(localStorage.getItem('wavify_recent')    || '[]'),
  playlists:      JSON.parse(localStorage.getItem('wavify_playlists') || '[]'),
  ytPlayer: null,
  ytReady: false,
  progressInterval: null,
};

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const DOM = {
  greeting: $('greeting'),
  quickPicks: $('quickPicks'),
  trendingRow: $('trendingRow'),
  categoriesGrid: $('categoriesGrid'),
  recommendedSection: $('recommendedSection'),
  recommendedRow: $('recommendedRow'),
  recentSection: $('recentSection'),
  recentRow: $('recentRow'),
  searchInput: $('searchInput'),
  clearSearch: $('clearSearch'),
  searchResults: $('searchResults'),
  resultsList: $('resultsList'),
  resultsLabel: $('resultsLabel'),
  searchDefault: $('searchDefault'),
  miniPlayer: $('miniPlayer'),
  miniThumb: $('miniThumb'),
  miniTitle: $('miniTitle'),
  miniArtist: $('miniArtist'),
  miniPlay: $('miniPlay'),
  miniNext: $('miniNext'),
  miniLike: $('miniLike'),
  miniProgressBar: $('miniProgressBar'),
  fullPlayer: $('fullPlayer'),
  playerThumb: $('playerThumb'),
  playerTitle: $('playerTitle'),
  playerArtist: $('playerArtist'),
  mainPlayBtn: $('mainPlayBtn'),
  timeElapsed: $('timeElapsed'),
  timeDuration: $('timeDuration'),
  progressFill: $('progressFill'),
  progressThumb: $('progressThumb'),
  toast: $('toast'),
};

/* ── YouTube API Setup ── */
window.onYouTubeIframeAPIReady = () => {
  state.ytPlayer = new YT.Player('ytPlayer', {
    height: '0',
    width: '0',
    events: {
      onReady: () => { state.ytReady = true; initHome(); },
      onStateChange: onPlayerStateChange,
    },
  });
};

function onPlayerStateChange(e) {
  if (e.data === YT.PlayerState.PLAYING) {
    state.isPlaying = true;
    updatePlayIcons(true);
    startProgressTracking();
  } else if (e.data === YT.PlayerState.PAUSED) {
    state.isPlaying = false;
    updatePlayIcons(false);
  } else if (e.data === YT.PlayerState.ENDED) {
    playNext();
  }
}

/* ── Search Logic (Fix for Search Button) ── */
DOM.searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') runSearch(DOM.searchInput.value);
});

async function runSearch(query) {
  if (!query) return;
  DOM.searchDefault.style.display = 'none';
  DOM.searchResults.style.display = 'block';
  DOM.resultsLabel.textContent = `Results for "${query}"`;
  
  const tracks = await searchYT(query);
  DOM.resultsList.innerHTML = '';
  tracks.forEach((track, index) => {
    DOM.resultsList.appendChild(renderResultItem(track, index, tracks));
  });
}

async function searchYT(query) {
  try {
    const url = `${YT_API}/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=15&key=${YT_API_KEY}`;
    const r = await fetch(url);
    const d = await r.json();
    return (d.items || []).map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumb: item.snippet.thumbnails.high.url
    }));
  } catch (err) {
    showToast("Error fetching music");
    return [];
  }
}

/* ── Playback Logic ── */
function playTrack(track) {
  if (!state.ytReady) return;
  state.currentTrack = track;
  state.ytPlayer.loadVideoById(track.id);
  
  DOM.miniThumb.src = track.thumb;
  DOM.miniTitle.textContent = track.title;
  DOM.miniArtist.textContent = track.artist;
  DOM.miniPlayer.classList.remove('hidden');
  
  // Update Full Player
  DOM.playerThumb.src = track.thumb;
  DOM.playerTitle.textContent = track.title;
  DOM.playerArtist.textContent = track.artist;
}

function updatePlayIcons(playing) {
  const playIcons = $$('.icon-play');
  const pauseIcons = $$('.icon-pause');
  playIcons.forEach(i => i.classList.toggle('hidden', playing));
  pauseIcons.forEach(i => i.classList.toggle('hidden', !playing));
}

function startProgressTracking() {
  if (state.progressInterval) clearInterval(state.progressInterval);
  state.progressInterval = setInterval(() => {
    if (state.isPlaying) {
      const cur = state.ytPlayer.getCurrentTime();
      const dur = state.ytPlayer.getDuration();
      const pct = (cur / dur) * 100;
      DOM.miniProgressBar.style.width = pct + '%';
      DOM.progressFill.style.width = pct + '%';
      DOM.timeElapsed.textContent = formatTime(cur);
      DOM.timeDuration.textContent = formatTime(dur);
    }
  }, 1000);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/* ── UI Rendering ── */
function renderResultItem(track, index, allTracks) {
  const div = document.createElement('div');
  div.className = 'result-item';
  div.innerHTML = `
    <img src="${track.thumb}" class="result-thumb">
    <div class="result-info">
      <div class="result-title">${track.title}</div>
      <div class="result-artist">${track.artist}</div>
    </div>
  `;
  div.onclick = () => playTrack(track);
  return div;
}

function showToast(msg) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.remove('hidden');
  setTimeout(() => DOM.toast.classList.add('hidden'), 3000);
}

// Sidebar Navigation
$$('.nav-btn, .bottom-nav-btn').forEach(btn => {
  btn.onclick = () => {
    const page = btn.dataset.page;
    $$('.page').forEach(p => p.classList.remove('active'));
    $(`page-${page}`).classList.add('active');
  };
});

async function initHome() {
  const trending = await searchYT("latest songs 2024");
  DOM.trendingRow.innerHTML = '';
  trending.forEach(t => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.innerHTML = `<div class="card-thumb-wrap"><img src="${t.thumb}"></div><div class="card-title">${t.title}</div>`;
    card.onclick = () => playTrack(t);
    DOM.trendingRow.appendChild(card);
  });
}

DOM.miniPlay.onclick = () => {
  if (state.isPlaying) state.ytPlayer.pauseVideo();
  else state.ytPlayer.playVideo();
};
