const api = require('../../utils/api');

Page({
  data: {
    // View: 'conversations' | 'thread'
    view: 'conversations',

    // Conversations list
    conversations: [],
    convsLoading: true,

    // User search
    searchQuery: '',
    searchResults: [],
    searchLoading: false,

    // Current thread
    currentUser: null,
    messages: [],
    messagesLoading: false,
    inputText: '',

    // Scroll
    scrollToBottom: ''
  },

  _pollTimer: null,
  _msgPollTimer: null,

  onLoad(options) {
    // Can open directly to a user thread
    if (options.userId) {
      this.openThread({ id: parseInt(options.userId), username: options.username || '用户', avatar: '' });
    } else {
      this.loadConversations();
      this._startConvPolling();
    }
  },

  onUnload() {
    this._stopPolling();
  },

  onHide() {
    this._stopPolling();
  },

  onShow() {
    if (this.data.view === 'conversations') {
      this.loadConversations();
      this._startConvPolling();
    } else if (this.data.view === 'thread') {
      this._startMsgPolling();
    }
  },

  _startConvPolling() {
    this._stopPolling();
    this._pollTimer = setInterval(function() {
      this.loadConversations(true);
    }.bind(this), 10000);
  },

  _startMsgPolling() {
    this._stopPolling();
    this._msgPollTimer = setInterval(function() {
      if (this.data.currentUser) {
        this.loadMessages(this.data.currentUser.id, true);
      }
    }.bind(this), 3000);
  },

  _stopPolling() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    if (this._msgPollTimer) { clearInterval(this._msgPollTimer); this._msgPollTimer = null; }
  },

  async loadConversations(silent) {
    if (!silent) this.setData({ convsLoading: true });
    try {
      var res = await api.get('/api/messages/conversations');
      var convs = (res || []).map(function(c) {
        return {
          user: c.user,
          lastMessage: c.lastMessage ? (c.lastMessage.content || '') : '',
          lastTime: _timeAgo(c.lastMessage ? c.lastMessage.createdAt : ''),
          unreadCount: c.unreadCount || 0
        };
      });
      this.setData({ conversations: convs, convsLoading: false });
    } catch (err) {
      this.setData({ convsLoading: false });
    }
  },

  onSearchInput(e) {
    var q = e.detail.value;
    this.setData({ searchQuery: q, searchResults: [] });
    if (q.length >= 2) {
      this._searchUsers(q);
    }
  },

  async _searchUsers(q) {
    this.setData({ searchLoading: true });
    try {
      var res = await api.get('/api/users/search', { q: q });
      this.setData({ searchResults: res || [], searchLoading: false });
    } catch (err) {
      this.setData({ searchLoading: false });
    }
  },

  clearSearch() {
    this.setData({ searchQuery: '', searchResults: [] });
  },

  openThreadFromSearch(e) {
    var user = e.currentTarget.dataset.user;
    this.clearSearch();
    this.openThread(user);
  },

  openThreadFromConv(e) {
    var user = e.currentTarget.dataset.user;
    this.openThread(user);
  },

  openThread(user) {
    this._stopPolling();
    this.setData({
      view: 'thread',
      currentUser: user,
      messages: [],
      messagesLoading: true,
      inputText: ''
    });
    wx.setNavigationBarTitle({ title: user.username || '私信' });
    this.loadMessages(user.id, false);
    this._startMsgPolling();
  },

  goBackToConversations() {
    this._stopPolling();
    this.setData({ view: 'conversations', currentUser: null, messages: [] });
    wx.setNavigationBarTitle({ title: '私信' });
    this.loadConversations();
    this._startConvPolling();
  },

  async loadMessages(userId, silent) {
    if (!silent) this.setData({ messagesLoading: true });
    try {
      var app = getApp();
      var myId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
      var res = await api.get('/api/messages/' + userId);
      var msgs = (res || []).map(function(m) {
        return {
          id: m.id,
          content: m.content || '',
          isMe: m.senderId === myId,
          time: _timeAgo(m.createdAt),
          createdAt: m.createdAt
        };
      });
      this.setData({ messages: msgs, messagesLoading: false });
      this._scrollToBottom();
    } catch (err) {
      this.setData({ messagesLoading: false });
    }
  },

  _scrollToBottom() {
    var msgs = this.data.messages;
    if (msgs.length > 0) {
      this.setData({ scrollToBottom: 'msg-' + msgs[msgs.length - 1].id });
    }
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
  },

  async sendMessage() {
    var text = this.data.inputText.trim();
    if (!text || !this.data.currentUser) return;
    this.setData({ inputText: '' });
    try {
      await api.post('/api/messages', {
        receiverId: this.data.currentUser.id,
        content: text
      });
      await this.loadMessages(this.data.currentUser.id, true);
    } catch (err) {
      wx.showToast({ title: '发送失败', icon: 'none' });
      this.setData({ inputText: text });
    }
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
