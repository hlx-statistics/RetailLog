/**
 * node scripts/barcode-ref/test-pick-lite.mjs
 */
import { buildLitePayload } from './lib/pick-lite.mjs'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const unique = new Map()
unique.set('6921168520015', { n: '农夫山泉天然水1.5L', p: 2.8, brand: '农夫山泉' })
unique.set('6901121300298', { n: '500g万丽厕精', p: 4.5, brand: '万丽' })
unique.set('6901294171206', {
  n: '六神清凉爽肤沐浴露200ml',
  p: 9.9,
  brand: '六神',
})
unique.set('6901668053893', {
  n: '奧利奧迷你原味小餅乾',
  p: 5.5,
  brand: '奧利奧',
})

const payload = buildLitePayload(unique, 1024 * 1024)
const barcodes = new Set(payload.items.map((t) => t[0]))

assert(barcodes.has('6921168520015'), 'includes nongfu')
assert(barcodes.has('6901668053893'), 'includes oreo')
assert(!barcodes.has('6901121300298'), 'excludes toilet cleaner')
assert(!barcodes.has('6901294171206'), 'excludes shower gel')

console.log('[barcode-ref] pick-lite 测试通过')
