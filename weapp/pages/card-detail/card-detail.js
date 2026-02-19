const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    scryfallId: '',
    card: null,
    loading: true,
    isFollowed: false,
    priceHistory: [],

    // Computed display data
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

    // Prices
    priceUsd: null,
    priceUsdFoil: null,
    priceEur: null,
    priceTix: null,
    priceCny: null,
    priceCnyFoil: null,
    priceJpy: null,

    // Legalities
    legalities: []
  },

  onLoad(options) {
    if (options.scryfallId) {
      this.setData({ scryfallId: options.scryfallId });
      this.loadCard(options.scryfallId);
      this.checkFollowed(options.scryfallId);
      this.loadPriceHistory(options.scryfallId);
    }
  },

  async loadCard(scryfallId) {
    this.setData({ loading: true });

    try {
      const card = await api.get('/api/cards/scryfall/' + scryfallId);
      if (!card) {
        wx.showToast({ title: 'Card not found', icon: 'none' });
        this.setData({ loading: false });
        return;
      }

      // Process card data for display
      const displayName = card.printed_name || card.name || '';
      const displayNameEn = card.name || '';
      const displayImage = util.getCardImage(card, 'large') || util.getCardImage(card, 'normal');
      const displayTypeLine = card.printed_type_line || card.type_line || '';
      const displayOracleText = card.printed_text || card.oracle_text || '';
      const displayManaCost = card.mana_cost || '';
      const displaySet = (card.set_name || '') + (card.set ? ' (' + card.set.toUpperCase() + ')' : '');
      const displayRarity = util.getRarityName(card.rarity);
      const displayRarityColor = util.getRarityColor(card.rarity);
      const displayArtist = card.artist || '';

      // Process prices
      const prices = card.prices || {};
      const priceUsd = prices.usd || null;
      const priceUsdFoil = prices.usd_foil || null;
      const priceEur = prices.eur || null;
      const priceTix = prices.tix || null;
      const priceCny = util.usdToCny(priceUsd);
      const priceCnyFoil = util.usdToCny(priceUsdFoil);
      const priceJpy = util.usdToJpy(priceUsd);

      // Process legalities
      const legalitiesObj = card.legalities || {};
      const formatOrder = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper', 'brawl'];
      const legalities = formatOrder.map(function(fmt) {
        const status = legalitiesObj[fmt] || 'not_legal';
        return {
          format: fmt.charAt(0).toUpperCase() + fmt.slice(1),
          status: status,
          isLegal: status === 'legal',
          isBanned: status === 'banned',
          isRestricted: status === 'restricted'
        };
      });

      // Parse mana symbols
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

      // Set navigation bar title
      wx.setNavigationBarTitle({ title: displayName || displayNameEn });

      // Record to view history
      this.recordHistory(card);
    } catch (err) {
      console.error('[CardDetail] Failed to load card:', err);
      wx.showToast({ title: 'Failed to load card', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async checkFollowed(scryfallId) {
    try {
      const followedCards = await api.get('/api/followed-cards');
      const isFollowed = (followedCards || []).some(function(fc) {
        return fc.scryfallId === scryfallId;
      });
      this.setData({ isFollowed: isFollowed });
    } catch (err) {
      // Not critical
    }
  },

  async loadPriceHistory(scryfallId) {
    try {
      const history = await api.get('/api/price-history/' + scryfallId, { days: 90 });
      this.setData({ priceHistory: history || [] });
    } catch (err) {
      // Not critical
    }
  },

  async recordHistory(card) {
    try {
      await api.post('/api/card-history', {
        scryfallId: card.id,
        cardName: card.name,
        cardNameCn: card.printed_name || '',
        cardImage: util.getCardImage(card, 'small')
      });
    } catch (err) {
      // Not critical
    }
  },

  async toggleFollow() {
    const card = this.data.card;
    if (!card) return;

    if (this.data.isFollowed) {
      // Unfollow
      try {
        const followedCards = await api.get('/api/followed-cards');
        const followed = (followedCards || []).find(function(fc) {
          return fc.scryfallId === card.id;
        });
        if (followed) {
          await api.del('/api/followed-cards/' + followed.id);
          this.setData({ isFollowed: false });
          wx.showToast({ title: 'Unfollowed', icon: 'success' });
        }
      } catch (err) {
        wx.showToast({ title: 'Failed to unfollow', icon: 'none' });
      }
    } else {
      // Follow
      try {
        await api.post('/api/followed-cards', {
          scryfallId: card.id,
          cardName: card.name,
          cardNameCn: card.printed_name || '',
          cardImage: util.getCardImage(card, 'small')
        });
        this.setData({ isFollowed: true });
        wx.showToast({ title: 'Following', icon: 'success' });
      } catch (err) {
        wx.showToast({ title: 'Failed to follow', icon: 'none' });
      }
    }
  },

  previewImage() {
    if (this.data.displayImage) {
      wx.previewImage({
        urls: [this.data.displayImage],
        current: this.data.displayImage
      });
    }
  },

  onShareAppMessage() {
    const card = this.data.card;
    return {
      title: (card ? card.name : 'Card Detail') + ' - PlanarBridge',
      path: '/pages/card-detail/card-detail?scryfallId=' + this.data.scryfallId,
      imageUrl: this.data.displayImage
    };
  }
});
