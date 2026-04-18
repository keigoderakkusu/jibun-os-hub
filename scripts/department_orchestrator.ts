import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * 自分株式会社：新部門統合オーケストレーター
 * 1. 資産鑑定部 (Vintage Appraiser)
 * 2. 広報・福利厚生部 (GF Concierge)
 * 3. 財務戦略部 (Asset Management)
 */

const CONFIG = {
    GEMINI_API_KEY: 'AIzaSyCmEd3SGm3LqrlblJJQX9agDL0pOy9Nq6w',
    CREDENTIALS_PATH: '/Users/nagahamakeigo/.gemini/antigravity/playground/chrono-intergalactic/worker/credentials.json',
    JOURNAL_SHEET_ID: '1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M', // Use main spreadsheet
    JOURNAL_TAB_NAME: '自分株式会社・経営日誌',
    ROADMAP_TAB_NAME: '人生ロードマップ',
    APPRAISE_FOLDER_NAME: '鑑定依頼',
    ROADMAP_FOLDER_NAME: 'VRS_Audio_Input'
};

const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
const auth = new google.auth.GoogleAuth({
    keyFile: CONFIG.CREDENTIALS_PATH,
    scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/tasks'
    ],
});

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });
const calendar = google.calendar({ version: 'v3', auth });
const tasks = google.tasks({ version: 'v1', auth });

/**
 * 共通ログ関数：自分株式会社・経営日誌
 */
async function logToJournal(dept: string, action: string, status: string) {
    if (!CONFIG.JOURNAL_SHEET_ID) return;
    const timestamp = new Date().toLocaleString('ja-JP');
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.JOURNAL_SHEET_ID,
            range: `${CONFIG.JOURNAL_TAB_NAME}!A:D`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[timestamp, dept, action, status]] }
        });
    } catch (e: any) {
        console.error(`[JOURNAL] ログ記録失敗: ${e.message}`);
    }
}

/**
 * 初期化：必要なシートとフォルダが存在することを確認
 */
async function initializeResources() {
    console.log('[SYSTEM] リソースの整合性をチェック中...');
    try {
        // 1. スプレッドシートのタブ確認
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: CONFIG.JOURNAL_SHEET_ID });
        const existingTabs = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];

        const requiredTabs = [
            { name: CONFIG.JOURNAL_TAB_NAME, headers: ['日時', '部署', 'アクション', 'ステータス'] },
            { name: CONFIG.ROADMAP_TAB_NAME, headers: ['日時', '元ファイル', '解析結果'] }
        ];

        for (const tab of requiredTabs) {
            if (!existingTabs.includes(tab.name)) {
                console.log(`[SYSTEM] 📝 シート「${tab.name}」を作成します...`);
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId: CONFIG.JOURNAL_SHEET_ID,
                    requestBody: {
                        requests: [{ addSheet: { properties: { title: tab.name } } }]
                    }
                });
                await sheets.spreadsheets.values.update({
                    spreadsheetId: CONFIG.JOURNAL_SHEET_ID,
                    range: `${tab.name}!A1`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [tab.headers] }
                });
            }
        }

        // 2. Google Drive フォルダの確認
        const requiredFolders = [CONFIG.APPRAISE_FOLDER_NAME, CONFIG.ROADMAP_FOLDER_NAME];
        for (const folderName of requiredFolders) {
            const res = await drive.files.list({
                q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'files(id)'
            });
            if (!res.data.files || res.data.files.length === 0) {
                console.log(`[SYSTEM] 📁 フォルダ「${folderName}」を新規作成します...`);
                await drive.files.create({
                    requestBody: {
                        name: folderName,
                        mimeType: 'application/vnd.google-apps.folder'
                    }
                });
            }
        }
        console.log('[SYSTEM] ✅ すべてのリソースが準備できました。');
    } catch (e: any) {
        console.error(`[SYSTEM] 初期化エラー: ${e.message}`);
    }
}
async function runAssetAppraisal() {
    console.log('[DEPT:資産鑑定] フォルダを監視中...');

    try {
        // フォルダIDを名前から取得
        const folderRes = await drive.files.list({
            q: `name = '${CONFIG.APPRAISE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id)'
        });
        const folderId = folderRes.data.files?.[0]?.id;
        if (!folderId) {
            console.log(`[資産鑑定部] ⚠️ フォルダ「${CONFIG.APPRAISE_FOLDER_NAME}」が見つかりません。`);
            return;
        }

        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false and not name contains '_鑑定済み'`,
            fields: 'files(id, name, mimeType)'
        });

        for (const file of res.data.files || []) {
            console.log(`[鑑定中] ${file.name} (ID: ${file.id}, Mime: ${file.mimeType})`);

            try {
                // ファイルの取得（画像想定）- ストリームを使用
                const fileRes = await drive.files.get({ fileId: file.id!, alt: 'media' }, { responseType: 'stream' });

                const chunks: any[] = [];
                const buffer = await new Promise<Buffer>((resolve, reject) => {
                    fileRes.data.on('data', (chunk: any) => chunks.push(chunk));
                    fileRes.data.on('end', () => resolve(Buffer.concat(chunks)));
                    fileRes.data.on('error', (err: any) => reject(err));
                });

                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = "この商品の画像から、市場相場、希少性、状態、将来の資産価値を鑑定してください。ビンテージ品やブランド品としての視点で専門的に分析してください。結果は簡潔なレポート形式（日本語）で出力してください。";

                const result = await model.generateContent([
                    prompt,
                    { inlineData: { mimeType: file.mimeType || 'image/jpeg', data: buffer.toString('base64') } }
                ]);

                const report = result.response.text();

                // 結果をメモファイルとして保存
                await drive.files.create({
                    requestBody: {
                        name: `${file.name}_鑑定結果.txt`,
                        parents: [folderId]
                    },
                    media: { mimeType: 'text/plain', body: report }
                });

                // 元ファイルを「鑑定済み」にリネーム（重複処理防止）
                await drive.files.update({
                    fileId: file.id!,
                    requestBody: { name: `${file.name}_鑑定済み` }
                });

                await logToJournal('資産鑑定部', `${file.name}の鑑定完了`, '完了');
            } catch (innerErr: any) {
                console.error(`[資産鑑定部] 個別ファイル処理エラー (${file.name}): ${innerErr.message}`);
            }
        }
    } catch (e: any) {
        console.error(`[資産鑑定部] エラー: ${e.message}`);
    }
}

