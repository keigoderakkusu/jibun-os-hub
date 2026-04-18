import { google } from 'googleapis';
import * as path from 'path';

const USER_EMAIL = 'keigo828n@gmail.com';
const CREDENTIALS_PATH = path.resolve('/Users/nagahamakeigo/.gemini/antigravity/playground/chrono-intergalactic/worker/credentials.json');

const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
    ],
});

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

async function autoCreate() {
    try {
        console.log('--- 自分株式会社 システム自動構築開始 (完全版) ---');

        // 1. Google Drive フォルダの作成
        console.log('1. Google Drive フォルダを作成中...');
        const folderResponse = await drive.files.create({
            requestBody: {
                name: '自分株式会社_システム管理',
                mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id',
        });

        const folderId = folderResponse.data.id;
        console.log(`✅ フォルダ作成完了 (ID: ${folderId})`);

        // 2. スプレッドシートの作成
        console.log('2. スプレッドシートを作成中...');
        const spreadsheetResponse = await drive.files.create({
            requestBody: {
                name: '自分株式会社_データベース',
                mimeType: 'application/vnd.google-apps.spreadsheet',
                parents: [folderId!],
            },
            fields: 'id',
        });

        const spreadsheetId = spreadsheetResponse.data.id!;
        console.log(`✅ スプレッドシート作成完了 (ID: ${spreadsheetId})`);

        // 3. 権限付与 (ユーザーに共有)
        console.log(`3. 社長 (${USER_EMAIL}) に編集権限を付与中...`);
        await drive.permissions.create({
            fileId: folderId!,
            requestBody: {
                type: 'user',
                role: 'writer',
                emailAddress: USER_EMAIL,
            },
        });
        // フォルダに付与すれば中身も継承されます
        console.log(`✅ 共有設定完了！`);

        // 4. シート構成を初期化
        console.log('4. シート構成を初期化中...');
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: spreadsheetId,
            requestBody: {
                requests: [
                    { addSheet: { properties: { title: '指示書' } } },
                    { addSheet: { properties: { title: '実行結果' } } },
                    { addSheet: { properties: { title: '部署一覧' } } },
                    { addSheet: { properties: { title: '経理データ' } } },
                    // デフォルトの Sheet1 を削除（最後に実行）
                    // 実際にはAPI経由の作成だとSheet1が存在するので、そのIDを確認して削除する必要があります
                    // 面倒なので追加だけにしておき、データ書き込み先を固定します
                ]
            }
        });

        console.log('5. 初期データを書き込み中...');
        const headerData = [
            { range: '指示書!A1:E1', values: [['ID', 'タイムスタンプ', '部署', '指示内容', '状況']] },
            { range: '実行結果!A1:D1', values: [['ID', '指示ID', '内容', '生成日時']] },
            { range: '部署一覧!A1:C1', values: [['部署名', '状況', '現在のタスク']] },
            {
                range: '部署一覧!A2:C5',
                values: [
                    ['営業部', '待機中', ''],
                    ['広報部', '待機中', ''],
                    ['マーケティング部', '待機中', ''],
                    ['経理部', '待機中', ''],
                ],
            }
        ];

        for (const data of headerData) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: data.range,
                valueInputOption: 'RAW',
                requestBody: { values: data.values },
            });
        }

        console.log('\n--- 構築完了！全自動化に成功しました ---');
        console.log(`スプレッドシートURL: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
        console.log(`フォルダURL: https://drive.google.com/drive/folders/${folderId}`);
        console.log(`\n社長のメールアドレス (${USER_EMAIL}) に共有済みです。`);

    } catch (err: any) {
        if (err.code === 403) {
            console.error('\n❌ エラー: 権限がありません (403)');
            console.error('原因: Google Cloud Console で "Google Sheets API" が有効になっていない可能性があります。');
            console.error(`解決策: 以下のURLを開き、「有効にする」を押してください (プロジェクト: my-private-dashboard-488201)`);
            console.error('👉 https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=my-private-dashboard-488201');
        } else {
            console.error('\n❌ エラーが発生しました:', err.message);
        }
    }
}

autoCreate();
