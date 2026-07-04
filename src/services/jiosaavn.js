const config = require('../config');
const cache = require('../utils/cache');

class UpstreamError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'UpstreamError';
    this.status = status;
  }
}

/**
 * Single entry point to JioSaavn's internal api.php.
 * Every request = GET api.php?__call=<endpoint>&<mandatory params>&<params>.
 * Responses are cached in memory to keep request volume low.
 */
async function call(endpoint, params = {}) {
  const url = new URL(config.jiosaavn.baseUrl);
  url.searchParams.set('__call', endpoint);
  for (const [key, value] of Object.entries(config.jiosaavn.defaultParams)) {
    url.searchParams.set(key, value);
  }
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': config.jiosaavn.userAgent,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(config.jiosaavn.timeoutMs),
    });
  } catch (err) {
    throw new UpstreamError(`JioSaavn request failed: ${err.message}`, 504);
  }

  if (!response.ok) {
    throw new UpstreamError(`JioSaavn responded with HTTP ${response.status}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new UpstreamError('JioSaavn returned a non-JSON response');
  }

  // api.php reports failures inside a 200 body: {"error": {...}} or {"status":"failure"}
  if (data && (data.error || data.status === 'failure')) {
    const message =
      (data.error && (data.error.msg || data.error.message)) ||
      'JioSaavn returned an error';
    throw new UpstreamError(message, 404);
  }

  cache.set(cacheKey, data);
  return data;
}

// api.php hard-caps every search request at 40 results per page; to serve
// bigger limits we fan out across pages in parallel and stitch the results.
const PAGE_SIZE = 40;
const MAX_LIMIT = 200;

async function searchPaged(endpoint, query, page, limit) {
  const capped = Math.min(Math.max(Number(limit) || PAGE_SIZE, 1), MAX_LIMIT);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * capped;
  const startPage = Math.floor(offset / PAGE_SIZE) + 1;
  const sliceStart = offset - (startPage - 1) * PAGE_SIZE;
  const pageCount = Math.ceil((sliceStart + capped) / PAGE_SIZE);

  const settled = await Promise.allSettled(
    Array.from({ length: pageCount }, (_, i) =>
      call(endpoint, { q: query, p: startPage + i, n: PAGE_SIZE })
    )
  );

  const pages = settled
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value);
  if (pages.length === 0 && settled[0]?.status === 'rejected') {
    throw settled[0].reason;
  }

  const merged = pages.flatMap((p) => p.results || []);
  return {
    total: Number(pages[0]?.total) || merged.length,
    start: offset + 1,
    results: merged.slice(sliceStart, sliceStart + capped),
  };
}

const api = {
  searchSongs: (query, page = 1, limit = 40) =>
    searchPaged('search.getResults', query, page, limit),

  searchArtists: (query, page = 1, limit = 40) =>
    searchPaged('search.getArtistResults', query, page, limit),

  /** Real trending songs per language (returns ~24 songs, actual intl hits for english). */
  getTrendingSongs: (language) =>
    call('content.getTrending', {
      entity_type: 'song',
      entity_language: language,
    }),

  getSongDetails: (ids) => call('song.getDetails', { pids: ids }),

  getArtistPage: (artistId, songCount = 20) =>
    call('artist.getArtistPageDetails', {
      artistId,
      n_song: songCount,
    }),
};

module.exports = { ...api, call, UpstreamError };
