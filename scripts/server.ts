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


// ════════════════════════════════════════════════════════════
//  CoupleOS API  (/api/calendar, /api/timetree, /api/restaurants, /api/ai, /api/plans, /api/events)
// ════════════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk';

const COUPLE_DB_PATH = path.join(process.cwd(), 'data', 'couple-os.json');

interface CoupleDB {
  plans: any[];
  lifeEvents: any[];
  restaurantFavorites: any[];
  _nextId: { plans: number; events: number };
}

const DEFAULT_DB: CoupleDB = { plans: [], lifeEvents: [], restaurantFavorites: [], _nextId: { plans: 1, events: 1 } };

function readCoupleDB(): CoupleDB {
  try {
    if (fs.existsSync(COUPLE_DB_PATH)) return JSON.parse(fs.readFileSync(COUPLE_DB_PATH, 'utf-8'));
  } catch {}
  return { ...DEFAULT_DB, _nextId: { plans: 1, events: 1 } };
}
function writeCoupleDB(db: CoupleDB) {
  fs.mkdirpSync(path.dirname(COUPLE_DB_PATH));
  fs.writeFileSync(COUPLE_DB_PATH, JSON.stringify(db, null, 2));
}

// ── Google Calendar ──────────────────────────────────────
function getCalendarAuth() {
  const credRaw  = process.env.GOOGLE_CREDENTIALS_JSON;
  const tokenRaw = process.env.GOOGLE_CALENDAR_TOKEN_JSON || process.env.GOOGLE_TOKEN_JSON;
  if (!credRaw) throw new Error('GOOGLE_CREDENTIALS_JSON not set');
  const parsed   = JSON.parse(credRaw);
  const cred     = parsed.installed ?? parsed.web ?? parsed;
  const oauth2   = new google.auth.OAuth2(cred.client_id, cred.client_secret, (cred.redirect_uris || ['urn:ietf:wg:oauth:2.0:oob'])[0]);
  if (tokenRaw) oauth2.setCredentials(JSON.parse(tokenRaw));
  return oauth2;
}

app.get('/api/calendar/events', async (req: any, res: any) => {
  try {
    const cal    = google.calendar({ version: 'v3', auth: getCalendarAuth() });
    const result = await cal.events.list({ calendarId: 'primary', timeMin: req.query.from, timeMax: req.query.to, singleEvents: true, orderBy: 'startTime', maxResults: 100 });
    res.json((result.data.items ?? []).map((e: any) => ({
      id: e.id, title: e.summary ?? '(タイトルなし)',
      start: e.start?.dateTime ?? e.start?.date ?? '',
      end:   e.end?.dateTime   ?? e.end?.date   ?? '',
      allDay: !e.start?.dateTime, location: e.location, source: 'google',
    })));
  } catch (e: any) { console.error('[Calendar]', e.message); res.json([]); }
});

