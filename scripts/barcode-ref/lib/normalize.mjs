/**
 * 条码与价格规范化
 */

/** @param {unknown} raw */
export function normalizeBarcode(raw) {
  const s = String(raw ?? '').trim().replace(/^"|"$/g, '')
  if (!s || s === 'NULL') return ''
  // 去掉 CSV 可能带来的小数形式（极少）
  const digits = s.includes('.') ? s.split('.')[0] : s
  if (!/^\d{8,14}$/.test(digits)) return ''
  return digits
}

/** @param {unknown} raw @returns {number | null} */
export function normalizePrice(raw) {
  const s = String(raw ?? '').trim()
  if (!s || s === 'NULL') return null
  const n = Number.parseFloat(s)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100) / 100
}
