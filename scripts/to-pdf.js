#!/usr/bin/env node
/**
 * 装修江湖 - 卡牌 PDF 生成脚本
 * 从 cards.html 提取渲染后的卡牌数据，排版为每页 15 张 (3×5) A4 打印版 PDF
 *
 * 用法:
 *   npm run pdf              → 生成 cards.pdf (所有卡牌)
 *   npm run pdf:board        → 生成 board.pdf (游戏棋盘)
 *   npm run pdf:all          → 生成全部
 *   node scripts/to-pdf.js   → 同 npm run pdf
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const CARDS_PER_PAGE = 15;
const COLS = 3;
const ROWS = 5; // 3×5 = 15

// 每种卡牌类型对应的头部背景色（与 cards.html 保持一致）
const TYPE_COLORS = {
  subsidy:   '#7D9B76',
  extra:     '#C4A882',
  prepay:    '#8FA8B8',
  runaway:   '#3A3530',
  corners:   '#9B7A5A',
  property:  '#C9A84C',
  timelimit: '#C06B66',
  ultralow:  '#8FA8B8',
  promo:     '#8A8580',
  inspect:   '#6B8FB5',
  xhs:       '#C8698A',
};

// ─────────────────────────────────────────
// 生成卡牌打印 HTML（每页15张，3列×5行）
// ─────────────────────────────────────────
function buildPrintHtml(cards) {
  // 按每15张分页
  const pages = [];
  for (let i = 0; i < cards.length; i += CARDS_PER_PAGE) {
    pages.push(cards.slice(i, i + CARDS_PER_PAGE));
  }

  const pagesHtml = pages.map((pageCards, pi) => {
    // 不足15张时补空占位，保持网格整齐
    while (pageCards.length < CARDS_PER_PAGE) {
      pageCards.push(null);
    }

    const cardsHtml = pageCards.map(c => {
      if (!c) return `<div class="card card-empty"></div>`;
      const bg = TYPE_COLORS[c.type] || '#888';
      const headTextColor = c.type === 'runaway' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.88)';
      return `
      <div class="card">
        <div class="c-head" style="background:${bg}">
          <span class="c-icon">${c.icon}</span>
          <span class="c-type" style="color:${headTextColor}">${c.label}</span>
        </div>
        <div class="c-body">
          <div class="c-title">${escHtml(c.title)}</div>
          <div class="c-flavor">${escHtml(c.flavor)}</div>
          <div class="c-effect">
            <div class="c-eff-label">效果</div>
            <div class="c-eff-text">${escHtml(c.effect)}</div>
          </div>
        </div>
        <div class="c-fine">${escHtml(c.fine)}</div>
      </div>`;
    }).join('');

    const isLast = pi === pages.length - 1;
    const pageNum = pi + 1;
    const totalPages = pages.length;
    return `
    <div class="page${isLast ? '' : ' break-after'}">
      ${cardsHtml}
      <div class="page-footer">装修江湖 · 卡牌集 &nbsp;|&nbsp; 第 ${pageNum} / ${totalPages} 页 &nbsp;|&nbsp; 共 ${cards.filter(Boolean).length} 张</div>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
@page {
  size: A4 portrait;
  margin: 6mm;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: white;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── 页面 ── */
.page {
  width: 198mm;
  height: 282mm;
  display: grid;
  grid-template-columns: repeat(${COLS}, 1fr);
  grid-template-rows: repeat(${ROWS}, 1fr) auto;
  gap: 2mm;
  position: relative;
  padding-bottom: 5mm;
}
.break-after {
  page-break-after: always;
}
.page-footer {
  grid-column: 1 / -1;
  font-size: 5pt;
  color: #bbb;
  text-align: center;
  padding-top: 1mm;
  letter-spacing: 0.05em;
}

/* ── 卡牌 ── */
.card {
  border: 0.4px solid #D4CEC6;
  border-radius: 2.5mm;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: 0 0.2mm 0.8mm rgba(0,0,0,0.06);
}
.card-empty {
  border: 0.4px dashed #E8E4DF;
  background: #FAFAF8;
}

