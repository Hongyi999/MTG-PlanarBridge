const api = require('../../utils/api');
const util = require('../../utils/util');

// Chinese format names for legalities
var FORMAT_NAMES = {
  standard:  '标准',
  pioneer:   '先驱',
  modern:    '现代',
  legacy:    '薪传',
  vintage:   '特选',
  commander: '统帅',
  pauper:    '平民',
  brawl:     '混战'
};

Page({
  data: {
    scryfallId: '',
    card: null,
    loading: true,
    isFab: false,
    isFollowed: false,
    priceHistory: [],

    displayName: '',
    displayNameEn: '',
    displayImage: '',
    displayTypeLine: '',
    displayOracleText: '',
    displayManaCost: '',
    displaySet: '',
    displayRarity: '',
    displayRarityColor: '',
    displayArtist: '',

    // FAB-specific
    fabCost: null,
    fabPitch: null,
    fabPower: null,
    fabDefense: null,
    fabHealth: null,
    fabKeywords: [],
    fabPrintings: [],

    priceUsd: null,
    priceUsdFoil: null,
    priceEur: null,
    priceTix: null,
    priceCny: null,
    priceCnyFoil: null,
    priceJpy: null,

    legalities: [],
    manaSymbols: []
  },

  onLoad(options) {
    const isFab = options.game === 'fab';
    this.setData({ isFab: isFab });

    if (isFab && options.scryfallId) {
      // For FAB cards, scryfallId is actually the identifier (e.g., "MST131")
      this.setData({ scryfallId: options.scryfallId });
      this.loadFabCard(options.scryfallId);
    } else if (options.scryfallId) {
      this.setData({ scryfallId: options.scryfallId });
      this.loadCard(options.scryfallId);
      this.checkFollowed(options.scryfallId);
      this.loadPriceHistory(options.scryfallId);
    }
  },

  // ============ FAB Card Loading ============
  async loadFabCard(identifier) {
    this.setData({ loading: true });
    try {
      const card = await api.get('/api/fab/cards/' + identifier);
      if (!card) {
        wx.showToast({ title: '卡牌未找到', icon: 'none' });
        this.setData({ loading: false });
        return;
      }

      var prices = card.prices || {};
      var priceUsd = prices.usd != null ? Number(prices.usd).toFixed(2) : null;
      var priceUsdFoil = prices.usd_foil != null ? Number(prices.usd_foil).toFixed(2) : null;
      var priceCny = prices.cny_converted != null ? Number(prices.cny_converted).toFixed(2) : null;
      var priceJpy = prices.jpy_converted != null ? Math.round(prices.jpy_converted) : null;
      if (!priceCny && priceUsd) {
        priceCny = util.usdToCny(parseFloat(priceUsd));
      }

      // Map printings with prices
      var printings = (card.printings || []).map(function(p) {
        var pp = p.prices || {};
        return {
          id: p.id || '',
          edition: p.edition || '',
          foiling: p.foiling || '',
          rarity: p.rarity || '',
          image: p.image || '',
          priceUsd: pp.usd != null ? Number(pp.usd).toFixed(2) : null,
          priceUsdFoil: pp.usd_foil != null ? Number(pp.usd_foil).toFixed(2) : null
        };
      });

      this.setData({
        card: card,
        loading: false,
        displayName: card.name || '',
        displayNameEn: card.name || '',
        displayImage: card.image || '',
        displayTypeLine: '',
        displayOracleText: card.text || '',
        displaySet: '',
        displayRarity: card.rarity || '',
        displayRarityColor: util.getRarityColor(card.rarity),
        fabCost: card.cost || null,
        fabPitch: card.pitch || null,
        fabPower: card.power || null,
        fabDefense: card.defense || null,
        fabHealth: card.health || null,
        fabKeywords: card.keywords || [],
        fabPrintings: printings,
        priceUsd: priceUsd,
        priceUsdFoil: priceUsdFoil,
        priceCny: priceCny,
        priceJpy: priceJpy,
      });

      wx.setNavigationBarTitle({ title: card.name || 'FAB Card' });
    } catch (err) {
      console.error('[CardDetail] Failed to load FAB card:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // ============ MTG Card Loading (original) ============
  async loadCard(scryfallId) {
    this.setData({ loading: true });
    try {
      const card = await api.get('/api/cards/scryfall/' + scryfallId);
      if (!card) {
        wx.showToast({ title: '卡牌未找到', icon: 'none' });
        this.setData({ loading: false });
        return;
      }

      const displayName = card.name_cn || card.printed_name || card.name_en || card.name || '';
      const displayNameEn = card.name_en || card.name || '';
      const displayImage = util.getCardImage(card, 'large') || util.getCardImage(card, 'normal');
      const displayTypeLine = card.type_line_cn || card.printed_type_line || card.type_line || '';
      const displayOracleText = card.oracle_text_cn || card.printed_text || card.oracle_text || '';
      const displayManaCost = card.mana_cost || '';
      const setName = card.set_name || '';
      const setCode = (card.set_code || card.set || '').toUpperCase();
      const displaySet = setName + (setCode ? ' (' + setCode + ')' : '');
      const displayRarity = util.getRarityName(card.rarity);
      const displayRarityColor = util.getRarityColor(card.rarity);
      const displayArtist = card.artist || '';

      const prices = card.prices || {};
      const priceUsd = prices.usd || null;
      const priceUsdFoil = prices.usd_foil || null;
      const priceEur = prices.eur || null;
      const priceTix = prices.tix || null;
      const priceCny = prices.cny_converted != null
        ? prices.cny_converted
        : util.usdToCny(priceUsd);
      const priceCnyFoil = prices.cny_foil_converted != null
        ? prices.cny_foil_converted
        : util.usdToCny(priceUsdFoil);
      const priceJpy = util.usdToJpy(priceUsd);

      const legalitiesObj = card.legalities || {};
      const formatOrder = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper', 'brawl'];
      const legalities = formatOrder.map(function(fmt) {
        const status = legalitiesObj[fmt] || 'not_legal';
        return {
          format: FORMAT_NAMES[fmt] || fmt,
          status: status,
          isLegal: status === 'legal',
          isBanned: status === 'banned',
          isRestricted: status === 'restricted'
        };
      });

      const manaSymbols = util.parseMana(displayManaCost);

      this.setData({
        card: card,
        loading: false,
        displayName: displayName,
        displayNameEn: displayNameEn,
        displayImage: displayImage,
        displayTypeLine: displayTypeLine,
        displayOracleText: displayOracleText,
        displayManaCost: displayManaCost,
        displaySet: displaySet,
        displayRarity: displayRarity,
        displayRarityColor: displayRarityColor,
        displayArtist: displayArtist,
        priceUsd: priceUsd,
        priceUsdFoil: priceUsdFoil,
        priceEur: priceEur,
        priceTix: priceTix,
        priceCny: priceCny,
        priceCnyFoil: priceCnyFoil,
        priceJpy: priceJpy,
        legalities: legalities,
        manaSymbols: manaSymbols
      });

      wx.setNavigationBarTitle({ title: displayName || displayNameEn });
      this.recordHistory(card);
    } catch (err) {
      console.error('[CardDetail] Failed to load card:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async checkFollowed(scryfallId) {
    try {
      const followedCards = await api.get('/api/followed-cards');
      const cardId = scryfallId;
      const isFollowed = (followedCards || []).some(function(fc) {
        return fc.scryfallId === cardId;
      });
      this.setData({ isFollowed: isFollowed });
    } catch (err) {}
  },

  async loadPriceHistory(scryfallId) {
    try {
      const history = await api.get('/api/price-history/' + scryfallId, { days: 90 });
      this.setData({ priceHistory: history || [] });
    } catch (err) {}
  },

  async recordHistory(card) {
    try {
      await api.post('/api/card-history', {
        scryfallId: util.getCardId(card),
        cardName: util.getCardNameEn(card),
        cardNameCn: util.getCardName(card),
        cardImage: util.getCardImage(card, 'small')
      });
    } catch (err) {}
  },

  async toggleFollow() {
    const card = this.data.card;
    if (!card) return;
    const cardId = util.getCardId(card);

    if (this.data.isFollowed) {
      try {
        const followedCards = await api.get('/api/followed-cards');
        const followed = (followedCards || []).find(function(fc) {
          return fc.scryfallId === cardId;
        });
        if (followed) {
          await api.del('/api/followed-cards/' + followed.id);
          this.setData({ isFollowed: false });
          wx.showToast({ title: '已取消关注', icon: 'success' });
        }
      } catch (err) {
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    } else {
      try {
        await api.post('/api/followed-cards', {
          scryfallId: cardId,
          cardName: util.getCardNameEn(card),
          cardNameCn: util.getCardName(card),
          cardImage: util.getCardImage(card, 'small')
        });
        this.setData({ isFollowed: true });
        wx.showToast({ title: '已关注', icon: 'success' });
      } catch (err) {
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    }
  },

  previewImage() {
    if (this.data.displayImage) {
      wx.previewImage({ urls: [this.data.displayImage], current: this.data.displayImage });
    }
  },

  onShareAppMessage() {
    const card = this.data.card;
    return {
      title: (this.data.displayName || '卡牌详情') + ' - PlanarBridge',
      path: '/pages/card-detail/card-detail?scryfallId=' + this.data.scryfallId + (this.data.isFab ? '&game=fab' : ''),
      imageUrl: this.data.displayImage
    };
  }
});
