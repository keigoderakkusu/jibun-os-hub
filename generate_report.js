/**
 * generate_report.js
 * Claude API でレポート内容を生成し、puppeteer で PDF に書き出す
 */

import Anthropic from "@anthropic-ai/sdk";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 対象銘柄定義 ─────────────────────────────────────────────
const STOCKS = [
  {
    name: "トクヤマ",
    code: "4043",
    market: "東証P",
    theme: "半導体多結晶シリコン・電子材料",
  },
  {
    name: "リガク・ホールディングス",
    code: "268A",
    market: "東証P",
    theme: "X線分析装置・半導体検査",
  },
  {
    name: "Marvell Technology",
    code: "MRVL",
    market: "NASDAQ",
    theme: "AIカスタムシリコン・データセンター半導体",
  },
  {
    name: "KIOXIA HD",
    code: "285A",
    market: "東証P",
    theme: "NAND型フラッシュメモリ・AI/DC向けストレージ",
  },
];

// ── Claude API でレポート生成 ─────────────────────────────────
async function generateReportContent() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const stockList = STOCKS.map(
    (s) => `・${s.name}（${s.code}・${s.market}）― ${s.theme}`
  ).join("\n");

  const prompt = `
あなたは証券アナリストです。本日（${today}）の「第二のキオクシア」追跡レポートを作成してください。

【対象銘柄】
${stockList}

【レポートに含める内容】
1. エグゼクティブ・サマリー（200字程度）
   - 本日の市場全体の概況
   - 注目銘柄の動向サマリー

2. 主要市場指数（日経平均・NYダウ・ナスダック・SOX指数）の動向

3. 各銘柄の個別分析（各銘柄につき）
   - 本日の株価動向・評価
   - 注目ポイント・カタリスト
   - リスク要因

4. 来週の注目スケジュール・見通し

【出力形式】
JSON形式で出力してください。構造は以下の通り：
{
  "report_date": "${today}",
  "executive_summary": "...",
  "market_indices": {
    "nikkei": {"value": "...", "change": "...", "change_pct": "...", "comment": "..."},
    "dow": {"value": "...", "change": "...", "change_pct": "...", "comment": "..."},
    "nasdaq": {"value": "...", "change": "...", "change_pct": "...", "comment": "..."},
    "sox": {"value": "...", "change": "...", "change_pct": "...", "comment": "..."}
  },
  "stocks": [
    {
      "name": "...",
      "code": "...",
      "market": "...",
      "price": "...",
      "change": "...",
      "change_pct": "...",
      "rating": "...",
      "analysis": "...",
      "catalysts": ["...", "..."],
      "risks": ["...", "..."]
    }
  ],
  "weekly_outlook": "...",
  "schedule": [
    {"date": "...", "event": "...", "importance": "★★★★★"}
  ],
  "risk_factors": ["...", "..."]
}

必ずJSONのみを出力してください。マークダウンのコードブロックは不要です。
`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

