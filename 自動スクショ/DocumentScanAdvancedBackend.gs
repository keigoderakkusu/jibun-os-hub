/**
 * Document Scan & Screenshot to PDF - Advanced Backend
 * 
 * 対応:
 * 1. 単一画像 → PDF
 * 2. 複数画像 → 1 つの マルチページPDF
 * 3. 複数画像 → ページごとに分割PDF
 */

function doPost(e) {
  try {
    // POSTデータの存在確認
    if (!e || !e.postData || !e.postData.contents) {
      return createErrorResponse('POSTデータが空、または正しく受信できていません。');
    }

    const payload = JSON.parse(e.postData.contents);
    Logger.log('Payload受信: ' + JSON.stringify({
      filename: payload.filename,
      hasImages: !!payload.images,
      imageCount: payload.images ? payload.images.length : 0,
      mode: payload.mode
    }));

    // バリデーション
    if (!payload.filename) {
      return createErrorResponse('filename は必須です');
    }

    // ファイル名サニタイズ
    payload.filename = sanitizeFilename(payload.filename);

    const mode = payload.mode || 'single'; // single, multiple
    const pdfMode = payload.pdfMode || 'combined'; // combined, split

    let result;

    if (mode === 'single' && payload.imageBase64) {
      // 単一画像 → PDF
      result = handleSingleImage(payload);

    } else if (mode === 'multiple' && payload.images && Array.isArray(payload.images)) {
      // 複数画像
      if (pdfMode === 'split') {
        // ページごとに分割 PDF
        result = handleSplitPDF(payload);
      } else {
        // 1 つのマルチページ PDF
        result = handleMultiplePage(payload);
      }

    } else if (Array.isArray(payload.images)) {
      // 自動スクロール取得画像（配列形式）
      if (pdfMode === 'split') {
        result = handleSplitPDF(payload);
      } else {
        result = handleMultiplePage(payload);
      }

    } else {
      return createErrorResponse('imageBase64 または images 配列が必要です');
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createErrorResponse(error.toString());
  }
}

/**
 * 単一画像 → PDF 変換
 */
function handleSingleImage(payload) {
  try {
    const imageBlob = Utilities.newBlob(
      Utilities.base64Decode(payload.imageBase64),
      'image/png',
      'temp.png'
    );

    const pdfBlob = convertImageToPDF(imageBlob, payload.filename);
    const folderId = payload.folderId || getOrCreateScanFolder();
    const file = DriveApp.getFolderById(folderId).createFile(pdfBlob);

    return {
      success: true,
      mode: 'single',
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: file.getUrl(),
      fileSize: file.getSize()
    };

  } catch (error) {
    throw error;
  }
}

/**
 * 複数画像 → マルチページ PDF（1 つのドキュメント）
 */
function handleMultiplePage(payload) {
  try {
    const images = payload.images;
    
    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('有効な画像配列が見つかりません');
    }

    // Google ドキュメント作成
    const doc = DocumentApp.create(payload.filename + '_temp');
    const body = doc.getBody();

    // 各画像を追加
    images.forEach((imageBase64, index) => {
      const imageBlob = Utilities.newBlob(
        Utilities.base64Decode(imageBase64),
        'image/png'
      );

      const img = body.appendImage(imageBlob);
      
      // 画像サイズ取得
      const imgWidth = img.getWidth();
      const imgHeight = img.getHeight();

      // ページサイズを画像に合わせて調整 (最大サイズ制限に注意)
      const targetWidth = 600; // 標準的なドキュメント幅
      const targetHeight = (imgHeight / imgWidth) * targetWidth;
      
      doc.setPageWidth(targetWidth);
      doc.setPageHeight(targetHeight);

      // 余白ゼロ
      body.setMarginTop(0);
      body.setMarginBottom(0);
      body.setMarginLeft(0);
      body.setMarginRight(0);

      // 画像をページいっぱいにリサイズ
      img.setWidth(targetWidth);
      img.setHeight(targetHeight);

      doc.saveAndClose(); // 保存
      
      const docOpen = DocumentApp.openById(doc.getId());
      const bodyOpen = docOpen.getBody();

      // ページ区切り（最後のページ以外）
      if (index < images.length - 1) {
        bodyOpen.appendPageBreak();
      }
      docOpen.saveAndClose();
    });

    Logger.log('PDF変換開始...');
    // PDF に変換
    const timestamp = Utilities.formatDate(new Date(), 'JST', 'yyyyMMdd_HHmmss');
    const pdfName = payload.filename + '_' + timestamp + '.pdf';
    const pdfBlob = DriveApp.getFileById(doc.getId()).getAs('application/pdf');
    pdfBlob.setName(pdfName);

    // Google Drive に保存
    const folderId = payload.folderId || getOrCreateScanFolder();
    const file = DriveApp.getFolderById(folderId).createFile(pdfBlob);

    // テンポラリドキュメントをゴミ箱へ（安全な削除）
    try {
      DriveApp.getFileById(doc.getId()).setTrashed(true);
    } catch (e) {
      console.warn('テンポラリファイル削除失敗:', e.message);
    }

    Logger.log('マルチページPDF作成: ' + pdfName + ', ページ数: ' + images.length);

    return {
      success: true,
      mode: 'multiple',
      pdfMode: 'combined',
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: file.getUrl(),
      fileSize: file.getSize(),
      pageCount: images.length
    };

  } catch (error) {
    throw error;
  }
}