/* 卡牌头部 */
.c-head {
  padding: 1.8mm 2.2mm;
  display: flex;
  align-items: center;
  gap: 1.5mm;
  flex-shrink: 0;
}
.c-icon {
  font-size: 8pt;
  line-height: 1;
}
.c-type {
  font-size: 4.8pt;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
}

/* 卡牌主体 */
.c-body {
  flex: 1;
  padding: 2mm 2.2mm 1.5mm;
  display: flex;
  flex-direction: column;
  gap: 1mm;
  overflow: hidden;
}
.c-title {
  font-size: 7.5pt;
  font-weight: 700;
  color: #2C2C2C;
  line-height: 1.2;
}
.c-flavor {
  font-size: 5.2pt;
  font-style: italic;
  color: #9A958F;
  line-height: 1.4;
  flex: 1;
}
.c-effect {
  background: rgba(0,0,0,0.038);
  border-radius: 1.2mm;
  padding: 1.2mm 1.8mm;
}
.c-eff-label {
  font-size: 4.2pt;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9A958F;
  margin-bottom: 0.5mm;
}
.c-eff-text {
  font-size: 6pt;
  font-weight: 700;
  color: #2C2C2C;
  line-height: 1.25;
}

/* 细则小字 */
.c-fine {
  font-size: 4.2pt;
  color: #B0AAA4;
  line-height: 1.38;
  padding: 1.2mm 2.2mm 1.5mm;
  border-top: 0.4px solid #E8E4DF;
  background: rgba(0,0,0,0.015);
}
</style>
</head>
<body>
${pagesHtml}
</body>
</html>`;
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─────────────────────────────────────────
// 从渲染后的 DOM 提取所有卡牌数据
// ─────────────────────────────────────────
async function extractCards(page) {
  return page.evaluate(() => {
    const cards = [];
    document.querySelectorAll('.card').forEach(el => {
      const typeClass = [...el.classList].find(c => c.startsWith('t-'));
      cards.push({
        type:   typeClass ? typeClass.slice(2) : '',
        title:  el.querySelector('.card-title')?.textContent?.trim()  || '',
        flavor: el.querySelector('.card-flavor')?.textContent?.trim() || '',
        effect: el.querySelector('.eff-text')?.textContent?.trim()    || '',
        fine:   el.querySelector('.card-fine')?.textContent?.trim()   || '',
        icon:   el.querySelector('.card-icon')?.textContent?.trim()   || '',
        label:  el.querySelector('.card-type')?.textContent?.trim()   || '',
      });
    });
    return cards;
  });
}

// ─────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────
async function main() {
  const mode = process.argv[2] || 'cards'; // cards | board | all
  const browser = await puppeteer.launch({ headless: true });

  try {
    if (mode === 'cards' || mode === 'all') {
      await exportCards(browser);
    }
    if (mode === 'board' || mode === 'all') {
      await exportBoard(browser);
    }
  } finally {
    await browser.close();
  }
}

async function exportCards(browser) {
  const page = await browser.newPage();
  const fileUrl = `file://${path.join(ROOT, 'cards.html')}`;

  console.log('📄 加载 cards.html ...');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  console.log('🃏 提取卡牌数据 ...');
  const cards = await extractCards(page);
  const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
  console.log(`   → ${cards.length} 张卡牌，共 ${totalPages} 页 (每页${CARDS_PER_PAGE}张)`);

  console.log('🖨️  生成打印布局 ...');
  const html = buildPrintHtml(cards);

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const outPath = path.join(ROOT, 'cards.pdf');
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '6mm', right: '6mm', bottom: '6mm', left: '6mm' },
  });

  console.log(`✅ 卡牌 PDF 已保存: ${outPath}`);
  await page.close();
}

async function exportBoard(browser) {
  const page = await browser.newPage();
  const fileUrl = `file://${path.join(ROOT, 'board.html')}`;

  console.log('📄 加载 board.html ...');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 1400, height: 900 });

  const outPath = path.join(ROOT, 'board.pdf');
  await page.pdf({
    path: outPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' },
  });

  console.log(`✅ 棋盘 PDF 已保存: ${outPath}`);
  await page.close();
}

main().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
