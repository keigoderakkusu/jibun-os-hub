// ============================================================
// Code.gs — 営業ナレッジベース Pro v2.0
// スクリプトプロパティ: GEMINI_API_KEY（必須）
// ============================================================

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('📋 営業ナレッジ Pro')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─────────────────────────────────────────────
// CORE HELPERS
// ─────────────────────────────────────────────

function _ss() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  const ss = SpreadsheetApp.create('営業ナレッジDB');
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}

function _sheet(name, headers) {
  const ss = _ss();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold')
      .setBackground('#1a73e8')
      .setFontColor('white');
    sh.setFrozenRows(1);
  }
  return sh;
}

function _callGemini(prompt, jsonMode) {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) return { error: 'スクリプトプロパティに GEMINI_API_KEY を設定してください' };
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {})
    }
  };
  try {
    const res = UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key,
      { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true }
    );
    const json = JSON.parse(res.getContentText());
    if (json.error) return { error: json.error.message };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (jsonMode) {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try { return { ok: true, data: JSON.parse(cleaned) }; }
      catch (e) { return { error: 'AI応答のパース失敗。再試行してください。' }; }
    }
    return { ok: true, text };
  } catch (e) {
    return { error: e.message };
  }
}

function _fmt(d) {
  if (!d) return '';
  try { return Utilities.formatDate(new Date(d), 'Asia/Tokyo', 'MM/dd HH:mm'); } catch (e) { return ''; }
}
function _fmtDate(d) {
  if (!d) return '';
  try { return Utilities.formatDate(new Date(d), 'Asia/Tokyo', 'yyyy/MM/dd'); } catch (e) { return ''; }
}
function _uuid() { return Utilities.getUuid().split('-')[0]; }

function getDbUrl() { return _ss().getUrl(); }

// ─────────────────────────────────────────────
// MEMO
// ─────────────────────────────────────────────

function getMemos(query) {
  const sh = _sheet('memos', ['id', 'title', 'content', 'tags', 'created', 'updated']);
  const rows = sh.getDataRange().getValues().slice(1)
    .filter(r => r[0])
    .map(r => ({ id: r[0], title: r[1], content: r[2], tags: r[3], created: _fmt(r[4]), updated: _fmt(r[5]) }))
    .reverse();
  if (!query) return rows;
  const q = String(query).toLowerCase();
  return rows.filter(r => (r.title + r.content + r.tags).toLowerCase().includes(q));
}

function saveMemo(memo) {
  const sh = _sheet('memos', ['id', 'title', 'content', 'tags', 'created', 'updated']);
  const now = new Date();
  if (memo.id) {
    const all = sh.getDataRange().getValues();
    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(memo.id)) {
        sh.getRange(i + 1, 2, 1, 5).setValues([[memo.title || '無題', memo.content || '', memo.tags || '', all[i][4], now]]);
        return { ok: true, id: memo.id };
      }
    }
  }
  const id = _uuid();
  sh.appendRow([id, memo.title || '無題', memo.content || '', memo.tags || '', now, now]);
  return { ok: true, id };
}

function deleteMemo(id) {
  const sh = _sheet('memos', ['id', 'title', 'content', 'tags', 'created', 'updated']);
  const all = sh.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (String(all[i][0]) === String(id)) { sh.deleteRow(i + 1); return { ok: true }; }
  }
  return { ok: false };
}

// ─────────────────────────────────────────────
// TASKS + AI PRIORITY ANALYSIS
// ─────────────────────────────────────────────

function getTasks() {
  const sh = _sheet('tasks', ['id', 'title', 'deadline', 'category', 'status', 'created']);
  const rows = sh.getDataRange().getValues().slice(1).filter(r => r[0]);
  if (rows.length === 0) {
    // サンプルタスクを挿入
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 5);
    const samples = [
      [_uuid(), '〇〇社への見積書作成・送付', today, '見積', '未完了', today],
      [_uuid(), '月次営業報告書の提出', tomorrow, '内部作業', '未完了', today],
      [_uuid(), '△△社フォローアップメール送信', today, '営業', '未完了', today],
      [_uuid(), '担当製品カタログの確認・メモ更新', nextWeek, '製品知識', '未完了', today],
    ];
    const sh2 = _sheet('tasks', ['id', 'title', 'deadline', 'category', 'status', 'created']);
    samples.forEach(s => sh2.appendRow(s));
    return getTasks();
  }
  return rows.map(r => ({
    id: r[0], title: r[1],
    deadline: r[2] ? _fmtDate(r[2]) : '',
    category: r[3], status: r[4], created: _fmt(r[5])
  })).reverse();
}

