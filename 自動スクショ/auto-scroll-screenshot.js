#!/usr/bin/env node

/**
 * Auto-Scroll Screenshot to PDF
 * ページを自動スクロールして連続スクショ → マルチページPDF生成
 * 
 * 使用方法:
 * node auto-scroll-screenshot.js \
 *   --url "https://example.com" \
 *   --scroll-mode "viewport" \
 *   --filename "report"
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GAS_DEPLOYMENT_URL = process.env.GAS_DEPLOYMENT_URL;

if (!GAS_DEPLOYMENT_URL || GAS_DEPLOYMENT_URL.includes('YOUR_SCRIPT_ID')) {
  console.error('❌ エラー: GAS_DEPLOYMENT_URL が設定されていません');
  console.error('   .env ファイルを確認して GAS デプロイ URL を設定してください');
  process.exit(1);
}

/**
 * スクロール戦略
 */
const SCROLL_STRATEGIES = {
  // ページ全体を 1 つのスクリーンショットでキャプチャ
  'full': async (page) => {
    console.log('📸 ページ全体をキャプチャ中...');
    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: true
    });
    console.log('✓ Full キャプチャ完了');
    return screenshot;
  },

  // ビューポート高さで分割して複数スクショ
  'viewport': async (page) => {
    const screenshots = [];
    const viewportHeight = page.viewport().height;
    const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const pages = Math.ceil(totalHeight / viewportHeight);

    console.log(`📄 ページ数: 約 ${pages} ページ`);

    // ページ先頭に戻る
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 1000));

    for (let i = 0; i < pages; i++) {
      const screenshot = await page.screenshot({
        encoding: 'base64'
      });
      screenshots.push(screenshot);
      console.log(`✓ ページ ${i + 1}/${pages} スクショ取得`);

      // 次のページへスクロール
      if (i < pages - 1) {
        await page.evaluate((offset) => {
          window.scrollBy(0, offset);
        }, viewportHeight);
        await new Promise(r => setTimeout(r, 1500)); // スクロール後の待機（増加）
      }
    }

    return screenshots;
  },

  // セレクタ内要素を 1 ページずつスクショ（ページネーション対応）
  'paginated': async (page, selector) => {
    const screenshots = [];
    let pageNum = 1;

    while (true) {
      const screenshot = await page.screenshot({
        encoding: 'base64'
      });
      screenshots.push(screenshot);
      console.log(`✓ ページ ${pageNum} スクショ取得`);

      // 次ページボタンを探す
      const nextPageSelectors = [
        'a[rel="next"]',
        'button[aria-label*="next"]',
        '.pagination .next',
        'a.next',
        '[data-testid="pagination-next"]',
        '.pager-next a',
        'a:contains("次へ")',
        'a:contains("→")',
        'a:contains("Next")'
      ];

      let found = false;
      for (const sel of nextPageSelectors) {
        const nextButton = await page.$(sel).catch(() => null);
        if (nextButton) {
          try {
            await nextButton.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
            await new Promise(r => setTimeout(r, 1000));
            found = true;
            pageNum++;
            break;
          } catch (e) {
            // ボタンが無効または動作しない
          }
        }
      }

      if (!found) {
        console.log(`✓ 全ページキャプチャ完了（${pageNum} ページ）`);
        break;
      }
    }

    return screenshots;
  },

  // スクロール終了検出による連続スクショ（無限スクロール対応）
  'infinite-scroll': async (page) => {
    const screenshots = [];
    let lastHeight = 0;
    let pageNum = 1;
    const maxPages = 50; // 無限ループ防止

    while (pageNum <= maxPages) {
      const screenshot = await page.screenshot({
        encoding: 'base64'
      });
      screenshots.push(screenshot);
      console.log(`✓ ページ ${pageNum} スクショ取得`);

      // 一番下までスクロール
      const currentHeight = await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
        return document.documentElement.scrollHeight;
      });

      await new Promise(r => setTimeout(r, 1500)); // 遅延ロード待機

      // 新しいコンテンツが読み込まれたか確認
      const newHeight = await page.evaluate(() => document.documentElement.scrollHeight);

      if (newHeight === currentHeight && newHeight === lastHeight) {
        console.log(`✓ スクロール完了（計 ${pageNum} ページ）`);
        break;
      }

      lastHeight = newHeight;
      pageNum++;
    }

    return screenshots;
  },

  // Kindle Cloud Reader 通信用（右矢印キーでページめくり）
  'kindle': async (page, selector, pagesCount = 10) => {
    const screenshots = [];
    let pageNum = 1;
    
    console.log(`📖 Kindle モード: ${pagesCount} ページを撮影します`);

    for (let i = 0; i < pagesCount; i++) {
      const screenshot = await page.screenshot({
        encoding: 'base64'
      });
      screenshots.push(screenshot);
      console.log(`✓ ページ ${pageNum}/${pagesCount} スクショ取得`);

      if (i < pagesCount - 1) {
        // 右矢印キーでページ送り
        await page.keyboard.press('ArrowRight');
        // レンダリング待機
        await new Promise(r => setTimeout(r, 2000));
      }
      pageNum++;
    }

    return screenshots;
  }
};

