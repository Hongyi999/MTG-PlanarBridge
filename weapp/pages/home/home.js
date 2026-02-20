const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    searchQuery: '',
    hotCards: [],
    recentCards: [],
    hotLoading: true,
    recentLoading: true,
    formats: [
      { name: 'Standard',  query: 'f:standard' },
      { name: 'Modern',    query: 'f:modern' },
      { name: 'Commander', query: 'f:commander' },
      { name: 'Pioneer',   query: 'f:pioneer' },
      { name: 'Legacy',    query: 'f:legacy' },
      { name: 'Vintage',   query: 'f:vintage' }
    ]
  },

  onLoad() {
    this.loadHotCards();
    this.loadRecentCards();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  // 市场动向：标准赛制秘稀牌前3张
  async loadHotCards() {
    this.setData({ hotLoading: true });
    try {
      const res = await api.get('/api/cards/search', { q: 'f:standard rarity:mythic', page: 1 });
      const raw = (res && (res.cards || res.data)) || [];
      const hotCards = raw.slice(0, 3).map(function(card) {
        return {
          id: util.getCardId(card),
          nameCn: util.getCardName(card),
          nameEn: util.getCardNameEn(card),
          image: util.getCardImage(card, 'small'),
          priceCny: util.getCardPriceCny(card),
          priceUsd: util.getCardPriceUsd(card)
        };
      });
      this.setData({ hotCards: hotCards });
    } catch (err) {
      console.error('[Home] hotCards error:', err);
      this.setData({ hotCards: [] });
    }
    this.setData({ hotLoading: false });
  },

  // 社区热门：现代赛制稀有牌横向滚动
  async loadRecentCards() {
    this.setData({ recentLoading: true });
    try {
      const res = await api.get('/api/cards/search', { q: 'f:modern rarity:rare', page: 1 });
      const raw = (res && (res.cards || res.data)) || [];
      const recentCards = raw.slice(0, 8).map(function(card) {
        return {
          id: util.getCardId(card),
          nameCn: util.getCardName(card),
          nameEn: util.getCardNameEn(card),
          image: util.getCardImage(card, 'normal'),
          priceCny: util.getCardPriceCny(card),
          priceUsd: util.getCardPriceUsd(card)
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
    const query = this.data.searchQuery.trim();
    if (!query) return;
    getApp().globalData.pendingLibraryQuery = query;
    wx.switchTab({ url: '/pages/library/library' });
  },

  onFormatTap(e) {
    const query = e.currentTarget.dataset.query;
    getApp().globalData.pendingLibraryQuery = query;
    wx.switchTab({ url: '/pages/library/library' });
  },

  onCardTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({ url: '/pages/card-detail/card-detail?scryfallId=' + id });
    }
  },

  goPriceLists() {
    wx.showToast({ title: '价格列表 — 即将上线', icon: 'none' });
  },

  goHistory() {
    wx.showToast({ title: '浏览足迹 — 即将上线', icon: 'none' });
  },

  onPullDownRefresh() {
    this.loadHotCards();
    this.loadRecentCards();
    setTimeout(function() { wx.stopPullDownRefresh(); }, 1500);
  }
});
