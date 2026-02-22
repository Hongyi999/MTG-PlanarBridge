const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    searchQuery: '',
    currentGame: 'mtg',
    showGameMenu: false,
    hotCards: [],
    recentCards: [],
    hotLoading: true,
    recentLoading: true,
    formats: [
      { name: 'Standard',  query: 'format:standard' },
      { name: 'Modern',    query: 'format:modern' },
      { name: 'Commander', query: 'format:commander' },
      { name: 'Legacy',    query: 'format:legacy' }
    ],
    fabClasses: [
      { name: 'Ninja',         cn: '忍者',     colorClass: 'fab-class-slate' },
      { name: 'Brute',         cn: '蛮勇',     colorClass: 'fab-class-red' },
      { name: 'Warrior',       cn: '战士',     colorClass: 'fab-class-orange' },
      { name: 'Wizard',        cn: '法师',     colorClass: 'fab-class-blue' },
      { name: 'Ranger',        cn: '游侠',     colorClass: 'fab-class-green' },
      { name: 'Mechanologist', cn: '机械师',   colorClass: 'fab-class-yellow' },
      { name: 'Guardian',      cn: '守护者',   colorClass: 'fab-class-amber' },
      { name: 'Runeblade',     cn: '符文剑士', colorClass: 'fab-class-purple' }
    ],
    fabFormats: ['Classic Constructed', 'Blitz', 'Limited', 'Commoner'],
    games: [
      { key: 'mtg', icon: 'MTG', nameCn: '万智牌',   name: 'Magic: The Gathering' },
      { key: 'fab', icon: 'FAB', nameCn: '血肉之躯', name: 'Flesh and Blood' }
    ]
  },

  onLoad() {
    var saved = wx.getStorageSync('selected_game');
    var game = saved === 'fab' ? 'fab' : 'mtg';
    getApp().globalData.currentGame = game;
    this.setData({ currentGame: game });
    if (game === 'mtg') {
      this.loadHotCards();
      this.loadRecentCards();
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    var app = getApp();
    var game = app.globalData.currentGame || 'mtg';
    if (game !== this.data.currentGame) {
      this.setData({ currentGame: game });
    }
    if (game === 'mtg' && this.data.hotCards.length === 0) {
      this.loadHotCards();
      this.loadRecentCards();
    }
    if (this.data.showGameMenu) this.setData({ showGameMenu: false });
  },

  toggleGameMenu() {
    this.setData({ showGameMenu: !this.data.showGameMenu });
  },

  selectGame(e) {
    var key = e.currentTarget.dataset.key;
    var app = getApp();
    app.globalData.currentGame = key;
    wx.setStorageSync('selected_game', key);
    this.setData({ currentGame: key, showGameMenu: false });
    if (key === 'mtg' && this.data.hotCards.length === 0) {
      this.loadHotCards();
      this.loadRecentCards();
    }
  },

  closeGameMenu() {
    if (this.data.showGameMenu) this.setData({ showGameMenu: false });
  },

  async loadHotCards() {
    this.setData({ hotLoading: true });
    try {
      var res = await api.get('/api/cards/search', { q: 'format:standard rarity:mythic', page: 1 });
      var raw = (res && (res.cards || res.data)) || [];
      var hotCards = raw.slice(0, 3).map(function(card) {
        var prices = card.prices || {};
        var priceCny = prices.cny_converted != null ? Number(prices.cny_converted).toFixed(2) : null;
        var priceUsd = prices.usd != null ? Number(prices.usd).toFixed(2) : null;
        return {
          id: util.getCardId(card),
          nameCn: card.name_cn || card.printed_name || card.name_en || card.name || '',
          nameEn: card.name_en || card.name || '',
          image: util.getCardImage(card, 'small'),
          priceCny: priceCny,
          priceUsd: priceUsd
        };
      });
      this.setData({ hotCards: hotCards });
    } catch (err) {
      console.error('[Home] hotCards error:', err);
      this.setData({ hotCards: [] });
    }
    this.setData({ hotLoading: false });
  },

  async loadRecentCards() {
    this.setData({ recentLoading: true });
    try {
      var res = await api.get('/api/cards/search', { q: 'format:modern rarity:rare', page: 1 });
      var raw = (res && (res.cards || res.data)) || [];
      var recentCards = raw.slice(0, 8).map(function(card) {
        var prices = card.prices || {};
        var priceCny = prices.cny_converted != null ? Number(prices.cny_converted).toFixed(2) : null;
        return {
          id: util.getCardId(card),
          nameCn: card.name_cn || card.printed_name || card.name_en || card.name || '',
          nameEn: card.name_en || card.name || '',
          image: util.getCardImage(card, 'normal'),
          priceCny: priceCny
        };
      });
      this.setData({ recentCards: recentCards });
    } catch (err) {
      console.error('[Home] recentCards error:', err);
      this.setData({ recentCards: [] });
    }
    this.setData({ recentLoading: false });
  },

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value });
  },

  onSearch() {
    var query = this.data.searchQuery.trim();
    if (query) getApp().globalData.pendingLibraryQuery = query;
    wx.switchTab({ url: '/pages/library/library' });
  },

  onFormatTap(e) {
    var query = e.currentTarget.dataset.query;
    getApp().globalData.pendingLibraryQuery = query;
    wx.switchTab({ url: '/pages/library/library' });
  },

  onCardTap(e) {
    var id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/card-detail/card-detail?scryfallId=' + id });
  },

  onFabClassTap(e) {
    var name = e.currentTarget.dataset.name;
    if (name) {
      getApp().globalData.pendingLibraryQuery = name;
      wx.switchTab({ url: '/pages/library/library' });
    }
  },

  goPriceLists() {
    wx.navigateTo({ url: '/pages/price-lists/price-lists' });
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/card-history/card-history' });
  },

  goFabLibrary() {
    wx.switchTab({ url: '/pages/library/library' });
  },

  onPullDownRefresh() {
    if (this.data.currentGame === 'mtg') {
      Promise.all([this.loadHotCards(), this.loadRecentCards()]).then(function() {
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  }
});
