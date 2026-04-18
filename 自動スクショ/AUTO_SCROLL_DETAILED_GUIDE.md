# 🤖 自動スクロール＆連続スクショ 実装パターン詳細

## スクロール戦略の解説

### 1️⃣ **Full ページスクショ（最もシンプル）**

```
ウェブページ（高さ 3000px）
┌─────────────────────┐
│                     │ ← 1 つのスクショでキャプチャ
│   ページ全体        │    （ページネーション不要）
│                     │
│                     │
└─────────────────────┘
         ↓
     PDF（1 ページ）
```

**使用場面:**
- ブログ記事（スクロールで全体が見える）
- 長いランディングページ
- 単一 URL のコンテンツ

**実行コマンド:**
```bash
node auto-scroll-screenshot.js \
  --url "https://example.com/article" \
  --scroll-mode "full"
```

**利点**
- 最速（1 回のキャプチャで完了）
- シンプル
- 画像品質が高い（Puppeteer の fullPage オプション使用）

**デメリット**
- ページが非常に長い場合、PDF が大きくなる可能性

---

### 2️⃣ **Viewport 分割方式（推奨）**

```
ウェブページ（高さ 3000px）
┌─────────────────────┐
│ スクショ 1          │ ← ビューポート高さ（1080px）
│ (0-1080px)          │
├─────────────────────┤
│ スクショ 2          │ ← 自動スクロール
│ (1080-2160px)       │
├─────────────────────┤
│ スクショ 3          │ ← 再度スクロール
│ (2160-3000px)       │
└─────────────────────┘
         ↓
  3 つのスクショ画像
         ↓
   PDF（3 ページ）
```

**使用場面:**
- 複数ページのブログ
- 商品説明ページ
- ドキュメント
- 一般的な WebページK

**実行コマンド:**
```bash
node auto-scroll-screenshot.js \
  --url "https://blog.example.com/post" \
  --scroll-mode "viewport"
```

**動作原理:**
```javascript
// スクリプト内の処理
const viewportHeight = 1080;  // デフォルト
for (let i = 0; i < totalPages; i++) {
  await page.evaluate((offset) => {
    window.scrollBy(0, offset);  // offset = 1080px ずつスクロール
  }, viewportHeight);
  
  const screenshot = await page.screenshot(); // スクショ取得
}
```

**利点:**
- 画像サイズが一定（管理しやすい）
- ページ数が明確
- 任意のビューポートサイズで対応可能

**デメリット:**
- 要素が 2 ページにまたがる場合、重複または欠落の可能性

---

### 3️⃣ **Paginated 方式（ページボタン対応）**

```
ページ 1
https://shop.com/products?page=1
┌─────────────────────┐
│ 商品 1              │
│ 商品 2              │
│ ...                 │
│ [次へ] ← クリック   │
└─────────────────────┘
         ↓
ページ 2
https://shop.com/products?page=2
┌─────────────────────┐
│ 商品 21             │
│ 商品 22             │
│ ...                 │
│ [次へ] ← クリック   │
└─────────────────────┘
         ↓
ページ 3 ... ページネーション終了

各ページで 1 スクショ → 複数ページ PDF
```

**使用場面:**
- EC サイトの商品リスト
- ニュースサイトのページネーション
- テーブルベースのデータページ

**実行コマンド:**
```bash
node auto-scroll-screenshot.js \
  --url "https://shop.example.com/products" \
  --scroll-mode "paginated"
```

**対応するボタンセレクタ:**
```javascript
const nextPageSelectors = [
  'a[rel="next"]',           // HTML5 標準
  'button[aria-label*="next"]', // アクセシビリティ属性
  '.pagination .next',       // Bootstrap
  'a.next',                  // カスタムクラス
  'button:contains("次へ")', // テキストマッチ
  'a:contains("→")'         // 矢印アイコン
];
```

**動作フロー:**
```javascript
while (pageNum <= maxPages) {
  // 現在のページをスクショ
  const screenshot = await page.screenshot();
  screenshots.push(screenshot);
  
  // 「次へ」ボタンを探してクリック
  const nextButton = await page.$('a[rel="next"]');
  if (nextButton) {
    await nextButton.click();
    await page.waitForNavigation();  // ページロード完了まで待機
    pageNum++;
  } else {
    break;  // 次ページがない
  }
}
```

**利点:**
- ページネーション構造に対応
- セマンティックな順序で取得
- ページごとに明確に分割

**デメリット:**
- ボタンが見つからない場合、途中で止まる
- ページロード時間が積算される（時間がかかる）

---

### 4️⃣ **無限スクロール方式（Twitter/Facebook 対応）**

