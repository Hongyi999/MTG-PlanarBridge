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
    currentGame: 'mtg', // 'mtg' | 'fab'

    // Filters
    showFilters: false,
    hasActiveFilters: false,
    selectedColors: [],
    selectedRarity: '',
    selectedFormat: '',

    colorOptions: [
      { code: 'W', name: '白', color: '#f9f3e3', border: true },
      { code: 'U', name: '蓝', color: '#1565c0' },
      { code: 'B', name: '黑', color: '#3b3b3b' },
      { code: 'R', name: '红', color: '#d32029' },
      { code: 'G', name: '绿', color: '#1b5e20' }
    ],
    rarityOptions: [
      { key: 'common',   label: '普通' },
      { key: 'uncommon', label: '非普' },
      { key: 'rare',     label: '稀有' },
      { key: 'mythic',   label: '秘稀' }
    ],
    formatOptions: [
      { key: 'standard',  label: '标准' },
      { key: 'modern',    label: '现代' },
      { key: 'commander', label: '统帅' },
      { key: 'pioneer',   label: '先驱' },
      { key: 'legacy',    label: '薪传' },
      { key: 'vintage',   label: '特选' },
      { key: 'pauper',    label: '平民' }
    ]
  },

  onLoad() {
    // Load game from globalData
    const app = getApp();
    const game = app.globalData.currentGame || 'mtg';
    this.setData({ currentGame: game });
    this._checkPendingQuery();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this._checkPendingQuery();
  },

  _checkPendingQuery() {
    const app = getApp();
    if (app.globalData.pendingLibraryQuery) {
      const query = app.globalData.pendingLibraryQuery;
      app.globalData.pendingLibraryQuery = '';
      this.setData({ searchQuery: query, cards: [], currentPage: 1 });
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
    const query = this.data.searchQuery.trim();
    if (!query) {
      wx.showToast({ title: '请输入搜索词', icon: 'none' });
      return;
    }
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

  async doMtgSearch(query) {
    let q = query;
    if (this.data.selectedColors.length > 0) {
      q += ' ' + this.data.selectedColors.map(function(c) { return 'color:' + c; }).join(' ');
    }
    if (this.data.selectedRarity) q += ' rarity:' + this.data.selectedRarity;
    if (this.data.selectedFormat) q += ' f:' + this.data.selectedFormat;

    const res = await api.get('/api/cards/search', { q: q, page: this.data.currentPage });
    const raw = (res && (res.cards || res.data)) || [];
    const newCards = raw.map(function(card) {
      return {
        id: util.getCardId(card),
        nameCn: util.getCardName(card),
        nameEn: util.getCardNameEn(card),
        image: util.getCardImage(card, 'normal'),
        priceCny: util.getCardPriceCny(card),
        priceUsd: util.getCardPriceUsd(card),
        rarity: card.rarity || '',
        rarityColor: util.getRarityColor(card.rarity),
        rarityName: util.getRarityName(card.rarity),
        setCode: (card.set_code || card.set || '').toUpperCase()
      };
    });
    const allCards = this.data.currentPage === 1 ? newCards : this.data.cards.concat(newCards);
    this.setData({
      cards: allCards,
      hasMore: !!(res && res.has_more),
      totalCards: (res && res.total_cards) || allCards.length,
      loading: false
    });
  },

  async doFabSearch(query) {
    const res = await api.get('/api/fab/cards/search', { q: query, page: this.data.currentPage });
    const raw = (res && (res.cards || res.data)) || [];
    const newCards = raw.map(function(card) {
      // FAB API returns: { identifier, name, image, prices: { usd, usd_foil, cny_converted, jpy_converted }, ... }
      var prices = card.prices || {};
      var priceUsd = prices.usd != null ? Number(prices.usd).toFixed(2) : null;
      var priceCny = prices.cny_converted != null ? Number(prices.cny_converted).toFixed(2) : null;
      if (!priceCny && priceUsd) {
        priceCny = util.usdToCny(parseFloat(priceUsd));
      }
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
        setCode: ''
      };
    });
    const allCards = this.data.currentPage === 1 ? newCards : this.data.cards.concat(newCards);
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

  onCardTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    if (this.data.currentGame === 'fab') {
      wx.navigateTo({ url: '/pages/card-detail/card-detail?scryfallId=' + id + '&game=fab' });
    } else {
      wx.navigateTo({ url: '/pages/card-detail/card-detail?scryfallId=' + id });
    }
  },

  toggleGame() {
    const newGame = this.data.currentGame === 'mtg' ? 'fab' : 'mtg';
    getApp().globalData.currentGame = newGame;
    this.setData({
      currentGame: newGame,
      cards: [], searched: false, searchQuery: '',
      hasMore: false, totalCards: 0, currentPage: 1,
      showFilters: false
    });
  },

  toggleFilters() {
    this.setData({ showFilters: !this.data.showFilters });
  },

  toggleColor(e) {
    const code = e.currentTarget.dataset.code;
    const colors = this.data.selectedColors.slice();
    const idx = colors.indexOf(code);
    if (idx >= 0) colors.splice(idx, 1);
    else colors.push(code);
    this.setData({ selectedColors: colors, hasActiveFilters: this._checkActive(colors, this.data.selectedRarity, this.data.selectedFormat) });
  },

  selectRarity(e) {
    const rarity = e.currentTarget.dataset.rarity;
    const val = this.data.selectedRarity === rarity ? '' : rarity;
    this.setData({ selectedRarity: val, hasActiveFilters: this._checkActive(this.data.selectedColors, val, this.data.selectedFormat) });
  },

  selectFormat(e) {
    const format = e.currentTarget.dataset.format;
    const val = this.data.selectedFormat === format ? '' : format;
    this.setData({ selectedFormat: val, hasActiveFilters: this._checkActive(this.data.selectedColors, this.data.selectedRarity, val) });
  },

  clearFilters() {
    this.setData({ selectedColors: [], selectedRarity: '', selectedFormat: '', hasActiveFilters: false });
  },

  _checkActive(colors, rarity, format) {
    return (colors && colors.length > 0) || !!rarity || !!format;
  }
});