function saveTask(task) {
  const sh = _sheet('tasks', ['id', 'title', 'deadline', 'category', 'status', 'created']);
  const now = new Date();
  const deadline = task.deadline ? new Date(task.deadline) : '';
  if (task.id) {
    const all = sh.getDataRange().getValues();
    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(task.id)) {
        sh.getRange(i + 1, 2, 1, 4).setValues([[task.title, deadline, task.category || '通常', task.status || all[i][4]]]);
        return { ok: true };
      }
    }
  }
  const id = _uuid();
  sh.appendRow([id, task.title, deadline, task.category || '通常', '未完了', now]);
  return { ok: true, id };
}

function toggleTaskStatus(id) {
  const sh = _sheet('tasks', ['id', 'title', 'deadline', 'category', 'status', 'created']);
  const all = sh.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (String(all[i][0]) === String(id)) {
      const next = all[i][4] === '完了' ? '未完了' : '完了';
      sh.getRange(i + 1, 5).setValue(next);
      return { ok: true, status: next };
    }
  }
  return { ok: false };
}

function deleteTask(id) {
  const sh = _sheet('tasks', ['id', 'title', 'deadline', 'category', 'status', 'created']);
  const all = sh.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (String(all[i][0]) === String(id)) { sh.deleteRow(i + 1); return { ok: true }; }
  }
  return { ok: false };
}

function analyzeTasks() {
  const tasks = getTasks().filter(t => t.status !== '完了');
  if (!tasks.length) return { error: '未完了のタスクがありません。タスクを追加してから分析してください。' };
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd(E)');
  const list = tasks.map((t, i) =>
    `${i + 1}. ${t.title}（期限:${t.deadline || '未設定'} / 種別:${t.category}）`
  ).join('\n');
  const prompt = `あなたは営業職のタスク管理アドバイザーです。
今日は${today}です。以下の未完了タスクを分析し、優先順位とアドバイスをJSONで返してください。

${list}

JSON形式（必ずこの形式で返すこと）:
{
  "situation": "今日の状況を励ます一言（30字以内）",
  "tasks": [
    {
      "rank": 1,
      "originalIndex": 1,
      "priority": "高",
      "reason": "この優先度にした理由（40字以内）",
      "tip": "効率よくこなすコツ（50字以内）",
      "time": "推定作業時間（例: 30分）"
    }
  ],
  "advice": "今日全体へのアドバイス（100字以内）"
}`;
  const result = _callGemini(prompt, true);
  if (!result.ok) return result;
  if (result.data.tasks) {
    result.data.tasks = result.data.tasks.map(t => ({
      ...t,
      taskId: tasks[t.originalIndex - 1]?.id,
      title: tasks[t.originalIndex - 1]?.title || '',
      deadline: tasks[t.originalIndex - 1]?.deadline || '',
      category: tasks[t.originalIndex - 1]?.category || '',
    }));
  }
  return result;
}

// ─────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────

function getTemplates() {
  const sh = _sheet('templates', ['id', 'name', 'subject', 'body', 'created']);
  const rows = sh.getDataRange().getValues().slice(1).filter(r => r[0]);
  if (rows.length === 0) {
    const defs = [
      ['見積書送付', '【見積書】{顧客名}様_{商品名}_{日付}',
        '{顧客名} 様\n\nいつもお世話になっております。{自分の名前}です。\nご依頼いただきました見積書をお送りいたします。\nご確認のほどよろしくお願いいたします。\n\nご不明な点はお気軽にご連絡ください。\n\n{自分の名前}'],
      ['訪問後お礼', '【御礼】本日のご面談_{顧客名}様',
        '{顧客名} 様\n\n本日はお忙しい中、貴重なお時間をいただきありがとうございました。\n{議題}についてご説明の機会をいただき大変勉強になりました。\n引き続きどうぞよろしくお願いいたします。\n\n{自分の名前}'],
      ['資料確認フォロー', 'ご確認のお願い_{顧客名}様',
        '{顧客名} 様\n\nいつもお世話になっております。{自分の名前}です。\n先日お送りした{資料名}のご確認状況はいかがでしょうか。\nご不明な点がございましたらお気軽にご連絡ください。\n\nよろしくお願いいたします。'],
      ['納期回答', '【納期回答】{商品名}_{顧客名}様',
        '{顧客名} 様\n\nいつもお世話になっております。{自分の名前}です。\nお問い合わせいただいた{商品名}の納期についてご回答いたします。\n\n納期：{納期}\n数量：{数量}\n\nご発注のほどよろしくお願いいたします。'],
      ['欠品・遅延連絡', '【重要】{商品名} 納期遅延のご連絡_{顧客名}様',
        '{顧客名} 様\n\nいつもお世話になっております。{自分の名前}です。\nご注文いただいております{商品名}について、誠に申し訳ございませんが\n納期が{変更後納期}に変更となりました。\nご迷惑をおかけしますことを深くお詫び申し上げます。\n何卒ご理解いただけますようお願い申し上げます。'],
    ];
    defs.forEach(d => sh.appendRow([_uuid(), d[0], d[1], d[2], new Date()]));
    return getTemplates();
  }
  return rows.map(r => ({ id: r[0], name: r[1], subject: r[2], body: r[3] }));
}

