import { google } from 'googleapis';
import * as path from 'path';

const CREDENTIALS_PATH = path.resolve('/Users/nagahamakeigo/.gemini/antigravity/playground/chrono-intergalactic/worker/credentials.json');

const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function sendCommand(spreadsheetId: string, dept: string, command: string) {
    const timestamp = new Date().toISOString();
    const id = `CMD_${Date.now()}`;

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: '指示書!A2',
        valueInputOption: 'RAW',
        requestBody: {
            values: [[id, timestamp, dept, command, '待機中']],
        },
    });
    return id;
}
