# 📚 統合ドキュメントスキャン＆自動スクロールシステム

**3つの撮影モード対応:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 物理書類スキャン（モバイルカメラ）                      │
│    📱 スマートフォンでカメラ撮影 → PDF化                   │
├─────────────────────────────────────────────────────────────┤
│ 2. ウェブページ自動スクロール（Puppeteer）                 │
│    🤖 ページを自動スクロール → 連続スクショ → PDF化        │
├─────────────────────────────────────────────────────────────┤
│ 3. ブラウザ拡張機能（ワンクリック）                        │
│    🔘 既存の Chrome 拡張機能で即座にキャプチャ            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 セットアップ手順

### **ステップ 1: GAS バックエンド設定（共通）**

#### 1-1. 新規スクリプトプロジェクト作成

1. https://script.google.com を開く
2. 「+ 新しいプロジェクト」をクリック
3. プロジェクト名: `DocumentScanSystem`

#### 1-2. バックエンド コードをコピー

`DocumentScanAdvancedBackend.gs` の全コードをコピーして貼付

#### 1-3. デプロイメント作成

1. 右上の **「デプロイ」→「新しいデプロイメント」**
2. 設定:
   ```
   種類: ウェブアプリ
   実行形式: Me
   アクセス: 全員（匿名ユーザー含む）
   ```
3. **「デプロイ」をクリック**
4. **デプロイメント URL をコピー** (以下の形)
   ```
   https://script.google.com/macros/d/abc123xyz789/usercallback
   ```

---

### **モード A: 物理書類スキャン（モバイルカメラ）**

#### A-1. GAS スクリプト追加

`DocumentScanMobile.gs` の全コードをコピーして、新規 GAS プロジェクトファイルを作成

または、既存プロジェクトに **新規ファイル追加** で統合

#### A-2. Web アプリのデプロイ

1. **「デプロイ」→「新しいデプロイメント」**
2. **「種類: ウェブアプリ」を選択**
3. アクセス: **全員（匿名ユーザー含む）**

#### A-3. スマートフォンからアクセス

デプロイメント URL を **スマートフォンのブラウザ**で開く

```
https://script.google.com/macros/d/abc123xyz789/usercallback
```

#### A-4. 使用方法

**単一モード（1 ページのみ）:**
1. カメラビューが表示される
2. 書類にカメラを向ける
3. **「📸 撮影」** をクリック
4. 自動的に Google Drive に PDF 保存

**複数モード（複数ページ）:**
1. モード選択で **「📚 複数」** を選択
2. ページごとに **「📸 撮影を追加」** をクリック
3. プレビューで確認
4. **「💾 保存」** で一括 PDF 化

---

### **モード B: ウェブページ自動スクロール（Node.js）**

#### B-1. 環境準備

```bash
# Node.js v14+ インストール確認
node --version  # v14.0.0 以上

# Puppeteer インストール
npm install puppeteer dotenv
```

#### B-2. スクリプト配置

`auto-scroll-screenshot.js` をプロジェクトフォルダに保存

#### B-3. 環境変数設定

`.env` ファイルを作成:

```bash
GAS_DEPLOYMENT_URL=https://script.google.com/macros/d/abc123xyz789/usercallback
```

#### B-4. スクロール戦略の選択

**4 つのスクロール戦略:**

```bash
# 1. Full: ページ全体を 1 枚のスクショでキャプチャ
node auto-scroll-screenshot.js \
  --url "https://example.com/article" \
  --scroll-mode "full" \
  --filename "article"

# 2. Viewport: ビューポート高さで分割スクショ
node auto-scroll-screenshot.js \
  --url "https://blog.com/post" \
  --scroll-mode "viewport" \
  --filename "blog-post"

# 3. Paginated: 次ページボタンをクリック進行
node auto-scroll-screenshot.js \
  --url "https://shop.com/products?page=1" \
  --scroll-mode "paginated" \
  --filename "products"

# 4. Infinite-Scroll: 無限スクロール対応（Twitter など）
node auto-scroll-screenshot.js \
  --url "https://twitter.com/search?q=nodejs" \
  --scroll-mode "infinite-scroll" \
  --filename "twitter-search"
```

#### B-5. PDF 出力形式の選択

```bash
# オプション 1: 全ページを 1 つの PDF にまとめる（デフォルト）
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --scroll-mode "viewport" \
  --pdf-mode "combined" \
  --filename "combined-report"

# オプション 2: ページごとに別々の PDF を生成
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --scroll-mode "viewport" \
  --pdf-mode "split" \
  --filename "split-pages"
```

#### B-6. ビューポート設定（オプション）

```bash
# デフォルト: 1920x1080
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --width 1024 \
  --height 768 \
  --scroll-mode "viewport"

# モバイルサイズでキャプチャ
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --width 375 \
  --height 667 \
  --scroll-mode "viewport"
```

---

### **モード C: ブラウザ拡張機能（既存）**

前のセットアップで構築した Chrome 拡張機能をそのまま使用

---

## 📊 使用例

### 例 1: Qiita ブログ記事を PDF 化

