import { google } from 'googleapis';
import * as path from 'path';

const CREDENTIALS_PATH = '/Users/nagahamakeigo/.gemini/antigravity/playground/chrono-intergalactic/worker/credentials.json';
const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/calendar'
    ],
});

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

async function setup() {
    console.log('[SETUP] 🏢 自分株式会社・新部門の初期設定を開始します...');

    // 1. 経営日誌の確認・作成
    const journalRes = await drive.files.list({
        q: "name = '自分株式会社・経営日誌' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
        fields: 'files(id)'
    });

    let journalId;
    if (journalRes.data.files && journalRes.data.files.length === 0) {
        const newSheet = await sheets.spreadsheets.create({
            requestBody: { properties: { title: '自分株式会社・経営日誌' } }
        });
        journalId = newSheet.data.spreadsheetId;
        console.log(`✅ 経営日誌を作成しました: ${journalId}`);
        await sheets.spreadsheets.values.update({
            spreadsheetId: journalId!,
            range: 'A1:D1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['日時', '部門', '活動内容', 'ステータス']] }
        });
    } else {
        journalId = journalRes.data.files?.[0].id;
        console.log(`ℹ️ 経営日誌は既に存在します: ${journalId}`);
    }

    // 2. 鑑定依頼フォルダの確認・作成
    const appraiseFolderRes = await drive.files.list({
        q: "name = '鑑定依頼' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: 'files(id)'
    });

    let appraiseFolderId;
    if (appraiseFolderRes.data.files && appraiseFolderRes.data.files.length === 0) {
        const newFolder = await drive.files.create({
            requestBody: { name: '鑑定依頼', mimeType: 'application/vnd.google-apps.folder' },
            fields: 'id'
        });
        appraiseFolderId = newFolder.data.id;
        console.log(`✅ 鑑定依頼フォルダを作成しました: ${appraiseFolderId}`);
    } else {
        appraiseFolderId = appraiseFolderRes.data.files?.[0].id;
        console.log(`ℹ️ 鑑定依頼フォルダは既に存在します: ${appraiseFolderId}`);
    }

    console.log('\n[SETUP] 完了。各種IDを記録してください。');
    console.log(`JOURNAL_ID: ${journalId}`);
    console.log(`APPRAISE_FOLDER_ID: ${appraiseFolderId}`);
}

setup().catch(console.error);
