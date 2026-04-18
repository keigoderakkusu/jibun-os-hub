// popup.js - Chrome拡張機能 ポップアップロジック

// GAS URL 管理
async function getGasUrl() {
  return new Promise(resolve => {
    chrome.storage.local.get(['gasUrl'], (result) => {
      resolve(result.gasUrl || '');
    });
  });
}

async function setGasUrl(url) {
  return new Promise(resolve => {
    chrome.storage.local.set({ gasUrl: url }, resolve);
  });
}

// 設定画面を開く
function openSettings() {
  const url = prompt('GAS デプロイメント URL を入力してください:\n例: https://script.google.com/macros/s/YOUR_ID/exec', '');
  if (url && url.includes('script.google.com')) {
    setGasUrl(url).then(() => {
      document.getElementById('gasUrlNotice').classList.remove('show');
      addStatus('✅ GAS URL を保存しました', 'success');
      showStatus();
    });
  } else if (url !== null) {
    alert('無効な URL です。\nhttps://script.google.com/macros/s/... の形式で入力してください');
  }
}

// ステータス表示
function showStatus() {
  document.getElementById('statusBox').classList.add('visible');
}

function addStatus(msg, type = 'info') {
  const statusLines = document.getElementById('statusLines');
  const line = document.createElement('div');
  line.className = `status-line ${type}`;

  const icons = { info: '🔵', success: '✅', error: '❌' };
  line.innerHTML = `<span>${icons[type] || '▸'}</span><span>${msg}</span>`;
  statusLines.appendChild(line);
  statusLines.scrollTop = statusLines.scrollHeight;
}

function clearStatus() {
  document.getElementById('statusLines').innerHTML = '';
  document.getElementById('driveLink').style.display = 'none';
}

// GAS にスクリーンショット（配列）を送信
async function sendToGAS(images, filename, pdfMode, gasUrl) {
  const payload = {
    images: Array.isArray(images) ? images : [images],
    filename: filename,
    pdfMode: pdfMode,
    timestamp: new Date().toISOString()
  };

  console.log('Sending payload to GAS:', { filename, pdfMode, count: images.length });

  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('GAS からの応答を解析できませんでした: ' + text.substring(0, 100));
  }
}

// メイン: スクリーンショット撮影
async function startCapture() {
  const btn = document.getElementById('captureBtn');
  btn.disabled = true;
  clearStatus();
  showStatus();

  try {
    // GAS URL チェック
    const gasUrl = await getGasUrl();
    if (!gasUrl || !gasUrl.includes('script.google.com')) {
      document.getElementById('gasUrlNotice').classList.add('show');
      addStatus('GAS URL が未設定です。設定ボタンから設定してください', 'error');
      return;
    }

    // ファイル名サニタイズ
    let filename = document.getElementById('filename').value.trim() || `screenshot_${Date.now()}`;
    filename = filename.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
    const scrollMode = document.querySelector('input[name="scrollMode"]:checked')?.value || 'viewport';
    const pdfMode = document.querySelector('input[name="pdfMode"]:checked')?.value || 'combined';

    addStatus(`📸 スクショ撮影中 (${scrollMode} モード)...`, 'info');

    // アクティブタブの取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // セキュリティ制限チェック (chrome:// ページなどは実行不可)
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('https://chrome.google.com')) {
      addStatus('❌ ブラウザの制限により、このページ（設定画面や拡張機能画面）ではスクショ撮影できません。通常のウェブサイトで試してください。', 'error');
      return;
    }

    let finalImages = [];

    if (scrollMode === 'full' || scrollMode === 'viewport') {
      // ページ情報を取得
      const pageInfo = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            height: document.documentElement.scrollHeight,
            viewportHeight: window.innerHeight,
            title: document.title
          };
        }
      });

      const { height, viewportHeight } = pageInfo[0].result;
      const totalPages = Math.ceil(height / viewportHeight);
      
      addStatus(`📄 全 ${totalPages} ページを処理します`, 'info');

      for (let i = 0; i < totalPages; i++) {
        // スクロール
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [i * viewportHeight],
          func: (y) => window.scrollTo(0, y)
        });

        // 描画待機（重要：白紙回避）
        await new Promise(r => setTimeout(r, 1500));

        // キャプチャ
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png', quality: 100 });
        finalImages.push(dataUrl.replace(/^data:image\/\w+;base64,/, ''));
        
        addStatus(`✓ ページ ${i + 1}/${totalPages} 完了`, 'info');
      }
    } else if (scrollMode === 'kindle') {
      // Kindle / スライドモード (ArrowRight キー)
      const pageLimit = parseInt(document.getElementById('pageCount').value) || 10;
      addStatus(`📖 Kindle モード: ${pageLimit} ページ撮影を開始します`, 'info');

      for (let i = 0; i < pageLimit; i++) {
        // 現在のページをキャプチャ
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png', quality: 100 });
        finalImages.push(dataUrl.replace(/^data:image\/\w+;base64,/, ''));
        addStatus(`✓ ページ ${i + 1}/${pageLimit} 撮影`, 'info');

        if (i < pageLimit - 1) {
          // 右矢印キーを送信
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const event = new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                code: 'ArrowRight',
                keyCode: 39,
                which: 39,
                bubbles: true
              });
              document.dispatchEvent(event);
            }
          });
          // ページめくり待機
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    } else {
      // 単一キャプチャ（暫定）
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png', quality: 100 });
      finalImages.push(dataUrl.replace(/^data:image\/\w+;base64,/, ''));
    }

    addStatus(`💾 GAS に ${finalImages.length} 枚を送信中...`, 'info');

    const result = await sendToGAS(finalImages, filename, pdfMode, gasUrl);

    if (result.success) {
      addStatus(`PDF 作成完了: ${result.fileName}`, 'success');

      const driveLink = document.getElementById('driveLink');
      if (result.fileUrl) {
        driveLink.href = result.fileUrl;
        driveLink.style.display = 'block';
      }
    } else {
      addStatus(`エラー: ${result.error || '不明なエラー'}`, 'error');
    }

  } catch (error) {
    console.error('Screenshot error:', error);
    addStatus(`エラー: ${error.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '📸 スクリーンショット撮影';
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  // ボタンのイベントリスナー登録
  const captureBtn = document.getElementById('captureBtn');
  const settingsBtn = document.getElementById('settingsBtn');

  if (captureBtn) {
    captureBtn.addEventListener('click', startCapture);
  }
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
  }

  // GAS URL チェック
  const gasUrl = await getGasUrl();
  if (!gasUrl) {
    document.getElementById('gasUrlNotice').classList.add('show');
  }

  // デフォルトファイル名（タブタイトルから）
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.title) {
    const cleanTitle = tab.title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 30);
    const filenameInput = document.getElementById('filename');
    if (filenameInput) {
      filenameInput.value = cleanTitle;
    }
  }
});