/**
 * 複数画像 → ページごとに分割 PDF
 */
function handleSplitPDF(payload) {
  try {
    const images = payload.images;
    
    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('有効な画像配列が見つかりません');
    }

    const folderId = payload.folderId || getOrCreateScanFolder();
    const folder = DriveApp.getFolderById(folderId);
    const baseFilename = payload.filename;
    const createdFiles = [];

    // ページごとに PDF を生成
    images.forEach((imageBase64, pageNum) => {
      const imageBlob = Utilities.newBlob(
        Utilities.base64Decode(imageBase64),
        'image/png'
      );

      const pdfBlob = convertImageToPDF(imageBlob, baseFilename + '_page' + (pageNum + 1));
      const file = folder.createFile(pdfBlob);
      
      createdFiles.push({
        fileId: file.getId(),
        fileName: file.getName(),
        fileUrl: file.getUrl()
      });

      Logger.log('ページ ' + (pageNum + 1) + ' PDF作成: ' + file.getName());
    });

    return {
      success: true,
      mode: 'multiple',
      pdfMode: 'split',
      totalFiles: createdFiles.length,
      files: createdFiles
    };

  } catch (error) {
    throw error;
  }
}

/**
 * 画像 → PDF 変換（単一ページ）
 */
function convertImageToPDF(imageBlob, filename) {
  const doc = DocumentApp.create(filename + '_temp');
  const body = doc.getBody();

  // 画像を埋め込み
  const img = body.appendImage(imageBlob);

  // 画像サイズに合わせてページサイズを調整
  const imgWidth = img.getWidth();
  const imgHeight = img.getHeight();
  const targetWidth = 600;
  const targetHeight = (imgHeight / imgWidth) * targetWidth;

  doc.setPageWidth(targetWidth);
  doc.setPageHeight(targetHeight);

  // ページ設定（余白ゼロ）
  body.setMarginTop(0);
  body.setMarginBottom(0);
  body.setMarginLeft(0);
  body.setMarginRight(0);

  // 画像をリサイズ
  img.setWidth(targetWidth);
  img.setHeight(targetHeight);

  // PDF にエクスポート
  const pdfBlob = DriveApp.getFileById(doc.getId()).getAs('application/pdf');
  const timestamp = Utilities.formatDate(new Date(), 'JST', 'yyyyMMdd_HHmmss');
  pdfBlob.setName(filename + '_' + timestamp + '.pdf');

  // テンポラリドキュメントをゴミ箱へ（安全な削除）
  try {
    DriveApp.getFileById(doc.getId()).setTrashed(true);
  } catch (e) {
    console.warn('テンポラリファイル追加削除失敗:', e.message);
  }

  return pdfBlob;
}

/**
 * スキャン保存用フォルダ取得/作成
 */
function getOrCreateScanFolder() {
  const folderName = 'DocumentScan_' + Utilities.formatDate(new Date(), 'JST', 'yyyy年MM月');
  const folders = DriveApp.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next().getId();
  } else {
    return DriveApp.createFolder(folderName).getId();
  }
}

/**
 * ファイル名サニタイズ
 */
function sanitizeFilename(filename) {
  if (!filename) return 'unnamed';
  // 使えない文字を除去
  return filename.replace(/[\\/:*?"<>|]/g, '_').substring(0, 100);
}

/**
 * エラーレスポンス
 */
function createErrorResponse(errorMsg) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: false,
      error: errorMsg
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * ログ取得用ヘルパー
 */
function getExecutionLog() {
  const logSheet = SpreadsheetApp.create('DocumentScan_ExecutionLog').getActiveSheet();
  
  logSheet.appendRow([
    'Timestamp',
    'Mode',
    'PDFMode',
    'Filename',
    'PageCount',
    'FileID',
    'Status'
  ]);

  return logSheet;
}

/**
 * テスト用
 */
function testMultiPagePDF() {
  // テスト用のダミー画像を作成
  const testUrl = 'https://via.placeholder.com/800x600.png?text=Page+1';
  const response = UrlFetchApp.fetch(testUrl);
  const imageBlob = response.getBlob();

  const payload = {
    images: [
      Utilities.base64Encode(imageBlob.getBytes()),
      Utilities.base64Encode(imageBlob.getBytes()),
      Utilities.base64Encode(imageBlob.getBytes())
    ],
    filename: 'test_multipage',
    pdfMode: 'combined'
  };

  const result = handleMultiplePage(payload);
  Logger.log('テスト結果: ' + JSON.stringify(result));
}
