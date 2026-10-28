/**
 * Marketing Agent - Jibun Co., Ltd.
 * ES Module版 (package.json "type":"module" 対応)
 * Claude APIでWordPress最新記事からSNS投稿文を生成
 */

import https from 'https';
import { URL } from 'url';

// HTTPリクエストのユーティリティ（タイムアウト + ステータス検証つき）
function httpGet(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('タイムアウト: ' + url));
    });
  });
}

function httpPost(options, body, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const req = https.request({ ...options, rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Claude APIタイムアウト'));
    });
    req.write(body);
    req.end();
  });
}

// 1. WordPressから最新記事を取得
async function getLatestPost() {
  const url = 'https://ai-jidoka-keigo.com/wp-json/wp/v2/posts?per_page=1&_fields=title,excerpt,link,date';
  console.log('  URL:', url);

  const { statusCode, body } = await httpGet(url);
  console.log('  WordPressステータス:', statusCode);

  if (statusCode !== 200) {
    throw new Error('WordPress API エラー (HTTP ' + statusCode + '): ' + body.substring(0, 200));
  }

  let posts;
  try {
    posts = JSON.parse(body);
  } catch {
    throw new Error('WordPress APIのレスポンスがJSONではありません: ' + body.substring(0, 200));
  }

  if (!Array.isArray(posts)) {
    throw new Error('WordPress APIが配列を返しませんでした: ' + JSON.stringify(posts).substring(0, 200));
  }

  if (posts.length === 0) {
    throw new Error('WordPress APIから記事が見つかりません');
  }

  return posts[0];
}

// 2. Claude APIでSNS投稿文を3パターン生成
async function generateSNSPosts(post) {
  const title = post.title?.rendered?.replace(/<[^>]+>/g, '') || '(タイトルなし)';
  const excerpt = (post.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim().substring(0, 200);

  const payload = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: 'あなたはJibun Co., Ltd.のマーケティング部長AIです。投資・AI・副業に興味のある20〜35歳向けのX(Twitter)投稿文を生成します。各投稿は150字以内でハッシュタグ必須。',
    messages: [{
      role: 'user',
      content: '記事タイトル: ' + title + '\n概要: ' + excerpt + '\nURL: ' + post.link + '\n\nX投稿を3パターン生成（各150字以内+ハッシュタグ）:\nVariant A（データ・数字系）:\nVariant B（教育・知識系）:\nVariant C（質問・エンゲージメント系）:'
    }]
  });

  const { statusCode, body } = await httpPost(
    {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload)
      }
    },
    payload
  );

  console.log('  Claude APIステータス:', statusCode);

  let result;
  try {
    result = JSON.parse(body);
  } catch {
    throw new Error('Claude APIのレスポンスがJSONではありません (HTTP ' + statusCode + '): ' + body.substring(0, 300));
  }

  if (statusCode !== 200) {
    throw new Error('Claude API エラー (HTTP ' + statusCode + '): ' + (result.error?.message || body.substring(0, 300)));
  }

  if (result.error) {
    throw new Error('Claude API エラー: ' + result.error.message);
  }

  if (!result.content || !result.content[0]?.text) {
    throw new Error('Claude APIのレスポンス形式が不正: ' + JSON.stringify(result).substring(0, 300));
  }

  return result.content[0].text;
}

// 3. Discord Webhookで通知（オプション）
async function sendDiscordNotify(snsPosts, title) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.log('ℹ️  DISCORD_WEBHOOK_URL未設定 — Actionsログで結果を確認してください');
    return;
  }

  const webhookUrl = new URL(process.env.DISCORD_WEBHOOK_URL);
  const payload = JSON.stringify({
    username: 'Marketing Agent 🤖',
    embeds: [{
      title: '✅ 本日のSNS投稿案が生成されました',
      description: '📰 **' + title.substring(0, 60) + '**\n\n' + snsPosts.substring(0, 1000),
      color: 0x5865F2,
      footer: { text: 'Jibun Co., Ltd. Marketing Agent' },
      timestamp: new Date().toISOString()
    }]
  });

  try {
    const { statusCode } = await httpPost(
      {
        hostname: webhookUrl.hostname,
        path: webhookUrl.pathname + webhookUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      payload,
      10000
    );
    console.log('✅ Discord通知送信完了 (status:', statusCode, ')');
  } catch (err) {
    console.log('⚠️  Discord通知失敗 (続行します):', err.message);
  }
}

// メイン処理
async function main() {
  console.log('🚀 Marketing Agent 開始...');

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY が設定されていません。GitHub Secrets に追加してください。');
  }

  console.log('📰 WordPressから最新記事を取得中...');
  const post = await getLatestPost();
  const title = post.title?.rendered?.replace(/<[^>]+>/g, '') || '(タイトルなし)';
  console.log('✅ 記事取得:', title);

  console.log('🤖 Claudeでコンテンツを生成中...');
  const snsPosts = await generateSNSPosts(post);

  console.log('\n========== 生成されたSNS投稿 ==========');
  console.log(snsPosts);
  console.log('==========================================\n');

  await sendDiscordNotify(snsPosts, title);
  console.log('✅ Marketing Agent 完了！');
}

main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
