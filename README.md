# MTG PlanarBridge - 万智牌卡牌价格查询平台

<p align="center">
  <strong>Magic: The Gathering 卡牌价格查询 · 社区交流 · 收藏管理</strong>
</p>

<p align="center">
  面向中文万智牌玩家和本地游戏店 (LGS) 的一站式卡牌价格查询与社区交易平台
</p>

---

## 功能特性

### 卡牌搜索与价格查询
- 接入 [Scryfall API](https://scryfall.com/) 实时获取卡牌数据
- 支持中英文自动检测搜索（输入中文自动搜索简体中文版本）
- 高级筛选：按名称、类别、系列、稀有度、颜色、法术力费用、赛制、画师、语言等维度搜索
- 实时价格显示（USD/EUR），并提供人民币 (CNY)、日元 (JPY) 估算换算
- 卡牌详情页：完整规则文本、赛制合法性、多市场价格对比

### 收藏与价格管理
- 价格列表管理（待购清单、出售清单、收藏观察）
- 支持导出为 CSV 或图片，可自定义导出字段
- 卡牌关注与浏览历史记录

### 社区功能
- 社区帖子（讨论、出售、收购、交换）
- 图片上传、语音输入
- 帖子可关联卡牌显示参考价格

### 用户体验
- 移动端优先设计（500px 最大宽度）
- 奇幻主题视觉风格，灵感来自万智牌世界观
- 深色/浅色主题切换
- 流畅的交互动画

---

## 技术栈

### 前端
- **React 19** + TypeScript
- **Vite 7** 构建工具
- **Tailwind CSS 4** 样式框架
- **shadcn/ui** (Radix UI) 组件库
- **TanStack React Query** 服务端状态管理
- **Wouter** 轻量级路由
- **Framer Motion** 动画
- **Recharts** 图表

### 后端
- **Express 5** (Node.js)
- **PostgreSQL** 数据库
- **Drizzle ORM** 数据库操作
- **Zod** 数据校验

### 外部 API（多源价格系统）
- **[Scryfall API](https://scryfall.com/docs/api)** - 主力数据源：卡牌信息 + TCGPlayer/CardMarket 官方价格（免费）
- **[TCGTracking API](https://tcgtracking.com/tcgapi/)** - 补充数据源：按品相查价 NM/LP/MP/HP（免费，无需 Key）
- **[JustTCG API](https://justtcg.com/docs)** - 价格历史：7/30/90/180 天深度历史（免费 Key）
- **[Wisdom Guild API](http://wonder.wisdom-guild.net/api/card-price/manual.php)** - 日本市场真实 JPY 价格（需申请 Key）

---

## 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+

### 安装

```bash
# 克隆仓库
git clone https://github.com/Hongyi999/MTG-PlanarBridge.git
cd MTG-PlanarBridge

# 安装依赖
npm install
```

### 配置

复制 `.env.example` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mtg_planar_bridge
PORT=5000

# JustTCG API Key (可选，用于价格历史)
# 申请：https://justtcg.com → Dashboard → API Settings
JUSTTCG_API_KEY=your_justtcg_api_key_here

# Wisdom Guild API (可选，用于日本市场价格)
# 申请：http://wonder.wisdom-guild.net/ → 联系管理员
WISDOMGUILD_API_KEY=your_api_key_here
WISDOMGUILD_SECRET_KEY=your_secret_key_here
```

### 数据库初始化

```bash
# 将 schema 推送到数据库
npm run db:push
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5000` 即可使用。

### 生产构建

```bash
npm run build
npm start
```

---

## 项目结构

```
MTG-PlanarBridge/
├── client/                    # React 前端
│   ├── src/
│   │   ├── pages/            # 页面组件 (9 个)
│   │   │   ├── home.tsx      # 发现页 - 热门卡牌、快捷搜索
│   │   │   ├── library.tsx   # 卡牌库 - 搜索与高级筛选
│   │   │   ├── card-detail.tsx  # 卡牌详情 - 价格、规则、赛制
│   │   │   ├── community.tsx # 社区 - 帖子动态
│   │   │   ├── create-post.tsx  # 发布动态
│   │   │   ├── price-lists.tsx  # 价格列表管理
│   │   │   ├── card-history-page.tsx  # 浏览足迹
│   │   │   ├── me.tsx        # 个人中心
│   │   │   └── not-found.tsx # 404 页面
│   │   ├── components/       # UI 组件
│   │   ├── lib/              # 工具函数
│   │   │   ├── api.ts        # Scryfall API 前端封装
│   │   │   ├── queryClient.ts # React Query 配置
│   │   │   └── utils.ts      # 通用工具
│   │   └── hooks/            # 自定义 Hooks
│   └── public/               # 静态资源
├── server/                    # Express 后端
│   ├── index.ts              # 服务器入口 + 定时快照调度
│   ├── routes.ts             # API 路由
│   ├── scryfall.ts           # Scryfall API 代理与速率限制
│   ├── tcgtracking.ts        # TCGTracking API (免费 TCGPlayer 代理)
│   ├── justtcg.ts            # JustTCG API (价格历史)
│   ├── wisdom-guild.ts       # Wisdom Guild API (日本市场)
│   ├── price-snapshot.ts     # 多源价格快照任务
│   ├── storage.ts            # 数据库操作层
│   └── db.ts                 # PostgreSQL 连接
├── shared/                    # 前后端共享
│   └── schema.ts             # Drizzle ORM Schema + Zod 校验
└── package.json
```

---

## API 端点

### 卡牌搜索（Scryfall 代理）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/cards/search?q=<query>&page=<n>` | 搜索卡牌 (自动检测中英文) |
| GET | `/api/cards/autocomplete?q=<query>` | 卡牌名称自动完成 |
| GET | `/api/cards/scryfall/:scryfallId` | 按 Scryfall UUID 获取卡牌 |
| GET | `/api/cards/named?name=<name>` | 按名称查找卡牌 |

### 价格列表
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/price-lists` | 获取/创建价格列表 |
| PATCH/DELETE | `/api/price-lists/:id` | 更新/删除价格列表 |
| GET/POST | `/api/price-lists/:id/items` | 获取/添加列表项 |

### 社区
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/community-posts` | 获取/发布社区帖子 |
| POST | `/api/community-posts/:id/like` | 点赞帖子 |

### 价格历史
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/price-history/:scryfallId?days=90` | 获取价格历史时间序列 |
| GET | `/api/price-history/:scryfallId/latest?source=scryfall` | 获取最新价格快照 |
| POST | `/api/price-history/snapshot` | 手动触发全量价格快照 |

### 其他
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/followed-cards` | 关注的卡牌（关注时自动快照价格） |
| GET/POST | `/api/card-history` | 浏览历史 |
| GET/PUT | `/api/exchange-rates` | 汇率设置 |
| GET/PUT | `/api/settings/:key` | 用户设置 |

---

## 数据库 Schema

项目使用 PostgreSQL，通过 Drizzle ORM 管理以下数据表：

- **cards** - 卡牌缓存（来自 Scryfall）
- **price_history** - 多源价格历史快照（Scryfall/TCGTracking/JustTCG/Wisdom Guild）
- **price_lists** / **price_list_items** - 价格列表
- **followed_cards** - 关注的卡牌
- **card_history** - 浏览历史
- **community_posts** - 社区帖子
- **user_settings** - 用户设置
- **users** - 用户信息

---

## 价格系统

### 多源价格数据

| 数据源 | 价格类型 | 更新频率 | 是否需要 API Key |
|--------|----------|----------|-----------------|
| **Scryfall** | USD, EUR, TIX | 每日 | 否（免费） |
| **TCGTracking** | USD (按品相) | 每日 8AM EST | 否（免费） |
| **JustTCG** | USD + 历史曲线 | 实时 | 是（免费层可用）|
| **Wisdom Guild** | JPY（真实价格）| 每日 | 是（需申请）|

### 价格快照机制
- 服务器启动 30 秒后执行首次快照
- 每 6 小时自动快照所有关注的卡牌
- 关注新卡牌时立即触发快照
- 每个快照记录当时的汇率，确保历史换算准确

### 汇率说明
- **CNY** 为基于可配置汇率的估算价格，标注为"估算"
- **JPY** 优先使用 Wisdom Guild 真实价格，无数据时使用汇率估算
- 默认汇率: 1 USD ≈ 7.25 CNY, 1 USD ≈ 150 JPY
- 可在设置中手动调整汇率

### API Key 申请指南

#### JustTCG（推荐，5 分钟完成）
1. 访问 [justtcg.com](https://justtcg.com) 注册账号
2. 进入 Dashboard → API Settings
3. 生成 API Key
4. 将 Key 添加到 `.env` 的 `JUSTTCG_API_KEY`

#### Wisdom Guild（可选，日本市场）
1. 访问 [wonder.wisdom-guild.net](http://wonder.wisdom-guild.net/) 注册
2. 通过联系表单或邮件联系管理员，申请 API 访问权限
3. 收到 `api_key` 和 `secret_key` 后添加到 `.env`
4. 详见 `server/wisdom-guild.ts` 中的注释

---

## 致谢

- 卡牌数据由 [Scryfall](https://scryfall.com/) 提供
- Scryfall is not produced by or endorsed by Wizards of the Coast
- Magic: The Gathering is a trademark of Wizards of the Coast LLC

---

## License

MIT
