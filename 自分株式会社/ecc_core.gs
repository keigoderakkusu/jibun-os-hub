/**
 * 自分株式会社 × ECC (everything-claude-code) for GAS
 * Version: 1.0 (Harness Edition)
 * Role: CEO's Agent Harness
 */

const ECC_CONFIG = {
  VERSION: '1.0.0',
  DEFAULT_MODEL: 'gemini-1.5-flash', // コスト最適化のためFlashを使用
  SKILLS: ['market-research', 'article-writing', 'code-reviewer', 'content-engine'],
  NOTIFY_TARGET: 'TELEGRAM'
};

/**
 * メイン実行関数（トリガー等から呼び出し）
 */
function main() {
  console.log('🤖 ECC Harness starting...');
  
  // 1. ハーネス監査（API疎通確認）
  if (!harnessAudit()) {
    notifyUser('⚠️ ECC Audit Failed: Check your API settings.');
    return;
  }

  // 2. 記憶のロード（前回の未完了タスク等）
  const memory = loadMemory();
  console.log('🧠 Memory loaded:', memory);

  // 3. ループ開始
  runWorkflow('daily-report');
}

/**
 * ワークフロー実行
 */
function runWorkflow(workflowId) {
  switch(workflowId) {
    case 'daily-report':
      executeMarketResearch();
      break;
    case 'content-production':
      executeContentEngine();
      break;
    case 'code-audit':
      executeCodeReview();
      break;
  }
}

/**
 * スキル: Market Research
 */
function executeMarketResearch() {
  const prompt = `
    あなたは自分株式会社のシニア・マーケットアナリストです。
    以下の情報をリサーチし、投資判断とビジネスチャンスを1000文字程度で報告してください。
    
    1. AI・DXの最新トレンド（DeepSeek, OpenAI, Anthropic関連）
    2. 副業市場での需要増ジャンル
    3. 本日の特筆すべき経済ニュース
    
    フォーマット: 【要約】→【チャンスの詳細】→【CEOへのアクション提案】
  `;
  
  const report = generateWithAI(prompt);
  notifyUser('📈 【Market Research Report】\n\n' + report);
  saveToMemory('last_research', { timestamp: new Date(), summary: report.substring(0, 100) });
}

/**
 * スキル: Code Reviewer
 */
function executeCodeReview(codeSnippet) {
  const prompt = `
    あなたは世界最高峰のセキュリティエンジニア兼GASエキスパートです。
    以下のコードをレビューし、バグ、セキュリティリスク、最適化案を指摘してください。
    
    【コード】
    ${codeSnippet}
  `;
  
  const review = generateWithAI(prompt);
  notifyUser('🛡️ 【Code Review Results】\n\n' + review);
}

/**
 * ユーザーへの通知（Telegram連携）
 */
function notifyUser(message) {
  try {
    sendTelegramMessage(message);
    console.log('✉️ Notification sent.');
  } catch (e) {
    console.error('❌ Notification failed:', e);
  }
}
