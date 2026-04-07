const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const { ENCRYPTION_KEY } = require('../config/env'); // Must be exactly 32 bytes
const IV_LENGTH = 16;

/**
 * Encrypts a plain text string using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text (format iv:encryptedContent)
 */
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-CBC encrypted string
 * @param {string} encryptedText - The text to decrypt (format iv:encryptedContent)
 * @returns {string} - The decrypted plain text
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encrypted = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
