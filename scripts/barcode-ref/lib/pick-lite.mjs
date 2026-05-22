import { MIN_LITE_SCORE, scoreProduct } from './score-product.mjs'

/**
 * 食品+大牌优先：按评分从高到低装入，直到体积上限
 *
 * @param {Map<string, { n: string, p: number, brand?: string }>} unique
 * @param {number} maxLiteBytes
 * @param {number} formatVersion
 */
export function buildLitePayload(unique, maxLiteBytes, formatVersion = 1) {
  /** @type {{ b: string, n: string, p: number, score: number }[]} */
  const ranked = []

  for (const [barcode, rec] of unique) {
    const score = scoreProduct(rec.n, rec.brand ?? '')
    if (score < MIN_LITE_SCORE) continue
    ranked.push({ b: barcode, n: rec.n, p: rec.p, score })
  }

  ranked.sort((a, b) => b.score - a.score || a.b.localeCompare(b.b))

  /** @type {[string, string, number][]} */
  const items = []
  for (const row of ranked) {
    const tuple = /** @type {[string, string, number]} */ ([row.b, row.n, row.p])
    const trial = { v: formatVersion, items: [...items, tuple] }
    if (Buffer.byteLength(JSON.stringify(trial), 'utf8') > maxLiteBytes) break
    items.push(tuple)
  }

  return { v: formatVersion, items, rankedTotal: ranked.length }
}
