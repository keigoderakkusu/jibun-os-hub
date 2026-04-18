// ============================================================
//  自分株式会社 ブログ自動化ハブ  server.js  v2.0 (最終デバッグ済)
//  機能: ジョブキュー / 承認フロー / スケジューラー / テンプレDB
//  npm install express body-parser node-fetch dotenv node-cron
// ============================================================

require("dotenv").config();
const express    = require("express");
const bodyParser = require("body-parser");
const cron       = require("node-cron");
const fetch      = (...a) => import("node-fetch").then(({ default: f }) => f(...a));

const app = express();
app.use(bodyParser.json());

const {
  GEMINI_API_KEY: GEMINI_KEY,
  TELEGRAM_BOT_TOKEN: TG_TOKEN,
  TELEGRAM_ALLOWED_USER_ID,
  WP_SITE_URL: WP_URL,
  WP_USERNAME: WP_USER,
  WP_APP_PASSWORD: WP_PASS,
  PORT = 3000,
  JQUANTS_API_KEY,
  ANTHROPIC_API_KEY,
  PERPLEXITY_API_KEY,
} = process.env;
const ALLOWED_ID = Number(TELEGRAM_ALLOWED_USER_ID);

// ──────────────────────────────────────────────
//  インメモリストア
// ──────────────────────────────────────────────

const jobs   = new Map();
let jobSeq   = 1;

const templates = new Map([
  ["default", { name:"default", persona:"プロのWEBライター兼マーケター",   tone:"丁寧でわかりやすい",    wordCount:"1500〜2000" }],
  ["tech",    { name:"tech",    persona:"IT専門のテクニカルライター",        tone:"論理的で専門的",        wordCount:"1500〜2000" }],
  ["finance", { name:"finance", persona:"投資・資産運用の専門家",            tone:"信頼感のある客観的口調", wordCount:"1500〜2000" }],
  ["travel",  { name:"travel",  persona:"国内旅行・観光ライター",            tone:"親しみやすい旅行者目線", wordCount:"1200〜1800" }],
]);

// ──────────────────────────────────────────────
//  プロンプトビルダー
// ──────────────────────────────────────────────
function buildPrompt(keyword, tmplName = "default") {
  const t = templates.get(tmplName) || templates.get("default");
  return `あなたは${t.persona}です。
以下の【キーワード】をテーマに、読者の悩みを解決する魅力的で高品質なブログ記事を作成してください。

【キーワード】: ${keyword}

【執筆のルール】
1. 出力形式: 1行目に「タイトル」、2行目から「HTML形式の本文」を出力してください（Markdownは使用しないでください）。
2. 構成: 「導入」→「見出し（<h2>）2〜3つ」→「まとめ」の構成にすること。
3. HTMLタグ: 見出しは <h2> と <h3> を使い、本文は <p> で囲んでください。重要な箇所は <strong> で強調してください。
4. トーン: ${t.tone}で書くこと。
5. 文字数: ${t.wordCount}文字程度。

それでは、上記のルールに従って出力をお願いします。`;
}

