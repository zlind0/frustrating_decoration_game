.PHONY: pdf pdf-cards pdf-board pdf-all install clean help

# ── 默认目标 ────────────────────────────────
pdf: pdf-cards

# ── 卡牌 PDF（所有卡牌，每页15张 A4） ───────
pdf-cards: node_modules
	@echo "🃏  生成卡牌 PDF ..."
	node scripts/to-pdf.js cards
	@echo "✅  输出: cards.pdf"

# ── 棋盘 PDF（A4 横向） ──────────────────────
pdf-board: node_modules
	@echo "🗺   生成棋盘 PDF ..."
	node scripts/to-pdf.js board
	@echo "✅  输出: board.pdf"

# ── 全部 PDF ─────────────────────────────────
pdf-all: node_modules
	@echo "📦  生成全部 PDF ..."
	node scripts/to-pdf.js all
	@echo "✅  全部完成: cards.pdf  board.pdf"

# ── 安装依赖 ─────────────────────────────────
install: node_modules

node_modules: package.json
	@echo "📦  安装依赖 (puppeteer 首次安装需下载 Chromium，约 100-300MB) ..."
	npm install
	@touch node_modules

# ── 清理生成文件 ─────────────────────────────
clean:
	rm -f cards.pdf board.pdf
	@echo "🗑   已清除 PDF 文件"

clean-all: clean
	rm -rf node_modules
	@echo "🗑   已清除 node_modules"

# ── 帮助 ─────────────────────────────────────
help:
	@echo ""
	@echo "装修江湖 · PDF 生成工具"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  make pdf          生成卡牌 PDF（默认，每页15张）"
	@echo "  make pdf-cards    生成卡牌 PDF"
	@echo "  make pdf-board    生成棋盘 PDF（A4 横向）"
	@echo "  make pdf-all      生成全部 PDF"
	@echo "  make install      安装 Node.js 依赖"
	@echo "  make clean        删除生成的 PDF"
	@echo "  make clean-all    删除 PDF + node_modules"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  npm run pdf       同 make pdf"
	@echo "  npm run pdf:all   同 make pdf-all"
	@echo ""