```bash
# ビューポート分割で連続スクショ
node auto-scroll-screenshot.js \
  --url "https://qiita.com/example/items/abc123def456" \
  --scroll-mode "viewport" \
  --filename "qiita_article" \
  --pdf-mode "combined"
```

**結果**: `qiita_article_20240328_143022.pdf` が Google Drive に保存

---

### 例 2: 複数ページの本をカメラで撮影

1. スマートフォンでデプロイメント URL を開く
2. モード: **「📚 複数」** を選択
3. ページ 1 を撮影 → 「📸 撮影を追加」
4. ページ 2 を撮影 → 「📸 撮影を追加」
5. ページ 3 を撮影 → 「📸 撮影を追加」
6. **「💾 保存」** をクリック

**結果**: 3 ページの連続 PDF が Google Drive に保存

---

### 例 3: EC サイトの商品ページを自動スクロール

```bash
# 商品リストを無限スクロールして全てキャプチャ
node auto-scroll-screenshot.js \
  --url "https://shop.example.com/category/electronics" \
  --scroll-mode "infinite-scroll" \
  --filename "electronics-catalog" \
  --pdf-mode "split"
```

**結果**: 各スクリーンショットが個別の PDF として Google Drive に保存

---

## 🎯 実装パターン比較表

| パターン | 入力 | 出力 | 自動化度 | 対応デバイス |
|---------|------|------|---------|-----------|
| **モバイルカメラ** | 物理書類 | PDF | 中（複数ページ手動） | 📱 スマートフォン |
| **自動スクロール** | URL | PDF | 高（完全自動） | 💻 デスクトップ |
| **拡張機能** | ブラウザ | PDF | 中（ワンクリック） | 💻 Chrome |

---

## ⚙️ 高度な設定

### A-1. 特定フォルダに保存

GAS バックエンド側で フォルダ ID を固定:

```javascript
// DocumentScanAdvancedBackend.gs の getOrCreateScanFolder() を置き換え
function getOrCreateScanFolder() {
  return 'YOUR_FOLDER_ID'; // Google Drive フォルダ ID
}
```

### A-2. PDF にメタデータを追加

```javascript
// convertImageToPDF() を拡張して、日時・ページ番号を追加
function convertImageToPDFWithMetadata(imageBlob, filename, pageNum) {
  const doc = DocumentApp.create(filename + '_temp');
  const body = doc.getBody();
  
  // ページ番号を挿入
  const pageInfo = body.insertParagraph(0, 'ページ: ' + pageNum);
  pageInfo.setFontSize(10);
  pageInfo.setForegroundColor('#999999');
  
  body.appendImage(imageBlob);
  
  // ... 残りのコード
}
```

### A-3. OCR で PDF をテキスト検索可能に

Google Docs で自動 OCR が行われるため、追加の設定は不要

PDF から自動的にテキスト層が作成されます

---

## 🔐 セキュリティ注意事項

- [ ] `.env` ファイルを `.gitignore` に追加
- [ ] GAS デプロイメント URL を機密扱い
- [ ] スマートフォンのカメラ許可を確認
- [ ] Google Drive へのアクセス権限を最小限に

---

## 📱 トラブルシューティング

### ❌ スマートフォンでカメラが起動しない

**原因**: HTTPS 接続が必要（GAS は HTTP をサポート）

**対処**: GAS デプロイメント URL は自動的に HTTPS です

### ❌ Node.js でスクリーンショットがぼやけている

```bash
# デバイススケール設定を追加（Puppeteer設定で）
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --width 1920 \
  --height 1080
```

### ❌ 複数ページ PDF が 1 ページだけになる

**原因**: `pdfMode` が `"split"` になっている可能性

**対処**:
```bash
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --pdf-mode "combined"  # これを明示的に指定
```

### ❌ 無限スクロール対応で最後のページがキャプチャされない

**原因**: ページロード時間が不足

```bash
node auto-scroll-screenshot.js \
  --url "https://example.com" \
  --scroll-mode "infinite-scroll" \
  --filename "report"
  # スクリプト内の waitForTimeout を増加させる
```

---

## 📚 次のステップ

- [ ] **定期自動実行**: Cloud Scheduler で毎日実行
- [ ] **複数 URL 管理**: Google Sheets で URL 一覧を管理 → 自動実行
- [ ] **Slack 通知**: PDF 保存完了時に Slack へ通知
- [ ] **メール送信**: 完成した PDF をメール添付
- [ ] **メタデータ記録**: Sheets に実行ログを記録

---

## 🎁 追加機能一覧

| 機能 | 状態 | 説明 |
|------|------|------|
| 単一ページ PDF | ✅ 実装済み | 1 ページのスクショ → PDF |
| マルチページ PDF | ✅ 実装済み | 複数ページ → 1 つの PDF |
| ページ分割 PDF | ✅ 実装済み | 複数ページ → 複数 PDF |
| 自動スクロール | ✅ 実装済み | Viewport/Paginated/Infinite |
| モバイルカメラ | ✅ 実装済み | スマートフォンでカメラ撮影 |
| Google Drive 連携 | ✅ 実装済み | 自動保存・フォルダ管理 |
| OCR テキスト化 | ✅ Google Docs | 自動テキスト抽出可能 |

---

**Happy Scanning! 📸📚**
