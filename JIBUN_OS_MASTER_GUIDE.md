# 🏢 自分株式会社OS — マスターセットアップガイド

> **コンセプト:** ゼロから開発しない。GitHub上の最強OSSを組み合わせて、**月額0円で動く最強の自動化システム**を構築する。

---

## 🗺️ システム全体像

```
[情報収集] → [AI生成] → [自動投稿] → [データ管理] → [ダッシュボード]
  Google News   Gemini     n8n         PocketBase    JIBUN-OS Hub
  RSS feeds    Flowise   WordPress   AnythingLLM     このアプリ
```

---

## ✅ セットアップ手順（推奨順）

### STEP 1: Gemini APIキーの取得（5分）
1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. 「APIキーを作成」をクリック
3. コピーして安全な場所に保存
4. **無料枠:** Gemini 1.5 Flash — 100万トークン/日

---

### STEP 2: n8nの起動確認（すでに完了）
```bash
# 起動コマンド（すでにある）
./n8n_sns_affiliate/start_sns_system.command

# アクセス
open http://localhost:5678
```

**n8nにGeminiを設定:**
1. n8n → Settings → Environment Variables
2. `GEMINI_API_KEY` = あなたのAPIキー を追加

**ワークフローのインポート:**
```
n8n → 左上メニュー → Import from File
→ n8n_sns_affiliate/gemini_blog_auto_workflow.json を選択
```

---

### STEP 3: Flowiseのセットアップ（AIエージェント構築）
```bash
# ダブルクリックで実行
./setup_flowise.command
```

**起動後の設定:**
1. `http://localhost:3000` を開く
2. 「Add New Chatflow」をクリック
3. 「ChatGoogleGemini」ノードをドラッグ
4. APIキーを入力 → 保存
5. 右上「Embed」からチャットボットとして埋め込み可能！

---

### STEP 4: PocketBaseのセットアップ（データDB）
```bash
# ダブルクリックで実行
./setup_pocketbase.command
```

**起動後の設定:**
1. `http://localhost:8090/_/` を開く
2. 管理者メールアドレスとパスワードを設定
3. New Collection → 「affiliates」テーブルを作成:
   - `name` (text) - 商品名
   - `url` (url) - アフィリエイトURL
   - `category` (text) - カテゴリ
   - `earnings` (number) - 収益
   - `date` (date)

---

### STEP 5: AnythingLLMのセットアップ（第二の脳）
> 事前にDocker Desktopのインストールが必要

```bash
# Docker Desktop: https://www.docker.com/products/docker-desktop/
# インストール後にダブルクリックで実行
./setup_anythingllm.command
```

**起動後の設定:**
1. `http://localhost:3001` を開く
2. 管理者アカウントを作成
3. Settings → LLM Provider → **Google Gemini** を選択
4. APIキーを入力
5. New Workspace → 「Kindle書籍」を作成
6. KindleスクショのPDFをドラッグ&ドロップ
7. 「この本の要点は？」などと質問できる！

---

## 📊 無料枠サマリー

| ツール | 月間コスト | 備考 |
|--------|-----------|------|
| n8n (ローカル) | ¥0 | セルフホスト |
| Flowise | ¥0 | セルフホスト |
| AnythingLLM | ¥0 | セルフホスト |
| PocketBase | ¥0 | セルフホスト |
| Gemini 1.5 Flash API | ¥0 | 100万トークン/日無料 |
| Google Drive | ¥0 | 既存利用 |
| **合計** | **¥0** | |

---

## 🔗 便利なリンク

| ツール | ローカルURL | GitHub |
|--------|------------|--------|
| JIBUN-OS Hub | http://localhost:5173 | このアプリ |
| n8n | http://localhost:5678 | [FlowiseAI/Flowise](https://github.com/n8n-io/n8n) |
| Flowise | http://localhost:3000 | [FlowiseAI/Flowise](https://github.com/FlowiseAI/Flowise) |
| PocketBase | http://localhost:8090/_/ | [pocketbase/pocketbase](https://github.com/pocketbase/pocketbase) |
| AnythingLLM | http://localhost:3001 | [Mintplex-Labs/anything-llm](https://github.com/Mintplex-Labs/anything-llm) |

---

## 🚨 よくある問題

**Q: ポートが使用中エラー**
```bash
# 使用中のプロセスを確認・終了
lsof -ti:5678 | xargs kill -9  # n8n
lsof -ti:3000 | xargs kill -9  # Flowise
```

**Q: Gemini APIエラー (429 Too Many Requests)**
- Flash モデルに変更: `gemini-1.5-flash`
- リクエスト間隔を1秒以上開ける

**Q: AnythingLLMがPDFを読めない**
- PDFのファイルサイズは50MB以下に
- テキストが含まれるPDFのみ対応（スキャン画像PDFはOCR必要）
