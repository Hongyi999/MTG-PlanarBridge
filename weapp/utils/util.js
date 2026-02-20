/**
 * Utility functions for MTG PlanarBridge Mini Program
 * Uses API field names matching the Replit web app (name_cn, name_en, scryfall_id, image_uri)
 */

function formatPrice(price, currency) {
  if (price === null || price === undefined || price === '') return '--';
  const num = Number(price);
  if (isNaN(num)) return '--';
  switch (currency) {
    case 'usd': case 'USD': return '$' + num.toFixed(2);
    case 'cny': case 'CNY': return '¥' + num.toFixed(2);
    case 'jpy': case 'JPY': return '¥' + Math.round(num);
    case 'eur': case 'EUR': return '€' + num.toFixed(2);
    case 'tix': case 'TIX': return num.toFixed(2) + ' TIX';
    default: return num.toFixed(2);
  }
}

function usdToCny(usd) {
  if (usd === null || usd === undefined) return null;
  const app = getApp();
  const rate = (app.globalData.exchangeRates && app.globalData.exchangeRates.usdToCny) || 7.25;
  return parseFloat((Number(usd) * rate).toFixed(2));
}

function usdToJpy(usd) {
  if (!usd) return null;
  const app = getApp();
  const rate = (app.globalData.exchangeRates && app.globalData.exchangeRates.usdToJpy) || 150;
  return Math.round(Number(usd) * rate);
}

// Handles both cached (image_uri) and raw Scryfall (image_uris) formats
function getCardImage(card, size) {
  size = size || 'normal';
  if (card.image_uri) return card.image_uri;
  if (card.image_uris) return card.image_uris[size] || card.image_uris.normal || '';
  if (card.card_faces && card.card_faces[0] && card.card_faces[0].image_uris) {
    return card.card_faces[0].image_uris[size] || card.card_faces[0].image_uris.normal || '';
  }
  return '';
}

// Prefer Chinese name — handles both API formats
function getCardName(card) {
  return card.name_cn || card.name_en || card.printed_name || card.name || '';
}

function getCardNameEn(card) {
  return card.name_en || card.name || '';
}

// Get card Scryfall ID — handles both cached and raw Scryfall
function getCardId(card) {
  return card.scryfall_id || card.id || '';
}

// Get prices — handles both pre-converted (cny_converted) and raw (prices.usd)
function getCardPriceCny(card) {
  if (card.prices) {
    if (card.prices.cny_converted != null) return card.prices.cny_converted;
    if (card.prices.usd != null) return usdToCny(card.prices.usd);
  }
  return null;
}

function getCardPriceUsd(card) {
  return card.prices && card.prices.usd != null ? card.prices.usd : null;
}

function getRarityColor(rarity) {
  switch (rarity) {
    case 'mythic':   return '#ea580c';
    case 'rare':     return '#ca8a04';
    case 'uncommon': return '#64748b';
    case 'common':   return '#94a3b8';
    default:         return '#94a3b8';
  }
}

function getRarityName(rarity) {
  switch (rarity) {
    case 'mythic':   return '秘稀';
    case 'rare':     return '稀有';
    case 'uncommon': return '非普';
    case 'common':   return '普通';
    default:         return rarity || '';
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60)     return '刚刚';
  if (seconds < 3600)   return Math.floor(seconds / 60) + '分钟前';
  if (seconds < 86400)  return Math.floor(seconds / 3600) + '小时前';
  if (seconds < 604800) return Math.floor(seconds / 86400) + '天前';
  return date.toLocaleDateString('zh-CN');
}

function getPostTypeInfo(type) {
  switch (type) {
    case 'sell':       return { label: '出售', colorClass: 'tag-sell' };
    case 'buy':        return { label: '收购', colorClass: 'tag-buy' };
    case 'trade':      return { label: '交换', colorClass: 'tag-trade' };
    case 'discussion': return { label: '讨论', colorClass: 'tag-discussion' };
    default:           return { label: '讨论', colorClass: 'tag-discussion' };
  }
}

function truncate(text, maxLen) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}

function parseMana(manaCost) {
  if (!manaCost) return [];
  const matches = manaCost.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map(function(m) { return m.replace(/[{}]/g, ''); });
}

module.exports = {
  formatPrice, usdToCny, usdToJpy,
  getCardImage, getCardName, getCardNameEn, getCardId,
  getCardPriceCny, getCardPriceUsd,
  getRarityColor, getRarityName,
  timeAgo, getPostTypeInfo, truncate, parseMana
};
