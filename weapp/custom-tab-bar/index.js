Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/home/home',
        text: '发现',
        icon: '⌂'
      },
      {
        pagePath: '/pages/library/library',
        text: '卡库',
        icon: '⚲'
      },
      {
        pagePath: '/pages/community/community',
        text: '社区',
        icon: '⊞'
      },
      {
        pagePath: '/pages/me/me',
        text: '我的',
        icon: '⊙'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.list[index];
      wx.switchTab({
        url: item.pagePath
      });
    }
  }
});
