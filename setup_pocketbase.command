#!/bin/bash
# =====================================================
# PocketBase セットアップスクリプト
# シンプルで強力なオープンソースDB+認証サーバー
# GitHub: https://github.com/pocketbase/pocketbase
# =====================================================

echo ""
echo "🗄️ =============================================
   PocketBase データベース セットアップ
   アフィリ実績・タスク・コンテンツを統合管理！
============================================="
echo ""

INSTALL_DIR="$HOME/pocketbase"
PB_VERSION="0.22.14"

# Macのアーキテクチャ判定
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    PB_FILE="pocketbase_${PB_VERSION}_darwin_arm64.zip"
else
    PB_FILE="pocketbase_${PB_VERSION}_darwin_amd64.zip"
fi

PB_URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${PB_FILE}"

# インストールディレクトリ作成
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# すでにインストール済みか確認
if [ -f "$INSTALL_DIR/pocketbase" ]; then
    echo "✅ PocketBaseはすでにインストールされています！"
    echo "   バージョン: $($INSTALL_DIR/pocketbase --version)"
else
    echo "📥 PocketBase v${PB_VERSION} をダウンロード中..."
    curl -L -o "$PB_FILE" "$PB_URL"

    if [ $? -ne 0 ]; then
        echo "❌ ダウンロードに失敗しました。"
        read -p "Enterで閉じる..."
        exit 1
    fi

    echo "📦 解凍中..."
    unzip -o "$PB_FILE"
    chmod +x pocketbase
    rm "$PB_FILE"
    echo "✅ PocketBaseのインストール完了！"
fi

echo ""
echo "🚀 PocketBaseを起動します..."
echo "   管理画面: http://localhost:8090/_/"
echo "   初回は管理者アカウントを作成してください"
echo "   停止するには: Ctrl+C"
echo ""

sleep 1
open "http://localhost:8090/_/" &
sleep 1
"$INSTALL_DIR/pocketbase" serve --http="127.0.0.1:8090"

read -p "Enterで閉じる..."