// ──────────────────────────────────────────────
//  Gemini 記事生成 (安定版：モデル自動フォールバック)
// ──────────────────────────────────────────────
async function generateArticle(keyword, tmplName = "default") {
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
  let lastError = null;

  for (const modelName of models) {
    try {
      // v1 正式版エンドポイントを使用
      const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${GEMINI_KEY}`;
      const prompt = buildPrompt(keyword, tmplName);
      
      console.log(`\n--- Gemini 生成試行: [${modelName}] ---`);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      
      const data = await res.json();
      
      if (data.error) {
        console.warn(`⚠️ モデル ${modelName} 失敗: ${data.error.message}`);
        lastError = data.error.message;
        continue;
      }
      
      let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!raw) continue;

      // 解析
      raw = raw.replace(/```(html)?/g, "").replace(/```/g, "").trim();
      const lines = raw.split("\n");
      const title = lines[0].replace(/^#+\s*/, "").replace(/タイトル[:：]\s*/, "").trim();
      const content = lines.slice(1).join("\n").trim();

      if (title && content) {
        console.log(`✅ 生成成功！モデル: ${modelName}`);
        return { title, content };
      }
    } catch (e) {
      console.error(`❌ モデル ${modelName} 実行エラー:`, e.message);
      lastError = e.message;
    }
  }
  throw new Error(`全モデルで失敗しました (理由: ${lastError})`);
}

// ──────────────────────────────────────────────
//  WordPress 投稿
// ──────────────────────────────────────────────
async function postToWordPress(title, content, status = "draft") {
  console.log(`\n--- WP投稿開始 --- [タイトル: ${title}] [ステータス: ${status}]`);
  const res = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64"),
    },
    body: JSON.stringify({ title, content, status }),
  });
  
  const data = await res.json();
  if (res.status !== 201) {
    console.error("❌ WP投稿エラー:", res.status, data.message || "不明なエラー");
    throw new Error(`WordPressエラー (${res.status}): ${data.message || "不明なエラー"}`);
  }
  
  console.log(`✅ WP投稿成功！ ID: ${data.id}, Link: ${data.link}`);
  return data;
}

// ──────────────────────────────────────────────
//  ジョブ作成 & 非同期生成 & Telegram通知
// ──────────────────────────────────────────────
async function createJobAndNotify(keyword, tmplName, chatId, scheduledAt = null) {
  const id  = `job_${jobSeq++}`;
  const job = {
    id, keyword, template: tmplName,
    status: scheduledAt ? "scheduled" : "pending",
    title: null, content: null,
    createdAt: new Date().toISOString(),
    scheduledAt, chatId,
  };
  jobs.set(id, job);

  generateArticle(keyword, tmplName).then(async ({ title, content }) => {
    job.title   = title;
    job.content = content;
    
    if (scheduledAt) {
      await tgSend(chatId, `📅 スケジュール登録完了！ ID: \`${id}\` \n📄 ${title} (⏰ ${scheduledAt})`);
      return;
    }

    const previewSnippet = (content || "").replace(/<[^>]+>/g, "").slice(0, 300);
    await tgSend(chatId,
      `✅ *記事を生成しました！*\n\n` +
      `🆔 ID: \`${id}\`\n` +
      `📄 タイトル: *${title}*\n\n` +
      `📖 *プレビュー:* \n${previewSnippet}...\n\n` +
      `👇 *操作:*\n` +
      `▶ 公開: /approve ${id}\n` +
      `▶ *プレビューURL作成*: /draft ${id}\n` +
      `▶ 全文確認: /preview ${id}\n` +
      `▶ 破棄: /reject ${id}`
    );
  }).catch(async (e) => {
    job.status = "error";
    await tgSend(chatId, `❌ 生成エラー [${id}]: ${e.message}`);
  });

  return id;
}

