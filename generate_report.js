/**
 * generate_report.js
 * Claude API でレポート内容を生成し、Word（.docx）ファイルに書き出す
 * jibun-os-hub/reports/ に配置して使用する
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  WidthType,
  PageOrientation,
  convertInchesToTwip,
} from "docx";
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

// ── ヘルパー：カラーテーブルセル ─────────────────────────────
function colorCell(text, bgColor, textColor = "FFFFFF", bold = false) {
  return new TableCell({
    shading: { type: ShadingType.CLEAR, fill: bgColor },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            color: textColor,
            bold,
            font: "Arial",
            size: 18,
          }),
        ],
      }),
    ],
  });
}

function dataCell(text, align = AlignmentType.LEFT, bold = false) {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({ text, bold, font: "Arial", size: 18 }),
        ],
      }),
    ],
  });
}

// ── 市場指数テーブル ─────────────────────────────────────────
function buildMarketTable(indices) {
  const rows = [
    new TableRow({
      children: [
        colorCell("指標", "1B3A5C", "FFFFFF", true),
        colorCell("直近値", "1B3A5C", "FFFFFF", true),
        colorCell("前日比", "1B3A5C", "FFFFFF", true),
        colorCell("前日比(%)", "1B3A5C", "FFFFFF", true),
        colorCell("評価", "1B3A5C", "FFFFFF", true),
      ],
    }),
    ...Object.entries({
      "日経平均": indices.nikkei,
      "NYダウ": indices.dow,
      "ナスダック": indices.nasdaq,
      "SOX指数": indices.sox,
    }).map(([label, data]) =>
      new TableRow({
        children: [
          dataCell(label, AlignmentType.LEFT, true),
          dataCell(data.value, AlignmentType.RIGHT),
          dataCell(data.change, AlignmentType.RIGHT),
          dataCell(data.change_pct, AlignmentType.RIGHT),
          dataCell(data.comment, AlignmentType.LEFT),
        ],
      })
    ),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

// ── 個別銘柄テーブル ─────────────────────────────────────────
function buildStockTable(stocks) {
  const headerRow = new TableRow({
    children: [
      colorCell("銘柄", "0D1B2A", "FFFFFF", true),
      colorCell("終値", "0D1B2A", "FFFFFF", true),
      colorCell("前日比", "0D1B2A", "FFFFFF", true),
      colorCell("騰落率", "0D1B2A", "FFFFFF", true),
      colorCell("評価", "0D1B2A", "FFFFFF", true),
    ],
  });

  const dataRows = stocks.map((s) =>
    new TableRow({
      children: [
        dataCell(`${s.name}（${s.code}）`, AlignmentType.LEFT, true),
        dataCell(s.price, AlignmentType.RIGHT),
        dataCell(s.change, AlignmentType.RIGHT),
        dataCell(s.change_pct, AlignmentType.RIGHT),
        dataCell(s.rating, AlignmentType.CENTER),
      ],
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

// ── スケジュールテーブル ──────────────────────────────────────
function buildScheduleTable(schedule) {
  const headerRow = new TableRow({
    children: [
      colorCell("日付", "C9A84C", "1A1A1A", true),
      colorCell("イベント", "C9A84C", "1A1A1A", true),
      colorCell("注目度", "C9A84C", "1A1A1A", true),
    ],
  });

  const dataRows = schedule.map((s) =>
    new TableRow({
      children: [
        dataCell(s.date, AlignmentType.LEFT, true),
        dataCell(s.event),
        dataCell(s.importance, AlignmentType.CENTER),
      ],
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

// ── Wordドキュメント組み立て ─────────────────────────────────
function buildDocument(data) {
  const siteUrl = "ai-jidoka-keigo.com";

  const children = [
    // ── ヘッダータイトルブロック ──
    new Paragraph({
      children: [
        new TextRun({
          text: `マーケット デイリー レポート`,
          bold: true,
          size: 36,
          color: "0D1B2A",
          font: "Arial",
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${data.report_date}　　${siteUrl}`,
          size: 20,
          color: "888888",
          font: "Arial",
        }),
      ],
      spacing: { after: 200 },
    }),

    // メタ情報テーブル
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            colorCell("レポート種別", "F5E6C8", "1A1A1A", true),
            dataCell("株式市場概況レポート（参考情報）"),
            colorCell("作成日", "F5E6C8", "1A1A1A", true),
            dataCell(data.report_date),
          ],
        }),
        new TableRow({
          children: [
            colorCell("対象市場", "F5E6C8", "1A1A1A", true),
            dataCell("東京証券取引所・NYSE・NASDAQ"),
            colorCell("作成者", "F5E6C8", "1A1A1A", true),
            dataCell(`Claude AI / ${siteUrl}`),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { after: 200 } }),

    // ── 1. エグゼクティブサマリー ──
    new Paragraph({
      text: "1. エグゼクティブ・サマリー",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: data.executive_summary, font: "Arial", size: 20 })],
      spacing: { after: 200 },
    }),

    // ── 2. 主要市場指数 ──
    new Paragraph({
      text: "2. 主要市場指数",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    }),
    buildMarketTable(data.market_indices),

    new Paragraph({ text: "", spacing: { after: 200 } }),

    // ── 3. 注目銘柄サマリー ──
    new Paragraph({
      text: "3. 注目銘柄サマリー",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    }),
    buildStockTable(data.stocks),

    new Paragraph({ text: "", spacing: { after: 200 } }),

    // ── 4. 個別銘柄詳細分析 ──
    new Paragraph({
      text: "4. 個別銘柄 詳細分析",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    }),

    ...data.stocks.flatMap((s) => [
      new Paragraph({
        text: `◆ ${s.name}（${s.code}・${s.market}）`,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: s.analysis, font: "Arial", size: 20 })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "【カタリスト】", bold: true, font: "Arial", size: 20, color: "1B3A5C" })],
      }),
      ...s.catalysts.map(
        (c) =>
          new Paragraph({
            children: [new TextRun({ text: `・${c}`, font: "Arial", size: 20 })],
            indent: { left: convertInchesToTwip(0.3) },
          })
      ),
      new Paragraph({
        children: [new TextRun({ text: "【リスク】", bold: true, font: "Arial", size: 20, color: "B22222" })],
        spacing: { before: 80 },
      }),
      ...s.risks.map(
        (r) =>
          new Paragraph({
            children: [new TextRun({ text: `・${r}`, font: "Arial", size: 20 })],
            indent: { left: convertInchesToTwip(0.3) },
          })
      ),
      new Paragraph({ text: "", spacing: { after: 150 } }),
    ]),

    // ── 5. リスク要因 ──
    new Paragraph({
      text: "5. 共通リスク要因",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    }),
    ...data.risk_factors.map(
      (r) =>
        new Paragraph({
          children: [new TextRun({ text: `● ${r}`, font: "Arial", size: 20 })],
          spacing: { after: 80 },
          indent: { left: convertInchesToTwip(0.2) },
        })
    ),

    new Paragraph({ text: "", spacing: { after: 200 } }),

    // ── 6. 来週の見通し ──
    new Paragraph({
      text: "6. 来週の見通し・注目スケジュール",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: data.weekly_outlook, font: "Arial", size: 20 })],
      spacing: { after: 200 },
    }),
    buildScheduleTable(data.schedule),

    new Paragraph({ text: "", spacing: { after: 300 } }),

    // ── 免責事項 ──
    new Paragraph({
      children: [
        new TextRun({
          text: "■ 免責事項：本レポートはすべて情報提供のみを目的とした参考資料であり、特定の有価証券の売買を推奨・勧誘するものではありません。記載された情報は作成時点のものであり、その後の変更を反映しない場合があります。株式投資はリスクを伴い、投資元本が保証されるものではありません。投資判断はご自身の責任において行ってください。本レポートは金融商品取引法に基づく投資助言ではありません。",
          font: "Arial",
          size: 16,
          color: "888888",
          italics: true,
        }),
      ],
      spacing: { before: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated by Claude AI / ${siteUrl}`,
          font: "Arial",
          size: 16,
          color: "888888",
        }),
      ],
    }),
  ];

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.9),
              right: convertInchesToTwip(0.9),
              bottom: convertInchesToTwip(0.9),
              left: convertInchesToTwip(0.9),
            },
          },
        },
        children,
      },
    ],
  });
}

// ── メイン処理 ────────────────────────────────────────────────
async function main() {
  console.log("📊 レポート生成開始...");

  // output ディレクトリ作成
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Claude API でコンテンツ生成
  console.log("🤖 Claude API にてレポート内容を生成中...");
  const data = await generateReportContent();
  console.log(`✅ コンテンツ生成完了: ${data.report_date}`);

  // ドキュメント組み立て
  const doc = buildDocument(data);

  // ファイル名（日付付き）
  const dateStr = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const filename = `マーケットレポート_${dateStr}.docx`;
  const filepath = path.join(outputDir, filename);

  // 書き出し
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filepath, buffer);

  console.log(`✅ Wordファイル生成完了: ${filepath}`);
}

main().catch((err) => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
