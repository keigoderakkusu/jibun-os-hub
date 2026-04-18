#!/bin/bash

# =====================================================
# 🚀 n8n SNSアフィリエイトシステム 起動スクリプト
# =====================================================

export LANG=ja_JP.UTF-8
cd "$(dirname "$0")"

# Node.js v20のパスを優先的に使用（n8n互換バージョン）
NODE_BIN="/opt/homebrew/opt/node@22/bin"
export PATH="$NODE_BIN:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
JSON_FILE="$SCRIPT_DIR/n8n_workflow.json"
LOG_FILE="$SCRIPT_DIR/n8n.log"
N8N_BIN="$SCRIPT_DIR/node_modules/.bin/n8n"

# =====================================================
# 設定情報（自動セットアップ済み）
# =====================================================
OPENAI_KEY="YOUR_OPENAI_API_KEY_HERE"
DEFAULT_SHEET_ID="1Ms1O1Pj8HJh7jQuKg_L_r4TC8Q3i20bd32FfKjhrCyI"

echo "====================================================="
echo "🚀 n8n SNSアフィリエイトシステム 起動中..."
echo "====================================================="

# =====================================================
# Node.js v20 の確認
# =====================================================
if [ ! -f "$NODE_BIN/node" ]; then
    echo "❌ Node.js v20 が見つかりません。セットアップしてください："
    echo "   brew install node@22"
    read -p "エンターキーを押して終了します..."
    exit 1
fi

NODE_VERSION=$("$NODE_BIN/node" --version)
echo "✅ Node.js $NODE_VERSION を使用します。"

# =====================================================
# n8n のインストール確認（初回のみ自動インストール）
# =====================================================
if [ ! -f "$N8N_BIN" ]; then
    echo ""
    echo "📦 n8nをインストールしています... (初回のみ数分かかります)"
    
    if [ ! -f "$SCRIPT_DIR/package.json" ]; then
        "$NODE_BIN/npm" init -y > /dev/null
    fi
    
    "$NODE_BIN/npm" install n8n --no-audit --no-fund --legacy-peer-deps
    
    if [ $? -ne 0 ]; then
        echo "❌ n8nのインストールに失敗しました。"
        echo "ネットワーク接続を確認して再度実行してください。"
        read -p "エンターキーを押して終了します..."
        exit 1
    fi
    echo "✅ n8nのインストールが完了しました。"
fi

# =====================================================
# スプレッドシートIDの自動設定
# =====================================================
if grep -q "YOUR_GOOGLE_SHEET_ID" "$JSON_FILE" 2>/dev/null; then
    sed -i '' "s|YOUR_GOOGLE_SHEET_ID|$DEFAULT_SHEET_ID|g" "$JSON_FILE"
    echo "✅ スプレッドシートIDを自動設定しました。"
fi

# =====================================================
# ワークフローのインポート（既存なら上書き）
# =====================================================
echo ""
echo "📦 ワークフローをインポートしています..."
"$N8N_BIN" import:workflow --input="$JSON_FILE" 2>&1

# =====================================================
# 環境変数の設定（APIキーを自動認識）
# =====================================================
export N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false
export N8N_CREDENTIALS_OVERWRITE_DATA="{\"openAiApi\": {\"apiKey\": \"$OPENAI_KEY\"}}"
export N8N_PORT=5678
export N8N_HOST=localhost
export N8N_PROTOCOL=http

echo ""
echo "====================================================="
echo "🎉 セットアップ完了！ n8n を起動します。"
echo "====================================================="
echo "   📌 ブラウザで http://localhost:5678 が開きます"
echo "   📌 OpenAI APIキーは自動設定済みです"
echo "   📌 このターミナルは閉じないでください"
echo "   📌 終了するには Ctrl+C を押してください"
echo "====================================================="
echo ""

# ブラウザを開く（n8n起動前に少し待つ）
(sleep 5 && open "http://localhost:5678") &

# n8n 起動（ローカルのバイナリを使用）
"$N8N_BIN" start

echo ""
echo "⚠️ n8nサーバーが停止しました。"
read -p "エンターキーを押すと画面を閉じます..."