function saveTemplate(tpl) {
  const sh = _sheet('templates', ['id', 'name', 'subject', 'body', 'created']);
  if (tpl.id) {
    const all = sh.getDataRange().getValues();
    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(tpl.id)) {
        sh.getRange(i + 1, 2, 1, 3).setValues([[tpl.name, tpl.subject, tpl.body]]);
        return { ok: true };
      }
    }
  }
  const id = _uuid();
  sh.appendRow([id, tpl.name, tpl.subject, tpl.body, new Date()]);
  return { ok: true, id };
}

function deleteTemplate(id) {
  const sh = _sheet('templates', ['id', 'name', 'subject', 'body', 'created']);
  const all = sh.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (String(all[i][0]) === String(id)) { sh.deleteRow(i + 1); return { ok: true }; }
  }
  return { ok: false };
}

function createGmailDraft(to, subject, body) {
  GmailApp.createDraft(to || '', subject, body);
  return { ok: true };
}

// ─────────────────────────────────────────────
// EMAIL PROOFREADING (AI添削)
// ─────────────────────────────────────────────

function proofreadEmail(emailText, context) {
  const prompt = `あなたは日本のビジネスメールのプロフェッショナルです。
営業担当者として送るメール文を添削してください。

${context ? '【補足情報】' + context + '\n\n' : ''}===メール文===
${emailText}
===============

以下のJSON形式で返してください:
{
  "score": 85,
  "verdict": "総合評価の一言",
  "issues": [
    {"type": "敬語", "text": "具体的な問題点と改善案"}
  ],
  "good_points": ["良かった点"],
  "corrected_body": "修正後の本文全文（敬語・表現を最適化）"
}`;
  return _callGemini(prompt, true);
}

// ─────────────────────────────────────────────
// OCR / PDF TEXT EXTRACTION
// ─────────────────────────────────────────────

function processFile(base64, mimeType, prompt) {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) return { error: 'GEMINI_API_KEY が設定されていません' };
  const instruction = prompt ||
    'この画像またはPDFのテキストをすべて正確に抽出してください。表は表形式を維持し、余分なコメントは不要です。';
  const payload = {
    contents: [{ parts: [{ text: instruction }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
    generationConfig: { temperature: 0 }
  };
  const res = UrlFetchApp.fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key,
    { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true }
  );
  const json = JSON.parse(res.getContentText());
  if (json.error) return { error: json.error.message };
  return { ok: true, text: json.candidates?.[0]?.content?.parts?.[0]?.text || '' };
}

// ─────────────────────────────────────────────
// DAILY LOG（業務日誌）
// ─────────────────────────────────────────────

function getDailyLogs(limit) {
  const sh = _sheet('daily_logs', ['id', 'date', 'work', 'achievements', 'issues', 'hours', 'tags', 'created']);
  const rows = sh.getDataRange().getValues().slice(1).filter(r => r[0])
    .map(r => ({
      id: r[0], date: _fmtDate(r[1]), work: r[2],
      achievements: r[3], issues: r[4], hours: r[5], tags: r[6], created: _fmt(r[7])
    })).reverse();
  return limit ? rows.slice(0, limit) : rows;
}

function saveDailyLog(log) {
  const sh = _sheet('daily_logs', ['id', 'date', 'work', 'achievements', 'issues', 'hours', 'tags', 'created']);
  const now = new Date();
  const date = log.date ? new Date(log.date) : now;
  if (log.id) {
    const all = sh.getDataRange().getValues();
    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(log.id)) {
        sh.getRange(i + 1, 2, 1, 7).setValues([[date, log.work || '', log.achievements || '', log.issues || '', Number(log.hours) || 0, log.tags || '', now]]);
        return { ok: true };
      }
    }
  }
  const id = _uuid();
  sh.appendRow([id, date, log.work || '', log.achievements || '', log.issues || '', Number(log.hours) || 0, log.tags || '', now]);
  return { ok: true, id };
}

