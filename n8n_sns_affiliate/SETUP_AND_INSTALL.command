#!/bin/bash

# =====================================================
# 🔧 n8n 完全セットアップ & PC自動起動登録スクリプト
# =====================================================

export LANG=ja_JP.UTF-8
cd "$(dirname "$0")"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

NODE_BIN="/opt/homebrew/opt/node@22/bin"
N8N_BIN="$SCRIPT_DIR/node_modules/.bin/n8n"
PLIST_SRC="$SCRIPT_DIR/com.nagahama.n8n.sns.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.nagahama.n8n.sns.plist"

echo "====================================================="
echo "🔧 n8n 完全セットアップを開始します"
echo "====================================================="
echo ""

# =====================================================
# Step 1: Node.js v20 の確認
# =====================================================
echo "[1/5] Node.js v20 の確認..."
if [ ! -f "$NODE_BIN/node" ]; then
    echo "❌ Node.js v20 が見つかりません。インストールします..."
    brew install node@22
    if [ $? -ne 0 ]; then
        echo "❌ Homebrewが見つかりません。https://brew.sh からインストールしてください。"
        read -p "エンターキーを押して終了します..."
        exit 1
    fi
fi
echo "✅ Node.js $($NODE_BIN/node --version) を確認しました。"

# =====================================================
# Step 2: n8n のインストール
# =====================================================
echo ""
echo "[2/5] n8n のインストール確認..."
if [ ! -f "$N8N_BIN" ]; then
    echo "📦 n8nをインストールしています... (5〜10分かかります)"
    if [ ! -f "$SCRIPT_DIR/package.json" ]; then
        "$NODE_BIN/npm" init -y > /dev/null
    fi
    "$NODE_BIN/npm" install n8n --no-audit --no-fund --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "❌ インストール失敗。ネットワーク接続を確認して再実行してください。"
        read -p "エンターキーを押して終了します..."
        exit 1
    fi
    echo "✅ n8n のインストール完了！"
else
    echo "✅ n8n はすでにインストール済みです。"
fi

# =====================================================
# Step 3: ワークフロー設定
# =====================================================
echo ""
echo "[3/5] ワークフローのインポート..."
JSON_FILE="$SCRIPT_DIR/n8n_workflow.json"
SHEET_ID="1Ms1O1Pj8HJh7jQuKg_L_r4TC8Q3i20bd32FfKjhrCyI"
OPENAI_KEY="YOUR_OPENAI_API_KEY_HERE"

# スプレッドシートID設定
if grep -q "YOUR_GOOGLE_SHEET_ID" "$JSON_FILE" 2>/dev/null; then
    sed -i '' "s|YOUR_GOOGLE_SHEET_ID|$SHEET_ID|g" "$JSON_FILE"
fi

# 環境変数セット
export PATH="$NODE_BIN:$PATH"
export N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false
export N8N_CREDENTIALS_OVERWRITE_DATA="{\"openAiApi\": {\"apiKey\": \"$OPENAI_KEY\"}}"

"$N8N_BIN" import:workflow --input="$JSON_FILE" 2>&1
echo "✅ ワークフローのインポート完了！"

# =====================================================
# Step 4: PC起動時自動起動の登録（LaunchAgent）
# =====================================================
echo ""
echo "[4/5] PC起動時の自動起動を登録しています..."

# 実行権限を付与
chmod +x "$SCRIPT_DIR/n8n_service.sh"
chmod +x "$SCRIPT_DIR/start_sns_system.command"

# LaunchAgents ディレクトリを確認
mkdir -p "$HOME/Library/LaunchAgents"

# 既存のサービスを一旦停止
launchctl unload "$PLIST_DST" 2>/dev/null

# plistをLaunchAgentsフォルダにコピー
cp "$PLIST_SRC" "$PLIST_DST"

# サービスを登録して起動
launchctl load "$PLIST_DST"
if [ $? -eq 0 ]; then
    echo "✅ 自動起動の登録完了！PCを再起動してもn8nが自動で起動します。"
else
    echo "⚠️ 自動起動の登録に失敗しました。手動で start_sns_system.command を使用してください。"
fi

# =====================================================
# Step 5: 動作確認テスト
# =====================================================
echo ""
echo "[5/5] 動作確認中..."
sleep 5

# n8nが起動したか確認
for i in {1..20}; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/ 2>/dev/null)
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        echo "✅ n8n が正常に起動しています！（http://localhost:5678）"
        open "http://localhost:5678"
        break
    fi
    echo "⏳ 起動を待機中... ($i/20)"
    sleep 3
done

echo ""
echo "====================================================="
echo "🎉 セットアップ完了！"
echo "====================================================="
echo ""
echo "📌 n8nにアクセスする方法:"
echo "   ブラウザで http://localhost:5678 を開く"
echo ""
echo "📌 PC起動後の流れ:"
echo "   → PCを起動するだけで自動的にn8nが起動します"
echo "   → ブラウザで http://localhost:5678 にアクセスするだけ"
echo ""
echo "📌 まだ必要な手動設定（n8n画面で1回だけ）:"
echo "   → 左メニューの「Credentials」"
echo "   → 「Google Sheets OAuth2 API」でGoogleアカウント認証"
echo ""
echo "📌 ログの確認方法:"
echo "   $SCRIPT_DIR/n8n_service.log"
echo "====================================================="
echo ""
read -p "エンターキーを押して終了します..."
