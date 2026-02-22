const api = require('../../utils/api');

Page({
  data: {
    phone: '',
    code: '',
    loading: false,
    codeSent: false,
    countdown: 0
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value });
  },

  async sendCode() {
    var phone = this.data.phone.trim();
    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      await api.post('/api/auth/send-code', { phone: phone });
      this.setData({ codeSent: true, loading: false });
      wx.showToast({ title: '验证码已发送', icon: 'success' });
      this._startCountdown();
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '发送失败，请重试', icon: 'none' });
    }
  },

  _startCountdown() {
    this.setData({ countdown: 60 });
    var timer = setInterval(function() {
      var c = this.data.countdown - 1;
      if (c <= 0) {
        clearInterval(timer);
        this.setData({ countdown: 0 });
      } else {
        this.setData({ countdown: c });
      }
    }.bind(this), 1000);
  },

  async login() {
    var phone = this.data.phone.trim();
    var code = this.data.code.trim();
    if (!phone || !code) {
      wx.showToast({ title: '请输入手机号和验证码', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      var user = await api.post('/api/auth/login', { phone: phone, code: code });
      if (user && user.id) {
        getApp().globalData.userInfo = user;
        wx.setStorageSync('userInfo', user);
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(function() { wx.navigateBack(); }, 1000);
      } else {
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      }
      this.setData({ loading: false });
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '登录失败，请检查验证码', icon: 'none' });
    }
  }
});
