const api = require('../../utils/api');

Page({
  data: {
    history: [],
    loading: true
  },

  onLoad() {
    this.loadHistory();
  },

  onPullDownRefresh() {
    this.loadHistory().then(function() {
      wx.stopPullDownRefresh();
    });
  },

  async loadHistory() {
    this.setData({ loading: true });
    try {
      var data = await api.get('/api/card-history');
      var entries = (data || []).map(function(entry) {
        return {
          id: entry.id || entry.scryfallId,
          scryfallId: entry.scryfallId || '',
          cardName: entry.cardName || entry.cardNameEn || '',
          cardNameCn: entry.cardNameCn || entry.cardName || '',
          cardImage: entry.cardImage || '',
          viewedAt: entry.viewedAt || entry.createdAt || '',
          timeAgo: _timeAgo(entry.viewedAt || entry.createdAt)
        };
      });
      this.setData({ history: entries, loading: false });
    } catch (err) {
      console.error('[CardHistory] Failed to load:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onCardTap(e) {
    var scryfallId = e.currentTarget.dataset.id;
    if (scryfallId) {
      wx.navigateTo({ url: '/pages/card-detail/card-detail?scryfallId=' + scryfallId });
    }
  },

  clearHistory() {
    wx.showModal({
      title: '清除足迹',
      content: '确定要清除所有浏览记录吗？',
      confirmText: '清除',
      confirmColor: '#dc2626',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          api.del('/api/card-history').then(function() {
            this.setData({ history: [] });
            wx.showToast({ title: '已清除', icon: 'success' });
          }.bind(this)).catch(function() {
            wx.showToast({ title: '操作失败', icon: 'none' });
          });
        }
      }.bind(this)
    });
  }
});

function _timeAgo(dateStr) {
  if (!dateStr) return '';
  var now = Date.now();
  var then = new Date(dateStr).getTime();
  var diff = Math.floor((now - then) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  if (diff < 2592000) return Math.floor(diff / 86400) + '天前';
  return new Date(dateStr).toLocaleDateString('zh-CN');
}