app.post('/api/calendar/events', async (req: any, res: any) => {
  try {
    const cal    = google.calendar({ version: 'v3', auth: getCalendarAuth() });
    const { title, start, end, location } = req.body;
    const result = await cal.events.insert({ calendarId: 'primary', requestBody: { summary: title, start: { dateTime: start }, end: { dateTime: end }, location } });
    res.json({ ...result.data, source: 'google' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/calendar/events/:id', async (req: any, res: any) => {
  try {
    await google.calendar({ version: 'v3', auth: getCalendarAuth() }).events.delete({ calendarId: 'primary', eventId: req.params.id });
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── TimeTree ─────────────────────────────────────────────
app.get('/api/timetree/events', async (req: any, res: any) => {
  const token = process.env.TIMETREE_TOKEN;
  if (!token) return res.json([]);
  try {
    const calRes = await fetch('https://timetreeapis.com/calendars', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.timetree.v1+json' } });
    if (!calRes.ok) throw new Error(`TimeTree calendars: ${calRes.status}`);
    const calData = await calRes.json() as any;
    const from = new Date(req.query.from as string);
    const to   = new Date(req.query.to   as string);
    const all  = await Promise.all(calData.data.map(async (c: any) => {
      const evRes = await fetch(`https://timetreeapis.com/calendars/${c.id}/upcoming_events?timezone=Asia%2FTokyo&days=60`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.timetree.v1+json' } });
      if (!evRes.ok) return [];
      const evData = await evRes.json() as any;
      return (evData.data ?? []).map((e: any) => ({
        id: `tt-${e.id}`, title: e.attributes?.title ?? '(タイトルなし)',
        start: e.attributes?.start_at ?? '', end: e.attributes?.end_at ?? '',
        allDay: e.attributes?.all_day ?? false, source: 'timetree',
      })).filter((e: any) => { const d = new Date(e.start); return d >= from && d <= to; });
    }));
    res.json(all.flat());
  } catch (e: any) { console.error('[TimeTree]', e.message); res.json([]); }
});

// ── Restaurants ──────────────────────────────────────────
app.get('/api/restaurants/search', async (req: any, res: any) => {
  const apiKey = process.env.HOTPEPPER_API_KEY;
  const { keyword, lat, lng, range = '3', genre, count = '20' } = req.query;
  if (!apiKey) return res.json([
    { id:'mock1', name:'桜亭', genre:'和食', address:'東京都渋谷区', access:'渋谷駅徒歩5分', budget:'3,000〜4,000円' },
    { id:'mock2', name:'BISTRO ROSE', genre:'フレンチ', address:'東京都渋谷区', access:'渋谷駅徒歩3分', budget:'5,000〜8,000円' },
    { id:'mock3', name:'月光カフェ', genre:'カフェ', address:'東京都表参道', access:'表参道駅徒歩8分', budget:'1,000〜2,000円' },
  ]);
  try {
    const p = new URLSearchParams({ key: apiKey, format: 'json', count });
    if (keyword) p.set('keyword', keyword); if (lat) p.set('lat', lat); if (lng) p.set('lng', lng);
    if (lat && lng) p.set('range', range); if (genre) p.set('genre', genre);
    const data = await (await fetch(`https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?${p}`)).json() as any;
    res.json((data.results?.shop ?? []).map((s: any) => ({ id:s.id, name:s.name, genre:s.genre?.name, address:s.address, access:s.access, budget:s.budget?.average, urls:s.urls?.pc, photo:s.photo?.mobile?.l, lat:s.lat, lng:s.lng })));
  } catch (e: any) { res.json([]); }
});

app.get ('/api/restaurants/favorites',     (req: any, res: any) => res.json(readCoupleDB().restaurantFavorites));
app.post('/api/restaurants/favorites',     (req: any, res: any) => { const db = readCoupleDB(); db.restaurantFavorites = db.restaurantFavorites.filter((f:any) => f.id !== req.body.id); db.restaurantFavorites.push(req.body); writeCoupleDB(db); res.json(req.body); });
app.delete('/api/restaurants/favorites/:id', (req: any, res: any) => { const db = readCoupleDB(); db.restaurantFavorites = db.restaurantFavorites.filter((f:any) => f.id !== req.params.id); writeCoupleDB(db); res.json({ ok: true }); });

// ── AI Planner ───────────────────────────────────────────
async function generatePlan(type: 'date'|'travel', params: any): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return `[ANTHROPIC_API_KEY が未設定です]\n\nパラメータ: ${JSON.stringify(params, null, 2)}`;
  const client = new Anthropic({ apiKey });
  let prompt = '';
  if (type === 'date') {
    prompt = `あなたはカップルのデートプランを考えるプロのプランナーです。以下の条件で具体的なデートプランを作成してください。\n\nエリア: ${params.area}\n予算: ${Number(params.budget).toLocaleString()}円（2人合計）\n気分: ${params.mood}\n所要時間: ${params.duration}\n\n【プランタイトル】\n（キャッチーなタイトル）\n\n【タイムライン】\nHH:MM 〜 HH:MM : スポット名 / 内容（予算目安）\n（3〜6項目）\n\n【ポイント】\n•（おすすめポイント3つ）\n\n【予算内訳】\n交通費・食費・入場料などの目安`;
  } else {
    const days = Number(params.nights) + 1;
    prompt = `あなたはカップル旅行のプロのプランナーです。以下の条件で詳細な旅行プランを作成してください。\n\n目的地: ${params.destination}\n泊数: ${params.nights}泊${days}日\n予算: ${Number(params.budget).toLocaleString()}円（2人合計）\nテーマ: ${params.theme}\n\n【旅行プランタイトル】\n（キャッチーなタイトル）\n\n${Array.from({length:days},(_,i)=>`【${i+1}日目】\n午前: スポット + 説明\n昼食: お店の提案\n午後: スポット + 説明\n${i<Number(params.nights)?'夕食・宿泊: お店・宿の提案':'帰路'}`).join('\n\n')}\n\n【予算内訳】\n交通費・宿泊費・食費・観光費の目安\n\n【持ち物リスト】\n•（3〜5項目）`;
  }
  const msg = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] });
  return msg.content[0].type === 'text' ? msg.content[0].text : '';
}

app.post('/api/ai/date-plan', async (req: any, res: any) => {
  try {
    const content = await generatePlan('date', req.body);
    const title   = content.match(/【プランタイトル】\s*\n(.+)/)?.[1]?.trim() ?? `${req.body.area}のデートプラン`;
    const db = readCoupleDB();
    const plan = { id: db._nextId.plans++, type: 'date', title, content, params: JSON.stringify(req.body), createdAt: new Date().toISOString() };
    db.plans.push(plan); writeCoupleDB(db);
    res.json(plan);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/travel-plan', async (req: any, res: any) => {
  try {
    const content = await generatePlan('travel', req.body);
    const title   = content.match(/【旅行プランタイトル】\s*\n(.+)/)?.[1]?.trim() ?? `${req.body.destination} ${req.body.nights}泊の旅`;
    const db = readCoupleDB();
    const plan = { id: db._nextId.plans++, type: 'travel', title, content, params: JSON.stringify(req.body), createdAt: new Date().toISOString() };
    db.plans.push(plan); writeCoupleDB(db);
    res.json(plan);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Plans CRUD ───────────────────────────────────────────
app.get('/api/plans', (req: any, res: any) => res.json([...readCoupleDB().plans].reverse()));
app.post('/api/plans', (req: any, res: any) => { const db = readCoupleDB(); const p = { id: db._nextId.plans++, ...req.body, createdAt: new Date().toISOString() }; db.plans.push(p); writeCoupleDB(db); res.json(p); });
app.delete('/api/plans/:id', (req: any, res: any) => { const db = readCoupleDB(); db.plans = db.plans.filter((p:any) => p.id !== Number(req.params.id)); writeCoupleDB(db); res.json({ ok: true }); });

// ── Life Events CRUD ─────────────────────────────────────
app.get('/api/events', (req: any, res: any) => res.json(readCoupleDB().lifeEvents));
app.post('/api/events', (req: any, res: any) => { const db = readCoupleDB(); const ev = { id: db._nextId.events++, done: false, ...req.body }; db.lifeEvents.push(ev); writeCoupleDB(db); res.json(ev); });
app.put('/api/events/:id', (req: any, res: any) => { const db = readCoupleDB(); const idx = db.lifeEvents.findIndex((e:any) => e.id === Number(req.params.id)); if (idx === -1) return res.status(404).json({ error:'not found' }); db.lifeEvents[idx] = { ...db.lifeEvents[idx], ...req.body }; writeCoupleDB(db); res.json(db.lifeEvents[idx]); });
app.delete('/api/events/:id', (req: any, res: any) => { const db = readCoupleDB(); db.lifeEvents = db.lifeEvents.filter((e:any) => e.id !== Number(req.params.id)); writeCoupleDB(db); res.json({ ok: true }); });

// ════════════════════════════════════════════════════════════
//  本番環境: Viteビルド済み静的ファイルを配信 (SPA フォールバック)
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // Express 5 対応: app.get('*') 非推奨のため app.use でフォールバック
    app.use((req: any, res: any, next: any) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

httpServer.listen(port, '0.0.0.0', () => {
    console.log(`\n🚀 JIBUN-OS Server running on port ${port}`);
    console.log(`   - API:  http://localhost:${port}/api`);
    console.log(`   - Web:  http://localhost:${port}`);
});