/**
 * 2. 広報・福利厚生部 (GF Concierge)
 */
async function runGFConcierge() {
    console.log('[DEPT:広報・福利厚生] カレンダーをスキャン中...');
    try {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: nextWeek.toISOString(),
            q: 'デート予定'
        });

        for (const event of res.data.items || []) {
            if (event.description?.includes('【しおり】')) continue; // 既に追加済み

            console.log(`[コンシェルジュ] デート予定を検出: ${event.summary}`);

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = "三重県（津・伊勢中心）の旬のスイーツ（プリンやいちごなど）と、ソニーZV-E10で映えるフォトスポットを組み合わせた、最高のデート旅程表（しおり）を作成してください。1日の流れに沿って。";

            const result = await model.generateContent(prompt);
            const shiori = `\n\n【しおり】\n${result.response.text()}`;

            await calendar.events.patch({
                calendarId: 'primary',
                eventId: event.id!,
                requestBody: { description: (event.description || '') + shiori }
            });

            await logToJournal('広報・福利厚生部', `旅程表「しおり」を作成: ${event.summary}`, '完了');
        }
    } catch (e: any) {
        console.error(`[広報・福利厚生部] エラー: ${e.message}`);
    }
}

/**
 * 3. 財務戦略部 (Asset Management)
 */
async function runAssetManagement() {
    console.log('[DEPT:財務戦略] 市場分析を開始...');
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        // NOTE: 実際にはYahoo Finance等のAPIやSearchを使うべきだが、ここではGeminiの学習データ or 簡易検索結果を模して
        const prompt = "NVIDIA、BTC（ビットコイン）、NISA（オルカン/S&P500）の最新状況に基づき、現在の投資リスクを分析してください。朝の通勤時に読みやすいよう、結論を含めた「5行要約」で出力してください。";

        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        // スマホ通知とGoogle Homeで読み上げられるよう、カレンダーの終日予定（TODO）として追加
        const today = new Date().toISOString().split('T')[0];

        // 既存の今日の記録がないか確認
        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
            timeMax: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
            q: '【財務概況】'
        });

        if (res.data.items && res.data.items.length === 0) {
            await calendar.events.insert({
                calendarId: 'primary',
                requestBody: {
                    summary: `【財務概況】本日(${today})のリスク分析`,
                    description: summary,
                    start: { date: today }, // 終日予定
                    end: { date: today }
                }
            });
            await logToJournal('財務戦略部', '米国・日本市場クローズ後のリスク分析をカレンダーに登録', '完了');
        } else {
            console.log('[財務戦略部] 本日の分析は既にカレンダー登録済みです。');
        }
    } catch (e: any) {
        console.error(`[財務戦略部] エラー: ${e.message}`);
    }
}

/**
 * メインループ
 */
async function main() {
    console.log('[自分株式会社] 巡回セッションを開始...');
    await initializeResources(); // 毎回リソースチェック
    await runAssetAppraisal();
    await runGFConcierge();
    // 財務戦略は1日1回などが望ましいが、デモとして実行可能に
    const hour = new Date().getHours();
    if (hour === 8 || hour === 23) { // 朝8時または夜23時（適宜調整）
        await runAssetManagement();
    }
}

main();
setInterval(main, 10 * 60 * 1000); // 10分おき