/**
 * メイン処理
 */
async function captureAndCreatePDF(options) {
  let browser;
  try {
    console.log('🚀 Puppeteer 起動...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // ビューポート設定
    await page.setViewport({
      width: options.viewportWidth || 1920,
      height: options.viewportHeight || 1080,
      deviceScaleFactor: 2  // Retina対応（高解像度）
    });

    // User-Agent 設定（ブロック回避）
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // ページ移動
    console.log(`📄 URL にアクセス: ${options.url}`);
    await page.goto(options.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // ページの完全レンダリングを待機（白紙対策）
    await new Promise(r => setTimeout(r, 3000));

    // body が存在するまで待つ
    await page.waitForSelector('body', { timeout: 10000 }).catch(() => {});

    // さらに追加待機（画像・スタイルの適用待ち）
    await new Promise(r => setTimeout(r, 1000));

    // スクリーンショット取得
    console.log(`📸 ${options.scrollMode} モードでスクショ取得...`);
    const screenshots = await (SCROLL_STRATEGIES[options.scrollMode] || SCROLL_STRATEGIES.full)(
      page,
      options.selector,
      options.pages
    );

    // 複数スクショの場合は配列に統一
    const screenshotArray = Array.isArray(screenshots) ? screenshots : [screenshots];

    console.log(`\n✓ 合計 ${screenshotArray.length} 枚のスクショを取得`);

    // GAS に送信
    console.log('💾 GAS に送信中...');
    const response = await sendToGAS(screenshotArray, options.filename, options.pdfMode);

    if (response.success) {
      console.log('\n✅ 処理完了！');
      if (response.fileName) console.log(`   ファイル: ${response.fileName}`);
      if (response.fileUrl)  console.log(`   URL: ${response.fileUrl}`);
      if (response.totalFiles) console.log(`   生成PDF数: ${response.totalFiles}`);
      return response;
    } else {
      throw new Error(response.error || 'GAS からエラーが返されました');
    }

  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * GAS バックエンドに送信
 */
async function sendToGAS(screenshots, filename, pdfMode = 'combined') {
  const payload = {
    images: screenshots,
    filename,
    pdfMode,
    timestamp: new Date().toISOString()
  };

  const response = await fetch(GAS_DEPLOYMENT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`GAS API エラー: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('GAS 応答の解析失敗: ' + text.substring(0, 200));
  }
}

/**
 * CLI インターフェース
 */
async function main() {
  const args = process.argv.slice(2);

  const options = {
    url: getValue(args, '--url'),
    scrollMode: getValue(args, '--scroll-mode') || 'viewport',
    filename: getValue(args, '--filename') || `screenshot_${Date.now()}`,
    pdfMode: getValue(args, '--pdf-mode') || 'combined',
    viewportWidth: parseInt(getValue(args, '--width') || '1920'),
    viewportHeight: parseInt(getValue(args, '--height') || '1080'),
    selector: getValue(args, '--selector'),
    pages: parseInt(getValue(args, '--pages') || '10')
  };

  if (!options.url) {
    console.log(`
使用方法:
  node auto-scroll-screenshot.js \\
    --url "https://example.com" \\
    [--scroll-mode <mode>] \\
    [--filename "myreport"] \\
    [--pdf-mode "combined|split"] \\
    [--width 1920] \\
    [--height 1080] \\
    [--selector "selector"] \\
    [--pages 10]

スクロールモード:
  full            - ページ全体を 1 つのスクショでキャプチャ（最速）
  viewport        - ビューポート高さで分割して複数スクショ（推奨）
  paginated       - 次ページボタンをクリックして進む
  infinite-scroll - 無限スクロール対応（Twitter など）
  kindle          - Kindle/スライド形式（右矢印キーでページめくり）

PDFモード:
  combined        - 全ページを 1 つの PDF にまとめる（デフォルト）
  split           - ページごとに別々の PDF を生成

例1) ブログ全体を 1 つの PDF に:
  node auto-scroll-screenshot.js --url "https://blog.com/article" --scroll-mode viewport

例2) ページネーション対応:
  node auto-scroll-screenshot.js --url "https://shop.com/products" --scroll-mode paginated

例3) 無限スクロール（Twitter など）:
  node auto-scroll-screenshot.js --url "https://twitter.com/search" --scroll-mode infinite-scroll

例4) ページごとに別々の PDF:
  node auto-scroll-screenshot.js --url "https://docs.example.com" --scroll-mode viewport --pdf-mode split
    `);
    process.exit(0);
  }

  console.log(`
📋 設定:
  URL:          ${options.url}
  スクロール:   ${options.scrollMode}
  ファイル名:   ${options.filename}
  PDF形式:      ${options.pdfMode}
  ビューポート: ${options.viewportWidth}x${options.viewportHeight}
  GAS URL:      ${GAS_DEPLOYMENT_URL.substring(0, 50)}...
  `);

  await captureAndCreatePDF(options);
}

function getValue(args, key) {
  const idx = args.indexOf(key);
  return idx !== -1 ? args[idx + 1] : null;
}

main();