// ── HTML テンプレート生成 ─────────────────────────────────────
function buildHtml(data) {
  const siteUrl = "ai-jidoka-keigo.com";

  const marketRows = Object.entries({
    "日経平均": data.market_indices.nikkei,
    "NYダウ": data.market_indices.dow,
    "ナスダック": data.market_indices.nasdaq,
    "SOX指数": data.market_indices.sox,
  })
    .map(
      ([label, d]) => `
      <tr>
        <td class="label">${label}</td>
        <td class="num">${d.value}</td>
        <td class="num">${d.change}</td>
        <td class="num">${d.change_pct}</td>
        <td>${d.comment}</td>
      </tr>`
    )
    .join("");

  const stockSummaryRows = data.stocks
    .map(
      (s) => `
      <tr>
        <td class="label">${s.name}（${s.code}）</td>
        <td class="num">${s.price}</td>
        <td class="num">${s.change}</td>
        <td class="num">${s.change_pct}</td>
        <td class="center">${s.rating}</td>
      </tr>`
    )
    .join("");

  const stockDetails = data.stocks
    .map(
      (s) => `
      <div class="stock-block">
        <h3 class="stock-name">◆ ${s.name}（${s.code}・${s.market}）</h3>
        <p>${s.analysis}</p>
        <p class="sub-title blue">【カタリスト】</p>
        <ul>${s.catalysts.map((c) => `<li>${c}</li>`).join("")}</ul>
        <p class="sub-title red">【リスク】</p>
        <ul>${s.risks.map((r) => `<li>${r}</li>`).join("")}</ul>
      </div>`
    )
    .join("");

  const scheduleRows = data.schedule
    .map(
      (s) => `
      <tr>
        <td class="label">${s.date}</td>
        <td>${s.event}</td>
        <td class="center">${s.importance}</td>
      </tr>`
    )
    .join("");

  const riskItems = data.risk_factors
    .map((r) => `<li>${r}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Helvetica Neue", Arial, "Hiragino Sans", "Meiryo", sans-serif;
    font-size: 11px;
    color: #1A1A1A;
    background: #fff;
    padding: 0;
  }

  /* ── カバーヘッダー ── */
  .cover {
    background: #0D1B2A;
    border-bottom: 4px solid #C9A84C;
    padding: 28px 36px 24px;
    margin-bottom: 20px;
  }
  .cover .sub { color: #F5E6C8; font-size: 10px; letter-spacing: 1px; margin-bottom: 6px; }
  .cover h1 { color: #FFFFFF; font-size: 22px; margin-bottom: 6px; }
  .cover .date { color: #C9A84C; font-size: 12px; }

  /* ── メタ情報 ── */
  .meta-table { width: 100%; border-collapse: collapse; margin: 0 36px 20px; width: calc(100% - 72px); }
  .meta-table td { padding: 6px 10px; border: 1px solid #DDD; font-size: 10px; }
  .meta-table .key { background: #F5E6C8; font-weight: bold; width: 100px; }

  /* ── コンテンツ本体 ── */
  .body { padding: 0 36px; }

  /* ── セクションバー ── */
  .section-bar {
    background: #1B3A5C;
    color: #FFFFFF;
    font-weight: bold;
    font-size: 12px;
    padding: 7px 14px;
    margin: 20px 0 10px;
    border-bottom: 3px solid #C9A84C;
  }

  /* ── 汎用テーブル ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  th {
    background: #1B3A5C;
    color: #FFF;
    padding: 6px 8px;
    font-size: 10px;
    text-align: center;
  }
  td { padding: 5px 8px; border: 1px solid #DDD; font-size: 10px; vertical-align: middle; }
  tr:nth-child(even) td { background: #F7F9FC; }
  .label { font-weight: bold; }
  .num { text-align: right; white-space: nowrap; }
  .center { text-align: center; }

  /* ── スケジュールテーブルヘッダー ── */
  .schedule th { background: #C9A84C; color: #1A1A1A; }

  /* ── 個別銘柄 ── */
  .stock-block { margin-bottom: 16px; }
  .stock-name {
    font-size: 12px;
    color: #0D1B2A;
    border-bottom: 2px solid #C9A84C;
    padding-bottom: 4px;
    margin-bottom: 6px;
  }
  .stock-block p { margin-bottom: 5px; line-height: 1.6; }
  .stock-block ul { padding-left: 18px; margin-bottom: 5px; }
  .stock-block li { margin-bottom: 2px; line-height: 1.6; }
  .sub-title { font-weight: bold; margin-top: 6px; }
  .blue { color: #1B3A5C; }
  .red { color: #B22222; }

  /* ── 免責 ── */
  .disclaimer {
    border-top: 1px solid #CCC;
    margin-top: 20px;
    padding-top: 10px;
    font-size: 9px;
    color: #888;
    line-height: 1.7;
  }

  /* ── フッター ── */
  .footer {
    font-size: 9px;
    color: #AAA;
    text-align: right;
    margin-top: 6px;
    margin-bottom: 8px;
  }
</style>
</head>
<body>

<!-- カバー -->
<div class="cover">
  <p class="sub">MARKET DAILY REPORT — ${siteUrl}</p>
  <h1>マーケット デイリー レポート</h1>
  <p class="date">${data.report_date}　発行</p>
</div>

<table class="meta-table">
  <tr>
    <td class="key">レポート種別</td><td>株式市場概況レポート（参考情報）</td>
    <td class="key">作成日</td><td>${data.report_date}</td>
  </tr>
  <tr>
    <td class="key">対象市場</td><td>東京証券取引所・NYSE・NASDAQ</td>
    <td class="key">作成者</td><td>Claude AI / ${siteUrl}</td>
  </tr>
</table>

<div class="body">

  <!-- 1. エグゼクティブサマリー -->
  <div class="section-bar">1. エグゼクティブ・サマリー</div>
  <p style="line-height:1.8; margin-bottom:14px;">${data.executive_summary}</p>

  <!-- 2. 主要市場指数 -->
  <div class="section-bar">2. 主要市場指数</div>
  <table>
    <tr>
      <th>指標</th><th>直近値</th><th>前日比</th><th>前日比(%)</th><th>評価</th>
    </tr>
    ${marketRows}
  </table>

  <!-- 3. 注目銘柄サマリー -->
  <div class="section-bar">3. 注目銘柄サマリー</div>
  <table>
    <tr>
      <th>銘柄</th><th>終値</th><th>前日比</th><th>騰落率</th><th>評価</th>
    </tr>
    ${stockSummaryRows}
  </table>

  <!-- 4. 個別銘柄詳細分析 -->
  <div class="section-bar">4. 個別銘柄 詳細分析</div>
  ${stockDetails}

  <!-- 5. 共通リスク要因 -->
  <div class="section-bar">5. 共通リスク要因</div>
  <ul style="padding-left:18px; margin-bottom:14px; line-height:1.8;">
    ${riskItems}
  </ul>

  <!-- 6. 来週の見通し -->
  <div class="section-bar">6. 来週の見通し・注目スケジュール</div>
  <p style="line-height:1.8; margin-bottom:10px;">${data.weekly_outlook}</p>
  <table class="schedule">
    <tr><th>日付</th><th>イベント</th><th>注目度</th></tr>
    ${scheduleRows}
  </table>

  <!-- 免責事項 -->
  <div class="disclaimer">
    ■ 免責事項：本レポートはすべて情報提供のみを目的とした参考資料であり、特定の有価証券の売買を推奨・勧誘するものではありません。記載された情報は作成時点のものであり、その後の変更を反映しない場合があります。株式投資はリスクを伴い、投資元本が保証されるものではありません。投資判断はご自身の責任において行ってください。本レポートは金融商品取引法に基づく投資助言ではありません。
  </div>
  <div class="footer">Generated by Claude AI / ${siteUrl}</div>

</div>
</body>
</html>`;
}

// ── メイン処理 ────────────────────────────────────────────────
async function main() {
  console.log("📊 レポート生成開始...");

  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log("🤖 Claude API にてレポート内容を生成中...");
  const data = await generateReportContent();
  console.log(`✅ コンテンツ生成完了: ${data.report_date}`);

  const html = buildHtml(data);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const pdfPath = path.join(outputDir, `マーケットレポート_${dateStr}.pdf`);

  console.log("🖨️  PDF を生成中...");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
  });
  await browser.close();

  console.log(`✅ PDF 生成完了: ${pdfPath}`);

  // 後続スクリプト用にパスを保存
  fs.writeFileSync(
    path.join(__dirname, "report_meta.env"),
    `REPORT_DATE=${dateStr}\nREPORT_FILE=${pdfPath}\n`
  );
}

main().catch((err) => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
