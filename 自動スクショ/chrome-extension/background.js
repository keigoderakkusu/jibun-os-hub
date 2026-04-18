// background.js - Chrome拡張機能バックグラウンドサービスワーカー

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    console.log('Auto Screenshot to PDF 拡張機能がインストールされました');
    // デフォルト設定
    chrome.storage.local.set({
      gasUrl: '',
      defaultScrollMode: 'viewport',
      defaultPdfMode: 'combined'
    });
  }
});

// メッセージハンドラー（将来の拡張用）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCREENSHOT_COMPLETE') {
    console.log('スクリーンショット完了:', message.data);
  }
  return true;
});
