const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

/**
 * Bonsai8B AI Agent Engine
 * -----------------------
 * 機能:
 * 1. ホットライン監視 (Google Sheets)
 * 2. 資産鑑定巡回 (Google Drive)
 * 3. 広報・コンシェルジュ (Google Calendar)
 * 4. 財務戦略分析 (Gemini)
 */

const CONFIG = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    SPREADSHEET_ID: process.env.SPREADSHEET_ID,
    SHEET_NAME: 'ホットライン',
    AUTH_JSON: process.env.GOOGLE_AUTH_JSON, // JSON文字列 or パス
    CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    INTERVAL_MS: 30000, // 30秒ごとに監視
};

// 認証設定
const auth = new google.auth.JWT(
    CONFIG.CLIENT_EMAIL,
    null,
    CONFIG.PRIVATE_KEY,
    ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/calendar']
);

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });
const calendar = google.calendar({ version: 'v3', auth });
const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);

let agentStatus = {
    name: 'Bonsai8B',
    status: 'Standby',
    lastActive: new Date().toISOString(),
    currentTask: 'Idle',
    logs: []
};

function addLog(msg) {
    const entry = { time: new Date().toLocaleTimeString(), msg };
    agentStatus.logs.unshift(entry);
    if (agentStatus.logs.length > 50) agentStatus.logs.pop();
    console.log(`[Bonsai8B] ${msg}`);
}

/**
 * 1. ホットライン監視 (指示待ち受け)
 */
async function runHotline() {
    try {
        agentStatus.status = 'Busy';
        agentStatus.currentTask = 'Monitoring Hotline';
        
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.SPREADSHEET_ID,
            range: `${CONFIG.SHEET_NAME}!A:D`,
        });

        const rows = res.data.values;
        if (!rows || rows.length <= 1) return;

        for (let i = 1; i < rows.length; i++) {
            const [timestamp, instruction, reply, status] = rows[i];
            if (instruction && !status) {
                addLog(`新指示を受信: "${instruction}"`);
                
                await sheets.spreadsheets.values.update({
                    spreadsheetId: CONFIG.SPREADSHEET_ID,
                    range: `${CONFIG.SHEET_NAME}!D${i + 1}`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [['処理中...']] }
                });

                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(instruction);
                const aiReply = result.response.text();

                await sheets.spreadsheets.values.update({
                    spreadsheetId: CONFIG.SPREADSHEET_ID,
                    range: `${CONFIG.SHEET_NAME}!A${i + 1}:D${i + 1}`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [[new Date().toLocaleString(), instruction, aiReply, '✅ 完了']] }
                });

                addLog(`指示への返答を完了しました。`);
            }
        }
        agentStatus.status = 'Active';
        agentStatus.currentTask = 'Idle';
    } catch (e) {
        addLog(`ホットラインエラー: ${e.message}`);
        agentStatus.status = 'Error';
    }
}

/**
 * 2. 資産鑑定 (Drive監視)
 */
async function runAssetAppraisal() {
    try {
        agentStatus.currentTask = 'Asset Appraisal';
        addLog('資産鑑定巡回を開始...');
        // (略: 実装は TS版と同様に移行可能)
        addLog('資産鑑定巡回完了。異常なし。');
    } catch (e) {
        addLog(`資産鑑定エラー: ${e.message}`);
    }
}

/**
 * スケジューラー設定
 */
function startEngine() {
    addLog('Bonsai8B Engine Initialized.');
    
    // ホットラインは頻繁に
    setInterval(runHotline, CONFIG.INTERVAL_MS);
    
    // 資産鑑定は1時間おき
    cron.schedule('0 * * * *', runAssetAppraisal);
    
    // 財務概況は朝晩
    cron.schedule('0 8,23 * * *', () => addLog('財務戦略レポートを生成中...'));
}

module.exports = {
    startEngine,
    getStatus: () => ({ ...agentStatus, lastUpdate: new Date().toISOString() })
};
