module.exports = {
  port: process.env.PORT || 3000,

  jiosaavn: {
    baseUrl: 'https://www.jiosaavn.com/api.php',
    // Mandatory params for every api.php call (api_version=4 = web client format)
    defaultParams: {
      _format: 'json',
      _marker: '0',
      api_version: '4',
      ctx: 'web6dot0',
    },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    timeoutMs: 15000,
    // DES-ECB key used by JioSaavn to encrypt media URLs
    mediaUrlKey: '38346591',
  },

  cache: {
    ttlMs: 10 * 60 * 1000, // 10 minutes
    maxEntries: 500,
  },

  notify: {
    submitUrl:
      'https://notifengine-hotfixapi-sit.idofocus.co.id:25443/api/submit',
  },
};
