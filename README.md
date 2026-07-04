# Music API Proxy Server

Proxy server for the Hirmify frontend. It talks directly to JioSaavn's internal
endpoint (`https://www.jiosaavn.com/api.php`), normalizes the raw responses into
a stable shape, and decrypts the media URLs (DES-ECB, via `crypto-js`) so clients
get playable `aac.saavncdn.com` links in five bitrates (12–320 kbps).

Previously this server proxied a third-party JioSaavn wrapper that broke whenever
it went down. It now depends only on JioSaavn itself.

## Architecture

```
index.js                  Entry point (local: listen, Vercel: exported handler)
src/
├── app.js                Express app assembly (CORS, logging, routes, errors)
├── config.js             Base URL, mandatory api.php params, cache TTL
├── routes/api.js         Route table
├── controllers/          Request handlers (songs, artists, notify)
├── services/jiosaavn.js  The only module that calls api.php (+ in-memory cache)
├── utils/
│   ├── crypto.js         encrypted_media_url decryption + bitrate variants
│   ├── mappers.js        Raw api.php JSON -> client response shape
│   └── cache.js          In-memory TTL cache (10 min, 500 entries)
└── middleware/errorHandler.js
```

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/getTopEnglish` | Top English songs (40) |
| GET | `/api/getTopHindi` | Top Hindi songs (40) |
| GET | `/api/getSongByParam/:query` | Search songs (`?page=`, `?limit=`) |
| GET | `/api/getSongById/:id` | Song details by ID |
| GET | `/api/getArtistByParam/:query` | Search artists (`?page=`, `?limit=`) |
| GET | `/api/getArtistById/:id` | Artist page details + top songs (`?songs=`) |
| GET | `/api/lyrics/:id` | Song lyrics |
| POST | `/api/submitEmail` | Forward to notification engine |

All success responses are `{ "success": true, "data": ... }`; errors are
`{ "success": false, "error": { "code", "message" } }`.

## Running

```bash
npm install
npm run dev   # nodemon
npm start     # node index.js
```

Requires Node 18+ (uses global `fetch`). Deployed on Vercel via `vercel.json`.

## Notes / caveats

- JioSaavn's `api.php` is an **internal, undocumented API** — it can change or
  start geo-blocking at any time. Responses are cached in memory (10 min) to
  keep request volume low.
- Media URL decryption uses the well-known DES key `38346591`; the decrypted
  96kbps URL is rewritten to `_12/_48/_96/_160/_320` variants.
- Song/artist names may contain HTML entities in the raw API; the mappers
  decode them.

## Feedback

If you have any feedback, please reach out to me at reynard.satria@gmail.com