// ──────────────────────────────────────────────
//  市場データ取得 (J-Quants / RSS)
// ──────────────────────────────────────────────
async function getJQuantsSummary() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  console.log(`\n--- J-Quants 決算サマリー取得中 (${dateStr}) ---`);
  try {
    const res = await fetch(`https://api.jquants.com/v2/fins/summary?date=${dateStr}`, {
      headers: { "x-api-key": JQUANTS_API_KEY }
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("❌ J-Quants取得失敗:", e.message);
    return null;
  }
}

async function getMarketNews() {
  console.log(`\n--- マーケットニュース取得中 ---`);
  try {
    const res = await fetch("https://finance.yahoo.com/rss/headline?s=^DJI");
    const text = await res.text();
    // 簡易パース（正規表現でタイトルを抽出）
    const titles = [...text.matchAll(/<title>(.*?)<\/title>/g)].slice(1, 10).map(m => m[1]);
    return titles.join("\n");
  } catch (e) {
    console.error("❌ ニュース取得失敗:", e.message);
    return "ニュース取得に失敗しました。";
  }
}

// ──────────────────────────────────────────────
//  市場レポート自動生成
// ──────────────────────────────────────────────
async function generateAndNotifyMarketReport(type = "morning") {
  const chatId = ALLOWED_ID;
  const isMorning = type === "morning";
  
  if (isMorning) {
    await tgSend(chatId, "⏳ 朝刊マーケットレポートを作成中...");
    const news = await getMarketNews();
    const prompt = `あなたはプロの金融アナリストです。以下の最新ニュースを基に、朝のブログレポート（NYダウ、為替、相場観）を300文字程度で簡潔にまとめてください。HTML形式(pタグ)のみで出力し、余計な解説は省くこと。\n\nニュース:\n${news}`;
    const { title, content } = await generateArticleFromCustomPrompt(`【朝刊】米国市場と為替の動向まとめ (${new Date().toLocaleDateString()})`, prompt);
    const id = `report_am_${Date.now()}`;
    await sendReportToTelegram(id, title, content, chatId);
  } else {
    await tgSend(chatId, "⏳ 夕刊マーケットレポートを作成中...");
    const summary = await getJQuantsSummary();
    const prompt = `あなたはプロの個人投資家向けライターです。本日の決算サマリーデータを基に、注目銘柄や市場の雰囲気を800文字程度で分かりやすく解説してください。HTML形式(h2, p, strongタグ)で出力すること。\n\nデータ:\n${JSON.stringify(summary)}`;
    const { title, content } = await generateArticleFromCustomPrompt(`【夕刊】本日の日本市場まとめと注目決算 (${new Date().toLocaleDateString()})`, prompt);
    const id = `report_pm_${Date.now()}`;
    await sendReportToTelegram(id, title, content, chatId);
  }
}

async function generateArticleFromCustomPrompt(title, prompt) {
  const models = ["gemini-1.5-flash", "gemini-1.5-pro"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const content = raw.replace(/```(html)?/g, "").replace(/```/g, "").trim();
      if (content) return { title, content };
    } catch (e) { console.error(`Gemini Error (${model}):`, e.message); }
  }
  return { title, content: "生成に失敗しました。" };
}

