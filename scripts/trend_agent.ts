import puppeteer from 'puppeteer';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as path from 'path';

// Authenticate with Google Sheets
const CREDENTIALS_PATH = path.resolve('/Users/nagahamakeigo/.gemini/antigravity/playground/chrono-intergalactic/worker/credentials.json');
const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M'; // User's main spreadsheet
const SHEET_NAME = 'インプット'; // Target sheet name as requested
const GEMINI_API_KEY = 'AIzaSyCmEd3SGm3LqrlblJJQX9agDL0pOy9Nq6w';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function performTrendSearch() {
    console.log('[AGENT] 🌐 ブラウザを起動し、AI・DXのトレンドニュースを検索します...');

    // Launch headless browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Pipe browser console to node
    page.on('console', msg => console.log('[BROWSER]', msg.text()));

    try {
        // Query formulation
        const query = encodeURIComponent('AI エージェント 自動化 OR DX 成功事例');
        const searchUrl = `https://news.google.com/search?q=${query}&hl=ja&gl=JP&ceid=JP:ja`;

        console.log(`[AGENT] 🔍 URLにアクセス: ${searchUrl}`);
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // Debug screenshot
        await page.screenshot({ path: 'google_news_debug.png' });
        console.log('[AGENT] 📸 デバッグ用スクリーンショットを保存しました: google_news_debug.png');

        // Wait for articles with a fallback
        try {
            await page.waitForSelector('article, [jscontroller]', { timeout: 30000 });
        } catch (e) {
            console.log('[AGENT] ⚠️ 記事のセレクタが見つかりませんでした。現在のページを解析します。');
        }

        // Wait for dynamic content
        await new Promise(r => setTimeout(r, 5000));

        const htmlLength = await page.evaluate(() => document.documentElement.outerHTML.length);
        console.log(`[AGENT] DOM Content Length: ${htmlLength}`);

        // Try getting all links and filtering for news articles
        const articles = await page.evaluate(() => {
            const results = [];
            const links = Array.from(document.querySelectorAll('a'));
            console.log(`Analyzing ${links.length} total links on page`);

            // Look for links that look like articles (Google News titles are often in links with specific structures)
            const seenTitles = new Set();
            for (const link of links) {
                if (results.length >= 3) break;

                const title = link.innerText.trim();
                const href = link.getAttribute('href');

                if (title.length < 20 || !href) continue; // Likely not a title
                if (seenTitles.has(title)) continue;

                // Google News links often start with ./read/ or refer to external sites
                if (href.includes('articles') || href.includes('./read') || href.includes('news.google.com')) {
                    let url = href;
                    if (url.startsWith('.')) {
                        url = 'https://news.google.com' + url.substring(1);
                    }

                    results.push({
                        title: title,
                        url: url,
                        snippet: '記事詳細をご確認ください。'
                    });
                    seenTitles.add(title);
                }
            }
            return results;
        });

        console.log(`[AGENT] ✅ ${articles.length}件の記事を抽出しました。`);

        if (articles.length === 0) {
            console.log('[AGENT] ⚠️ 記事が取得できませんでした。HTML構造を確認してください。');
            // If no articles, we still need to append a "no articles found" entry
            const today = new Date().toISOString().split('T')[0];
            const values = [[today, 'トレンド収集', '新しい記事が見つかりませんでした', '', '']];

            // Verification of sheet existence
            const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
            const sheetExists = spreadsheet.data.sheets?.some(s => s.properties?.title === SHEET_NAME);

            if (!sheetExists) {
                console.log(`[AGENT] ⚠️ シート「${SHEET_NAME}」が見つかりません。作成します。`);
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId: SPREADSHEET_ID,
                    requestBody: {
                        requests: [{ addSheet: { properties: { title: SHEET_NAME } } }]
                    }
                });
            }

            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values },
            });

        } else {
            // --- Gemini Analysis Addition ---
            console.log('[AGENT] 🧠 Geminiでトレンドを分析中...');
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const analysisPrompt = `以下の最新トレンドニュース記事のタイトルに基づき、「なぜ今これらの技術や事例が注目されているのか」と「社長（ユーザー）が取るべきネクストアクション」を3行で要約してください。
            
            記事：
            ${articles.map((a: any) => `- ${a.title}`).join('\n')}
            `;

            const analysisResult = await model.generateContent(analysisPrompt);
            const trendSummary = analysisResult.response.text();

            // Format data for Google Sheets
            const today = new Date().toLocaleString('ja-JP');
            const values = [
                [today, 'トレンド分析', 'AI・DX市場概況', 'Gemini Analysis', trendSummary]
            ];

            articles.forEach((article: any) => {
                values.push([
                    today,
                    'ニュース収集',
                    article.title,
                    article.url,
                    article.snippet
                ]);
            });

            // Verification and Append
            const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
            const sheetExists = spreadsheet.data.sheets?.some(s => s.properties?.title === SHEET_NAME);

            if (!sheetExists) {
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId: SPREADSHEET_ID,
                    requestBody: {
                        requests: [{ addSheet: { properties: { title: SHEET_NAME } } }]
                    }
                });
            }

            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values },
            });
        }

        console.log('\n===========================================');
        console.log('🤖 【完了通知】');
        console.log('営業課AIエージェント: トレンド情報の分析と');
        console.log(`[${SHEET_NAME}] シートへの記録が完了しました！`);
        console.log('===========================================\n');

    } catch (error) {
        console.error('[AGENT:ERROR] 検索中にエラーが発生しました:', error);
    } finally {
        await browser.close();
    }
}

// Execute the agent
performTrendSearch();
