/**
 * node scripts/test-barcode-ref-app.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { shouldConfirmCloseOnCancel } from '../src/utils/goods-form-close.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const JSONL =
  fs.existsSync(path.join(ROOT, 'public/barcode-ref.jsonl'))
    ? path.join(ROOT, 'public/barcode-ref.jsonl')
    : path.join(ROOT, 'data/processed/full/barcodes.jsonl')

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const map = new Map()
for (const line of fs.readFileSync(JSONL, 'utf8').split('\n')) {
  const t = line.trim()
  if (!t) continue
  const row = JSON.parse(t)
  map.set(row[0], { name: row[1], price: row[2] })
}

assert(map.size > 400000, 'full ref size')
const probe = '6921168520015'
const hit = map.get(probe)
assert(hit && hit.name.includes('农夫山泉'), `probe ${probe}`)

assert(
  shouldConfirmCloseOnCancel(false, false, { barcode: '690', name: '', price: '' }, true),
  'barcode-only needs confirm',
)

console.log(`OK: barcode-ref full jsonl (${map.size} 条, probe OK)`)
