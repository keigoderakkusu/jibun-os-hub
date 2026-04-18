"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var puppeteer_1 = require("puppeteer");
var googleapis_1 = require("googleapis");
var path = require("path");
// Authenticate with Google Sheets
var CREDENTIALS_PATH = path.resolve('/Users/nagahamakeigo/.gemini/antigravity/playground/chrono-intergalactic/worker/credentials.json');
var auth = new googleapis_1.google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
var sheets = googleapis_1.google.sheets({ version: 'v4', auth: auth });
var SPREADSHEET_ID = '1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M'; // User's main spreadsheet
var SHEET_NAME = 'インプット'; // Target sheet name as requested
function performTrendSearch() {
    return __awaiter(this, void 0, void 0, function () {
        var browser, page, query, searchUrl, articles, today_1, values, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('[AGENT] 🌐 ブラウザを起動し、AI・DXのトレンドニュースを検索します...');
                    return [4 /*yield*/, puppeteer_1.default.launch({ headless: true })];
                case 1:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.newPage()];
                case 2:
                    page = _a.sent();
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 8, 9, 11]);
                    query = encodeURIComponent('AI エージェント 自動化 OR DX 成功事例');
                    searchUrl = "https://news.google.com/search?q=".concat(query, "&hl=ja&gl=JP&ceid=JP:ja");
                    console.log("[AGENT] \uD83D\uDD0D URL\u306B\u30A2\u30AF\u30BB\u30B9: ".concat(searchUrl));
                    return [4 /*yield*/, page.goto(searchUrl, { waitUntil: 'networkidle2' })];
                case 4:
                    _a.sent();
                    // Wait for articles to load
                    return [4 /*yield*/, page.waitForSelector('article')];
                case 5:
                    // Wait for articles to load
                    _a.sent();
                    return [4 /*yield*/, page.evaluate(function () {
                            var _a;
                            var results = [];
                            var articleElements = document.querySelectorAll('article');
                            // Loop through first 3 articles
                            for (var i = 0; i < Math.min(3, articleElements.length); i++) {
                                var el = articleElements[i];
                                // Google News structure typically has main link inside a tag
                                var linkEl = el.querySelector('a');
                                if (!linkEl)
                                    continue;
                                var title = ((_a = linkEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || 'No Title';
                                var url = linkEl.href;
                                results.push({ title: title, url: url, snippet: '記事リンクから詳細をご確認ください。' });
                            }
                            return results;
                        })];
                case 6:
                    articles = _a.sent();
                    console.log("[AGENT] \u2705 ".concat(articles.length, "\u4EF6\u306E\u8A18\u4E8B\u3092\u53D6\u5F97\u3057\u307E\u3057\u305F\u3002\u30B9\u30D7\u30EC\u30C3\u30C9\u30B7\u30FC\u30C8\u3078\u306E\u8A18\u9332\u3092\u958B\u59CB\u3057\u307E\u3059\u3002"));
                    today_1 = new Date().toISOString().split('T')[0];
                    values = articles.map(function (article) { return [
                        today_1, // 日付
                        'トレンド収集', // タスク名
                        article.title, // タイトル
                        article.url, // URL
                        article.snippet // 冒頭テキスト/スニペット
                    ]; });
                    // Fallback if no articles found
                    if (values.length === 0) {
                        values.push([today_1, 'トレンド収集', '新しい記事が見つかりませんでした', '', '']);
                    }
                    // Append to Google Sheets
                    return [4 /*yield*/, sheets.spreadsheets.values.append({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "".concat(SHEET_NAME, "!A1"),
                            valueInputOption: 'USER_ENTERED',
                            requestBody: { values: values },
                        })];
                case 7:
                    // Append to Google Sheets
                    _a.sent();
                    console.log('\n===========================================');
                    console.log('🤖 【完了通知】');
                    console.log('営業課AIエージェント: トレンド情報の収集と');
                    console.log("[".concat(SHEET_NAME, "] \u30B7\u30FC\u30C8\u3078\u306E\u8A18\u9332\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F\uFF01"));
                    console.log('===========================================\n');
                    return [3 /*break*/, 11];
                case 8:
                    error_1 = _a.sent();
                    console.error('[AGENT:ERROR] 検索中にエラーが発生しました:', error_1);
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, browser.close()];
                case 10:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// Execute the agent
performTrendSearch();