function deleteDailyLog(id) {
  const sh = _sheet('daily_logs', ['id', 'date', 'work', 'achievements', 'issues', 'hours', 'tags', 'created']);
  const all = sh.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (String(all[i][0]) === String(id)) { sh.deleteRow(i + 1); return { ok: true }; }
  }
  return { ok: false };
}

// ─────────────────────────────────────────────
// HR EVALUATION SUPPORT（人事評価サポート）
// ─────────────────────────────────────────────

function getHrGoals() {
  const sh = _sheet('hr_goals', ['id', 'term', 'title', 'kpi', 'detail', 'created']);
  const rows = sh.getDataRange().getValues().slice(1).filter(r => r[0]);
  if (rows.length === 0) {
    // 営業2年目に合ったサンプル目標を挿入
    const term = '2025年度上期（4〜9月）';
    const samples = [
      ['既存顧客リピート受注率の向上', 'リピート受注件数 前期比110%以上（月次確認）',
        '既存顧客への定期フォロー頻度を月1回以上に設定し、課題や要望を早期にキャッチして先回りの提案活動を行う。商談記録をナレッジベースに蓄積し引き継ぎ品質も向上させる。'],
      ['業務効率化（見積・メール作成時間50%削減）', '見積書1件あたりの作成時間 現状比50%削減',
        'メールテンプレートとナレッジベースを整備し、過去の見積書や事例をすぐに参照できる仕組みを構築する。定型業務の手順書化も行い、ミスの削減と時間短縮を同時に実現する。'],
      ['製品・技術知識の習得', '技術的質問の自己解決率80%以上を目指す',
        '担当製品（基板・部品・機種構成）の基礎知識を習得し、顧客からの基本的な技術的質問に自力で回答できるようにする。週1回の自己学習時間を確保し、学んだ内容はメモとして蓄積する。'],
      ['新規顧客接点の創出', '新規顧客への提案活動 月2件以上',
        '既存顧客の紹介や展示会等を活用し、新規顧客との接点を月2件以上作る。提案内容をテンプレート化して再現性を高める。'],
    ];
    samples.forEach(s => sh.appendRow([_uuid(), term, s[0], s[1], s[2], new Date()]));
    return getHrGoals();
  }
  return rows.map(r => ({ id: r[0], term: r[1], title: r[2], kpi: r[3], detail: r[4] }));
}

function saveHrGoal(goal) {
  const sh = _sheet('hr_goals', ['id', 'term', 'title', 'kpi', 'detail', 'created']);
  if (goal.id) {
    const all = sh.getDataRange().getValues();
    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(goal.id)) {
        sh.getRange(i + 1, 2, 1, 4).setValues([[goal.term, goal.title, goal.kpi || '', goal.detail || '']]);
        return { ok: true };
      }
    }
  }
  const id = _uuid();
  sh.appendRow([id, goal.term, goal.title, goal.kpi || '', goal.detail || '', new Date()]);
  return { ok: true, id };
}

function deleteHrGoal(id) {
  const sh = _sheet('hr_goals', ['id', 'term', 'title', 'kpi', 'detail', 'created']);
  const all = sh.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (String(all[i][0]) === String(id)) { sh.deleteRow(i + 1); return { ok: true }; }
  }
  return { ok: false };
}

