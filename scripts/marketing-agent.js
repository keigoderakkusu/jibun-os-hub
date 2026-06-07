/**
 * Marketing Agent - Jibun Co., Ltd.
 * Claude APIを使ってWordPressの最新記事からSNS投稿文を生成
 * 通知: Discord Webhook (LINE Notifyは2025年3月終了)
 */

const https = require('https');
const { URL } = require('url');

// 1. WordPressから最新記事を取得
function getLatestPost() {
  return new Promise((resolve, reject) => {
    https.get('https://ai-jidoka-keigo.com/wp-json/wp/v2/posts?per_page=1&_fields=title,excerpt,link,date', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const posts = JSON.parse(data);
        if (!posts.length) reject(new Error('記事が見つかりません'));
        resolve(posts[0]);
      });
    }).on('error', reject);
  });
}

// 2. Claude APIでSNS投稿文を3パターン生成
function generateSNSPosts(post) {
  const title = post.title.rendered.replace(/<[^>]+>/g, '');
  const excerpt = (post.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim().substring(0, 200);

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: 'あなたはJibun Co., Ltd.のマーケティング部長AIです。投資・AI・副業に興味のある20〜35歳向けのX(Twitter)投稿文を生成します。各投稿は150字以内でハッシュタグ必須。',
    messages: [{
      role: 'user',
      content: `記事タイトル: ${title}\n概要: ${excerpt}\nURL: ${post.link}\n\nX投稿を3パターン生成（各150字以内+ハッシュタグ）:\nVariant A（データ・数字系）:\nVariant B（教育・知識系）:\nVariant C（質問・エンゲージメント系）:`
    }]
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        if (result.error) reject(new Error(result.error.message));
        resolve(result.content[0].text);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// 3. Discord Webhookで通知
function sendDiscordNotify(snsPosts, title) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.log('⚠️ DISCORD_WEBHOOK_URL未設定 - Actionsログで結果を確認してください');
    return Promise.resolve();
  }

  const webhookUrl = new URL(process.env.DISCORD_WEBHOOK_URL);
  const body = JSON.stringify({
    username: 'Marketing Agent 🤖',
    embeds: [{
      title: '✅ 本日のSNS投稿案が生成されました',
      description: `📰 **${title.substring(0, 60)}**\n\n${snsPosts.substring(0, 1000)}`,
      color: 0x5865F2,
      footer: { text: 'Jibun Co., Ltd. Marketing Agent' },
      timestamp: new Date().toISOString()
    }]
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: webhookUrl.hostname,
      path: webhookUrl.pathname + webhookUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Discord通知送信完了 (status:', res.statusCode, ')');
        resolve();
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// メイン処理
async function main() {
  console.log('🚀 Marketing Agent 開始...');

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEYが設定されていません。GitHub Secrets に追加してください。');
  }

  console.log('📰 WordPressから最新記事を取得中...');
  const post = await getLatestPost();
  const title = post.title.rendered.replace(/<[^>]+>/g, '');
  console.log('✅ 記事取得: ' + title);

  console.log('🤖 Claudeでコンテンツを生成中...');
  const snsPosts = await generateSNSPosts(post);

  console.log('\n========== 生成されたSNS投稿 ==========');
  console.log(snsPosts);
  console.log('==========================================\n');

  console.log('📨 Discord通知を送信中...');
  await sendDiscordNotify(snsPosts, title);

  console.log('✅ Marketing Agent 完了！GitHubのActionsタブで結果を確認できます。');
}

main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
