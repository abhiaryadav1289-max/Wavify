/* ═══════════════════════════════════════════════════════
   WAVIFY – script.js (UPDATED WITH API KEY)
   ───────────────────────────────────────────────────────
   ⚠️  API KEY HAS BEEN ADDED BELOW
═══════════════════════════════════════════════════════ */
const YT_API_KEY = 'AlzaSyArLJC-WQUZ4UOS2kXT1CerwgDSiicrxk_w'; // ← Key added from image

/* ── API Base ── */
const YT_API = 'https://www.googleapis.com/youtube/v3';

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
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
  addToPlaylistTarget: null,
};

/* ═══════════════════════════════════════════
   DOM REFS
═══════════════════════════════════════════ */
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
  searchSuggestions: $('searchSuggestions'),
  searchDefault: $('searchDefault'),
  searchResults: $('searchResults'),
  resultsList: $('resultsList'),
  resultsLabel: $('resultsLabel'),
  browseChips: $('browseChips'),

  likedList: $('likedList'),
  likedEmpty: $('likedEmpty'),
  recentList: $('recentList'),
  recentEmpty: $('recentEmpty'),
  playlistsView: $('playlistsView'),
  playlistsEmpty: $('playlistsEmpty'),
  playlistList: $('playlistList'),

  miniPlayer: $('miniPlayer'),
  miniThumb: $('miniThumb'),
  miniTitle: $('miniTitle'),
  miniArtist: $('miniArtist'),
  miniPlay: $('miniPlay'),
  miniNext: $('miniNext'),
  miniLike: $('miniLike'),
  miniProgressBar: $('miniProgressBar'),

  fullPlayer: $('fullPlayer'),
  playerBg: $('playerBg'),
  playerThumb: $('playerThumb'),
  playerTitle: $('playerTitle'),
  playerArtist: $('playerArtist'),
  playerDown: $('playerDown'),
  playerLike: $('playerLike'),
  progressTrack: $('progressTrack'),
  progressFill: $('progressFill'),
  progressThumb: $('progressThumb'),
  timeElapsed: $('timeElapsed'),
  timeDuration: $('timeDuration'),
  mainPlayBtn: $('mainPlayBtn'),
  prevBtn: $('prevBtn'),
  nextBtn: $('nextBtn'),
  shuffleBtn: $('shuffleBtn'),
  repeatBtn: $('repeatBtn'),
  volumeSlider: $('volumeSlider'),
  addToPlaylistBtn: $('addToPlaylistBtn'),

  playlistModal: $('playlistModal'),
  modalBackdrop: $('modalBackdrop'),
  modalPlaylistList: $('modalPlaylistList'),
  modalCreateNew: $('modalCreateNew'),
  modalClose: $('modalClose'),

  createPlaylistModal: $('createPlaylistModal'),
  createModalBackdrop: $('createModalBackdrop'),
  playlistNameInput: $('playlistNameInput'),
  confirmCreatePlaylist: $('confirmCreatePlaylist'),
  cancelCreatePlaylist: $('cancelCreatePlaylist'),

  toast: $('toast'),
};

/* ═══════════════════════════════════════════
   CATEGORIES
═══════════════════════════════════════════ */
const CATEGORIES = [
  { name: 'Lo-Fi',    emoji: '☕',  query: 'lofi hip hop music',          color: '#3d2b1f' },
  { name: 'Study',    emoji: '📚',  query: 'study music concentration',   color: '#1a2a3a' },
  { name: 'Sad',      emoji: '🌧️', query: 'sad emotional songs',          color: '#1f1a2e' },
  { name: 'Party',    emoji: '🎉',  query: 'party hits 2024',             color: '#2a1a2a' },
  { name: 'Workout',  emoji: '🏋️', query: 'workout gym music',            color: '#1a2a1a' },
  { name: 'Chill',    emoji: '🌊',  query: 'chill vibes music',           color: '#1a2230' },
  { name: 'Bollywood',emoji: '🎬',  query: 'bollywood hits 2024',         color: '#2a1a10' },
  { name: 'Pop',      emoji: '🌟',  query: 'pop songs 2024 hits',         color: '#1c1a2a' },
  { name: 'Hip-Hop',  emoji: '🎤',  query: 'hip hop rap 2024',            color: '#1a1a1a' },
];

const QUICK_QUERIES = [
  'top trending songs 2024',
  'best hindi songs 2024',
  'english hits 2024',
  'midnight melodies',
];

const SEARCH_CHIPS = ['Lo-Fi', 'Bollywood', 'Pop Hits', 'Hip-Hop', 'Sad Songs', 'Party Mix', 'Chill Vibes', 'Workout'];

/* ═══════════════════════════════════════════
   YOUTUBE IFRAME API
═══════════════════════════════════════════ */
window.onYouTubeIframeAPIReady = () => {
  state.ytPlayer = new YT.Player('ytPlayer', {
    height: '1',
    width: '1',
    playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3 },
    events: {
      onReady: () => { state.ytReady = true; },
      onStateChange: onPlayerStateChange,
    },
  });
};

function onPlayerStateChange(e) {
  const S = YT.PlayerState;
  if (e.data === S.PLAYING) {
    state.isPlaying = true;
    state.duration = state.ytPlayer.getDuration();
    updatePlayIcons(true);
    startProgressTracking();
    if (state.currentTrack) {
      DOM.playerThumb.classList.add('playing');
    }
  } else if (e.data === S.PAUSED) {
    state.isPlaying = false;
    updatePlayIcons(false);
    stopProgressTracking();
    DOM.playerThumb.classList.remove('playing');
  } else if (e.data === S.ENDED) {
    DOM.playerThumb.classList.remove('playing');
    stopProgressTracking();
    if (state.isRepeat) {
      playTrack(state.currentTrack, false);
    } else {
      playNext();
    }
  }
}

/* ═══════════════════════════════════════════
   YOUTUBE API CALLS
═══════════════════════════════════════════ */
async function searchYT(query, maxResults = 12) {
  if (!YT_API_KEY || YT_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    showToast('⚠️ Add your YouTube API Key in script.js');
    return [];
  }
  try {
    const url = `${YT_API}/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${YT_API_KEY}`;
    const r = await fetch(url);
    const d = await r.json();
    if (d.error) { 
      showToast('API Error: ' + (d.error.message || 'Check your key')); 
      return []; 
    }
    return (d.items || []).map(item => ({
      id:     item.id.videoId,
      title:  item.snippet.title,
      artist: item.snippet.channelTitle,
      thumb:  item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
    }));
  } catch (err) {
    console.error(err);
    showToast('Network error.');
    return [];
  }
}

// ... Rest of your application logic follows (playTrack, UI updates, etc.)
