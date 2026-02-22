const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    searchQuery: '',
    cards: [],
    loading: false,
    hasMore: false,
    currentPage: 1,
    totalCards: 0,
    searched: false,
    currentGame: 'mtg',

    // Advanced filter sheet
    showFilterSheet: false,

    // Filter fields (matching React library.tsx)
    filterName: '',
    filterRulesText: '',
    filterType: '',
    filterSet: '',
    filterRarity: [],   // array of selected rarities
    filterColors: [],   // array of selected color codes
    filterFormat: '',
    filterArtist: '',
    filterLang: 'any',
    filterCmcOp: '=',
    filterCmcVal: '',

    hasActiveFilters: false,

    colorOptions: [
      { code: 'W', label: 'W', bg: '#f9f3e3', dark: false },
      { code: 'U', label: 'U', bg: '#1565c0', dark: true },
      { code: 'B', label: 'B', bg: '#3b3b3b', dark: true },
      { code: 'R', label: 'R', bg: '#d32029', dark: true },
      { code: 'G', label: 'G', bg: '#1b5e20', dark: true },
      { code: 'C', label: 'C', bg: '#94a3b8', dark: true }
    ],
    rarityOptions: [
      { key: 'mythic',   label: '秘稀 Mythic',      dot: '#ea580c' },
      { key: 'rare',     label: '稀有 Rare',         dot: '#ca8a04' },
      { key: 'uncommon', label: '非普通 Uncommon',   dot: '#64748b' },
      { key: 'common',   label: '普通 Common',       dot: '#3b3b3b' }
    ],
    formatOptions: [
      { key: '',          label: '不限赛制 (All Formats)' },
      { key: 'standard',  label: 'Standard (标准)' },
      { key: 'pioneer',   label: 'Pioneer (先驱)' },
      { key: 'modern',    label: 'Modern (近代)' },
      { key: 'commander', label: 'Commander (指挥官)' },
      { key: 'legacy',    label: 'Legacy (薪传)' },
      { key: 'vintage',   label: 'Vintage (特选)' },
      { key: 'pauper',    label: 'Pauper (纯普)' }
    ],
    langOptions: [
      { key: 'any', label: '所有语言 (All Languages)' },
      { key: 'cn',  label: '简体中文' },
      { key: 'en',  label: 'English' },
      { key: 'jp',  label: '日本語' }
    ],
    cmcOps: ['=', '≤', '≥', '<', '>'],
    filterFormatIndex: 0,
    filterFormatLabel: '不限赛制 (All Formats)',
    filterLangIndex: 0,
    filterLangLabel: '所有语言 (All Languages)'
  },

  onLoad() {
    var saved = wx.getStorageSync('selected_game');
    var game = saved === 'fab' ? 'fab' : (getApp().globalData.currentGame || 'mtg');
    this.setData({ currentGame: game });
    this._checkPendingQuery();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    // Sync game from global
    var game = getApp().globalData.currentGame || 'mtg';
    if (game !== this.data.currentGame) {
      this.setData({
        currentGame: game,
        cards: [], searched: false,
        hasMore: false, totalCards: 0, currentPage: 1
      });
    }
    this._checkPendingQuery();
  },

  _checkPendingQuery() {
    var app = getApp();
    if (app.globalData.pendingLibraryQuery) {
      var query = app.globalData.pendingLibraryQuery;
      app.globalData.pendingLibraryQuery = '';
      this.setData({ searchQuery: query, cards: [], currentPage: 1, searched: false });
      this.doSearch();
    }
  },

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value });
  },

  clearSearch() {
    this.setData({ searchQuery: '', cards: [], searched: false, hasMore: false, totalCards: 0 });
  },

  onSearch() {
    this.setData({ cards: [], currentPage: 1 });
    this.doSearch();
  },

  async doSearch() {
    var query = this.data.searchQuery.trim();
    this.setData({ loading: true, searched: true });

    try {
      if (this.data.currentGame === 'fab') {
        await this.doFabSearch(query);
      } else {
        await this.doMtgSearch(query);
      }
    } catch (err) {
      console.error('[Library] Search error:', err);
      wx.showToast({ title: '搜索失败，请重试', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  _buildMtgQuery() {
    var parts = [];
    var name = this.data.filterName || this.data.searchQuery.trim();
    if (name) parts.push(name);
    if (this.data.filterRulesText) parts.push('oracle:"' + this.data.filterRulesText + '"');
    if (this.data.filterType) parts.push('type:' + this.data.filterType);
    if (this.data.filterSet) parts.push('set:' + this.data.filterSet);
    var rarities = this.data.filterRarity;
    if (rarities && rarities.length > 0) {
      rarities.forEach(function(r) { parts.push('rarity:' + r); });
    }
    var colors = this.data.filterColors;
    if (colors && colors.length > 0) parts.push('color:' + colors.join(''));
    var fmt = this.data.filterFormat;
    if (fmt) parts.push('format:' + fmt);
    if (this.data.filterArtist) parts.push('artist:"' + this.data.filterArtist + '"');
    var lang = this.data.filterLang;
    if (lang && lang !== 'any') {
      var langMap = { cn: 'zhs', en: 'en', jp: 'ja' };
      parts.push('lang:' + (langMap[lang] || lang));
    }
    if (this.data.filterCmcVal) {
      var opMap = { '=': '=', '≤': '<=', '≥': '>=', '<': '<', '>': '>' };
      parts.push('cmc' + (opMap[this.data.filterCmcOp] || '=') + this.data.filterCmcVal);
    }
    return parts.join(' ');
  },

  async doMtgSearch(query) {
    var q = this._buildMtgQuery() || query;
    if (!q) {
      this.setData({ loading: false });
      return;
    }
    var res = await api.get('/api/cards/search', { q: q, page: this.data.currentPage });
    var raw = (res && (res.cards || res.data)) || [];
    var newCards = raw.map(function(card) {
      var prices = card.prices || {};
      var priceCny = prices.cny_converted != null ? Number(prices.cny_converted).toFixed(2) : null;
      var priceUsd = prices.usd != null ? Number(prices.usd).toFixed(2) : null;
      return {
        id: util.getCardId(card),
        nameCn: card.name_cn || card.printed_name || card.name_en || card.name || '',
        nameEn: card.name_en || card.name || '',
        image: util.getCardImage(card, 'normal'),
        priceCny: priceCny,
        priceUsd: priceUsd,
        rarity: card.rarity || '',
        rarityColor: util.getRarityColor(card.rarity),
        rarityName: util.getRarityName(card.rarity),
        setCode: (card.set_code || card.set || '').toUpperCase(),
        // FAB pitch color coding
        pitch: null
      };
    });
    var allCards = this.data.currentPage === 1 ? newCards : this.data.cards.concat(newCards);
    this.setData({
      cards: allCards,
      hasMore: !!(res && res.has_more),
      totalCards: (res && res.total_cards) || allCards.length,
      loading: false
    });
  },

  async doFabSearch(query) {
    if (!query) {
      this.setData({ loading: false });
      return;
    }
    var res = await api.get('/api/fab/cards/search', { q: query, page: this.data.currentPage });
    var raw = (res && (res.cards || res.data)) || [];
    var newCards = raw.map(function(card) {
      var prices = card.prices || {};
      var priceUsd = prices.usd != null ? Number(prices.usd).toFixed(2) : null;
      var priceCny = prices.cny_converted != null ? Number(prices.cny_converted).toFixed(2) : null;
      if (!priceCny && priceUsd) priceCny = util.usdToCny(parseFloat(priceUsd));
      // Pitch colors: 1=red, 2=yellow, 3=blue
      var pitchBorderClass = '';
      if (card.pitch === '1') pitchBorderClass = 'pitch-red';
      else if (card.pitch === '2') pitchBorderClass = 'pitch-yellow';
      else if (card.pitch === '3') pitchBorderClass = 'pitch-blue';
      return {
        id: card.identifier || card.id || '',
        nameCn: card.name || '',
        nameEn: card.name || '',
        image: card.image || card.image_url || '',
        priceCny: priceCny,
        priceUsd: priceUsd,
        rarity: card.rarity || '',
        rarityColor: util.getRarityColor(card.rarity),
        rarityName: card.rarity || '',
        setCode: '',
        cost: card.cost || null,
        pitch: card.pitch || null,
        pitchBorderClass: pitchBorderClass
      };
    });
    var allCards = this.data.currentPage === 1 ? newCards : this.data.cards.concat(newCards);
    this.setData({
      cards: allCards,
      hasMore: !!(res && res.has_more),
      totalCards: (res && res.total_cards) || allCards.length,
      loading: false
    });
  },

  loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ currentPage: this.data.currentPage + 1 });
    this.doSearch();
  },

  prevPage() {
    if (this.data.currentPage <= 1) return;
    this.setData({ currentPage: this.data.currentPage - 1, cards: [] });
    this.doSearch();
  },

  onCardTap(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    if (this.data.currentGame === 'fab') {
      wx.navigateTo({ url: '/pages/card-detail/card-detail?scryfallId=' + id + '&game=fab' });
    } else {
      wx.navigateTo({ url: '/pages/card-detail/card-detail?scryfallId=' + id });
    }
  },

  // ---- Advanced Filter Sheet ----
  openFilterSheet() {
    this.setData({ showFilterSheet: true });
  },

  closeFilterSheet() {
    this.setData({ showFilterSheet: false });
  },

  onFilterNameInput(e) { this.setData({ filterName: e.detail.value }); },
  onFilterRulesTextInput(e) { this.setData({ filterRulesText: e.detail.value }); },
  onFilterTypeInput(e) { this.setData({ filterType: e.detail.value }); },
  onFilterSetInput(e) { this.setData({ filterSet: e.detail.value }); },
  onFilterArtistInput(e) { this.setData({ filterArtist: e.detail.value }); },
  onFilterCmcValInput(e) { this.setData({ filterCmcVal: e.detail.value }); },

  toggleFilterColor(e) {
    var code = e.currentTarget.dataset.code;
    var colors = this.data.filterColors.slice();
    var idx = colors.indexOf(code);
    if (idx >= 0) colors.splice(idx, 1);
    else colors.push(code);
    this.setData({ filterColors: colors });
  },

  toggleFilterRarity(e) {
    var key = e.currentTarget.dataset.key;
    var rarities = this.data.filterRarity.slice();
    var idx = rarities.indexOf(key);
    if (idx >= 0) rarities.splice(idx, 1);
    else rarities.push(key);
    this.setData({ filterRarity: rarities });
  },

  selectFilterFormat(e) {
    var idx = parseInt(e.detail.value) || 0;
    var opt = this.data.formatOptions[idx];
    this.setData({
      filterFormat: opt ? opt.key : '',
      filterFormatIndex: idx,
      filterFormatLabel: opt ? opt.label : '不限赛制 (All Formats)'
    });
  },

  selectFilterLang(e) {
    var idx = parseInt(e.detail.value) || 0;
    var opt = this.data.langOptions[idx];
    this.setData({
      filterLang: opt ? opt.key : 'any',
      filterLangIndex: idx,
      filterLangLabel: opt ? opt.label : '所有语言 (All Languages)'
    });
  },

  selectFilterCmcOp(e) {
    this.setData({ filterCmcOp: e.detail.value });
  },

  noop() {},

  resetFilters() {
    this.setData({
      filterName: '', filterRulesText: '', filterType: '', filterSet: '',
      filterRarity: [], filterColors: [], filterFormat: '', filterArtist: '',
      filterLang: 'any', filterCmcOp: '=', filterCmcVal: '',
      hasActiveFilters: false,
      filterFormatIndex: 0, filterFormatLabel: '不限赛制 (All Formats)',
      filterLangIndex: 0, filterLangLabel: '所有语言 (All Languages)'
    });
  },

  applyFilters() {
    var active = this.data.filterColors.length > 0 || this.data.filterRarity.length > 0 ||
      !!this.data.filterFormat || !!this.data.filterName || !!this.data.filterRulesText ||
      !!this.data.filterType || !!this.data.filterSet || !!this.data.filterArtist ||
      !!this.data.filterCmcVal;
    this.setData({ showFilterSheet: false, hasActiveFilters: active, cards: [], currentPage: 1 });
    this.doSearch();
  }
});
