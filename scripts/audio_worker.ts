import { google } from 'googleapis';
import * as path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * 26歳からの人生攻略ロードマップ：全自動音声解析ワーカー (Node.js版)
 * 動作: Google Driveの指定フォルダを監視し、新規音声をGeminiで分析してスプレッドシートへ。
 */

const CONFIG = {
    GEMINI_API_KEY: 'AIzaSyCmEd3SGm3LqrlblJJQX9agDL0pOy9Nq6w',
    DRIVE_FOLDER_NAME: 'VRS_Audio_Input',
    ROADMAP_SHEET_ID: '1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M',
    CREDENTIALS_PATH: path.resolve('/Users/nagahamakeigo/.gemini/antigravity/playground/chrono-intergalactic/worker/credentials.json'),
    INTERVAL_MS: 5 * 60 * 1000 // 5分おき
};

const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
const auth = new google.auth.GoogleAuth({
    keyFile: CONFIG.CREDENTIALS_PATH,
    scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
    ],
});

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

async function runWorker() {
    console.log('[AUDIO-WORKER] 🚀 起動しました。Google Driveを監視します...');

    try {
        // 1. 監視フォルダのIDを取得（なければ作成）
        let folderId = await getFolderId(CONFIG.DRIVE_FOLDER_NAME);
        if (!folderId) {
            console.log(`[AUDIO-WORKER] 📁 フォルダ「${CONFIG.DRIVE_FOLDER_NAME}」を作成します...`);
            folderId = await createFolder(CONFIG.DRIVE_FOLDER_NAME, ''); // ルートに作成
        }

        // 2. 処理済みフォルダの準備
        let processedFolderId = await getFolderId('Processed', folderId);
        if (!processedFolderId) {
            processedFolderId = await createFolder('Processed', folderId);
        }

        // 3. フォルダ内のファイルをリストアップ
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
            fields: 'files(id, name, mimeType)'
        });

        const files = res.data.files || [];
        console.log(`[AUDIO-WORKER] 📁 ${files.length} 件の未処理ファイルを検出しました。`);

        for (const file of files) {
            await processFile(file, processedFolderId!);
        }

    } catch (error: any) {
        console.error('[AUDIO-WORKER] ⚠️ エラー発生:', error.message);
    }
}

async function processFile(file: any, processedFolderId: string) {
    console.log(`[AUDIO-WORKER] 🎙️ 処理開始: ${file.name}`);

    try {
        // A. ファイルをテンポラリにダウンロード
        const filePath = path.join('/tmp', file.name);
        const dest = fs.createWriteStream(filePath);

        const driveRes = await drive.files.get(
            { fileId: file.id, alt: 'media' },
            { responseType: 'stream' }
        );

        await new Promise((resolve, reject) => {
            driveRes.data
                .on('end', () => resolve(true))
                .on('error', err => reject(err))
                .pipe(dest);
        });

        // B. Gemini 1.5 で音声解析
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const audioData = fs.readFileSync(filePath);

        const result = await model.generateContent([
            "あなたは26歳の若者の人生戦略アドバイザーです。この音声（思考の断片）を解析し、「将来への野望」「現在の悩み」「具体的戦略」の3点を抽出し、ロードマップ形式で要約してください。最後には若者がやる気になる一言を添えてください。",
            {
                inlineData: {
                    mimeType: file.mimeType || 'audio/mpeg',
                    data: audioData.toString('base64')
                }
            }
        ]);

        const analysis = result.response.text();
        console.log(`[AUDIO-WORKER] ✨ Gemini分析完了`);

        // C. スプレッドシートに書き込み
        await appendToSheet(file.name, analysis);

        // D. ファイルをProcessedへ移動
        await drive.files.update({
            fileId: file.id,
            addParents: processedFolderId,
            removeParents: (await drive.files.get({ fileId: file.id, fields: 'parents' })).data.parents?.join(','),
            fields: 'id, parents'
        });

        // E. テンポラリファイルを削除
        fs.unlinkSync(filePath);
        console.log(`[AUDIO-WORKER] ✅ 完了: ${file.name}`);

    } catch (err: any) {
        console.error(`[AUDIO-WORKER] ❌ ファイル処理失敗 (${file.name}):`, err.message);
    }
}

async function appendToSheet(fileName: string, analysis: string) {
    const timestamp = new Date().toLocaleString('ja-JP');
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.ROADMAP_SHEET_ID,
            range: '人生ロードマップ!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[timestamp, fileName, analysis]]
            }
        });
    } catch (err: any) {
        console.error(`[AUDIO-WORKER] ⚠️ シート追記失敗:`, err.message);
    }
}

async function getFolderId(name: string, parentId: string | null = null) {
    let q = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentId) q += ` and '${parentId}' in parents`;

    const res = await drive.files.list({ q, fields: 'files(id)' });
    return res.data.files?.[0]?.id;
}

async function createFolder(name: string, parentId: string | null = null) {
    const requestBody: any = {
        name,
        mimeType: 'application/vnd.google-apps.folder'
    };
    if (parentId) requestBody.parents = [parentId];

    const res = await drive.files.create({
        requestBody,
        fields: 'id'
    });
    return res.data.id;
}

// 実行
runWorker();
setInterval(runWorker, CONFIG.INTERVAL_MS);
