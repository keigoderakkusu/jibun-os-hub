# 🚀 自動スクショシステム セットアップガイド

## ステップ 1: GAS バックエンドをデプロイする

### 1-1. Google Apps Script を開く
1. [https://script.google.com](https://script.google.com) を開く
2. **「+ 新しいプロジェクト」** をクリック
3. プロジェクト名を `DocumentScanSystem` に変更

### 1-2. バックエンドコードを貼る
1. デフォルトの `コード.gs` を全選択して削除
2. `DocumentScanAdvancedBackend.gs` の内容を全てコピーして貼る
3. **「保存（Ctrl+S）」**

### 1-3. ウェブアプリとしてデプロイ
1. 右上の **「デプロイ」→「新しいデプロイメント」** をクリック
2. 歯車アイコン → **「ウェブアプリ」** を選択
3. 以下の設定:
   ```
   実行ユーザー: 自分
   アクセスできるユーザー: 全員
   ```
4. **「デプロイ」** をクリック → Google アカウントで承認
5. 表示される **「ウェブアプリ URL」** をコピーする
   ```
   例: https://script.google.com/macros/s/AKfycbx.../exec
   ```

---

## ステップ 2: Node.js スクリプトに GAS URL を設定する

`.env` ファイルを開き、コピーした URL を設定:

```bash
GAS_DEPLOYMENT_URL=https://script.google.com/macros/s/AKfycbx.../exec
```

---

## ステップ 3: 自動スクショを実行する

```bash
cd "/Users/nagahamakeigo/Desktop/windowsパソコン/【仕事用】/アンチグラビティ　２/自動スクショ"

# 例) ブログ記事を PDF 化
node auto-scroll-screenshot.js \
  --url "https://example.com/article" \
  --scroll-mode viewport \
  --filename "my-article"
```

---

## ステップ 4: Chrome 拡張機能をインストールする

1. Chrome を開き `chrome://extensions` にアクセス
2. 右上 **「デベロッパーモード」** を ON にする
3. **「パッケージ化されていない拡張機能を読み込む」** をクリック
4. このフォルダを選択:
   ```
   /Users/nagahamakeigo/Desktop/windowsパソコン/【仕事用】/アンチグラビティ　２/自動スクショ/chrome-extension/
   ```
5. 拡張機能アイコンが Chrome ツールバーに表示される ✅
6. アイコンをクリック → **「⚙️ GAS URL 設定」** から GAS URL を入力

---

## ファイル構成

```
自動スクショ/
├── auto-scroll-screenshot.js  ← メインスクリプト（Node.js）
├── batch-screenshot.sh        ← 一括処理スクリプト
├── .env                       ← GAS URL 設定（★要設定）
├── .gitignore
├── package.json
├── urls.txt                   ← バッチ処理用 URL リスト
├── DocumentScanAdvancedBackend.gs  ← GAS バックエンド（★GASに貼る）
├── DocumentScanMobile.gs      ← モバイルカメラアプリ（GASに貼る）
└── chrome-extension/          ← Chrome 拡張機能フォルダ
    ├── manifest.json
    ├── popup.html
    ├── popup.js
    ├── background.js
    └── icon*.png
```
