Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/home/home',
        text: 'Discover',
        icon: '◆'
      },
      {
        pagePath: '/pages/library/library',
        text: 'Library',
        icon: '▣'
      },
      {
        pagePath: '/pages/community/community',
        text: 'Community',
        icon: '◈'
      },
      {
        pagePath: '/pages/me/me',
        text: 'Profile',
        icon: '◉'
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