async function sendReportToTelegram(id, title, content, chatId) {
  const job = { id, keyword: "Market Report", template: "auto", status: "pending", title, content, createdAt: new Date().toISOString(), chatId };
  jobs.set(id, job);
  const previewSnippet = content.replace(/<[^>]+>/g, "").slice(0, 300);
  await tgSend(chatId, `📊 *${title}*\n\n📖 *プレビュー:* \n${previewSnippet}...\n\n▶ 公開: /approve ${id}\n▶ 下書き: /draft ${id}`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  REST API & Webhook
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get("/health", (req, res) => res.json({ ok: true, jobs: jobs.size }));

app.post("/generate", async (req, res) => {
  const { keyword, template = "default", chatId = ALLOWED_ID, autoPublish = false } = req.body;
  if (!keyword) return res.status(400).json({ error: "keywordが必要" });
  try {
    if (autoPublish) {
      const { title, content } = await generateArticle(keyword, template);
      const wp = await postToWordPress(title, content, "publish");
      return res.json({ ok: true, link: wp.link });
    }
    const id = await createJobAndNotify(keyword, template, Number(chatId));
    res.json({ ok: true, jobId: id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/schedule", async (req, res) => {
  const { keyword, template = "default", scheduledAt, chatId = ALLOWED_ID } = req.body;
  const id = await createJobAndNotify(keyword, template, Number(chatId), scheduledAt);
  res.json({ ok: true, jobId: id });
});

app.get("/jobs", (req, res) => res.json([...jobs.values()].reverse()));

// 外部レポート用（互換性のため維持）
app.post("/webhook/report", async (req, res) => {
  const { title, content, chatId = ALLOWED_ID } = req.body;
  await sendReportToTelegram(`ext_${Date.now()}`, title, content, Number(chatId));
  res.json({ ok: true });
});

app.post("/jobs/:id/approve", async (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).send("Not found");
  const wp = await postToWordPress(job.title, job.content, "publish");
  job.status = "published";
  res.json({ ok: true, link: wp.link });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Telegram Webhook
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.post("/telegram/webhook", async (req, res) => {
  res.sendStatus(200);
  const msg = req.body?.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const text   = msg.text.trim();
  const userId = msg.from.id;

  if (userId !== ALLOWED_ID) { await tgSend(chatId, "⛔ アクセス拒否"); return; }

  // コマンド解析
  if (text.startsWith("/write ")) {
    const kw = text.replace("/write ", "").trim();
    await tgSend(chatId, `⏳ 「${kw}」を生成中...`);
    await createJobAndNotify(kw, "default", chatId);
    return;
  }

  // 特別コマンド: 市場レポート手動実行
  if (text === "/report_am") { await generateAndNotifyMarketReport("morning"); return; }
  if (text === "/report_pm") { await generateAndNotifyMarketReport("evening"); return; }

  if (text.startsWith("/preview ")) {
    const job = jobs.get(text.replace("/preview ", "").trim());
    if (!job) { await tgSend(chatId, "❌ 見つかりません"); return; }
    const snippet = (job.content || "").replace(/<[^>]+>/g, "").slice(0, 3500);
    await tgSend(chatId, `📄 *${job.title}*\n\n${snippet}\n\n---\n▶ /approve ${job.id} | /draft ${job.id}`);
    return;
  }

  if (text.startsWith("/approve ")) {
    const job = jobs.get(text.replace("/approve ", "").trim());
    if (!job?.title) { await tgSend(chatId, "❌ 準備ができていません"); return; }
    const wp = await postToWordPress(job.title, job.content, "publish");
    job.status = "published";
    await tgSend(chatId, `🚀 公開完了！\n🔗 ${wp.link}`);
    return;
  }

  if (text.startsWith("/draft ")) {
    const job = jobs.get(text.replace("/draft ", "").trim());
    if (!job?.title) { await tgSend(chatId, "❌ 準備ができていません"); return; }
    const wp = await postToWordPress(job.title, job.content, "draft");
    job.status = "approved";
    const editUrl = `${WP_URL}/wp-admin/post.php?post=${wp.id}&action=edit`;
    const previewUrl = `${WP_URL}/?p=${wp.id}&preview=true`;
    await tgSend(chatId, `📝 下書き保存完了！ (WP ID: ${wp.id})\n\n🔎 [プレビューを見る](${previewUrl})\n✏️ [WP編集画面へ](${editUrl})\n\nOKならWP上で公開するか /approve ${job.id} を送ってください。`);
    return;
  }

  if (text === "/jobs") {
    const list = [...jobs.values()].slice(-5).reverse().map(j => `• \`${j.id}\` [${j.status}] ${j.title || j.keyword}`).join("\n");
    await tgSend(chatId, list || "現在ジョブはありません");
    return;
  }

  if (text === "/start" || text === "/help") {
    await tgSend(chatId, "📝 *コマンド一覧*\n/write キーワード\n/report_am → 朝刊手動実行\n/report_pm → 夕刊手動実行\n/jobs → 最近のジョブ\n/help → これを表示");
    return;
  }
});

async function tgSend(chatId, text) {
  return fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  }).catch(console.error);
}

// ──────────────────────────────────────────────
//  スケジューラー (市場レポート自動実行)
// ──────────────────────────────────────────────

// 平日 07:05 (朝刊)
cron.schedule("5 7 * * 1-5", () => generateAndNotifyMarketReport("morning"));

// 平日 18:05 (夕刊)
cron.schedule("5 18 * * 1-5", () => generateAndNotifyMarketReport("evening"));

// 既存のWordPressスケジュール投稿チェック
cron.schedule("* * * * *", async () => {
  const now = new Date();
  for (const job of jobs.values()) {
    if (job.status === "scheduled" && job.scheduledAt && new Date(job.scheduledAt) <= now && job.title) {
      try {
        const wp = await postToWordPress(job.title, job.content, "publish");
        job.status = "published";
        await tgSend(job.chatId, `🚀 スケジュール記事を公開しました！\n📄 ${job.title}\n🔗 ${wp.link}`);
      } catch (e) { console.error("Scheduler error:", e); }
    }
  }
});

// 起動
app.listen(PORT, () => {
  console.log(`\n**************************************************`);
  console.log(`🚀 【超・完全版】ブログ自動化ハブ v2.1 起動`);
  console.log(`   - n8n不要・市場レポート内蔵モデル -`);
  console.log(`  - ポート: ${PORT}`);
  console.log(`**************************************************\n`);
});
