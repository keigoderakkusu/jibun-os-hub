#!/bin/bash

# =====================================================
# n8n バックグラウンドサービス起動スクリプト
# LaunchAgent から呼び出されます（PC起動時に自動実行）
# =====================================================

export LANG=ja_JP.UTF-8
NODE_BIN="/opt/homebrew/opt/node@22/bin"
export PATH="$NODE_BIN:$PATH"

SCRIPT_DIR="/Users/nagahamakeigo/Desktop/windowsパソコン/【仕事用】/アンチグラビティ　２/n8n_sns_affiliate"
N8N_BIN="$SCRIPT_DIR/node_modules/.bin/n8n"
LOG_FILE="$SCRIPT_DIR/n8n_service.log"

# =====================================================
# APIキー設定（自動セットアップ済み）
# =====================================================
OPENAI_KEY="YOUR_OPENAI_API_KEY_HERE"

export N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false
export N8N_CREDENTIALS_OVERWRITE_DATA="{\"openAiApi\": {\"apiKey\": \"$OPENAI_KEY\"}}"
export N8N_PORT=5678
export N8N_HOST=localhost
export N8N_PROTOCOL=http

# ログに起動時刻を記録
echo "=============================" >> "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') n8n サービス起動" >> "$LOG_FILE"

# n8n 起動（バックグラウンドサービスとして）
"$N8N_BIN" start >> "$LOG_FILE" 2>&1

echo "$(date '+%Y-%m-%d %H:%M:%S') n8n サービス停止" >> "$LOG_FILE"
