/**
 * Document Scan to PDF - Mobile Camera Version
 * スマートフォンのカメラで物理書類を撮影 → PDF化 → Google Drive保存
 * 
 * 対応: Android / iOS デバイスのブラウザ
 * 必要: Web カメラ API、Google Drive API
 */

// GAS デプロイメント URL
const GAS_DEPLOYMENT_URL = 'https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback';

// グローバル状態
const state = {
  stream: null,
  canvasContext: null,
  capturedImages: [],
  isCapturing: false,
  currentMode: 'single' // single or multiple
};

/**
 * HTML アプリケーション（インラインで実行）
 */
const HTML_APP = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>書類スキャンPDF</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background: rgba(0, 0, 0, 0.3);
      color: white;
      padding: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .header h1 {
      font-size: 20px;
      margin-bottom: 4px;
    }
    
    .container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 12px;
    }
    
    .camera-section {
      flex: 1;
      background: #000;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    video, canvas {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    #canvas {
      display: none;
    }
    
    .controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding: 12px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    button {
      flex: 1;
      min-width: 80px;
      padding: 12px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-transform: uppercase;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      flex: 2;
    }
    
    .btn-primary:active {
      transform: scale(0.95);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }
    
    .btn-secondary:active {
      background: #e0e0e0;
    }
    
    .btn-danger {
      background: #ff6b6b;
      color: white;
    }
    
    .btn-success {
      background: #51cf66;
      color: white;
    }
    
    .mode-toggle {
      display: flex;
      gap: 4px;
      background: #f0f0f0;
      padding: 4px;
      border-radius: 6px;
    }
    
    .mode-btn {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    }
    
    .mode-btn.active {
      background: white;
      color: #667eea;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .preview-gallery {
      background: white;
      border-radius: 12px;
      padding: 12px;
      overflow-y: auto;
      max-height: 120px;
      margin-bottom: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .preview-item {
      display: inline-block;
      width: 80px;
      height: 80px;
      margin-right: 8px;
      margin-bottom: 8px;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
      border: 2px solid #ddd;
    }
    
    .preview-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .preview-item .remove-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 14px;
      cursor: pointer;
      padding: 0;
    }
    
    .form-group {
      margin-bottom: 12px;
    }
    
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #333;
    }
    
    input[type="text"] {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
    }
    
    .status {
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      text-align: center;
      margin-top: 8px;
      display: none;
    }
    
    .status.show {
      display: block;
    }
    
    .status.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .status.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .status.loading {
      background: #cfe2ff;
      color: #084298;
      border: 1px solid #b6d4fe;
    }
    
    .stats {
      background: white;
      padding: 10px;
      border-radius: 8px;
      font-size: 12px;
      text-align: center;
      margin-top: 8px;
    }
    
    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid rgba(0, 0, 0, 0.2);
      border-top-color: #333;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 6px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    @media (max-width: 480px) {
      button {
        font-size: 12px;
        padding: 10px 12px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📸 書類スキャンPDF</h1>
    <p>カメラで撮影 → PDF化 → Google Drive保存</p>
  </div>
  
  <div class="container">
    <!-- モード選択 -->
    <div class="form-group">
      <label>撮影モード</label>
      <div class="mode-toggle">
        <button class="mode-btn active" data-mode="single">📄 単一</button>
        <button class="mode-btn" data-mode="multiple">📚 複数</button>
      </div>
    </div>
    
    <!-- カメラビュー -->
    <div class="camera-section">
      <video id="video" playsinline></video>
      <canvas id="canvas"></canvas>
    </div>
    
    <!-- プレビューギャラリー -->
    <div id="previewGallery" class="preview-gallery" style="display: none;">
      <div id="previewItems"></div>
    </div>
    
    <!-- ファイル名入力 -->
    <div class="form-group">
      <label for="filename">ファイル名</label>
      <input 
        type="text" 
        id="filename" 
        placeholder="例: 契約書"
        value=""
      />
    </div>
    
    <!-- コントロールボタン -->
    <div class="controls">
      <button class="btn-secondary" id="switchCameraBtn">🔄 切り替え</button>
      <button class="btn-primary" id="captureBtn">📸 撮影</button>
      <button class="btn-danger" id="clearBtn" style="display: none;">🗑️ リセット</button>
      <button class="btn-success" id="submitBtn" style="display: none;">💾 保存</button>
    </div>
    
    <!-- ステータス表示 -->
    <div id="status" class="status"></div>
    <div id="stats" class="stats" style="display: none;">
      撮影済: <span id="imageCount">0</span> 枚
    </div>
  </div>
  
  <script>
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const filenameInput = document.getElementById('filename');
    const captureBtn = document.getElementById('captureBtn');
    const switchCameraBtn = document.getElementById('switchCameraBtn');
    const clearBtn = document.getElementById('clearBtn');
    const submitBtn = document.getElementById('submitBtn');
    const statusDiv = document.getElementById('status');
    const statsDiv = document.getElementById('stats');
    const imageCountSpan = document.getElementById('imageCount');
    const previewGallery = document.getElementById('previewGallery');
    const previewItems = document.getElementById('previewItems');
    
    let capturedImages = [];
    let stream = null;
    let currentFacingMode = 'environment'; // 'environment' = 背面, 'user' = 前面
    let currentMode = 'single';
    
    // モード切り替え
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentMode = e.target.dataset.mode;
        
        if (currentMode === 'single') {
          capturedImages = [];
          clearBtn.style.display = 'none';
          submitBtn.style.display = 'none';
          statsDiv.style.display = 'none';
          previewGallery.style.display = 'none';
          captureBtn.textContent = '📸 撮影';
        } else {
          captureBtn.textContent = '📸 撮影を追加';
          clearBtn.style.display = 'block';
        }
      });
    });
    
    // カメラ初期化
    async function initCamera() {
      try {
        stopCamera();
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: currentFacingMode,
            width: { ideal: 1920 },
            height: { ideal: 1440 }
          }
        });
        
        video.srcObject = stream;
        video.play();
      } catch (error) {
        showStatus('❌ カメラにアクセスできません: ' + error.message, 'error');
      }
    }
    
    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
    
    // スクリーンショット撮影
    async function captureImage() {
      try {
        const width = video.videoWidth;
        const height = video.videoHeight;
        
        if (width === 0 || height === 0) {
          showStatus('❌ カメラが初期化されていません', 'error');
          return;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/png');
        
        if (currentMode === 'single') {
          submitImage(imageData);
        } else {
          capturedImages.push(imageData);
          updatePreview();
          updateStats();
          showStatus('✅ 画像を追加しました (' + capturedImages.length + '枚)', 'success');
        }
      } catch (error) {
        showStatus('❌ スクリーンショット失敗: ' + error.message, 'error');
      }
    }
    
    // 単一画像を即座に送信
    async function submitImage(imageData) {
      showStatus('💾 Google Drive に保存中...', 'loading');
      
      try {
        const filename = filenameInput.value || 'scan_' + Date.now();
        
        const response = await fetch(GAS_DEPLOYMENT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: imageData.split(',')[1],
            filename,
            mode: 'single',
            timestamp: new Date().toISOString()
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          showStatus('✅ PDF保存完了!\\n' + result.fileName, 'success');
          filenameInput.value = '';
          
          setTimeout(() => {
            location.reload();
          }, 2000);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        showStatus('❌ 送信失敗: ' + error.message, 'error');
      }
    }
    
    // 複数画像をまとめて送信
    async function submitMultipleImages() {
      if (capturedImages.length === 0) {
        showStatus('❌ 画像を撮影してください', 'error');
        return;
      }
      
      showStatus('💾 Google Drive に保存中...', 'loading');
      
      try {
        const filename = filenameInput.value || 'scan_' + Date.now();
        
        const response = await fetch(GAS_DEPLOYMENT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: capturedImages.map(img => img.split(',')[1]),
            filename,
            mode: 'multiple',
            timestamp: new Date().toISOString()
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          showStatus('✅ ' + capturedImages.length + 'ページのPDF保存完了!', 'success');
          capturedImages = [];
          filenameInput.value = '';
          updatePreview();
          statsDiv.style.display = 'none';
          clearBtn.style.display = 'none';
          submitBtn.style.display = 'none';
          previewGallery.style.display = 'none';
          
          setTimeout(() => {
            location.reload();
          }, 2000);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        showStatus('❌ 送信失敗: ' + error.message, 'error');
      }
    }
    
    // プレビュー更新
    function updatePreview() {
      previewItems.innerHTML = capturedImages.map((img, idx) => \`
        <div class="preview-item">
          <img src="\${img}" alt="page \${idx + 1}">
          <button class="remove-btn" onclick="removeImage(\${idx})">✕</button>
        </div>
      \`).join('');
      
      if (capturedImages.length > 0) {
        previewGallery.style.display = 'block';
      }
    }
    
    window.removeImage = function(idx) {
      capturedImages.splice(idx, 1);
      updatePreview();
      updateStats();
    };
    
    function updateStats() {
      if (capturedImages.length > 0) {
        statsDiv.style.display = 'block';
        submitBtn.style.display = 'block';
        imageCountSpan.textContent = capturedImages.length;
      }
    }
    
    function showStatus(message, type = 'info') {
      statusDiv.textContent = message;
      statusDiv.className = 'status show ' + type;
    }
    
    // イベントリスナー
    captureBtn.addEventListener('click', captureImage);
    
    switchCameraBtn.addEventListener('click', () => {
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
      initCamera();
    });
    
    clearBtn.addEventListener('click', () => {
      capturedImages = [];
      updatePreview();
      statsDiv.style.display = 'none';
      submitBtn.style.display = 'none';
      previewGallery.style.display = 'none';
      showStatus('✅ リセットしました', 'success');
    });
    
    submitBtn.addEventListener('click', submitMultipleImages);
    
    // 初期化
    window.addEventListener('load', initCamera);
    window.addEventListener('beforeunload', stopCamera);
    
    // ファイル名を自動生成
    const now = new Date();
    const timestamp = now.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/[\\/ :]/g, '');
    filenameInput.value = 'scan_' + timestamp;
  </script>
</body>
</html>
`;

// Google Apps Script で実行
function doGet(e) {
  return HtmlService.createHtmlOutput(HTML_APP);
}
