const api = require('../../utils/api');

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,

    followedCount: 0,
    priceListCount: 0,
    historyCount: 0,

    menuItems: [
      { key: 'followed',   icon: '★', label: '关注的卡牌', desc: '追踪你喜爱卡牌的价格变动' },
      { key: 'priceLists', icon: '≡', label: '价格列表',   desc: '管理心愿单和出售列表' },
      { key: 'history',    icon: '◷', label: '浏览足迹',   desc: '最近查看过的卡牌' },
      { key: 'settings',   icon: '⚙', label: '设置',       desc: '汇率偏好等配置' }
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
      this.setData({ isLoggedIn: true, userInfo: app.globalData.userInfo });
    } else {
      api.get('/api/auth/me').then(function(res) {
        var user = res && res.user;
        if (user && user.id) {
          app.globalData.userInfo = user;
          wx.setStorageSync('userInfo', user);
          this.setData({ isLoggedIn: true, userInfo: user });
        }
      }.bind(this)).catch(function() {});
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
        wx.showToast({ title: '关注功能即将上线', icon: 'none' });
        break;
      case 'priceLists':
        wx.navigateTo({ url: '/pages/price-lists/price-lists' });
        break;
      case 'history':
        wx.navigateTo({ url: '/pages/card-history/card-history' });
        break;
      case 'settings':
        wx.showToast({ title: '设置功能即将上线', icon: 'none' });
        break;
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  async onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      success: async function(res) {
        if (res.confirm) {
          try {
            await api.post('/api/auth/logout');
          } catch (err) {}
          getApp().globalData.userInfo = null;
          getApp().globalData.sessionId = '';
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('sessionId');
          this.setData({ isLoggedIn: false, userInfo: null });
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }.bind(this)
    });
  },

  onShareAppMessage() {
    return {
      title: 'PlanarBridge — MTG & FAB 卡牌价格查询',
      path: '/pages/home/home'
    };
  }
});
