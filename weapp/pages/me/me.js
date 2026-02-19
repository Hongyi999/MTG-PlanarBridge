const api = require('../../utils/api');

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,

    // Stats
    followedCount: 0,
    priceListCount: 0,
    historyCount: 0,

    // Menu items
    menuItems: [
      { key: 'followed', icon: '★', label: 'Followed Cards', desc: 'Track prices of your favorite cards' },
      { key: 'priceLists', icon: '≡', label: 'Price Lists', desc: 'Manage wishlists and sell lists' },
      { key: 'history', icon: '◷', label: 'View History', desc: 'Recently viewed cards' },
      { key: 'settings', icon: '⚙', label: 'Settings', desc: 'Exchange rates & preferences' }
    ]
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.loadStats();
  },

  checkLogin() {
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({
        isLoggedIn: true,
        userInfo: app.globalData.userInfo
      });
    } else {
      // Try to check session with backend
      api.get('/api/auth/me').then(function(user) {
        if (user && user.id) {
          app.globalData.userInfo = user;
          wx.setStorageSync('userInfo', user);
          this.setData({ isLoggedIn: true, userInfo: user });
        }
      }.bind(this)).catch(function() {
        // Not logged in
      });
    }
  },

  async loadStats() {
    try {
      const [followed, priceLists, history] = await Promise.all([
        api.get('/api/followed-cards').catch(function() { return []; }),
        api.get('/api/price-lists').catch(function() { return []; }),
        api.get('/api/card-history').catch(function() { return []; })
      ]);

      this.setData({
        followedCount: (followed || []).length,
        priceListCount: (priceLists || []).length,
        historyCount: (history || []).length
      });
    } catch (err) {
      console.error('[Me] Failed to load stats:', err);
    }
  },

  onMenuTap(e) {
    const key = e.currentTarget.dataset.key;
    switch (key) {
      case 'followed':
        wx.showToast({ title: 'Coming soon', icon: 'none' });
        break;
      case 'priceLists':
        wx.showToast({ title: 'Coming soon', icon: 'none' });
        break;
      case 'history':
        wx.showToast({ title: 'Coming soon', icon: 'none' });
        break;
      case 'settings':
        wx.showToast({ title: 'Coming soon', icon: 'none' });
        break;
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  async onLogout() {
    wx.showModal({
      title: 'Logout',
      content: 'Are you sure you want to log out?',
      success: async function(res) {
        if (res.confirm) {
          try {
            await api.post('/api/auth/logout');
          } catch (err) {
            // Ignore
          }
          getApp().globalData.userInfo = null;
          getApp().globalData.sessionId = '';
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('sessionId');
          this.setData({ isLoggedIn: false, userInfo: null });
          wx.showToast({ title: 'Logged out', icon: 'success' });
        }
      }.bind(this)
    });
  },

  onShareAppMessage() {
    return {
      title: 'PlanarBridge - MTG & FAB Card Price Tracker',
      path: '/pages/home/home'
    };
  }
});
