const config = require('../config');

const submitEmail = async (req, res) => {
  const response = await fetch(config.notify.submitUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });

  res.status(response.status).json(await response.json());
};

module.exports = { submitEmail };
