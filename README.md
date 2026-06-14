# 📊 投資管理ダッシュボード

自分株式会社OS に統合された投資管理モジュールです。

## 機能

| 機能 | 説明 |
|------|------|
| ポートフォリオ管理 | 日本株・米国株・投資信託・仮想通貨を一元管理 |
| 損益追跡 | 評価額・含み損益・リターン率をリアルタイム計算 |
| AI銘柄分析 | フィジカルAIなど6テーマから有望銘柄をClaude AIが分析 |
| AIチャット | 保有資産を踏まえた自由質問に回答 |

## 組み込み方法

### 1. コンポーネントを `src/components/investment/` に配置（完了）

### 2. 既存の App.tsx / ルーターに追加

```tsx
import InvestmentDashboard from "./components/investment";

// ルーターに追加（例: React Router）
<Route path="/investment" element={<InvestmentDashboard />} />

// またはサイドバーのナビゲーションに追加
{ icon: "📊", label: "投資管理", path: "/investment" }
```

### 3. Tailwind CSS のアニメーション設定

`tailwind.config.js` または `tailwind.config.ts` に追加:

```js
theme: {
  extend: {
    animation: {
      fadeIn: "fadeIn 0.3s ease both",
    },
    keyframes: {
      fadeIn: {
        from: { opacity: "0", transform: "translateY(6px)" },
        to: { opacity: "1", transform: "translateY(0)" },
      },
    },
  },
},
```

## ファイル構成

```
src/components/investment/
├── index.ts                  # エクスポート
├── InvestmentDashboard.tsx   # メインコンポーネント
├── PortfolioTab.tsx          # ポートフォリオ一覧
├── AiAnalysisTab.tsx         # AI銘柄分析
├── AiChatTab.tsx             # AIチャット
├── AddItemModal.tsx          # 銘柄追加/編集モーダル
├── types.ts                  # 型定義・定数・ユーティリティ
└── README.md                 # このファイル
```

## 使い方

### 銘柄の追加
右上の「+ 銘柄追加」ボタンから種別（日本株・米国株・投資信託・仮想通貨）を選んで登録。

### AI銘柄分析
「AI銘柄分析」タブからテーマを選択すると、Claude AIが10倍株候補を分析。

対応テーマ:
- 🤖 フィジカルAI（ロボティクス・自律機械）
- ⚛️ 量子コンピュータ
- 🛸 宇宙・衛星
- 🧬 AIバイオ（創薬・ゲノム）
- ⚡ 次世代エネルギー（核融合・水素）
- 💎 半導体（AIチップ・HBM）

### AIに相談
「AIに相談」タブで保有資産を踏まえた自由質問が可能。

## 注意事項

- 価格データは手動入力です（SBI証券はAPIを公開していないため）
- AI分析は教育目的であり、投資助言ではありません
- 投資は自己責任でお願いします

## 今後の拡張案

- [ ] Yahoo Finance API で米国株の価格を自動取得
- [ ] bitFlyer/Bitbank API でBTC価格を自動更新
- [ ] バックテストシミュレーターとの連携
- [ ] n8n との連携で定期的な分析レポートを自動生成
