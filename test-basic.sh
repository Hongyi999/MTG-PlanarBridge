#!/bin/bash

# 基础测试脚本 - MTG PlanarBridge
# 运行基本的健康检查和验证

set -e

echo "🧪 MTG PlanarBridge - 基础测试"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

fail() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Node.js 版本检查
echo "1️⃣  检查 Node.js 版本..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    pass "Node.js 版本: $(node -v)"
else
    fail "Node.js 版本过低，需要 >= 18，当前: $(node -v)"
fi
echo ""

# 2. 依赖检查
echo "2️⃣  检查 npm 依赖..."
if [ -d "node_modules" ]; then
    pass "依赖已安装"
else
    warn "依赖未安装，正在安装..."
    npm install
fi
echo ""

# 3. FAB 子模块检查
echo "3️⃣  检查 FAB 卡牌数据子模块..."
if [ -f "server/fab-cards-data/json/english/card.json" ]; then
    CARD_COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('server/fab-cards-data/json/english/card.json')).length)")
    pass "FAB 数据已加载: $CARD_COUNT 张卡牌"
else
    warn "FAB 数据未初始化，正在初始化子模块..."
    git submodule update --init --recursive
    if [ -f "server/fab-cards-data/json/english/card.json" ]; then
        pass "子模块初始化成功"
    else
        fail "子模块初始化失败"
    fi
fi
echo ""

# 4. 环境变量检查
echo "4️⃣  检查环境配置..."
if [ -f ".env" ]; then
    pass ".env 文件存在"

    # 检查 DATABASE_URL
    if grep -q "DATABASE_URL" .env; then
        pass "DATABASE_URL 已配置"
    else
        warn "DATABASE_URL 未配置（本地测试需要）"
    fi

    # 检查 JUSTTCG_API_KEY
    if grep -q "JUSTTCG_API_KEY" .env; then
        pass "JUSTTCG_API_KEY 已配置"
    else
        warn "JUSTTCG_API_KEY 未配置（价格历史功能受限）"
    fi
else
    warn ".env 文件不存在，从模板创建..."
    cp .env.example .env
    warn "请编辑 .env 文件配置必要的环境变量"
fi
echo ""

# 5. TypeScript 编译检查
echo "5️⃣  检查 TypeScript 编译..."
if npm run build > /tmp/build.log 2>&1; then
    pass "构建成功"
else
    fail "构建失败，请查看 /tmp/build.log"
fi
echo ""

# 6. FAB 缓存测试
echo "6️⃣  测试 FAB 卡牌缓存..."
if [ -f "test-fab-cache.ts" ]; then
    if npx tsx test-fab-cache.ts > /tmp/fab-cache-test.log 2>&1; then
        pass "FAB 缓存测试通过"
        grep "Loaded" /tmp/fab-cache-test.log | head -1
        grep "Performance test" /tmp/fab-cache-test.log -A1 | tail -1
    else
        warn "FAB 缓存测试失败（可能缺少子模块数据）"
    fi
else
    warn "跳过 FAB 缓存测试（测试文件不存在）"
fi
echo ""

# 7. 代码质量检查
echo "7️⃣  检查代码质量..."

# 检查是否有未提交的更改
if [ -z "$(git status --porcelain)" ]; then
    pass "工作目录干净，没有未提交的更改"
else
    warn "有未提交的更改："
    git status --short
fi
echo ""

# 8. 文件大小检查
echo "8️⃣  检查构建产物大小..."
if [ -f "dist/public/assets/index-*.js" ]; then
    JS_SIZE=$(du -h dist/public/assets/index-*.js | cut -f1 | head -1)
    CSS_SIZE=$(du -h dist/public/assets/index-*.css | cut -f1 | head -1)
    echo "   JavaScript bundle: $JS_SIZE"
    echo "   CSS bundle: $CSS_SIZE"
    pass "构建产物已生成"
else
    warn "构建产物未找到（可能需要先运行 npm run build）"
fi
echo ""

# 总结
echo "================================"
echo "🎉 基础测试完成！"
echo ""
echo "下一步："
echo "  1. 启动服务器: npm start"
echo "  2. 访问: http://localhost:5000"
echo "  3. 按照 TESTING-CHECKLIST.md 进行手动测试"
echo "  4. 测试通过后，合并到 main 分支"
echo ""
