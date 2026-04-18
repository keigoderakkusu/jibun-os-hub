import { google } from 'googleapis';
import * as path from 'path';

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve('worker/credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

async function setup() {
    try {
        console.log('Creating Spreadsheet...');
        const spreadsheet = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: '自分株式会社_データベース',
                },
                sheets: [
                    { properties: { title: '指示書' } },
                    { properties: { title: '実行結果' } },
                    { properties: { title: '部署一覧' } },
                    { properties: { title: '経理データ' } },
                ],
            },
        });

        const spreadsheetId = spreadsheet.data.spreadsheetId;
        console.log(`Spreadsheet created: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);

        // Initialize Headers
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: '指示書!A1:E1',
            valueInputOption: 'RAW',
            requestBody: { values: [['ID', 'タイムスタンプ', '部署', '指示内容', '状況']] },
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: '実行結果!A1:D1',
            valueInputOption: 'RAW',
            requestBody: { values: [['ID', '指示ID', '内容', '生成日時']] },
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: '部署一覧!A1:C1',
            valueInputOption: 'RAW',
            requestBody: { values: [['部署名', '状況', '現在のタスク']] },
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: '部署一覧!A2:C5',
            valueInputOption: 'RAW',
            requestBody: {
                values: [
                    ['営業部', '待機中', ''],
                    ['広報部', '待機中', ''],
                    ['マーケティング部', '待機中', ''],
                    ['経理部', '待機中', ''],
                ],
            },
        });

        // Grant access to user (Placeholder - you might need to share it manually to your main account)
        console.log('IMPORTANT: Please share the spreadsheet above with your own Google email address.');

    } catch (err) {
        console.error('Error setting up sheets:', err);
    }
}

setup();
