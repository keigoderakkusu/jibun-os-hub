#!/bin/bash
# ============================================
# 自動スクロールスクショ 一括バッチ実行スクリプト
# ============================================
# 使用方法: bash batch-screenshot.sh
# または特定のURLリストファイルを指定:
#   bash batch-screenshot.sh urls.txt
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$SCRIPT_DIR/auto-scroll-screenshot.js"
URL_FILE="${1:-$SCRIPT_DIR/urls.txt}"
LOG_FILE="$SCRIPT_DIR/batch_$(date +%Y%m%d_%H%M%S).log"

# 色付きログ
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

print_info()    { echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$LOG_FILE"; }
print_success() { echo -e "${GREEN}[OK]${NC}   $1" | tee -a "$LOG_FILE"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"; }
print_error()   { echo -e "${RED}[ERR]${NC}  $1" | tee -a "$LOG_FILE"; }

echo "=======================================" | tee "$LOG_FILE"
echo "  自動スクロールスクショ バッチ処理" | tee -a "$LOG_FILE"
echo "  開始: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
echo "=======================================" | tee -a "$LOG_FILE"

# Node.js チェック
if ! command -v node &> /dev/null; then
  print_error "Node.js が見つかりません。インストールしてください。"
  exit 1
fi

# .env チェック
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  print_error ".env ファイルが見つかりません"
  exit 1
fi

source "$SCRIPT_DIR/.env"
if [[ "$GAS_DEPLOYMENT_URL" == *"YOUR_SCRIPT_ID"* ]]; then
  print_error "GAS_DEPLOYMENT_URL が設定されていません"
  print_info ".env ファイルの GAS_DEPLOYMENT_URL を実際の URL に変更してください"
  exit 1
fi

# URLリストファイルが存在するか確認
if [ ! -f "$URL_FILE" ]; then
  print_warning "URLリストファイルが見つかりません: $URL_FILE"
  print_info "サンプルの urls.txt を作成します..."
  cat > "$SCRIPT_DIR/urls.txt" << 'EOF'
# 自動スクショ URLリスト
# フォーマット: URL スクロールモード ファイル名(任意)
# 例:
# https://example.com/article viewport article_report
# https://shop.com/products paginated products_list
# https://twitter.com/home infinite-scroll twitter_feed

https://www.google.com viewport google_homepage
EOF
  print_info "urls.txt を作成しました。URLを追加して再実行してください。"
  exit 0
fi

# URLリストを処理
SUCCESS=0
FAILED=0
TOTAL=0

while IFS= read -r line; do
  # コメント行と空行をスキップ
  [[ "$line" =~ ^#.*$ ]] && continue
  [[ -z "${line// }" ]] && continue

  TOTAL=$((TOTAL + 1))

  # スペースで分割
  IFS=' ' read -r URL SCROLL_MODE FILENAME <<< "$line"

  SCROLL_MODE="${SCROLL_MODE:-viewport}"
  FILENAME="${FILENAME:-page_${TOTAL}_$(date +%s)}"

  print_info "処理中 [$TOTAL]: $URL (モード: $SCROLL_MODE)"

  # 実行
  if node "$SCRIPT" \
    --url "$URL" \
    --scroll-mode "$SCROLL_MODE" \
    --filename "$FILENAME" \
    --pdf-mode "combined" 2>&1 | tee -a "$LOG_FILE"; then
    SUCCESS=$((SUCCESS + 1))
    print_success "完了: $FILENAME"
  else
    FAILED=$((FAILED + 1))
    print_error "失敗: $URL"
  fi

  echo "---" | tee -a "$LOG_FILE"
  sleep 2  # 次のURLまで2秒待機

done < "$URL_FILE"

# 結果サマリー
echo "" | tee -a "$LOG_FILE"
echo "=======================================" | tee -a "$LOG_FILE"
echo "  バッチ処理完了" | tee -a "$LOG_FILE"
echo "  総数: $TOTAL | 成功: $SUCCESS | 失敗: $FAILED" | tee -a "$LOG_FILE"
echo "  完了: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
echo "  ログ: $LOG_FILE" | tee -a "$LOG_FILE"
echo "=======================================" | tee -a "$LOG_FILE"
