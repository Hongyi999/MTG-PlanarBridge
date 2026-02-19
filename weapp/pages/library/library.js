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

    // Filters
    showFilters: false,
    selectedColors: [],
    selectedRarity: '',
    selectedFormat: '',
    colorOptions: [
      { code: 'W', name: 'White', color: '#f9faf4' },
      { code: 'U', name: 'Blue', color: '#0e68ab' },
      { code: 'B', name: 'Black', color: '#150b00' },
      { code: 'R', name: 'Red', color: '#d3202a' },
      { code: 'G', name: 'Green', color: '#00733e' }
    ],
    rarityOptions: ['common', 'uncommon', 'rare', 'mythic'],
    formatOptions: ['standard', 'modern', 'commander', 'pioneer', 'legacy', 'vintage', 'pauper']
  },

  onLoad() {
    // Check if there's a pending query from Home page
    const app = getApp();
    if (app.globalData.pendingLibraryQuery) {
      const query = app.globalData.pendingLibraryQuery;
      app.globalData.pendingLibraryQuery = '';
      this.setData({ searchQuery: query });
      this.doSearch();
    }
  },

  onShow() {
    // Set tab bar selection
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }

    // Check for pending query (from Home page tag/search)
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

  onSearch() {
    this.setData({ cards: [], currentPage: 1 });
    this.doSearch();
  },

  async doSearch() {
    const query = this.data.searchQuery.trim();
    if (!query) {
      wx.showToast({ title: 'Enter a card name', icon: 'none' });
      return;
    }

    this.setData({ loading: true, searched: true });

    try {
      // Build search query with filters
      let searchQuery = query;

      // Add color filter
      if (this.data.selectedColors.length > 0) {
        searchQuery += ' ' + this.data.selectedColors.map(function(c) { return 'color:' + c; }).join(' ');
      }

      // Add rarity filter
      if (this.data.selectedRarity) {
        searchQuery += ' rarity:' + this.data.selectedRarity;
      }

      // Add format filter
      if (this.data.selectedFormat) {
        searchQuery += ' f:' + this.data.selectedFormat;
      }

      const res = await api.get('/api/cards/search', {
        q: searchQuery,
        page: this.data.currentPage
      });

      const rawCards = (res && res.data) || [];
      const newCards = rawCards.map(function(card) {
        return {
          id: card.id,
          name: card.name,
          nameCn: card.printed_name || '',
          image: util.getCardImage(card, 'normal'),
          imageSmall: util.getCardImage(card, 'small'),
          priceUsd: card.prices ? card.prices.usd : null,
          priceCny: util.usdToCny(card.prices ? card.prices.usd : null),
          rarity: card.rarity,
          rarityColor: util.getRarityColor(card.rarity),
          rarityName: util.getRarityName(card.rarity),
          setName: card.set_name || '',
          setCode: card.set || '',
          typeLine: card.type_line || '',
          manaCost: card.mana_cost || ''
        };
      });

      const allCards = this.data.currentPage === 1 ? newCards : this.data.cards.concat(newCards);

      this.setData({
        cards: allCards,
        hasMore: res.has_more || false,
        totalCards: res.total_cards || allCards.length,
        loading: false
      });
    } catch (err) {
      console.error('[Library] Search failed:', err);
      wx.showToast({ title: 'Search failed', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ currentPage: this.data.currentPage + 1 });
    this.doSearch();
  },

  onCardTap(e) {
    const card = e.currentTarget.dataset.card;
    wx.navigateTo({
      url: '/pages/card-detail/card-detail?scryfallId=' + card.id
    });
  },

  // Filter controls
  toggleFilters() {
    this.setData({ showFilters: !this.data.showFilters });
  },

  toggleColor(e) {
    const code = e.currentTarget.dataset.code;
    const colors = this.data.selectedColors.slice();
    const idx = colors.indexOf(code);
    if (idx >= 0) {
      colors.splice(idx, 1);
    } else {
      colors.push(code);
    }
    this.setData({ selectedColors: colors });
  },

  selectRarity(e) {
    const rarity = e.currentTarget.dataset.rarity;
    this.setData({
      selectedRarity: this.data.selectedRarity === rarity ? '' : rarity
    });
  },

  selectFormat(e) {
    const format = e.currentTarget.dataset.format;
    this.setData({
      selectedFormat: this.data.selectedFormat === format ? '' : format
    });
  },

  clearFilters() {
    this.setData({
      selectedColors: [],
      selectedRarity: '',
      selectedFormat: ''
    });
  }
});
