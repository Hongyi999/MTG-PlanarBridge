const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    searchQuery: '',
    trendingCards: [],
    recentPosts: [],
    loading: true,
    formatTags: [
      { name: 'Standard', query: 'f:standard' },
      { name: 'Modern', query: 'f:modern' },
      { name: 'Commander', query: 'f:commander' },
      { name: 'Pioneer', query: 'f:pioneer' },
      { name: 'Legacy', query: 'f:legacy' }
    ]
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // Set tab bar selection
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  async loadData() {
    this.setData({ loading: true });

    try {
      // Load trending cards (Standard format popular cards)
      const cardsRes = await api.get('/api/cards/search', { q: 'f:standard', page: 1 });
      const rawCards = (cardsRes && cardsRes.data) || [];
      const trendingCards = rawCards.slice(0, 8).map(function(card) {
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
          setName: card.set_name || ''
        };
      });

      this.setData({ trendingCards: trendingCards });
    } catch (err) {
      console.error('[Home] Failed to load trending cards:', err);
    }

    try {
      // Load recent community posts
      const posts = await api.get('/api/community-posts');
      const recentPosts = (posts || []).slice(0, 5).map(function(post) {
        const typeInfo = util.getPostTypeInfo(post.type);
        return {
          id: post.id,
          authorName: post.authorName || 'Anonymous',
          authorAvatar: post.authorAvatar || '',
          content: util.truncate(post.content, 80),
          type: post.type,
          typeLabel: typeInfo.label,
          typeColorClass: typeInfo.colorClass,
          images: post.images || [],
          cardName: post.cardName || '',
          cardImage: post.cardImage || '',
          likes: post.likes || 0,
          timeAgo: util.timeAgo(post.createdAt)
        };
      });

      this.setData({ recentPosts: recentPosts });
    } catch (err) {
      console.error('[Home] Failed to load posts:', err);
    }

    this.setData({ loading: false });
  },

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value });
  },

  onSearch() {
    const query = this.data.searchQuery.trim();
    if (!query) return;
    // Pass query to Library page via globalData, then switch tab
    getApp().globalData.pendingLibraryQuery = query;
    wx.switchTab({ url: '/pages/library/library' });
  },

  onTagTap(e) {
    const query = e.currentTarget.dataset.query;
    getApp().globalData.pendingLibraryQuery = query;
    wx.switchTab({ url: '/pages/library/library' });
  },

  onCardTap(e) {
    const card = e.currentTarget.dataset.card;
    wx.navigateTo({
      url: '/pages/card-detail/card-detail?scryfallId=' + card.id
    });
  },

  onPostTap(e) {
    // Could navigate to post detail in the future
    const post = e.currentTarget.dataset.post;
    if (post.cardName) {
      // If post has a linked card, navigate to community tab
      wx.switchTab({ url: '/pages/community/community' });
    }
  },

  onPullDownRefresh() {
    this.loadData().then(function() {
      wx.stopPullDownRefresh();
    });
  }
});
