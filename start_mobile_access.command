#!/bin/bash

echo "==========================================================="
echo "📱 JIBUN-OS 外出先アクセス用 トンネル起動スクリプト"
echo "==========================================================="
echo ""
echo "このスクリプトは、あなたのMac上で動いている「JIBUN-OS APIサーバー」を"
echo "外出先のスマートフォン等から安全にアクセスできるようにします。"
echo ""
echo "※ 事前にターミナルで 'npm run dev' などでサーバーが起動している必要があります。"
echo "（APIサーバーはデフォルトで3001番ポートを使用しています）"
echo ""

# npxがインストールされているか確認
if ! command -v npx &> /dev/null; then
    echo "エラー: Node.js (npx) がインストールされていません。"
    echo "https://nodejs.org/ からインストールしてください。"
    exit 1
fi

echo "🚀 トンネルを構築中... (localtunnelを使用)"
echo ""
echo "【重要】"
echo "1. 下記に出力される 'your url is: https://xxxx.loca.lt' のURLをコピーしてください"
echo "2. スマートフォンで https://keigoderakkusu.github.io/jibun-os-hub/ にアクセス"
echo "3. ダッシュボードの「接続設定」を開き、コピーしたURLを貼り付けます"
echo "※ localtunnelを初めて使う場合、ブラウザアクセス時に一回だけ「Click to Continue」を押す必要があります。"
echo "==========================================================="

# URL出力をわかりやすくするため、localtunnelを実行
npx localtunnel --port 3001
