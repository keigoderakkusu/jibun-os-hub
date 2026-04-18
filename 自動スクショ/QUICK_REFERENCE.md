# ⚡ クイックリファレンス - 全機能実行ガイド

## 🎯 3 つの撮影機能

```
┌────────────────────────────────────────────────────────────┐
│ 1. 📱 物理書類スキャン（モバイルカメラ）                  │
│    スマートフォンで本や書類を撮影 → PDF化                 │
├────────────────────────────────────────────────────────────┤
│ 2. 🤖 自動スクロール連続スクショ（Puppeteer）             │
│    ウェブページを自動スクロール → 連続スクショ → PDF      │
├────────────────────────────────────────────────────────────┤
│ 3. 🔘 ブラウザ拡張機能（Chrome）                          │
│    任意のページで 1 クリック → すぐ PDF                   │
└────────────────────────────────────────────────────────────┘
```

---

## 📋 セットアップチェックリスト

### ステップ 1: GAS バックエンド設定（全機能共通）

```
1. Google Apps Script (https://script.google.com) を開く
2. 新規プロジェクト: "DocumentScanSystem"
3. DocumentScanAdvancedBackend.gs をコピー＆貼付
4. デプロイ → ウェブアプリ → アクセス: 全員
5. デプロイメント URL をコピー (abc123xyz789/usercallback の形)
```

✅ **チェック**: GAS URL が `https://script.google.com/macros/d/...` 形式か確認

---

## 🚀 機能別実行ガイド

### 機能 1️⃣: 物理書類スキャン（モバイル）

#### セットアップ
```bash
# ステップ 1: GAS に DocumentScanMobile.gs を追加
# ステップ 2: ウェブアプリとしてデプロイ → URL を開く

スマートフォンで開く:
https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback
```

#### 使用方法

**📄 単一ページモード（1 ページのみ）**
```
1. ブラウザで GAS URL を開く
2. モード: 「📄 単一」を選択（デフォルト）
3. ファイル名を入力
4. カメラに書類を向ける
5. 「📸 撮影」をクリック
6. 自動的に Google Drive に PDF 保存
```

**📚 複数ページモード（複数ページ）**
```
1. モード: 「📚 複数」を選択
2. ページ 1 を撮影 → 「📸 撮影を追加」
3. ページ 2 を撮影 → 「📸 撮影を追加」
4. プレビューで確認
5. 「💾 保存」で一括 PDF 化
```

**期待結果**
```
Google Drive に次のファイルが自動作成:
📁 DocumentScan_YYYY年MM月/
   📄 契約書_20240328_143022.pdf
   📄 領収書_20240328_144500.pdf
```

---

### 機能 2️⃣: 自動スクロール連続スクショ（Node.js）

#### 環境準備（初回のみ）
```bash
# Node.js v14+ をインストール
node --version  # v14.0.0 以上か確認

# Puppeteer をインストール
npm install puppeteer dotenv

# .env ファイル作成
echo 'GAS_DEPLOYMENT_URL=https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback' > .env
```

#### 実行コマンド

**パターン A: Full ページ（最速）**
```bash
# ページ全体を 1 枚のスクショでキャプチャ
node auto-scroll-screenshot.js \
  --url "https://example.com/article" \
  --scroll-mode "full" \
  --filename "article"
```

**パターン B: Viewport 分割（推奨）**
```bash
# ビューポート高さで分割スクショ → マルチページ PDF
node auto-scroll-screenshot.js \
  --url "https://blog.example.com/post" \
  --scroll-mode "viewport" \
  --filename "blog-post" \
  --pdf-mode "combined"
```

**パターン C: Paginated（ページボタン）**
```bash
# 「次へ」ボタンをクリックして進行
node auto-scroll-screenshot.js \
  --url "https://shop.example.com/products?page=1" \
  --scroll-mode "paginated" \
  --filename "products"
```

