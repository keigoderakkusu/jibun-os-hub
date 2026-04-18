/**
 * Memory Management for ECC (GAS Edition)
 * Role: Persistent context storage (NanoClaw compatible)
 */

/**
 * メモリ保存
 */
function saveToMemory(key, value) {
  const props = PropertiesService.getUserProperties();
  props.setProperty('ECC_MEMORY_' + key, JSON.stringify(value));
}

/**
 * メモリ読み込み
 */
function loadMemory() {
  const props = PropertiesService.getUserProperties();
  const all = props.getProperties();
  const memory = {};
  
  for (let key in all) {
    if (key.startsWith('ECC_MEMORY_')) {
      memory[key.replace('ECC_MEMORY_', '')] = JSON.parse(all[key]);
    }
  }
  return memory;
}

/**
 * 継続的な進捗（Context Compact）
 */
function autoCompact() {
  const memory = loadMemory();
  const keys = Object.keys(memory);
  if (keys.length > 20) {
    // 20件以上の古い記憶を削除するロジック（実際にはより高度な要約が必要）
    console.log('🧹 Compacting memory...');
  }
}
