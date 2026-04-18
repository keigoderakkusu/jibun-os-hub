/**
 * API Connector for ECC (GAS Edition)
 */

const API_KEYS = {
  GEMINI: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
  TELEGRAM_BOT_TOKEN: PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN'),
  TELEGRAM_CHAT_ID: PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID')
};

/**
 * AI生成（Gemini API）
 */
function generateWithAI(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEYS.GEMINI}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  return result.candidates[0].content.parts[0].text;
}

/**
 * Telegram送信
 */
function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${API_KEYS.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: API_KEYS.TELEGRAM_CHAT_ID,
    text: text
  };
  
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch(url, options);
}

/**
 * 疎通確認 (Harness Audit)
 */
function harnessAudit() {
  if (!API_KEYS.GEMINI || !API_KEYS.TELEGRAM_BOT_TOKEN) {
    console.error('❌ Keys are missing. Set them in File > Project Settings > Script Properties.');
    return false;
  }
  return true;
}
