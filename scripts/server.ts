import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { google } from 'googleapis';
import * as path from 'path';
import * as os from 'os';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs-extra';
import { JSDOM } from 'jsdom';

// Puppeteer: 起動失敗してもサーバーがクラッシュしないよう遅延ロード
async function launchBrowser() {
    try {
        const pup = await import('puppeteer');
        return await pup.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
    } catch (e: any) {
        throw new Error(`Browser unavailable: ${e.message}`);
    }
}

const execPromise = util.promisify(exec);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const DEFAULT_SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M';

app.use(cors());
app.use(bodyParser.json());

// Google認証: Render環境では GOOGLE_CREDENTIALS_JSON 環境変数 (base64) を使用
const CREDENTIALS_PATH = path.join(process.cwd(), 'worker/credentials.json');
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
];

let auth: any;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
    const creds = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf-8'));
    auth = new google.auth.GoogleAuth({ credentials: creds, scopes: SCOPES });
} else {
    auth = new google.auth.GoogleAuth({ keyFile: CREDENTIALS_PATH, scopes: SCOPES });
}
const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

app.post('/api/command', async (req: any, res: any) => {
    let { spreadsheetId, dept, command } = req.body;
    try {
        if (!spreadsheetId || spreadsheetId === 'AUTO' || spreadsheetId === 'DUMMY') {
            spreadsheetId = DEFAULT_SPREADSHEET_ID;
        }

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
        res.json({ success: true, id });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ローカル管理用のスクリプト起動API (Mac専用: Render環境では無効)
app.post('/api/run-script', async (req: any, res: any) => {
    if (process.env.RENDER) {
        return res.status(403).json({ success: false, error: 'このAPIはクラウド環境では利用できません。自宅Macからのみ実行可能です。' });
    }
    const { scriptPath } = req.body;
    try {
        if (!scriptPath) {
            return res.status(400).json({ success: false, error: 'scriptPath is required' });
        }
        const allowedScripts = [
            'n8n_sns_affiliate/start_sns_system.command',
            '自動スクショ/batch-screenshot.sh',
            'setup_flowise.command',
            'setup_pocketbase.command',
            'setup_anythingllm.command'
        ];
        if (!allowedScripts.includes(scriptPath)) {
            return res.status(403).json({ success: false, error: 'Unauthorized script execution' });
        }
        const absPath = path.join(process.cwd(), scriptPath);
        if (scriptPath.endsWith('.sh') || scriptPath.endsWith('.command')) {
            await execPromise(`chmod +x "${absPath}"`);
            await execPromise(`open -a Terminal "${absPath}"`);
        }
        res.json({ success: true, message: 'Script launched in new terminal' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});


app.get('/api/inputs', async (req: any, res: any) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: DEFAULT_SPREADSHEET_ID,
            range: 'インプット!A:E',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Assuming headers: [日付, タスク名, タイトル, URL, スニペット]
        // Returning reverse chronological order (newest first)
        const data = rows.slice(1).reverse().map((row) => ({
            date: row[0] || '',
            taskName: row[1] || '',
            title: row[2] || '',
            url: row[3] || '',
            snippet: row[4] || ''
        }));

        res.json({ success: true, data });
    } catch (err: any) {
        console.error('Failed to fetch inputs:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/api/agent/stream' });

// ==========================================
// 🤖 Auto-CEO Agent (Claude Code-like)
// ==========================================

const sysPrompt = `あなたは優秀なAIエージェント「JIBUN-OS Auto-CEO」です。
ユーザー（社長）からの指示に従い、Macのターミナルコマンドを実行したり、ファイルを読み書きしてタスクを解決します。
考える過程や説明は簡潔にし、必要なツールを積極的に呼び出してください。`;

const tools: any = [{
    functionDeclarations: [
        {
            name: "execute_command",
            description: "Run a shell command on the macOS terminal (e.g. ls, cat, npm, etc).",
            parameters: {
                type: "object",
                properties: { command: { type: "string", description: "The shell command to execute" } },
                required: ["command"]
            }
        },
        {
            name: "read_file",
            description: "Read the contents of a file.",
            parameters: {
                type: "object",
                properties: { filePath: { type: "string", description: "Absolute or relative path to the file" } },
                required: ["filePath"]
            }
        },
        {
            name: "search_web",
            description: "Search the web using Google to find recent articles or information. Returns a list of titles and URLs.",
            parameters: {
                type: "object",
                properties: { query: { type: "string", description: "The search query" } },
                required: ["query"]
            }
        },
        {
            name: "read_webpage",
            description: "Read the main text content of a specified web page URL.",
            parameters: {
                type: "object",
                properties: { url: { type: "string", description: "The URL of the webpage to read" } },
                required: ["url"]
            }
        },
        {
            name: "save_to_drive",
            description: "Save a text document or research summary directly to the user's Google Drive in a folder named 'リサーチDB'.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "The title of the document (should not include .txt extension)" },
                    content: { type: "string", description: "The main text content to save" }
                },
                required: ["title", "content"]
            }
        },
        {
            name: "generate_sns_content",
            description: "Generate highly optimized content for X(Twitter), Instagram, and TikTok based on a given theme or information, and save it to Google Drive 'SNS投稿ストック' folder.",
            parameters: {
                type: "object",
                properties: {
                    theme: { type: "string", description: "The theme, keywords, or raw information to base the SNS posts on" }
                },
                required: ["theme"]
            }
        },
        {
            name: "analyze_market_trends",
            description: "Analyze market trends and identify promising stocks and cryptocurrencies based on a specific theme or recent event (e.g. '日米首脳会議', '最新のAI動向'). Returns a detailed analysis report and saves it to Google Drive.",
            parameters: {
                type: "object",
                properties: {
                    theme: { type: "string", description: "The theme, news event, or market sector to analyze for promising investment targets." }
                },
                required: ["theme"]
            }
        },
        {
            name: "deploy_gas_backend",
            description: "Push local GAS code to Google servers, deploy it, and update the Flutter client service URL.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    ]
}];

// Generic helper function for Drive folders
async function getOrCreateDriveFolder(folderName: string, parentId?: string): Promise<string> {
    const ROOT_RESEARCH_DB_ID = '1pAWXorwNyu9ekUd5V56gZcQprZVRREbJ'; // The reliable shared folder ID
    try {
        if (folderName === 'リサーチDB') return ROOT_RESEARCH_DB_ID;

        const effectiveParentId = parentId || ROOT_RESEARCH_DB_ID;
        const query = `name = '${folderName}' and '${effectiveParentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

        const res = await drive.files.list({
            q: query,
            fields: 'files(id)'
        });
        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0].id!;
        }

        console.log(`[Auto-CEO] 📁 フォルダ「${folderName}」を新規作成します...`);
        const createRes = await drive.files.create({
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [effectiveParentId]
            },
            fields: 'id',
            supportsAllDrives: true
        });
        return createRes.data.id!;
    } catch (e: any) {
        throw new Error(`Folder creation failed for ${folderName}: ${e.message}`);
    }
}

wss.on('connection', (ws: WebSocket) => {
    console.log('[Auto-CEO] 🔗 ターミナル接続が確立されました');
    let chatSession: any = null;

    ws.on('message', async (message: string) => {
        try {
            const req = JSON.parse(message);
            const userText = req.text;
            ws.send(JSON.stringify({ type: 'status', message: '思考中...' }));

            if (!chatSession) {
                const model = genAI.getGenerativeModel({
                    model: 'gemini-2.5-flash',
                    systemInstruction: sysPrompt,
                    tools: tools,
                });
                chatSession = model.startChat({});
            }

            let response;
            try {
                response = await chatSession.sendMessage(userText);
            } catch (err: any) {
                if (err.status === 429 || err.message?.includes('429')) {
                    throw Object.assign(new Error("429 Too Many Requests"), { status: 429 });
                }
                throw err;
            }

            // Tool call loop
            while (response.response.functionCalls && response.response.functionCalls().length > 0) {
                const call = response.response.functionCalls()[0];
                const fnName = call.name;
                const args = call.args;

                ws.send(JSON.stringify({ type: 'tool_call', name: fnName, args: args }));
                console.log(`[Auto-CEO] ツール実行: ${fnName}`, args);

                let toolResult = "";
                try {
                    if (fnName === 'execute_command') {
                        const { stdout, stderr } = await execPromise(args.command as string, { cwd: process.cwd() });
                        toolResult = stdout || stderr || "Command executed successfully (no output).";
                    } else if (fnName === 'read_file') {
                        toolResult = await fs.readFile(args.filePath as string, 'utf-8');
                    } else if (fnName === 'search_web') {
                        const browser = await launchBrowser();
                        const page = await browser.newPage();
                        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

                        const q = encodeURIComponent(args.query as string);
                        await page.goto(`https://news.google.com/search?q=${q}&hl=ja&gl=JP&ceid=JP:ja`, { waitUntil: 'networkidle2' });

                        const results = await page.evaluate(() => {
                            const links = Array.from(document.querySelectorAll('a'));
                            const unique = new Map();
                            for (const link of links) {
                                const title = link.innerText.trim();
                                const href = link.getAttribute('href');
                                if (title.length > 15 && href && (href.startsWith('./read') || href.includes('articles'))) {
                                    let url = href;
                                    if (url.startsWith('.')) url = 'https://news.google.com' + url.substring(1);
                                    if (!unique.has(title)) {
                                        unique.set(title, { title, url });
                                    }
                                }
                                if (unique.size >= 5) break;
                            }
                            return Array.from(unique.values());
                        });
                        await browser.close();
                        toolResult = JSON.stringify(results, null, 2);

                    } else if (fnName === 'read_webpage') {
                        const url = args.url as string;
                        try {
                            const browser = await launchBrowser();
                            const page = await browser.newPage();
                            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

                            // Go to the URL and wait for redirects and initial render
                            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

                            // Wait a bit extra just in case of slow JS redirects like Google News
                            await new Promise(r => setTimeout(r, 3000));

                            const text = await page.evaluate(() => {
                                // Try to extract from common article containers first
                                const article = document.querySelector('article, main, .post-content, .article-body, .entry-content');
                                if (article) return article.textContent;

                                // Fallback to raw body text without scripts/styles
                                const body = document.body.cloneNode(true) as HTMLElement;
                                body.querySelectorAll('script, style, nav, footer, header, aside, .ad').forEach(el => el.remove());
                                return body.textContent;
                            });

                            await browser.close();
                            toolResult = text?.replace(/\s+/g, ' ').trim().substring(0, 15000) || "No content found on the page.";
                        } catch (e: any) {
                            toolResult = `Failed to read webpage: ${e.message}`;
                        }

                    } else if (fnName === 'save_to_drive') {
                        const folderId = await getOrCreateDriveFolder('リサーチDB');
                        const title = args.title as string;
                        const content = args.content as string;

                        const createRes = await drive.files.create({
                            requestBody: {
                                name: `${title}.txt`,
                                parents: folderId ? [folderId] : ['1pAWXorwNyu9ekUd5V56gZcQprZVRREbJ']
                            },
                            media: { mimeType: 'text/plain', body: content },
                            fields: 'id, webViewLink',
                            supportsAllDrives: true
                        });

                        toolResult = `Successfully saved to Google Drive!\nFile ID: ${createRes.data.id}\nLink: ${createRes.data.webViewLink}`;

                    } else if (fnName === 'generate_sns_content') {
                        const theme = args.theme as string;
                        try {
                            // 1. Generate Content using Gemini
                            const snsModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                            const prompt = `あなたはSNSマーケティングのプロフェッショナルです。以下のテーマについて、X(Twitter)、Instagram、TikTokの3媒体に向けた最適な投稿コンテンツを作成してください。フォロワー1万人を目指すためのバズる構成を意識してください。

【テーマ・トピック】
${theme}

【出力要件】
1. X (Twitter) 用
- 140文字以内で、目を引くフック（最初の1行）を作る。
- ハッシュタグを2〜3個つける。
- 長くなる場合はスレッド形式（ツリー投稿）の構成案も出す。

2. Instagram 用
- 文字入り画像（カルーセル投稿）を想定した構成。
- 1枚目（表紙）：キャッチーなタイトル
- 2〜5枚目：図解や箇条書きのテキスト案
- 最後の枚数：保存やフォローを促すCTA（Call to Action）
- 投稿用のキャプション文とハッシュタグ（最大10個）

3. TikTok / リール縦型動画 用
- 15秒〜60秒を想定した動画の台本。
- 【0-2秒】フック：視聴維持率を高める強烈な一言
- 【3-12秒】展開：具体的な情報やノウハウをテンポ良く
- 【13-15秒】オチ・CTA：プロフィールへの誘導やオチテキスト
- 撮影のコツや、画像生成AI（Midjourney等）を使う場合のプロンプト案

出力はマークダウン形式できれいに整形してください。`;

                            let snsContent = "";
                            try {
                                const snsModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                                const genResult = await snsModel.generateContent(prompt);
                                snsContent = genResult.response.text();
                            } catch (apiErr: any) {
                                if (apiErr.status === 429 || apiErr.message?.includes('429')) {
                                    throw Object.assign(new Error("429 Too Many Requests"), { status: 429 });
                                }
                                throw apiErr;
                            }

                            // 2. Save to Drive
                            const rootFolderId = await getOrCreateDriveFolder('リサーチDB');
                            const folderId = await getOrCreateDriveFolder('SNS投稿ストック', rootFolderId);
                            const todayStr = new Date().toISOString().split('T')[0];
                            const docTitle = `SNSコンテンツ案_${todayStr}_${theme.substring(0, 10)}`;

                            const createRes = await drive.files.create({
                                requestBody: {
                                    name: `${docTitle}.txt`,
                                    parents: folderId ? [folderId] : ['1pAWXorwNyu9ekUd5V56gZcQprZVRREbJ']
                                },
                                media: { mimeType: 'text/plain', body: snsContent },
                                fields: 'id, webViewLink',
                                supportsAllDrives: true
                            });

                            toolResult = `SNSコンテンツの生成に成功し、Driveの「SNS投稿ストック」フォルダに保存しました。\nプレビュー:\n${snsContent.substring(0, 300)}...\n\nDriveリンク: ${createRes.data.webViewLink}`;

                        } catch (e: any) {
                            toolResult = `Failed to generate SNS content: ${e.message}`;
                        }

                    } else if (fnName === 'analyze_market_trends') {
                        const theme = args.theme as string;
                        try {
                            ws.send(JSON.stringify({ type: 'status', message: `🔍 「${theme}」について市場調査を開始...` }));

                            // 1. Web Search for context (using same logic as search_web)
                            const browser = await launchBrowser();
                            const page = await browser.newPage();
                            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

                            const q = encodeURIComponent(theme + " (株 OR 銘柄 OR 仮想通貨 OR 暗号資産)");
                            await page.goto(`https://news.google.com/search?q=${q}&hl=ja&gl=JP&ceid=JP:ja`, { waitUntil: 'networkidle2' });

                            const searchResults = await page.evaluate(() => {
                                const links = Array.from(document.querySelectorAll('a'));
                                const unique = new Map();
                                for (const link of links) {
                                    const title = link.innerText.trim();
                                    const href = link.getAttribute('href');
                                    if (title.length > 15 && href && (href.startsWith('./read') || href.includes('articles'))) {
                                        if (!unique.has(title)) unique.set(title, title);
                                    }
                                    if (unique.size >= 15) break; // Get top 15 headlines for context
                                }
                                return Array.from(unique.values()).join('\n- ');
                            });
                            await browser.close();

                            ws.send(JSON.stringify({ type: 'status', message: `🧠 収集した情報を元にGeminiアナリストが分析中...` }));

                            // 2. Analyze with Gemini
                            const analystModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                            const prompt = `あなたはプロの金融アナリストおよび仮想通貨トレーダーです。以下のテーマと、それに関する最新のニュース見出しを元に、これから個人的に伸びそうだと予測される「株（日本株・米国株）」および「仮想通貨（暗号資産）」の銘柄をリストアップし、その分析レポートを作成してください。

【テーマ】
${theme}

【直近の関連ニュース見出し】
- ${searchResults}

【出力要件】
1. **全体サマリー**: このテーマが市場に与える影響の全体観
2. **注目の株式銘柄 (2〜3銘柄)**: 具体的な銘柄名、選定理由、上昇ストーリー
3. **注目の仮想通貨 (1〜2銘柄)**: 具体的な通貨名、選定理由、リスク要因
4. **全体のリスク・懸念点**: 投資する上での注意点

※ 出力はMarkdown形式できれいに整形し、断定的な表現（絶対儲かる等）は避けて論理的な推測として記述してください。`;

                            let reportContent = "";
                            try {
                                const genResult = await analystModel.generateContent(prompt);
                                reportContent = genResult.response.text();
                            } catch (apiErr: any) {
                                if (apiErr.status === 429 || apiErr.message?.includes('429')) {
                                    throw Object.assign(new Error("429 Too Many Requests"), { status: 429 });
                                }
                                throw apiErr;
                            }

                            // 3. Save to Drive
                            ws.send(JSON.stringify({ type: 'status', message: `💾 分析レポートをDriveに保存中...` }));
                            const rootFolderId = await getOrCreateDriveFolder('リサーチDB');
                            const folderId = await getOrCreateDriveFolder('市場分析レポート', rootFolderId);
                            const todayStr = new Date().toISOString().split('T')[0];
                            const docTitle = `市場分析_${todayStr}_${theme.substring(0, 15)}`;

                            const createRes = await drive.files.create({
                                requestBody: {
                                    name: `${docTitle}.md`,
                                    parents: folderId ? [folderId] : ['1pAWXorwNyu9ekUd5V56gZcQprZVRREbJ']
                                },
                                media: { mimeType: 'text/markdown', body: reportContent },
                                fields: 'id, webViewLink',
                                supportsAllDrives: true
                            });

                            toolResult = `市場トレンドの分析に成功し、「市場分析レポート」フォルダに保存しました。\nプレビュー:\n${reportContent.substring(0, 300)}...\n\nDriveリンク: ${createRes.data.webViewLink}`;

                        } catch (e: any) {
                            toolResult = `Failed to analyze market trends: ${e.message}`;
                        }

                    } else if (fnName === 'deploy_gas_backend') {
                        try {
                            const gasDir = path.join(process.cwd(), 'bitcoin_app/gas');
                            ws.send(JSON.stringify({ type: 'status', message: '🚀 GASコードをアップロード中 (clasp push)...' }));

                            // 1. Clasp Push
                            await execPromise('clasp push --force', { cwd: gasDir });

                            ws.send(JSON.stringify({ type: 'status', message: '📦 ウェブアプリとしてデプロイ中 (clasp deploy)...' }));

                            // 2. Clasp Deploy
                            const { stdout: deployOut } = await execPromise('clasp deploy --description "Auto-CEO Deployment"', { cwd: gasDir });

                            // Extract Deployment ID: usually looks like "- <ID> @<Version>"
                            const match = deployOut.match(/- ([A-Za-z0-9_-]+) @/);
                            if (!match) throw new Error(`デプロイIDの取得に失敗しました: ${deployOut}`);

                            const deploymentId = match[1];
                            const webAppUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;

                            ws.send(JSON.stringify({ type: 'status', message: '📱 Flutter側のURLを更新中...' }));

                            // 3. Update Flutter (Dart) Service
                            const dartPath = path.join(gasDir, 'gas_service.dart');
                            if (await fs.pathExists(dartPath)) {
                                let content = await fs.readFile(dartPath, 'utf-8');
                                // Look for static const String _gasUrl = '...';
                                const updatedContent = content.replace(/static const String _gasUrl = '[^']+';/, `static const String _gasUrl = '${webAppUrl}';`);
                                await fs.writeFile(dartPath, updatedContent);
                            }

                            // 4. Update secondary Flutter path if exists
                            const altDartPath = path.join(process.cwd(), 'bitcoin_app/lib/services/gas_service.dart');
                            if (await fs.pathExists(altDartPath)) {
                                let content = await fs.readFile(altDartPath, 'utf-8');
                                const updatedContent = content.replace(/static const String _gasUrl = '[^']+';/, `static const String _gasUrl = '${webAppUrl}';`);
                                await fs.writeFile(altDartPath, updatedContent);
                            }

                            toolResult = `✅ GASデプロイが完了しました！\nURL: ${webAppUrl}\nFlutter側のURLも自動更新されました。`;

                        } catch (e: any) {
                            toolResult = `GASデプロイエラー: ${e.message}`;
                        }

                    } else {
                        toolResult = `Error: Tool ${fnName} not found.`;
                    }
                } catch (e: any) {
                    toolResult = `Execution Error: ${e.message}`;
                }

                ws.send(JSON.stringify({ type: 'tool_result', result: toolResult.substring(0, 500) + (toolResult.length > 500 ? '...' : '') }));

                // Send result back to model
                response = await chatSession.sendMessage([{
                    functionResponse: {
                        name: fnName,
                        response: { name: fnName, content: { result: toolResult } }
                    }
                }]);
            }

            if (response.response.text()) {
                ws.send(JSON.stringify({ type: 'text', text: response.response.text() }));
            }
            ws.send(JSON.stringify({ type: 'done' }));

        } catch (error: any) {
            console.error('[Auto-CEO] Error:', error);

            let errorMessage = `Agent Error: ${error.message}`;
            if (error.status === 429 || error.message.includes('429 Too Many Requests') || error.message.includes('Quota exceeded')) {
                errorMessage = "⚠️ AIの利用上限（1分間に15回の無料枠）に達しました。約1分待ってから再度お試しください。";
            }

            ws.send(JSON.stringify({ type: 'error', text: errorMessage }));
            ws.send(JSON.stringify({ type: 'done' }));
        }
    });

    ws.on('close', () => {
        console.log('[Auto-CEO] 🔌 ターミナル接続が切断されました');
    });
});


// 本番環境: Viteビルド済み静的ファイルを配信
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/.*/, (req: any, res: any) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
}

httpServer.listen(port, '0.0.0.0', () => {
    console.log(`\n🚀 JIBUN-OS Server running on port ${port}`);
    console.log(`   - API:  http://localhost:${port}/api`);
    console.log(`   - Web:  http://localhost:${port}`);
});
