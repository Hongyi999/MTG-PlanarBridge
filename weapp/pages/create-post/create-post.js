const api = require('../../utils/api');

Page({
  data: {
    content: '',
    type: 'discussion',
    typeOptions: [
      { value: 'discussion', label: 'Discussion' },
      { value: 'sell', label: 'Sell' },
      { value: 'buy', label: 'Buy' },
      { value: 'trade', label: 'Trade' }
    ],
    images: [],
    maxImages: 9,
    cardSearch: '',
    linkedCard: null,
    price: '',
    submitting: false
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ type: type });
  },

  onPriceInput(e) {
    this.setData({ price: e.detail.value });
  },

  // Image handling
  chooseImage() {
    const remaining = this.data.maxImages - this.data.images.length;
    if (remaining <= 0) {
      wx.showToast({ title: 'Max 9 images', icon: 'none' });
      return;
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const newImages = res.tempFiles.map(function(file) {
          return file.tempFilePath;
        });
        this.setData({
          images: this.data.images.concat(newImages)
        });
      }.bind(this)
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.slice();
    images.splice(index, 1);
    this.setData({ images: images });
  },

  // Card search
  onCardSearchInput(e) {
    this.setData({ cardSearch: e.detail.value });
  },

  async searchCard() {
    const query = this.data.cardSearch.trim();
    if (!query) return;

    try {
      wx.showLoading({ title: 'Searching...' });
      const res = await api.get('/api/cards/search', { q: query, page: 1 });
      wx.hideLoading();

      if (res && res.data && res.data.length > 0) {
        const card = res.data[0];
        const imageUris = card.image_uris || (card.card_faces && card.card_faces[0] ? card.card_faces[0].image_uris : null);
        this.setData({
          linkedCard: {
            scryfallId: card.id,
            name: card.name,
            nameCn: card.printed_name || '',
            image: imageUris ? (imageUris.small || imageUris.normal) : ''
          }
        });
      } else {
        wx.showToast({ title: 'Card not found', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: 'Search failed', icon: 'none' });
    }
  },

  removeLinkedCard() {
    this.setData({ linkedCard: null });
  },

  // Submit
  async submitPost() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: 'Please enter content', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      // Upload images first
      let imageUrls = [];
      if (this.data.images.length > 0) {
        wx.showLoading({ title: 'Uploading images...' });
        for (let i = 0; i < this.data.images.length; i++) {
          try {
            const url = await api.uploadImage(this.data.images[i]);
            imageUrls.push(url);
          } catch (err) {
            console.error('Failed to upload image:', err);
          }
        }
        wx.hideLoading();
      }

      // Create post
      const postData = {
        content: this.data.content.trim(),
        type: this.data.type,
        images: imageUrls,
        authorName: 'Anonymous',
        authorAvatar: ''
      };

      // Add linked card info
      if (this.data.linkedCard) {
        postData.scryfallId = this.data.linkedCard.scryfallId;
        postData.cardName = this.data.linkedCard.name;
        postData.cardImage = this.data.linkedCard.image;
      }

      // Add price
      if (this.data.price) {
        postData.price = parseFloat(this.data.price);
      }

      // Add user info if logged in
      const app = getApp();
      if (app.globalData.userInfo) {
        postData.authorName = app.globalData.userInfo.username || app.globalData.userInfo.wechatNickname || 'User';
        postData.authorAvatar = app.globalData.userInfo.avatar || '';
      }

      await api.post('/api/community-posts', postData);

      wx.showToast({ title: 'Posted!', icon: 'success' });
      setTimeout(function() {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      console.error('[CreatePost] Failed:', err);
      wx.showToast({ title: 'Failed to post', icon: 'none' });
    }

    this.setData({ submitting: false });
  }
});