**パターン D: 無限スクロール（Twitter など）**
```bash
# 無限スクロール対応
node auto-scroll-screenshot.js \
  --url "https://twitter.com/search?q=nodejs" \
  --scroll-mode "infinite-scroll" \
  --filename "twitter-search"
```

#### PDF 出力形式の選択

**オプション 1: 全ページを 1 つの PDF**
```bash
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --scroll-mode "viewport" \
  --pdf-mode "combined"
  # 結果: 1 つの複数ページ PDF
```

**オプション 2: ページごと別々の PDF**
```bash
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --scroll-mode "viewport" \
  --pdf-mode "split"
  # 結果: article_page1.pdf, article_page2.pdf, ...
```

#### ビューポート設定（オプション）

**デスクトップサイズ（デフォルト）**
```bash
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --width 1920 \
  --height 1080
```

**タブレットサイズ**
```bash
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --width 768 \
  --height 1024
```

**モバイルサイズ（iPhone）**
```bash
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --width 375 \
  --height 667
```

**期待結果**
```
✓ ページ 1/3 スクショ取得
✓ ページ 2/3 スクショ取得
✓ ページ 3/3 スクショ取得
✅ 処理完了！
   ファイル: blog-post_20240328_143022.pdf
   URL: https://drive.google.com/file/d/abc123/view
```

---

### 機能 3️⃣: ブラウザ拡張機能（Chrome）

#### セットアップ（前回作成済み）

```
1. Chrome を開く → chrome://extensions
2. デベロッパー モード ON
3. 4 つのファイルをフォルダに配置
4. 「パッケージ化されていない拡張機能を読み込む」
5. フォルダを選択
6. ✅ インストール完了
```

#### 使用方法

```
1. 任意のウェブページを Chrome で開く
2. 拡張機能アイコン（紫色）をクリック
3. ファイル名を入力（例: "営業資料"）
4. キャプチャ範囲を選択:
   - 表示領域 (表示中の部分)
   - ページ全体 (上から下まで)
   - 特定要素 (CSS セレクタで指定)
5. 「📸 スクショを撮影」をクリック
6. ✅ Google Drive に自動保存
```

---

## 📊 使用例集

### 例 1: Zenn の記事を PDF 化

```bash
# Zenn ブログを自動スクロール → PDF化
node auto-scroll-screenshot.js \
  --url "https://zenn.dev/example/articles/abc123def456" \
  --scroll-mode "viewport" \
  --filename "zenn_article" \
  --pdf-mode "combined"

# 結果: zenn_article_20240328_143022.pdf
```

### 例 2: Amazon 商品リストを全キャプチャ

```bash
# ページネーション対応
node auto-scroll-screenshot.js \
  --url "https://amazon.com/s?k=nodejs+books&page=1" \
  --scroll-mode "paginated" \
  --filename "amazon_books"

# 結果: amazon_books_20240328_143022.pdf (複数ページ)
```

### 例 3: Twitter タイムラインをキャプチャ

```bash
# 無限スクロール対応
node auto-scroll-screenshot.js \
  --url "https://twitter.com/home" \
  --scroll-mode "infinite-scroll" \
  --filename "timeline" \
  --pdf-mode "split"  # ページごと分割

# 結果: timeline_page1.pdf, timeline_page2.pdf, ...
```

### 例 4: 本を複数ページカメラで撮影

```
1. スマートフォンで GAS URL を開く
2. モード: 「📚 複数」
3. ページ 1-10 を順に撮影
4. 「💾 保存」
5. ✅ 10 ページの連続 PDF が自動作成
```

### 例 5: 複数 URL を一括処理（バッチ）

```bash
# 複数の URL を処理する場合
for url in \
  "https://blog.example.com/post1" \
  "https://blog.example.com/post2" \
  "https://blog.example.com/post3"
do
  node auto-scroll-screenshot.js \
    --url "$url" \
    --scroll-mode "viewport"
done
```