function generateEvaluation(term) {
  const goals = getHrGoals();
  const logs = getDailyLogs(60);
  if (!goals.length) return { error: '目標が設定されていません。先に「目標管理」タブで目標を設定してください。' };
  const goalText = goals.map((g, i) =>
    `【目標${i + 1}】${g.title}\nKPI: ${g.kpi}\n詳細: ${g.detail}`
  ).join('\n\n');
  const logText = logs.length
    ? logs.slice(0, 30).map(l =>
        `[${l.date}] ${l.work.slice(0, 60)} ／ 成果:${l.achievements.slice(0, 40)}`
      ).join('\n')
    : '（業務日誌の記録がまだありません。日誌を記録すると評価の精度が上がります）';
  const prompt = `あなたは人事評価のプロフェッショナルです。
以下の情報をもとに、製造業向け営業担当者（現職2年目）の人事評価用自己評価文を作成してください。

【評価期間】${term || '直近期'}
【設定目標】
${goalText}

【業務日誌（抜粋）】
${logText}

以下のJSON形式で返してください:
{
  "achievements": [
    "達成・実績の箇条書き（3〜5項目、具体的に）"
  ],
  "self_eval": "自己評価本文（280字程度、謙虚かつ積極的なトーンで目標への取り組みを具体的に記述）",
  "appeal_points": [
    "特にアピールすべきポイント（2〜3項目）"
  ],
  "growth": "成長・改善の記録（120字程度）",
  "next_goals": [
    "次期に向けた目標案（2〜3項目）"
  ],
  "interview_tips": [
    "評価面談でのアドバイス（2〜3項目）"
  ]
}`;
  return _callGemini(prompt, true);
}

function generateGoalAdvice(situation) {
  const prompt = `あなたは人事評価目標設定の専門家です。
製造業向け営業担当者（部品・基板・機種構成等を扱う、現職2年目）が
人事評価で良い評価を得るためのSMART目標を提案してください。

【現在の状況・課題】
${situation}

以下のJSON形式で返してください:
{
  "goals": [
    {
      "category": "カテゴリ（売上/効率化/スキル/顧客関係/チーム等）",
      "title": "目標タイトル（簡潔に）",
      "detail": "具体的な目標内容（測定可能な指標を含む、120字程度）",
      "kpi": "測定指標（例: 〇〇件以上、〇〇%向上）",
      "why": "この目標を設定する効果・理由（60字程度）"
    }
  ],
  "advice": "目標設定全体へのアドバイス（120字程度）",
  "caution": "よくある失敗と注意点（60字程度）"
}`;
  return _callGemini(prompt, true);
}

// ─────────────────────────────────────────────
// AI CHAT（営業専門アシスタント）
// ─────────────────────────────────────────────

function aiChat(messages) {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) return { error: 'GEMINI_API_KEY が設定されていません' };
  const systemPrompt = `あなたは製造業向け営業職のプロフェッショナルアシスタントです。
対象者は部品・基板・機種構成を扱う営業担当で現職2年目です。
業務効率化、顧客対応、見積作成、社内調整、製品知識習得、スキルアップについてアドバイスします。
【重要】回答は必ず日本語で。簡潔・具体的・実践的に。長文は避け箇条書きを活用してください。`;
  const contents = (messages || []).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));
  if (!contents.length) return { error: 'メッセージがありません' };
  const payload = {
    contents,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
  };
  try {
    const res = UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key,
      { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true }
    );
    const json = JSON.parse(res.getContentText());
    if (json.error) return { error: json.error.message };
    return { ok: true, text: json.candidates?.[0]?.content?.parts?.[0]?.text || '' };
  } catch (e) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────
// CHECKLIST
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// CUSTOMERS（顧客カルテ）
// ─────────────────────────────────────────────

function getCustomers(query) {
  const sh = _sheet('customers', ['id','company','name','role','phone','email','rank','last_contact','notes','tags','created']);
  const rows = sh.getDataRange().getValues().slice(1).filter(r => r[0])
    .map(r => ({
      id: r[0], company: r[1], name: r[2], role: r[3],
      phone: r[4], email: r[5], rank: r[6],
      last_contact: r[7] ? _fmtDate(r[7]) : '',
      notes: r[8], tags: r[9], created: _fmt(r[10])
    }))
    .sort((a, b) => ({ 'A': 0, 'B': 1, 'C': 2 }[a.rank] - ({ 'A': 0, 'B': 1, 'C': 2 }[b.rank] || 2) || 0));
  if (!query) return rows;
  const q = String(query).toLowerCase();
  return rows.filter(r => (r.company + r.name + r.tags + r.notes).toLowerCase().includes(q));
}

