/**
 * 稳定哈希，用于从全量中均匀抽样生成 lite 包
 * @param {string} str
 * @returns {number} uint32
 */
export function hash32(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * @param {string} barcode
 * @param {number} ratio 0..1
 */
export function inLiteSample(barcode, ratio) {
  if (ratio >= 1) return true
  if (ratio <= 0) return false
  return hash32(barcode) / 0xffffffff < ratio
}
