import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as path from 'path';

/**
 * 外出先からの司令受信エージェント (スプレッドシート連携版)
 * 動作: スプレッドシートの「AIホットライン」シートを監視し、新しい指示があれば実行・返答する
 */

const CONFIG = {
    GEMINI_API_KEY: 'AIzaSyCmEd3SGm3LqrlblJJQX9agDL0pOy9Nq6w',
    CREDENTIALS_PATH: '/Users/nagahamakeigo/.gemini/antigravity/playground/chrono-intergalactic/worker/credentials.json',
    SPREADSHEET_ID: '1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M', // 統合データ基盤
    SHEET_NAME: 'AIホットライン',
    INTERVAL_MS: 30 * 1000 // 30秒おきに確認
};

const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
const auth = new google.auth.GoogleAuth({
    keyFile: CONFIG.CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function initSheet() {
    try {
        const res = await sheets.spreadsheets.get({
            spreadsheetId: CONFIG.SPREADSHEET_ID
        });
        const sheetExists = res.data.sheets?.some(s => s.properties?.title === CONFIG.SHEET_NAME);

        if (!sheetExists) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: { title: CONFIG.SHEET_NAME }
                        }
                    }]
                }
            });
            await sheets.spreadsheets.values.update({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                range: `${CONFIG.SHEET_NAME}!A1:D1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [['日時', '社長の指示', 'AIの返答', 'ステータス']] }
            });
            console.log(`[司令塔] 📝 コミュニケーション用シート「${CONFIG.SHEET_NAME}」を新規作成しました！`);
        }
    } catch (e: any) {
        console.error('[司令塔] シート初期化エラー:', e.message);
    }
}

async function processCommand(commandText: string) {
    console.log(`[司令塔] 🧠 Geminiで指示を解析・処理中:「${commandText}」`);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `あなたは優秀なAI秘書「アンチグラビティ」です。社長から以下のチャット指示を受け取りました。
指示内容：${commandText}

この指示に対して、社長へ報告する的確かつ簡潔なメッセージ（200文字程度）を生成してください。`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (e) {
        return "申し訳ありません、処理中にエラーが発生しました。";
    }
}

async function runHotlineListener() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.SPREADSHEET_ID,
            range: `${CONFIG.SHEET_NAME}!A:D`
        });

        const rows = res.data.values;
        if (!rows || rows.length < 2) return; // ヘッダーのみ

        // 未処理（ステータスが空、または「処理中」でない）の行を探す
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const timestamp = row[0] || '';
            const instruction = row[1] || '';
            const reply = row[2] || '';
            const status = row[3] || '';

            if (instruction && status === '') {
                // 返答処理開始
                console.log(`[司令塔] 📩 新しい指示を受信 (${i + 1}行目): ${instruction}`);

                // 「処理中」マークを付ける
                await sheets.spreadsheets.values.update({
                    spreadsheetId: CONFIG.SPREADSHEET_ID,
                    range: `${CONFIG.SHEET_NAME}!D${i + 1}`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [['処理中...']] }
                });

                // Geminiで思考
                const aiReply = await processCommand(instruction);

                // 結果を書き込む
                const now = new Date().toLocaleString('ja-JP');
                await sheets.spreadsheets.values.update({
                    spreadsheetId: CONFIG.SPREADSHEET_ID,
                    range: `${CONFIG.SHEET_NAME}!A${i + 1}:D${i + 1}`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [[now, instruction, aiReply, '✅ 完了']] }
                });

                console.log(`[司令塔] ✅ 返信完了！ (${i + 1}行目)`);
            }
        }
    } catch (error: any) {
        console.error('[司令塔] 例外エラー:', error.message);
    }
}

async function start() {
    console.log('[司令塔] 🎯 外出先からのチャット（ホットライン）待ち受けを開始しました...');
    await initSheet();
    runHotlineListener();
    setInterval(runHotlineListener, CONFIG.INTERVAL_MS);
}

start();
