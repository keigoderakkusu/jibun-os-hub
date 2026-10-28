"""
post_blog.py
生成した PDF を WordPress にアップロードして投稿する
環境変数:
  WP_URL          WordPress サイトの URL（例: https://ai-jidoka-keigo.com）
  WP_USER         WordPress ユーザー名
  WP_APP_PASSWORD WordPress アプリケーションパスワード（設定 > ユーザー > アプリケーションパスワード）
"""

import os
import glob
import json
import base64
from datetime import datetime
import urllib.request
import urllib.error


def wp_request(url, method, data=None, headers=None):
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers or {}, method=method)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))


def main():
    wp_url  = os.environ["WP_URL"].rstrip("/")
    wp_user = os.environ["WP_USER"]
    wp_pass = os.environ["WP_APP_PASSWORD"]

    token = base64.b64encode(f"{wp_user}:{wp_pass}".encode()).decode()
    auth_header = {"Authorization": f"Basic {token}"}

    today_label = datetime.now().strftime("%Y年%m月%d日")

    # ── 最新 PDF を探す ──────────────────────────────────────
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "output")
    files = sorted(glob.glob(os.path.join(output_dir, "*.pdf")))

    if not files:
        raise FileNotFoundError(f"{output_dir}/*.pdf が見つかりません。")

    pdf_path = files[-1]
    pdf_name = os.path.basename(pdf_path)
    print(f"📄 対象 PDF: {pdf_path}")

    # ── WordPress メディアライブラリへアップロード ───────────
    print("📤 WordPress メディアライブラリにアップロード中...")
    media_url = f"{wp_url}/wp-json/wp/v2/media"

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    upload_headers = {
        **auth_header,
        "Content-Type": "application/pdf",
        "Content-Disposition": f'attachment; filename="{pdf_name}"',
    }
    req = urllib.request.Request(
        media_url, data=pdf_bytes, headers=upload_headers, method="POST"
    )
    try:
        with urllib.request.urlopen(req) as res:
            media = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"メディアアップロード失敗: {e.code} {e.read().decode()}") from e

    media_id   = media["id"]
    media_link = media["source_url"]
    print(f"✅ アップロード完了: {media_link}")

    # ── 投稿本文（HTML）───────────────────────────────────────
    post_content = f"""
<!-- wp:paragraph -->
<p>{today_label}のマーケット デイリー レポートです。「第二のキオクシア」追跡銘柄（トクヤマ・リガク HD・Marvell Technology・KIOXIA HD）の最新動向をまとめました。</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {{"layout":{{"type":"flex","justifyContent":"center"}}}} -->
<div class="wp-block-buttons">
  <!-- wp:button {{"backgroundColor":"#1B3A5C","textColor":"white","style":{{"border":{{"radius":"4px"}}}}}} -->
  <div class="wp-block-button">
    <a class="wp-block-button__link" href="{media_link}" target="_blank" rel="noopener noreferrer"
       style="background-color:#1B3A5C; color:#ffffff; padding:12px 28px; display:inline-block; border-radius:4px;">
      📄 PDF レポートをダウンロード
    </a>
  </div>
  <!-- /wp:button -->
</div>
<!-- /wp:buttons -->

<!-- wp:paragraph -->
<p style="font-size:11px; color:#888;">
※ 本レポートはすべて情報提供のみを目的とした参考資料であり、特定の有価証券の売買を推奨・勧誘するものではありません。投資判断はご自身の責任において行ってください。
</p>
<!-- /wp:paragraph -->
"""

    # ── 投稿を作成 ────────────────────────────────────────────
    print("📝 WordPress に記事を投稿中...")
    post_data = {
        "title":   f"【マーケットレポート】{today_label}",
        "content": post_content,
        "status":  "publish",
        "categories": [],
        "tags": [],
    }
    post_headers = {**auth_header, "Content-Type": "application/json"}
    try:
        post = wp_request(
            f"{wp_url}/wp-json/wp/v2/posts", "POST", post_data, post_headers
        )
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"投稿失敗: {e.code} {e.read().decode()}") from e

    post_link = post.get("link", "")
    print(f"✅ 投稿完了: {post_link}")

    # 後続スクリプト用に保存
    with open(os.path.join(script_dir, "blog_link.txt"), "w") as f:
        f.write(post_link)


if __name__ == "__main__":
    main()