---

## 🔍 トラブルシューティング

### ❌ エラー: "GAS デプロイメント URL が設定されていません"

**解決:**
```bash
# .env ファイルを確認
cat .env

# GAS_DEPLOYMENT_URL が含まれているか確認
# なければ追加:
echo 'GAS_DEPLOYMENT_URL=https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback' > .env
```

### ❌ スマートフォンでカメラが起動しない

**解決:**
```
1. スマートフォンで HTTPS サイトを使用（GAS は HTTPS）
2. カメラ許可をブラウザに与えたか確認
3. Chrome 設定 → サイト設定 → カメラ → 許可
```

### ❌ PDF が保存されない

**解決:**
```bash
# GAS ログを確認
1. GAS スクリプトエディタを開く
2. 実行ログを確認
3. エラーメッセージをメモ

# よくある原因:
- GAS URL が正しくない
- Google Drive へのアクセス権限なし
- GAS デプロイメントの「アクセス」が「指定したユーザーのみ」
```

### ❌ 連続スクショが途中で止まる

**解決:**
```bash
# waitForTimeout を増加
# auto-scroll-screenshot.js 内の以下を変更:
await page.waitForTimeout(2000);  // 500ms → 2000ms に変更

# または実行時にビューポート調整:
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --width 1920 \
  --height 1080 \
  --scroll-mode "viewport"
```

---

## ⚙️ 便利な設定

### GAS にいつも同じフォルダに保存

```javascript
// DocumentScanAdvancedBackend.gs を編集
function getOrCreateScanFolder() {
  return '1a2b3c4d5e6f7g8h9i0j';  // Google Drive フォルダ ID を固定
}
```

Google Drive フォルダ ID の確認方法:
```
1. Google Drive でフォルダを開く
2. アドレスバーから ID をコピー:
   https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j
                                        ↑ これが ID
```

### 自動スクロールをもっと遅く（遅いサイト対応）

```javascript
// auto-scroll-screenshot.js の waitForTimeout を編集
await page.waitForTimeout(3000);  // 3 秒待機（デフォルト: 500ms）
```

---

## 📚 ドキュメント一覧

| ファイル | 内容 | 対象ユーザー |
|---------|------|-----------|
| **INTEGRATED_SETUP_GUIDE.md** | 全機能のセットアップ | 全員向け |
| **AUTO_SCROLL_DETAILED_GUIDE.md** | 自動スクロール詳細解説 | 詳しく学びたい人向け |
| **DocumentScanMobile.gs** | モバイルカメラアプリ | GAS コード |
| **DocumentScanAdvancedBackend.gs** | バックエンド PDF エンジン | GAS コード |
| **auto-scroll-screenshot.js** | Node.js スクリプト | JavaScript |

---

## 🎁 便利なコマンドエイリアス

`.bashrc` または `.zshrc` に追加:

```bash
# GAS URL をグローバル変数に保存
export GAS_URL="https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback"

# エイリアス作成
alias screenshot-full='node auto-scroll-screenshot.js --scroll-mode full'
alias screenshot-viewport='node auto-scroll-screenshot.js --scroll-mode viewport'
alias screenshot-paginated='node auto-scroll-screenshot.js --scroll-mode paginated'
alias screenshot-infinite='node auto-scroll-screenshot.js --scroll-mode infinite-scroll'

# 使用例:
# screenshot-viewport --url "https://example.com" --filename "report"
```

---

## 📈 次のステップ

```
□ Google Cloud Scheduler で定期実行
□ Google Sheets で URL 一覧管理 → 自動バッチ処理
□ Slack Webhook で保存完了通知
□ Gmail で PDF をメール添付送信
□ データ Studio で実行ログダッシュボード化
```

---

**Happy Screenshotting! 📸✨**

🚀 すべての機能が動いていますか？
💬 問題が発生したら、ドキュメント内の「トラブルシューティング」を確認してください。
