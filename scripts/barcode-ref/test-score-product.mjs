/**
 * node scripts/barcode-ref/test-score-product.mjs
 */
import { scoreProduct, MIN_LITE_SCORE } from './lib/score-product.mjs'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

assert(
  scoreProduct('农夫山泉天然水1.5L', '农夫山泉') >= MIN_LITE_SCORE,
  'nongfu spring',
)
assert(scoreProduct('500g万丽厕精', '万丽') < MIN_LITE_SCORE, 'toilet cleaner out')
assert(
  scoreProduct('六神清凉爽肤沐浴露200ml', '六神') < MIN_LITE_SCORE,
  'shower gel out',
)
assert(
  scoreProduct('奥利奥迷你原味小餅乾', '奧利奧') >= MIN_LITE_SCORE,
  'oreo in',
)
assert(
  scoreProduct('南方黑芝麻糊', '南方黑芝麻') >= MIN_LITE_SCORE,
  'food in',
)

console.log('[barcode-ref] score-product 测试通过')
