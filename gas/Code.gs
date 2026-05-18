// ============================================================
// Code.gs — 営業ナレッジベース（シンプル版）
// 必要なスクリプトプロパティ: GEMINI_API_KEY
// ============================================================

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('📋 営業ナレッジ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ── スプレッドシート管理 ──────────────────────────────────────

function _getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SHEET_ID');
  if (ssId) {
    try { return SpreadsheetApp.openById(ssId); } catch (e) {}
  }
  const ss = SpreadsheetApp.create('営業ナレッジDB');
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}

function _sheet(name, headers) {
  const ss = _getSpreadsheet();
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

// ── メモ CRUD ─────────────────────────────────────────────────

function getMemos(query) {
  const sh = _sheet('memos', ['id', 'title', 'content', 'tags', 'created', 'updated']);
  const rows = sh.getDataRange().getValues().slice(1)
    .filter(r => r[0])
    .map(r => ({
      id: r[0],
      title: r[1],
      content: r[2],
      tags: r[3],
      created: r[4] ? Utilities.formatDate(new Date(r[4]), 'Asia/Tokyo', 'MM/dd') : '',
      updated: r[5] ? Utilities.formatDate(new Date(r[5]), 'Asia/Tokyo', 'MM/dd HH:mm') : ''
    }))
    .reverse();

  if (!query) return rows;
  const q = String(query).toLowerCase();
  return rows.filter(r =>
    (String(r.title) + String(r.content) + String(r.tags)).toLowerCase().includes(q)
  );
}

function saveMemo(memo) {
  const sh = _sheet('memos', ['id', 'title', 'content', 'tags', 'created', 'updated']);
  const now = new Date();

  if (memo.id) {
    const all = sh.getDataRange().getValues();
    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(memo.id)) {
        sh.getRange(i + 1, 2, 1, 5).setValues([[
          memo.title || '無題', memo.content || '', memo.tags || '', all[i][4], now
        ]]);
        return { ok: true, id: memo.id };
      }
    }
  }

  const id = Utilities.getUuid().split('-')[0];
  sh.appendRow([id, memo.title || '無題', memo.content || '', memo.tags || '', now, now]);
  return { ok: true, id };
}

function deleteMemo(id) {
  const sh = _sheet('memos', ['id', 'title', 'content', 'tags', 'created', 'updated']);
  const all = sh.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (String(all[i][0]) === String(id)) {
      sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false };
}

// ── テンプレート ──────────────────────────────────────────────

function getTemplates() {
  const sh = _sheet('templates', ['id', 'name', 'subject', 'body', 'created']);
  const rows = sh.getDataRange().getValues().slice(1).filter(r => r[0]);

  if (rows.length === 0) {
    const defaults = [
      ['見積書送付',
        '【見積書】{顧客名}様_{商品名}_{日付}',
        '{顧客名} 様\n\nいつもお世話になっております。{自分の名前}です。\nご依頼いただきました見積書をお送りいたします。\nご確認のほど、よろしくお願いいたします。\n\nご不明な点がございましたらお気軽にご連絡ください。'],
      ['訪問後フォロー',
        'ご面談のお礼_{顧客名}様',
        '{顧客名} 様\n\n本日はお忙しい中、お時間をいただきありがとうございました。\nご説明した内容について、引き続きご検討いただけますと幸いです。\n何かご不明な点がございましたらお気軽にご連絡ください。\n\nよろしくお願いいたします。'],
      ['資料確認フォロー',
        'ご確認のお願い_{顧客名}様',
        '{顧客名} 様\n\nいつもお世話になっております。{自分の名前}です。\n先日お送りした{資料名}についてご確認いただけましたでしょうか。\nご不明な点がございましたらお気軽にご連絡ください。\n\nよろしくお願いいたします。'],
      ['納期回答',
        '【納期回答】{商品名}_{顧客名}様',
        '{顧客名} 様\n\nいつもお世話になっております。{自分の名前}です。\nお問い合わせいただいた{商品名}の納期についてご回答いたします。\n\n納期：{納期}\n数量：{数量}\n\n上記にて問題なければ、ご発注のほどよろしくお願いいたします。'],
    ];
    defaults.forEach(d => {
      sh.appendRow([Utilities.getUuid().split('-')[0], d[0], d[1], d[2], new Date()]);
    });
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

  const id = Utilities.getUuid().split('-')[0];
  sh.appendRow([id, tpl.name, tpl.subject, tpl.body, new Date()]);
  return { ok: true, id };
}

function deleteTemplate(id) {
  const sh = _sheet('templates', ['id', 'name', 'subject', 'body', 'created']);
  const all = sh.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (String(all[i][0]) === String(id)) {
      sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false };
}

function createGmailDraft(to, subject, body) {
  GmailApp.createDraft(to || '', subject, body);
  return { ok: true };
}

// ── OCR / PDF テキスト抽出（Gemini） ─────────────────────────

function processFile(base64, mimeType, prompt) {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) {
    return { error: 'スクリプトプロパティに GEMINI_API_KEY を設定してください。\n設定方法はデプロイ手順書を参照してください。' };
  }

  const instruction = prompt ||
    'この画像またはPDFに含まれるすべてのテキストを正確に抽出してください。' +
    '表は表形式を維持し、箇条書きはそのまま出力してください。' +
    '余分なコメントは不要です。抽出テキストのみ出力してください。';

  const payload = {
    contents: [{
      parts: [
        { text: instruction },
        { inline_data: { mime_type: mimeType, data: base64 } }
      ]
    }],
    generationConfig: { temperature: 0 }
  };

  const res = UrlFetchApp.fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
  );

  const json = JSON.parse(res.getContentText());
  if (json.error) return { error: json.error.message };
  return { ok: true, text: json.candidates?.[0]?.content?.parts?.[0]?.text || '（テキストを抽出できませんでした）' };
}

// ── チェックリスト ────────────────────────────────────────────

function getChecklist(type) {
  const lists = {
    email: [
      '宛先（To/CC）は正しいか',
      '件名に顧客名・日付が入っているか',
      '添付ファイルを忘れていないか',
      '金額・型番を数字で再確認したか',
      '誤字脱字はないか',
      '敬称・敬語は適切か',
      '署名は正しく入っているか',
    ],
    estimate: [
      '顧客名・宛名は正しいか',
      '品番・型番は正確か',
      '単価・数量・合計を計算し直したか',
      '有効期限は記載したか',
      '承認者の確認は済んでいるか',
      'ファイル名に顧客名と日付を入れたか',
      '前回見積書と金額に差異がないか確認したか',
    ],
    visit: [
      '訪問先の住所・経路を確認したか',
      '持参する資料・サンプルを準備したか',
      '名刺は十分にあるか',
      '前回の打ち合わせ内容を確認したか',
      'アポイントの時間・担当者を再確認したか',
      '商談目的・ゴールを決めたか',
    ],
  };
  return lists[type] || [];
}

// ── スプレッドシートURLを返す（確認用） ──────────────────────

function getDbUrl() {
  const ss = _getSpreadsheet();
  return ss.getUrl();
}
