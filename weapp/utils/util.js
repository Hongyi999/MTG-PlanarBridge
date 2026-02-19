/**
 * Utility functions for MTG PlanarBridge Mini Program
 */

/**
 * Format price with currency symbol
 */
function formatPrice(price, currency) {
  if (price === null || price === undefined || price === '') return '--';
  const num = Number(price);
  if (isNaN(num)) return '--';

  switch (currency) {
    case 'USD': return '$' + num.toFixed(2);
    case 'EUR': return '€' + num.toFixed(2);
    case 'CNY': return '¥' + num.toFixed(2);
    case 'JPY': return '¥' + Math.round(num);
    case 'TIX': return num.toFixed(2) + ' TIX';
    default: return num.toFixed(2);
  }
}

/**
 * Convert USD to CNY using current exchange rate
 */
function usdToCny(usd) {
  if (!usd) return null;
  const app = getApp();
  const rate = (app.globalData.exchangeRates && app.globalData.exchangeRates.usdToCny) || 7.25;
  return (Number(usd) * rate).toFixed(2);
}

/**
 * Convert USD to JPY using current exchange rate
 */
function usdToJpy(usd) {
  if (!usd) return null;
  const app = getApp();
  const rate = (app.globalData.exchangeRates && app.globalData.exchangeRates.usdToJpy) || 150;
  return Math.round(Number(usd) * rate);
}

/**
 * Get card image URL, handling double-faced cards
 * @param {object} card - Scryfall card object
 * @param {string} size - 'small', 'normal', 'large', 'png'
 */
function getCardImage(card, size) {
  size = size || 'normal';
  if (card.image_uris) {
    return card.image_uris[size] || card.image_uris.normal || '';
  }
  if (card.card_faces && card.card_faces[0] && card.card_faces[0].image_uris) {
    return card.card_faces[0].image_uris[size] || card.card_faces[0].image_uris.normal || '';
  }
  // Fallback for locally cached cards
  if (card.image_uri) return card.image_uri;
  if (card.image_uri_small && size === 'small') return card.image_uri_small;
  return '';
}

/**
 * Get card display name (prefer Chinese name if available)
 */
function getCardName(card) {
  return card.printed_name || card.name_cn || card.name || '';
}

/**
 * Get card English name
 */
function getCardNameEn(card) {
  return card.name || card.name_en || '';
}

/**
 * Get rarity color hex
 */
function getRarityColor(rarity) {
  switch (rarity) {
    case 'mythic': return '#f05d23';
    case 'rare': return '#c9a96e';
    case 'uncommon': return '#7c8ea0';
    case 'common': return '#555555';
    default: return '#888888';
  }
}

/**
 * Get rarity display name
 */
function getRarityName(rarity) {
  switch (rarity) {
    case 'mythic': return 'Mythic Rare';
    case 'rare': return 'Rare';
    case 'uncommon': return 'Uncommon';
    case 'common': return 'Common';
    default: return rarity || '';
  }
}

/**
 * Detect if text contains Chinese characters
 */
function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * Time ago formatting
 */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
  return date.toLocaleDateString();
}

/**
 * Get post type label and color class
 */
function getPostTypeInfo(type) {
  switch (type) {
    case 'sell': return { label: 'Sell', colorClass: 'tag-red' };
    case 'buy': return { label: 'Buy', colorClass: 'tag-green' };
    case 'trade': return { label: 'Trade', colorClass: 'tag-blue' };
    case 'discussion': return { label: 'Discussion', colorClass: 'tag-gold' };
    default: return { label: type || 'Post', colorClass: 'tag-gold' };
  }
}

/**
 * Truncate text to maxLen characters
 */
function truncate(text, maxLen) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}

/**
 * Parse mana cost string to array of mana symbols
 * e.g., "{2}{U}{B}" → ["2", "U", "B"]
 */
function parseMana(manaCost) {
  if (!manaCost) return [];
  const matches = manaCost.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map(m => m.replace(/[{}]/g, ''));
}

/**
 * Get mana symbol color class
 */
function getManaColor(symbol) {
  switch (symbol) {
    case 'W': return '#f9faf4';
    case 'U': return '#0e68ab';
    case 'B': return '#150b00';
    case 'R': return '#d3202a';
    case 'G': return '#00733e';
    default: return '#888888';
  }
}

module.exports = {
  formatPrice,
  usdToCny,
  usdToJpy,
  getCardImage,
  getCardName,
  getCardNameEn,
  getRarityColor,
  getRarityName,
  containsChinese,
  timeAgo,
  getPostTypeInfo,
  truncate,
  parseMana,
  getManaColor
};
