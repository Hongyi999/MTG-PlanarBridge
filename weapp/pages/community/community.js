const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    posts: [],
    loading: true,
    activeFilter: 'all',
    filterOptions: [
      { key: 'all', label: 'All' },
      { key: 'sell', label: 'Sell' },
      { key: 'buy', label: 'Buy' },
      { key: 'trade', label: 'Trade' },
      { key: 'discussion', label: 'Discussion' }
    ]
  },

  onLoad() {
    this.loadPosts();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    // Reload posts when returning from create-post
    if (this._needRefresh) {
      this._needRefresh = false;
      this.loadPosts();
    }
  },

  async loadPosts() {
    this.setData({ loading: true });

    try {
      const posts = await api.get('/api/community-posts');
      const allPosts = (posts || []).map(function(post) {
        const typeInfo = util.getPostTypeInfo(post.type);
        return {
          id: post.id,
          authorName: post.authorName || 'Anonymous',
          authorAvatar: post.authorAvatar || '',
          content: post.content || '',
          type: post.type || 'discussion',
          typeLabel: typeInfo.label,
          typeColorClass: typeInfo.colorClass,
          images: post.images || [],
          scryfallId: post.scryfallId || '',
          cardName: post.cardName || '',
          cardImage: post.cardImage || '',
          price: post.price || null,
          likes: post.likes || 0,
          comments: post.comments || 0,
          timeAgo: util.timeAgo(post.createdAt),
          createdAt: post.createdAt
        };
      });

      this.setData({ posts: allPosts, loading: false });
    } catch (err) {
      console.error('[Community] Failed to load posts:', err);
      wx.showToast({ title: 'Failed to load posts', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onFilterTap(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeFilter: key });
  },

  getFilteredPosts() {
    if (this.data.activeFilter === 'all') return this.data.posts;
    return this.data.posts.filter(function(post) {
      return post.type === this.data.activeFilter;
    }.bind(this));
  },

  async onLike(e) {
    const postId = e.currentTarget.dataset.id;
    try {
      await api.post('/api/community-posts/' + postId + '/like');
      // Update local like count
      const posts = this.data.posts.map(function(post) {
        if (post.id === postId) {
          return Object.assign({}, post, { likes: post.likes + 1 });
        }
        return post;
      });
      this.setData({ posts: posts });
    } catch (err) {
      wx.showToast({ title: 'Failed to like', icon: 'none' });
    }
  },

  onPostImageTap(e) {
    const urls = e.currentTarget.dataset.urls;
    const current = e.currentTarget.dataset.current;
    wx.previewImage({ urls: urls, current: current });
  },

  onCardRefTap(e) {
    const scryfallId = e.currentTarget.dataset.id;
    if (scryfallId) {
      wx.navigateTo({
        url: '/pages/card-detail/card-detail?scryfallId=' + scryfallId
      });
    }
  },

  goCreatePost() {
    this._needRefresh = true;
    wx.navigateTo({ url: '/pages/create-post/create-post' });
  },

  onPullDownRefresh() {
    this.loadPosts().then(function() {
      wx.stopPullDownRefresh();
    });
  }
});
