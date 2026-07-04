const CryptoJS = require('crypto-js');
const config = require('../config');

const KEY = CryptoJS.enc.Utf8.parse(config.jiosaavn.mediaUrlKey);

const QUALITIES = [
  { quality: '12kbps', suffix: '_12' },
  { quality: '48kbps', suffix: '_48' },
  { quality: '96kbps', suffix: '_96' },
  { quality: '160kbps', suffix: '_160' },
  { quality: '320kbps', suffix: '_320' },
];

/**
 * Decrypts JioSaavn's encrypted_media_url (DES-ECB, PKCS7).
 * Returns the 96kbps CDN url, e.g. https://aac.saavncdn.com/.../abc_96.mp4
 */
function decryptMediaUrl(encryptedUrl) {
  const decrypted = CryptoJS.DES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl) },
    KEY,
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  );
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Builds the 5-entry downloadUrl array the frontend expects
 * (index 4 = 320kbps). Returns [] when there is nothing to decrypt.
 */
function buildDownloadUrls(encryptedUrl) {
  if (!encryptedUrl) return [];

  let baseUrl;
  try {
    baseUrl = decryptMediaUrl(encryptedUrl);
  } catch (err) {
    return [];
  }
  if (!baseUrl) return [];

  return QUALITIES.map(({ quality, suffix }) => ({
    quality,
    url: baseUrl.replace(/_\d+(\.\w+)$/, `${suffix}$1`),
  }));
}

module.exports = { decryptMediaUrl, buildDownloadUrls };
