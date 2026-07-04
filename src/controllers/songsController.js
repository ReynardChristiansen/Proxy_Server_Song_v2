const jiosaavn = require('../services/jiosaavn');
const { mapSong, mapSongSearchPage } = require('../utils/mappers');

const TOP_SONGS_LIMIT = 40;

/**
 * Top songs = real trending charts first (actual international hits for
 * english, not india-made "english" search results), topped up with search
 * results until the limit. Falls back to search-only if trending fails.
 */
async function getTopSongs(language) {
  let trending;
  try {
    const raw = await jiosaavn.getTrendingSongs(language);
    const items = Array.isArray(raw) ? raw : raw.data || [];
    trending = items.filter((item) => item.type === 'song').map(mapSong);
  } catch {
    trending = [];
  }

  const seen = new Set(trending.map((song) => song.id));
  let results = trending;

  if (results.length < TOP_SONGS_LIMIT) {
    const raw = await jiosaavn.searchSongs(language, 1, TOP_SONGS_LIMIT);
    const fill = mapSongSearchPage(raw).results.filter(
      (song) => !seen.has(song.id)
    );
    results = [...results, ...fill].slice(0, TOP_SONGS_LIMIT);
  }

  return { total: results.length, start: 1, results };
}

const getTopEnglish = async (req, res) => {
  res.json({ success: true, data: await getTopSongs('english') });
};

const getTopHindi = async (req, res) => {
  res.json({ success: true, data: await getTopSongs('hindi') });
};

/**
 * Song search with optional ?lang= filter (e.g. english, hindi).
 * JioSaavn ignores every server-side language param, so we bias the query by
 * appending the language word, then post-filter on the language field. If
 * that yields nothing (e.g. a specific local title), fall back to the plain
 * search so exact matches still work.
 */
const searchSongs = async (req, res) => {
  const { id: query } = req.params;
  const { page = 1, limit = 40, lang } = req.query;
  const language = String(lang || 'all').toLowerCase();

  if (language !== 'all') {
    try {
      const biased = await jiosaavn.searchSongs(`${query} ${language}`, page, limit);
      const pageData = mapSongSearchPage(biased);
      const filtered = pageData.results.filter(
        (song) => song.language === language
      );
      if (filtered.length > 0) {
        return res.json({
          success: true,
          data: { ...pageData, total: filtered.length, results: filtered },
        });
      }
    } catch {
      // fall through to the plain search
    }
  }

  const raw = await jiosaavn.searchSongs(query, page, limit);
  res.json({ success: true, data: mapSongSearchPage(raw) });
};

const getSongById = async (req, res) => {
  const { id } = req.params;
  const raw = await jiosaavn.getSongDetails(id);
  const songs = (raw.songs || []).map(mapSong);

  if (songs.length === 0) {
    return res.status(404).json({
      success: false,
      error: { code: 404, message: `Song ${id} not found` },
    });
  }

  res.json({ success: true, data: songs });
};

const getLyrics = async (req, res) => {
  const { id } = req.params;
  const raw = await jiosaavn.getLyrics(id);
  res.json({ success: true, data: raw });
};

module.exports = {
  getTopEnglish,
  getTopHindi,
  searchSongs,
  getSongById,
  getLyrics,
};