function saveCustomer(c) {
  const sh = _sheet('customers', ['id','company','name','role','phone','email','rank','last_contact','notes','tags','created']);
  const lc = c.last_contact ? new Date(c.last_contact) : '';
  if (c.id) {
    const all = sh.getDataRange().getValues();
    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(c.id)) {
        sh.getRange(i + 1, 2, 1, 9).setValues([[c.company || '', c.name || '', c.role || '', c.phone || '', c.email || '', c.rank || 'B', lc, c.notes || '', c.tags || '']]);
        return { ok: true };
      }
    }
  }
  const id = _uuid();
  sh.appendRow([id, c.company || '', c.name || '', c.role || '', c.phone || '', c.email || '', c.rank || 'B', lc, c.notes || '', c.tags || '', new Date()]);
  return { ok: true, id };
}

function deleteCustomer(id) {
  const sh = _sheet('customers', ['id','company','name','role','phone','email','rank','last_contact','notes','tags','created']);
  const all = sh.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (String(all[i][0]) === String(id)) { sh.deleteRow(i + 1); return { ok: true }; }
  }
  return { ok: false };
}

// ─────────────────────────────────────────────
// MEETINGS（商談メモ）
// ─────────────────────────────────────────────

function getMeetings(limit) {
  const sh = _sheet('meetings', ['id','date','company','person','purpose','content','my_actions','their_actions','next_date','status','created']);
  const rows = sh.getDataRange().getValues().slice(1).filter(r => r[0])
    .map(r => ({
      id: r[0], date: _fmtDate(r[1]), company: r[2], person: r[3],
      purpose: r[4], content: r[5], my_actions: r[6], their_actions: r[7],
      next_date: r[8] ? _fmtDate(r[8]) : '', status: r[9]
    })).reverse();
  return limit ? rows.slice(0, limit) : rows;
}

function saveMeeting(m) {
  const sh = _sheet('meetings', ['id','date','company','person','purpose','content','my_actions','their_actions','next_date','status','created']);
  const now = new Date();
  const date = m.date ? new Date(m.date) : now;
  const nextDate = m.next_date ? new Date(m.next_date) : '';
  if (m.id) {
    const all = sh.getDataRange().getValues();
    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(m.id)) {
        sh.getRange(i + 1, 2, 1, 9).setValues([[date, m.company || '', m.person || '', m.purpose || '', m.content || '', m.my_actions || '', m.their_actions || '', nextDate, m.status || 'フォロー中']]);
        return { ok: true };
      }
    }
  }
  const id = _uuid();
  sh.appendRow([id, date, m.company || '', m.person || '', m.purpose || '', m.content || '', m.my_actions || '', m.their_actions || '', nextDate, m.status || 'フォロー中', now]);
  return { ok: true, id };
}

function deleteMeeting(id) {
  const sh = _sheet('meetings', ['id','date','company','person','purpose','content','my_actions','their_actions','next_date','status','created']);
  const all = sh.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (String(all[i][0]) === String(id)) { sh.deleteRow(i + 1); return { ok: true }; }
  }
  return { ok: false };
}

function generateFollowupEmail(meetingId) {
  const m = getMeetings(null).find(x => x.id === meetingId);
  if (!m) return { error: '商談記録が見つかりません' };
  const prompt = `あなたは製造業向け営業担当者です。以下の商談記録をもとに訪問後フォローアップメールを作成してください。

顧客: ${m.company} ${m.person}様 / 日付: ${m.date}
商談目的: ${m.purpose}
商談内容: ${m.content}
自分の宿題: ${m.my_actions || 'なし'}
先方の宿題: ${m.their_actions || 'なし'}
次回予定: ${m.next_date || '未定'}

要件: 件名(30字以内)と本文(300字以内)。自分の宿題は対応予定を明記。先方の宿題は丁寧に確認。次回への橋渡しで締める。`;
  return _callGemini(prompt, false);
}

function generateMeetingPrep(company, purpose, pastContent) {
  const prompt = `製造業向け営業のプロとして、以下の商談前の準備ブリーフィングをJSONで作成してください。

顧客: ${company} / 目的: ${purpose}
過去の商談: ${pastContent || '（初回訪問または記録なし）'}

JSON形式:
{
  "opening": "最初の一言・アイスブレイク（具体的に）",
  "key_points": ["必ず押さえるポイント（3つ）"],
  "questions": ["顧客に聞くべき質問（3つ）"],
  "watch_out": ["気をつけるべきリスク・注意点"],
  "goal": "この商談のゴール（一文）"
}`;
  return _callGemini(prompt, true);
}

// ─────────────────────────────────────────────
// MONTHLY NUMBERS（数値目標）
// ─────────────────────────────────────────────

