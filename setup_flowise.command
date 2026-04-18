#!/bin/bash
# =====================================================
# Flowise セットアップスクリプト
# LLMエージェントをノーコードで構築できるOSSツール
# GitHub: https://github.com/FlowiseAI/Flowise
# =====================================================

echo ""
echo "🤖 =============================================
   Flowise AI Agent Builder セットアップ
   ノーコードでGeminiエージェントを構築しよう！
============================================="
echo ""

# Node.jsチェック
if ! command -v node &> /dev/null; then
    echo "❌ Node.jsが見つかりません。https://nodejs.org からインストールしてください。"
    read -p "Enterで閉じる..."
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo "✅ npm: $(npm -v)"
echo ""

# Flowise グローバルインストール
echo "📦 Flowiseをインストール中..."
npm install -g flowise

if [ $? -ne 0 ]; then
    echo "❌ インストールに失敗しました。"
    read -p "Enterで閉じる..."
    exit 1
fi

echo ""
echo "✅ Flowiseのインストール完了！"
echo ""
echo "🚀 Flowiseを起動します..."
echo "   ブラウザが自動で開きます: http://localhost:3000"
echo "   停止するには: Ctrl+C"
echo ""

open "http://localhost:3000" &
sleep 2
npx flowise start

read -p "Enterで閉じる..."
