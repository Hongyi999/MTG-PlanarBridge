export interface Card {
  id: string;
  name_en: string;
  name_cn: string;
  set_name: string;
  set_code: string;
  collector_number: string;
  image_uri: string;
  mana_cost: string;
  type_line: string;
  oracle_text: string;
  colors: string[];
  rarity: "common" | "uncommon" | "rare" | "mythic";
  prices: {
    usd: number;
    usd_foil?: number;
    cny: number;
    jpy: number;
  };
  price_history: { date: string; value: number }[];
}

export interface Post {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  type: "discussion" | "sell" | "buy" | "trade";
  timestamp: string;
  likes: number;
  comments: number;
  card_attachment?: string;
}

export const MOCK_CARDS: Card[] = [
  {
    id: "1",
    name_en: "Black Lotus",
    name_cn: "黑莲花",
    set_name: "Limited Edition Alpha",
    set_code: "LEA",
    collector_number: "232",
    image_uri: "https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg",
    mana_cost: "{0}",
    type_line: "Artifact",
    oracle_text: "{T}, Sacrifice Black Lotus: Add three mana of any one color of your choice.",
    colors: [],
    rarity: "rare",
    prices: {
      usd: 25000,
      cny: 150000,
      jpy: 3500000
    },
    price_history: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      value: 150000 + Math.random() * 5000 - 2500
    }))
  },
  {
    id: "2",
    name_en: "Sheoldred, the Apocalypse",
    name_cn: "默示体希令",
    set_name: "Dominaria United",
    set_code: "DMU",
    collector_number: "107",
    image_uri: "https://cards.scryfall.io/large/front/d/6/d67be074-cdd4-41d9-ac89-0a0456c4e4b2.jpg",
    mana_cost: "{2}{B}{B}",
    type_line: "Legendary Creature — Phyrexian Praetor",
    oracle_text: "Deathtouch\nWhenever you draw a card, you gain 2 life.\nWhenever an opponent draws a card, they lose 2 life.",
    colors: ["B"],
    rarity: "mythic",
    prices: {
      usd: 85.50,
      cny: 550,
      jpy: 12000
    },
    price_history: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      value: 550 + Math.random() * 20 - 10
    }))
  },
  {
    id: "3",
    name_en: "Orcish Bowmasters",
    name_cn: "半兽人弓箭手",
    set_name: "The Lord of the Rings: Tales of Middle-earth",
    set_code: "LTR",
    collector_number: "103",
    image_uri: "https://cards.scryfall.io/large/front/7/c/7c024bae-9305-4bd4-9188-58fca95aa763.jpg",
    mana_cost: "{1}{B}",
    type_line: "Creature — Orc Archer",
    oracle_text: "Flash\nWhen Orcish Bowmasters enters the battlefield and whenever an opponent draws a card except the first one they draw in each of their draw steps, Orcish Bowmasters deals 1 damage to any target. Then amass Orcs 1.",
    colors: ["B"],
    rarity: "rare",
    prices: {
      usd: 45.00,
      cny: 320,
      jpy: 6500
    },
    price_history: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      value: 320 + Math.random() * 15 - 7
    }))
  },
  {
    id: "4",
    name_en: "The One Ring",
    name_cn: "至尊魔戒",
    set_name: "The Lord of the Rings: Tales of Middle-earth",
    set_code: "LTR",
    collector_number: "246",
    image_uri: "https://cards.scryfall.io/large/front/d/5/d5806e68-1054-458e-866d-5f5f94a2b005.jpg",
    mana_cost: "{4}",
    type_line: "Legendary Artifact",
    oracle_text: "Indestructible\nWhen The One Ring enters the battlefield, if you cast it, you gain protection from everything until your next turn.\nAt the beginning of your upkeep, you lose 1 life for each burden counter on The One Ring.\n{T}: Put a burden counter on The One Ring, then draw a card for each burden counter on The One Ring.",
    colors: [],
    rarity: "mythic",
    prices: {
      usd: 60.00,
      cny: 450,
      jpy: 9000
    },
    price_history: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      value: 450 + Math.random() * 30 - 15
    }))
  },
  {
    id: "5",
    name_en: "Ragavan, Nimble Pilferer",
    name_cn: "巧手窃猴勒格文",
    set_name: "Modern Horizons 2",
    set_code: "MH2",
    collector_number: "138",
    image_uri: "https://cards.scryfall.io/large/front/a/9/a9738cda-adb1-47fb-9f4c-ecd930228c4d.jpg",
    mana_cost: "{R}",
    type_line: "Legendary Creature — Monkey Pirate",
    oracle_text: "Whenever Ragavan, Nimble Pilferer deals combat damage to a player, create a Treasure token. Exile the top card of that player's library. Until end of turn, you may cast that card.\nDash {1}{R}",
    colors: ["R"],
    rarity: "mythic",
    prices: {
      usd: 35.00,
      cny: 240,
      jpy: 5000
    },
    price_history: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      value: 240 + Math.random() * 10 - 5
    }))
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: "101",
    user: { name: "Li Wei", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Li" },
    content: "Thoughts on the new Ban List? Seems like Fury is finally gone in Modern. Do you think Rakdos Scam is dead or will it adapt? Looking for opinions before I sell my pieces.",
    type: "discussion",
    timestamp: "2h ago",
    likes: 24,
    comments: 18,
  },
  {
    id: "102",
    user: { name: "CardMaster_CN", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Master" },
    content: "[出] 出一张日文蚀刻闪 母圣树，品相完美 NM。上海可面交，外地顺丰到付。 Selling JP Etched Foil Boseiju. NM condition.",
    type: "sell",
    timestamp: "15m ago",
    likes: 12,
    comments: 4,
    card_attachment: "4"
  },
  {
    id: "103",
    user: { name: "鹏洛客_99", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Planeswalker" },
    content: "寻找全图基本地！愿意高价收购 Unhinged/Unstable 系列。有意私聊。",
    type: "buy",
    timestamp: "1d ago",
    likes: 8,
    comments: 2
  }
];
