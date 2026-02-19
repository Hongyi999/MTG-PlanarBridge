App({
  globalData: {
    // ============================================================
    // IMPORTANT: Replace with your deployed backend URL
    // Must be HTTPS for production. During development, enable
    // "不校验合法域名" in DevTools → Details → Local Settings
    // ============================================================
    apiBaseUrl: 'http://localhost:5000',

    userInfo: null,
    sessionId: '',

    exchangeRates: {
      usdToCny: 7.25,
      usdToJpy: 150
    },

    // Used to pass search query from Home to Library tab
    pendingLibraryQuery: ''
  },

  onLaunch() {
    this.loadExchangeRates();
    this.loadSession();
  },

  loadExchangeRates() {
    const that = this;
    wx.request({
      url: `${this.globalData.apiBaseUrl}/api/exchange-rates`,
      success(res) {
        if (res.statusCode === 200 && res.data) {
          const rates = res.data;
          that.globalData.exchangeRates = {
            usdToCny: rates.usdToCny || rates.usd_to_cny || 7.25,
            usdToJpy: rates.usdToJpy || rates.usd_to_jpy || 150
          };
        }
      },
      fail() {
        console.log('[App] Using default exchange rates');
      }
    });
  },

  loadSession() {
    const sessionId = wx.getStorageSync('sessionId');
    if (sessionId) {
      this.globalData.sessionId = sessionId;
    }
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  }
});
