const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const songs = require('../controllers/songsController');
const artists = require('../controllers/artistsController');
const notify = require('../controllers/notifyController');

const router = express.Router();

// Legacy routes — keep the exact paths/shapes Spotify_Clone_v3 depends on
router.get('/getTopEnglish', asyncHandler(songs.getTopEnglish));
router.get('/getTopHindi', asyncHandler(songs.getTopHindi));
router.get('/getSongByParam/:id', asyncHandler(songs.searchSongs));
router.get('/getSongById/:id', asyncHandler(songs.getSongById));
router.get('/getArtistById/:id', asyncHandler(artists.getArtistById));
router.get('/getArtistByParam/:id', asyncHandler(artists.searchArtists));
router.post('/submitEmail', asyncHandler(notify.submitEmail));

// New routes
router.get('/lyrics/:id', asyncHandler(songs.getLyrics));

module.exports = router;
