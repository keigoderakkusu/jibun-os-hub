import { google } from 'googleapis';
import * as path from 'path';

// 社長が手動作成したスプレッドシートID
const SPREADSHEET_ID = '1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M';

// 日本語のシート名に合わせる
const RANGE_INSTRUCTIONS = '指示書!A2:E';
const RANGE_RESULTS = '実行結果!A2:D';
const RANGE_DEPARTMENTS = '部署一覧!A2:C';

const CREDENTIALS_PATH = path.resolve('/Users/nagahamakeigo/.gemini/antigravity/playground/chrono-intergalactic/worker/credentials.json');

const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function pollInstructions() {
    try {
        console.log(`Checking ${SPREADSHEET_ID}...`);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE_INSTRUCTIONS,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            // console.log('待機中の指示はありません。');
            return;
        }

        for (let i = 0; i < rows.length; i++) {
            const [id, timestamp, department, command, status] = rows[i];
            if (status === '待機中' || status === 'Pending') {
                console.log(`指示 ${id} を ${department} で処理開始...`);
                await processInstruction(i + 2, id, department, command);
            }
        }
    } catch (err: any) {
        console.error('スプレッドシートの読み取り(GET)に失敗しました:', err.message);
    }
}

async function processInstruction(rowIndex: number, id: string, department: string, command: string) {
    // 1. ステータスを「実行中」に更新
    await updateStatus(rowIndex, '実行中');
    await updateDepartmentStatus(department, '稼働中', command);

    // 2. AI処理（シミュレーション）
    console.log(`エージェントが「${command}」を処理しています...`);
    const result = await simulateAIProcessing(department, command);

    // 3. 実行結果を書き込み
    const resId = `RES_${Date.now()}`;
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: '実行結果!A2',
        valueInputOption: 'RAW',
        requestBody: {
            values: [[resId, id, result, new Date().toLocaleString('ja-JP')]],
        },
    });

    // 4. ステータスを「完了」に更新
    await updateStatus(rowIndex, '完了');
    await updateDepartmentStatus(department, '待機中', '');
    console.log(`✅ 指示 ${id} の処理が完了しました。`);
}

async function updateStatus(rowIndex: number, status: string) {
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `指示書!E${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [[status]],
        },
    });
}

async function updateDepartmentStatus(deptName: string, status: string, task: string) {
    const depts = {
        '営業部': 2,
        '広報部': 3,
        'マーケティング部': 4,
        '経理部': 5
    };
    const rowIndex = (depts as any)[deptName];
    if (rowIndex) {
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `部署一覧!B${rowIndex}:C${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[status, task]],
            },
        });
    }
}

async function simulateAIProcessing(department: string, command: string): Promise<string> {
    // 20代若手社員をイメージした日本語レスポンス
    await new Promise(resolve => setTimeout(resolve, 5000));

    switch (department) {
        case '営業部':
            return `【営業部報告】「${command}」了解です！タイパ重視でSNSをフル活用したプランを作りました。ターゲットの刺さるポイントを絞って、即レスでクロージングまで持っていくイメージです！`;
        case '広報部':
            return `【広報部報告】お疲れ様です！「${command}」の件、Threadsとインスタで見栄えするキャッチコピーを考えました。今のトレンドに合わせたトーンで、拡散狙いでいきます！`;
        case 'マーケティング部':
            return `【マーケ部報告】了解っす！「${command}」について、TikTokの最新バズり傾向を分析しました。短尺動画で一気に認知広げるのが最短ルートだと思います！`;
        case '経理部':
            return `【経理部報告】承知いたしました。「${command}」に伴うコストとリターンを計算しました。今のキャッシュフローなら十分いけます。無理のない資金計画で進めましょう！`;
        default:
            return `処理が完了しました：${command}`;
    }
}

// 10秒ごとに監視
setInterval(pollInstructions, 10000);
console.log('--- 自分株式会社 AIワーカー 起動中 ---');
console.log(`対象スプレッドシート: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
