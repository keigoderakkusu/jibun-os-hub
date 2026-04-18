#!/bin/bash
# =====================================================
# AnythingLLM セットアップスクリプト
# 自分のドキュメントをAIで検索 - 「第二の脳」
# GitHub: https://github.com/Mintplex-Labs/anything-llm
# =====================================================

echo ""
echo "🧠 =============================================
   AnythingLLM 第二の脳 セットアップ
   KindleスクショPDF・メモをAIで検索可能に！
============================================="
echo ""

# Dockerチェック
if ! command -v docker &> /dev/null; then
    echo "❌ Dockerが必要です。"
    echo "   https://www.docker.com/products/docker-desktop/ からインストールしてください。"
    open "https://www.docker.com/products/docker-desktop/"
    read -p "Dockerをインストール後、もう一度このスクリプトを実行してください。Enterで閉じる..."
    exit 1
fi

# Dockerが起動しているか確認
if ! docker info &> /dev/null 2>&1; then
    echo "⚠️  Dockerが起動していません。Docker Desktopを起動してください..."
    open -a "Docker"
    sleep 10
fi

echo "✅ Docker: $(docker --version)"
echo ""

# ストレージディレクトリ作成
STORAGE_DIR="$HOME/anythingllm_storage"
mkdir -p "$STORAGE_DIR"

echo "📥 AnythingLLMのDockerイメージを取得中..."
docker pull mintplexlabs/anythingllm

if [ $? -ne 0 ]; then
    echo "❌ 取得に失敗しました。インターネット接続を確認してください。"
    read -p "Enterで閉じる..."
    exit 1
fi

echo ""
echo "✅ AnythingLLMの準備完了！"
echo ""

# 既存コンテナを停止・削除
docker rm -f anythingllm 2>/dev/null

echo "🚀 AnythingLLMを起動します..."
echo "   ブラウザ: http://localhost:3001"
echo "   ストレージ: $STORAGE_DIR"
echo "   停止するには: Ctrl+C"
echo ""

sleep 1
open "http://localhost:3001" &
sleep 2

docker run -d \
  --name anythingllm \
  -p 3001:3001 \
  -v "$STORAGE_DIR:/app/server/storage" \
  -e STORAGE_DIR="/app/server/storage" \
  mintplexlabs/anythingllm

echo ""
echo "✅ AnythingLLMが起動しました！"
echo "   ブラウザで http://localhost:3001 を開いてください"
echo ""
echo "📋 初期セットアップ手順:"
echo "   1. ブラウザで管理者アカウントを作成"
echo "   2. 設定 → LLMプロバイダー → Google Gemini を選択"
echo "   3. Gemini APIキーを入力 (aistudio.google.com で無料取得)"
echo "   4. 新しいワークスペースを作成"
echo "   5. KindleスクショのPDFをドラッグ&ドロップ！"
echo ""

open "http://localhost:3001"

read -p "Enterで閉じる..."
