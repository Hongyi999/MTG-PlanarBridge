const api = require('../../utils/api');

Page({
  data: {
    lists: [],
    loading: true,
    selectedListId: null,
    selectedList: null,
    items: [],
    itemsLoading: false,
    showCreateForm: false,
    newListName: '',
    editingItemId: null,
    editQuantity: '',
    editNotes: '',
    editCondition: 'NM',
    conditionOptions: ['NM', 'LP', 'MP', 'HP', 'DMG']
  },

  onLoad() {
    this.loadLists();
  },

  onShow() {
    if (!this.data.selectedListId) {
      this.loadLists();
    }
  },

  onPullDownRefresh() {
    if (this.data.selectedListId) {
      this.loadItems(this.data.selectedListId).then(function() {
        wx.stopPullDownRefresh();
      });
    } else {
      this.loadLists().then(function() {
        wx.stopPullDownRefresh();
      });
    }
  },

  async loadLists() {
    this.setData({ loading: true });
    try {
      var lists = await api.get('/api/price-lists');
      this.setData({ lists: lists || [], loading: false });
    } catch (err) {
      console.error('[PriceLists] Failed to load:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async loadItems(listId) {
    this.setData({ itemsLoading: true });
    try {
      var items = await api.get('/api/price-lists/' + listId + '/items');
      this.setData({ items: items || [], itemsLoading: false });
    } catch (err) {
      console.error('[PriceLists] Failed to load items:', err);
      this.setData({ itemsLoading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onListTap(e) {
    var id = e.currentTarget.dataset.id;
    var list = this.data.lists.find(function(l) { return l.id === id; });
    this.setData({ selectedListId: id, selectedList: list, items: [], editingItemId: null });
    wx.setNavigationBarTitle({ title: list ? list.name : '价格列表' });
    this.loadItems(id);
  },

  goBack() {
    this.setData({ selectedListId: null, selectedList: null, items: [], editingItemId: null });
    wx.setNavigationBarTitle({ title: '价格列表' });
    this.loadLists();
  },

  openCreateForm() {
    this.setData({ showCreateForm: true, newListName: '' });
  },

  closeCreateForm() {
    this.setData({ showCreateForm: false, newListName: '' });
  },

  onNewListNameInput(e) {
    this.setData({ newListName: e.detail.value });
  },

  async createList() {
    var name = this.data.newListName.trim();
    if (!name) {
      wx.showToast({ title: '请输入列表名称', icon: 'none' });
      return;
    }
    try {
      await api.post('/api/price-lists', { name: name });
      this.setData({ showCreateForm: false, newListName: '' });
      await this.loadLists();
      wx.showToast({ title: '创建成功', icon: 'success' });
    } catch (err) {
      console.error('[PriceLists] Create failed:', err);
      wx.showToast({ title: '创建失败', icon: 'none' });
    }
  },

  deleteList(e) {
    var id = e.currentTarget.dataset.id;
    var list = this.data.lists.find(function(l) { return l.id === id; });
    wx.showModal({
      title: '删除列表',
      content: '确定删除"' + (list ? list.name : '') + '"？此操作不可恢复。',
      confirmText: '删除',
      confirmColor: '#dc2626',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          api.del('/api/price-lists/' + id).then(function() {
            this.loadLists();
            wx.showToast({ title: '已删除', icon: 'success' });
          }.bind(this)).catch(function() {
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }.bind(this)
    });
  },

  onCardTap(e) {
    var scryfallId = e.currentTarget.dataset.id;
    if (scryfallId) {
      wx.navigateTo({ url: '/pages/card-detail/card-detail?scryfallId=' + scryfallId });
    }
  },

  startEdit(e) {
    var itemId = e.currentTarget.dataset.id;
    var item = this.data.items.find(function(i) { return i.id === itemId; });
    if (!item) return;
    this.setData({
      editingItemId: itemId,
      editQuantity: String(item.quantity || 1),
      editNotes: item.notes || '',
      editCondition: item.condition || 'NM'
    });
  },

  cancelEdit() {
    this.setData({ editingItemId: null });
  },

  onEditQuantityInput(e) { this.setData({ editQuantity: e.detail.value }); },
  onEditNotesInput(e) { this.setData({ editNotes: e.detail.value }); },

  selectCondition(e) {
    this.setData({ editCondition: e.detail.value });
  },

  async saveEdit() {
    var itemId = this.data.editingItemId;
    var qty = parseInt(this.data.editQuantity) || 1;
    try {
      await api.patch('/api/price-list-items/' + itemId, {
        quantity: qty,
        notes: this.data.editNotes,
        condition: this.data.editCondition
      });
      this.setData({ editingItemId: null });
      await this.loadItems(this.data.selectedListId);
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      console.error('[PriceLists] Save failed:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async removeItem(e) {
    var itemId = e.currentTarget.dataset.id;
    try {
      await api.del('/api/price-list-items/' + itemId);
      await this.loadItems(this.data.selectedListId);
      wx.showToast({ title: '已移除', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '移除失败', icon: 'none' });
    }
  },

  noop() {},

  exportCsv() {
    var list = this.data.selectedList;
    var items = this.data.items;
    if (!items.length) {
      wx.showToast({ title: '列表为空', icon: 'none' });
      return;
    }
    var lines = ['卡牌名称,中文名,套系,稀有度,状况,数量,单价(CNY),小计(CNY)'];
    items.forEach(function(item) {
      var price = item.priceCny || item.priceUsd || 0;
      var subtotal = (parseFloat(price) * (item.quantity || 1)).toFixed(2);
      lines.push([
        item.cardName || '',
        item.cardNameCn || '',
        item.setCode || '',
        item.rarity || '',
        item.condition || 'NM',
        item.quantity || 1,
        price,
        subtotal
      ].join(','));
    });
    var csv = lines.join('\n');
    var fs = wx.getFileSystemManager();
    var filePath = wx.env.USER_DATA_PATH + '/' + (list ? list.name : 'price-list') + '.csv';
    fs.writeFile({
      filePath: filePath,
      data: csv,
      encoding: 'utf8',
      success: function() {
        wx.shareFileMessage({
          filePath: filePath,
          success: function() {},
          fail: function() {
            wx.showToast({ title: 'CSV 已生成', icon: 'success' });
          }
        });
      },
      fail: function() {
        wx.showToast({ title: '导出失败', icon: 'none' });
      }
    });
  }
});
