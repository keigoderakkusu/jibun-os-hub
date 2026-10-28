# WordPress (Cocoon) サイト改善 セットアップガイド
## ai-jidoka-keigo.com 向け

---

## ① カスタムCSS の適用（最優先・5分で完了）

1. WordPress管理画面 → **外観 → カスタマイズ**
2. **「追加CSS」** をクリック
3. `custom.css` の内容を**全文コピー&ペースト**
4. 「公開」ボタンをクリック

✅ これだけでヘッダー・記事カード・サイドバー・フッターが一気にプロ仕様になります。

---

## ② Google Fonts の読み込み（Noto Sans JP）

1. WordPress管理画面 → **外観 → カスタマイズ → 追加CSS** の上に以下を追加

```html
<!-- functions.php に追加する場合 -->
```

または Cocoon設定 → **headタグ内** に以下を貼り付け：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
```

---

## ③ サイドバーウィジェットの設定（10分）

1. WordPress管理画面 → **外観 → ウィジェット**
2. 「サイドバー」エリアに **「カスタムHTML」** ウィジェットを追加
3. `affiliate-widget.html` の各ブロック（①〜⑤）を順番に貼り付け
4. 順序は以下を推奨：
   - 最上部：プロフィール＋実績バッジ（①）
   - 2番目：無料プレゼント導線（④）← 最重要
   - 3番目：n8nアフィリ（②）
   - 4番目：Xserverアフィリ（③）
   - 最下部：人気記事ランキング（⑤）

---

## ④ 画面下部固定CTAバナーの設置（5分）

**方法A: Cocoonのフッター設定（推奨）**
1. Cocoon設定 → **「全体」タブ**
2. 「フッター」セクション → **「フッターHTML」**
3. `sticky-cta-banner.html` の `<style>〜</style>` と `<div class="jibun-sticky-cta"〜</div>` と `<script>〜</script>` を貼り付け

**方法B: テーマファイルエディター**
1. 外観 → テーマファイルエディター → `footer.php`
2. `</body>` タグの直前に貼り付け

---

## ⑤ 記事内アフィリエイトカードの使い方

記事を書く際、**ブロックエディタ（Gutenberg）** で：

1. ブロック追加 → **「カスタムHTML」**
2. `sticky-cta-banner.html` の後半部分（n8nカード or Xserverカード）を貼り付け
3. 記事の中間（見出し「まとめ」の前）と記事末尾の2箇所に配置

---

## ⑥ カテゴリの整理（SEO対策）

現在「Uncategorized」のみ → 以下のカテゴリを作成してください：

| カテゴリ名 | スラッグ | 用途 |
|---|---|---|
| AI・自動化 | ai-automation | Hermes/n8n/Ollama系記事 |
| 副業・収益化 | side-business | アフィリ・ブログ収益系 |
| ツールレビュー | tools | 各種ツール比較・レビュー |
| 書評・学び | book-review | 書籍・自己啓発系 |

作成方法: 投稿 → カテゴリー → 新規カテゴリーを追加

---

## ⑦ Cocoon テーマ設定の最適化

**Cocoon設定 → 「全体」**
- サイトキーカラー: `#7c3aed`
- テキストカラー: `#1e293b`
- リンクカラー: `#7c3aed`
- ホバーカラー: `#4f46e5`

**Cocoon設定 → 「ヘッダー」**
- ヘッダーレイアウト: 「センターロゴ + ナビ下」
- ヘッダー背景色: `#0f172a`
- ヘッダーテキスト色: `#ffffff`

**Cocoon設定 → 「投稿」**
- アイキャッチ画像: 有効
- 著者情報: 有効（プロフィール強化）
- SNSシェアボタン: 有効

---

## ⑧ アフィリエイト登録リスト（副業収益化）

| サービス | 登録先 | 想定単価 |
|---|---|---|
| Xサーバー | https://affiliate.xserver.ne.jp/ | 1件 ¥4,000〜 |
| ConoHa WING | https://www.conoha.jp/affiliate/ | 1件 ¥3,500〜 |
| もしもアフィリエイト | https://af.moshimo.com/ | Amazon等 |
| A8.net | https://www.a8.net/ | 幅広いジャンル |
| n8n Partner | https://n8n.io/affiliate/ | 売上の30% |

---

## ⑨ SEO基本設定（Cocoon + SEO SIMPLE PACK）

プラグイン「SEO SIMPLE PACK」をインストール後：

**サイト全体の設定**
```
サイト名: 自分株式会社
キャッチフレーズ: 26歳がAI×自動化で年収1000万を目指す記録
メタディスクリプション: AIと自動化ツールを駆使して副業収益を最大化する方法を実体験とともに発信。Hermes Agent・n8n・アフィリエイトの組み合わせで月収3万円達成への道。
```

**OGP画像**: 1200×630px の画像を作成して設定（Canvaで無料作成可能）

---

## ⑩ 今後のコンテンツ計画（Hermesで自動生成）

Hermesターミナルで以下のように依頼：

```
hermes

「n8nでブログ記事を自動投稿する方法」について、
SEOを意識した2000字のWordPress記事を書いてください。
カテゴリ: AI・自動化
アフィリエイト: n8nのリンクを自然な形で2箇所挿入
```

生成された記事をWordPressに貼り付けて投稿するだけで完成します。
