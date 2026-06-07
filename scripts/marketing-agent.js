/**
 * Marketing Agent - Jibun Co., Ltd.
 * Claude APIを使ってWordPressの最新記事からSNS投稿文を生成し、LINEに通知する
 */

const https = require('https');

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
    system: 'あなたはJibun Co., Ltd.のマーケティング部長AIです。投資・AI・副業に興味のある20〜35歳向けのX(Twitter)投稿文を生成します。各投稿は150字以内にし、ハッシュタグを必ず付けてください。',
    messages: [{
      role: 'user',
      content: `以下の記事に基づいてX(Twitter)投稿を3パターン生成してください。

記事タイトル: ${title}
記事概要: ${excerpt}
記事URL: ${post.link}

【出力形式】
Variant A（データ・数字で引き付ける）:
[投稿文]

Variant B（教育・知識系「知らないと損」）:
[投稿文]

Variant C（エンゲージメント・質問型）:
[投稿文]`
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

// 3. LINE Notifyで通知を送信
function sendLineNotify(message) {
  if (!process.env.LINE_NOTIFY_TOKEN) {
    console.log('⚠️ LINE_NOTIFY_TOKEN未設定 - スキップします');
    return Promise.resolve();
  }

  const body = 'message=' + encodeURIComponent(message);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'notify-api.line.me',
      path: '/api/notify',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.LINE_NOTIFY_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// メイン処理
async function main() {
  console.log('🚀 Marketing Agent 開始...');

  // APIキーチェック
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEYが設定されていません。GitHub Secretsに追加してください。');
  }

  console.log('📰 WordPressから最新記事を取得中...');
  const post = await getLatestPost();
  const title = post.title.rendered.replace(/<[^>]+>/g, '');
  console.log('✅ 記事取得: ' + title);

  console.log('🤖 Claudeでコンテンツを生成中...');
  const snsPosts = await generateSNSPosts(post);

  console.log('\n=== 生成されたSNS投稿 ===');
  console.log(snsPosts);
  console.log('========================\n');

  const lineMessage = `✅ Marketing Agent実行完了

📰 ${title.substring(0, 40)}...

${snsPosts.substring(0, 400)}

👉 GitHubのActionsログで全文確認`;

  console.log('📱 LINE通知を送信中...');
  await sendLineNotify(lineMessage);
  console.log('✅ Marketing Agent 完了！');
}

main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