function getNumbers(yearMonth) {
  const sh = _sheet('monthly_numbers', ['id','year_month','category','target','actual','unit','created']);
  const rows = sh.getDataRange().getValues().slice(1).filter(r => r[0])
    .map(r => ({ id: r[0], year_month: r[1], category: r[2], target: Number(r[3]) || 0, actual: Number(r[4]) || 0, unit: r[5] }));
  return yearMonth ? rows.filter(r => r.year_month === yearMonth) : rows;
}

function saveNumber(n) {
  const sh = _sheet('monthly_numbers', ['id','year_month','category','target','actual','unit','created']);
  const all = sh.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (String(all[i][0]) === String(n.id) || (all[i][1] === n.year_month && all[i][2] === n.category)) {
      sh.getRange(i + 1, 2, 1, 5).setValues([[n.year_month, n.category, Number(n.target) || 0, Number(n.actual) || 0, n.unit || '']]);
      return { ok: true, id: all[i][0] };
    }
  }
  const id = _uuid();
  sh.appendRow([id, n.year_month, n.category, Number(n.target) || 0, Number(n.actual) || 0, n.unit || '', new Date()]);
  return { ok: true, id };
}

function analyzeNumbers(yearMonth) {
  const nums = getNumbers(yearMonth);
  if (!nums.length) return { error: 'この月のデータがありません' };
  const numText = nums.map(n => {
    const rate = n.target > 0 ? Math.round(n.actual / n.target * 100) : 0;
    return `${n.category}: 目標${n.target}${n.unit} 実績${n.actual}${n.unit} 達成率${rate}%`;
  }).join('\n');
  const prompt = `営業担当者の${yearMonth}の実績データです。
${numText}

以下のJSON形式でコメントをください:
{
  "overall": "全体評価（20字以内、必ず励ます）",
  "best": "最もできている点（具体的に）",
  "focus": "今注力すべきこと（具体的に）",
  "tip": "残り期間で達成率を上げるための具体的なアドバイス（80字以内）"
}`;
  return _callGemini(prompt, true);
}

// ─────────────────────────────────────────────
// WEEKLY REPORT（週次報告書AI生成）
// ─────────────────────────────────────────────

function generateWeeklyReport() {
  const logs = getDailyLogs(7);
  const doneTasks = getTasks().filter(t => t.status === '完了').slice(0, 10);
  if (!logs.length) return { error: '業務日誌がありません。日誌を記録してから実行してください。' };
  const logText = logs.map(l => `[${l.date}] ${l.work} / 成果: ${l.achievements}`).join('\n');
  const taskText = doneTasks.length ? doneTasks.map(t => `・${t.title}`).join('\n') : 'なし';
  const prompt = `以下の業務日誌をもとに、上司への週次業務報告書をJSON形式で作成してください。

【業務日誌（直近）】
${logText}

【完了タスク】
${taskText}

JSON形式:
{
  "subject": "週次報告の件名（簡潔に30字以内）",
  "summary": "今週の業務サマリー（150字以内）",
  "achievements": ["主な成果・完了事項（3〜5項目）"],
  "issues": ["課題・懸念事項（あれば、なければ空配列）"],
  "next_week": ["来週の主な予定・方針（3項目）"],
  "message": "上司へのひと言（30字以内、前向きに）"
}`;
  return _callGemini(prompt, true);
}

// ─────────────────────────────────────────────
// CHECKLIST
// ─────────────────────────────────────────────

function getChecklist(type) {
  const lists = {
    email: ['宛先（To/CC）は正しいか', '件名に顧客名・日付が入っているか', '添付ファイルを忘れていないか',
      '金額・型番を声に出して再確認したか', '誤字脱字はないか', '敬称・敬語は適切か', '署名は正しく入っているか'],
    estimate: ['顧客名・宛名は正しいか', '品番・型番は正確か', '単価・数量・合計を計算し直したか',
      '有効期限は記載したか', '承認者の確認は済んでいるか', 'ファイル名に顧客名と日付を入れたか',
      '前回見積書と差異がないか確認したか'],
    visit: ['訪問先の住所・経路を確認したか', '持参する資料・サンプルを準備したか', '名刺は十分にあるか',
      '前回の打ち合わせ内容を確認したか', 'アポイントの時間・担当者名を確認したか',
      '商談目的・ゴールを決めたか', '相手企業の最新情報を確認したか'],
  };
  return lists[type] || [];
}
