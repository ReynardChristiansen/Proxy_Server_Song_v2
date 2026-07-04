const jiosaavn = require('../services/jiosaavn');
const { mapArtistPage, mapArtistSearchPage } = require('../utils/mappers');

const getArtistById = async (req, res) => {
  const { id } = req.params;
  const { songs = 40 } = req.query;
  const raw = await jiosaavn.getArtistPage(id, songs);
  res.json({ success: true, data: mapArtistPage(raw) });
};

const searchArtists = async (req, res) => {
  const { id: query } = req.params;
  const { page = 1, limit = 40 } = req.query;
  const raw = await jiosaavn.searchArtists(query, page, limit);
  res.json({ success: true, data: mapArtistSearchPage(raw) });
};

module.exports = { getArtistById, searchArtists };