```
スクロール前
┌─────────────────────┐
│ ツイート 1          │
│ ツイート 2          │
│ ツイート 3          │
│ [さらに読み込み中...]│ ← 自動ロード
└─────────────────────┘

        ↓ スクロール ↓

スクロール後
┌─────────────────────┐
│ ツイート 2          │
│ ツイート 3          │
│ ツイート 4          │ ← 新規ロード
│ ツイート 5          │ ← 新規ロード
│ [さらに読み込み中...]│
└─────────────────────┘

各スクロール段階でスクショ → 複数ページ PDF
```

**使用場面:**
- Twitter/X
- Facebook フィード
- Reddit
- Pinterest
- Instagram

**実行コマンド:**
```bash
node auto-scroll-screenshot.js \
  --url "https://twitter.com/search?q=nodejs" \
  --scroll-mode "infinite-scroll"
```

**動作原理:**
```javascript
let lastHeight = 0;
while (pageNum <= maxPages) {
  // スクロール実行
  const currentHeight = await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    return document.documentElement.scrollHeight;
  });
  
  // ページの高さが変わらなければ終了（新しいコンテンツなし）
  if (currentHeight === lastHeight) {
    break;
  }
  
  // 遅延ロード待機
  await page.waitForTimeout(1000);
  
  // スクショ取得
  const screenshot = await page.screenshot();
  screenshots.push(screenshot);
  
  lastHeight = currentHeight;
  pageNum++;
}
```

**利点:**
- 動的ロードに対応
- 終了判定が自動（新しいコンテンツがないと終了）
- ボタンクリックが不要

**デメリット:**
- 終了判定の精度がサイトに依存
- ロード時間が予測不可能
- コンテンツの重複可能性

---

## 🔧 カスタマイズ例

### 例 1: モバイルサイズでキャプチャ

```bash
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --width 375 \      # iPhone サイズ
  --height 667 \
  --scroll-mode "viewport"
```

### 例 2: 特定セレクタ内の要素のみキャプチャ

```javascript
// auto-scroll-screenshot.js を編集
await page.goto(options.url);

// 特定要素でクリップ
const element = await page.$('#main-content');
await element.screenshot({ path: 'output.png' });
```

### 例 3: スクロール間隔を調整

```javascript
// auto-scroll-screenshot.js の waitForTimeout を変更
// デフォルト: 500ms（速い）
// 遅いサイト用: 2000ms 以上

await page.waitForTimeout(2000);  // 2 秒待機
```

### 例 4: JavaScript レンダリング待機

```bash
# 動的コンテンツが多いサイト向け
node auto-scroll-screenshot.js \
  --url "https://single-page-app.example.com" \
  --scroll-mode "viewport"
  # networkidle2 で待機（自動で対応）
```

---

## 📊 パフォーマンス比較

| モード | ページ数 | 実行時間 | ファイルサイズ | 推奨用途 |
|--------|---------|---------|--------------|---------|
| Full | 1 ページ | 5 秒 | 2-5 MB | 単一ページ |
| Viewport | 5-10 ページ | 15-20 秒 | 5-15 MB | 一般的なページ |
| Paginated | 10-50 ページ | 60-180 秒 | 10-50 MB | EC サイト |
| Infinite-Scroll | 5-20 ページ | 30-120 秒 | 5-30 MB | SNS フィード |

---

## ⚡ 最適化テクニック

### 1. 不要なリソース読み込みをスキップ

```javascript
// auto-scroll-screenshot.js に追加
await page.setRequestInterception(true);

page.on('request', (request) => {
  const resourceType = request.resourceType();
  if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
    request.abort();  // これらのリソースはスキップ
  } else {
    request.continue();
  }
});
```

### 2. 読み込み時間制限

```javascript
await page.goto(options.url, {
  waitUntil: 'networkidle2',
  timeout: 30000  // 30 秒でタイムアウト
});
```

### 3. 並列処理で複数 URL を同時処理

```javascript
const urls = [
  'https://site1.com',
  'https://site2.com',
  'https://site3.com'
];

// 最大 3 つを並列実行
const results = await Promise.all(
  urls.map(url => captureAndCreatePDF({ url, ... }))
);
```

---

## 🐛 デバッグ方法

### スクリーンショット中にブラウザを表示

```javascript
// auto-scroll-screenshot.js の puppeteer.launch を変更
const browser = await puppeteer.launch({
  headless: false,  // false = ブラウザウィンドウを表示
  args: ['--no-sandbox']
});
```

### スクロール位置をログに出力

```javascript
// viewport モードで
await page.evaluate((offset) => {
  window.scrollBy(0, offset);
  console.log('Scroll position:', window.scrollY);
}, viewportHeight);
```

### 現在のページ内容を HTML で保存

```javascript
const htmlContent = await page.content();
fs.writeFileSync('page_' + i + '.html', htmlContent);
```

---

**Happy Automating! 🚀**
