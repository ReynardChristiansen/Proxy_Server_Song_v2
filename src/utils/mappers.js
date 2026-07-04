const { buildDownloadUrls } = require('./crypto');

const HTML_ENTITIES = {
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&#039;': "'",
  '&apos;': "'",
};

function decodeHtml(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/&quot;|&amp;|&lt;|&gt;|&#039;|&apos;/g, (m) => HTML_ENTITIES[m]);
}

const IMAGE_QUALITIES = ['50x50', '150x150', '500x500'];

/**
 * JioSaavn returns a single image url (usually the 150x150 or 50x50 variant).
 * The frontend expects an array of 3 sizes: index 0 = 50x50, 2 = 500x500.
 */
function buildImageUrls(imageUrl) {
  if (!imageUrl) return [];
  return IMAGE_QUALITIES.map((quality) => ({
    quality,
    url: imageUrl.replace(/50x50|150x150|500x500/, quality),
  }));
}

function mapArtistMini(raw) {
  return {
    id: raw.id,
    name: decodeHtml(raw.name),
    role: raw.role || '',
    type: raw.type || 'artist',
    image: buildImageUrls(raw.image),
    url: raw.perma_url || '',
  };
}

/**
 * Raw api.php song (from search.getResults / song.getDetails / topSongs)
 * -> the shape the frontend already consumes.
 */
function mapSong(raw) {
  const info = raw.more_info || {};
  const artistMap = info.artistMap || {};

  return {
    id: raw.id,
    name: decodeHtml(raw.title),
    type: raw.type || 'song',
    year: raw.year || null,
    language: raw.language || null,
    duration: info.duration ? Number(info.duration) : null,
    label: info.label || null,
    playCount: raw.play_count ? Number(raw.play_count) : null,
    explicitContent: raw.explicit_content === '1',
    hasLyrics: info.has_lyrics === 'true',
    url: raw.perma_url || '',
    album: {
      id: info.album_id || null,
      name: decodeHtml(info.album) || null,
      url: info.album_url || null,
    },
    artists: {
      primary: (artistMap.primary_artists || []).map(mapArtistMini),
      featured: (artistMap.featured_artists || []).map(mapArtistMini),
      all: (artistMap.artists || []).map(mapArtistMini),
    },
    image: buildImageUrls(raw.image),
    downloadUrl: buildDownloadUrls(info.encrypted_media_url),
  };
}

/** Raw search.getArtistResults entry -> frontend artist list item. */
function mapArtistSearchResult(raw) {
  return {
    id: raw.id,
    name: decodeHtml(raw.name),
    role: raw.role || '',
    type: raw.type || 'artist',
    image: buildImageUrls(raw.image),
    url: raw.perma_url || '',
  };
}

/** Raw artist.getArtistPageDetails -> frontend artist detail page. */
function mapArtistPage(raw) {
  return {
    id: raw.artistId || raw.id,
    name: decodeHtml(raw.name),
    subtitle: decodeHtml(raw.subtitle) || '',
    followerCount: raw.follower_count ? Number(raw.follower_count) : 0,
    fanCount: raw.fan_count ? Number(raw.fan_count) : null,
    isVerified: Boolean(raw.isVerified),
    dominantLanguage: raw.dominantLanguage || null,
    dominantType: raw.dominantType || null,
    url: raw.urls && raw.urls.overview ? raw.urls.overview : '',
    image: buildImageUrls(raw.image),
    topSongs: (raw.topSongs || []).map(mapSong),
  };
}

/** Raw search.getResults page -> { total, start, results } envelope. */
function mapSongSearchPage(raw) {
  return {
    total: raw.total || 0,
    start: raw.start || 0,
    results: (raw.results || []).map(mapSong),
  };
}

function mapArtistSearchPage(raw) {
  return {
    total: raw.total || 0,
    start: raw.start || 0,
    results: (raw.results || []).map(mapArtistSearchResult),
  };
}

module.exports = {
  decodeHtml,
  buildImageUrls,
  mapSong,
  mapArtistSearchResult,
  mapArtistPage,
  mapSongSearchPage,
  mapArtistSearchPage,
};
