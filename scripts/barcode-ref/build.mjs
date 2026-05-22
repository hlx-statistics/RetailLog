/**
 * 条码参考库预处理
 *
 * 输入：data/raw/barcodes.csv
 * 输出：
 *   - data/processed/full/barcodes.jsonl  （全量，gitignore）
 *   - data/processed/stats.json
 *   - public/barcode-ref.jsonl            （App 内置全量参考库，约 26MB）
 *   - public/barcode-ref-lite.json        （可选 --lite，默认不再生成）
 *
 * 用法：
 *   node scripts/barcode-ref/build.mjs
 *   node scripts/barcode-ref/build.mjs --sample 5000
 *   node scripts/barcode-ref/build.mjs --max-lite-mb 4.5
 */
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'
import { parseCsvLine, COL } from './lib/csv-parse.mjs'
import { buildDisplayName } from './lib/merge-name.mjs'
import { normalizeBarcode, normalizePrice } from './lib/normalize.mjs'
import { buildLitePayload } from './lib/pick-lite.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

const DEFAULT_RAW = path.join(ROOT, 'data/raw/barcodes.csv')
const FULL_JSONL = path.join(ROOT, 'data/processed/full/barcodes.jsonl')
const STATS_PATH = path.join(ROOT, 'data/processed/stats.json')
const PUBLIC_JSONL = path.join(ROOT, 'public/barcode-ref.jsonl')
const LITE_PATH = path.join(ROOT, 'public/barcode-ref-lite.json')

const LITE_FORMAT_VERSION = 1
const DEFAULT_MAX_LITE_BYTES = 5 * 1024 * 1024

function parseArgs(argv) {
  let sample = 0
  let maxLiteMb = 5
  let rawPath = DEFAULT_RAW
  let buildLite = false
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--sample' && argv[i + 1]) {
      sample = Number.parseInt(argv[++i], 10)
      continue
    }
    if (a === '--lite') {
      buildLite = true
      continue
    }
    if (a === '--max-lite-mb' && argv[i + 1]) {
      maxLiteMb = Number.parseFloat(argv[++i])
      continue
    }
    if (a === '--input' && argv[i + 1]) {
      rawPath = path.resolve(argv[++i])
      continue
    }
  }
  return {
    sample: Number.isFinite(sample) && sample > 0 ? sample : 0,
    maxLiteBytes: Math.floor(maxLiteMb * 1024 * 1024),
    rawPath,
    buildLite,
  }
}

async function main() {
  const { sample, maxLiteBytes, rawPath, buildLite } = parseArgs(process.argv)

  if (!fs.existsSync(rawPath)) {
    console.error(`[barcode-ref] 找不到原始 CSV：${rawPath}`)
    console.error('请将 barcodes.csv 放到 data/raw/，或用 --input 指定路径')
    process.exit(1)
  }

  fs.mkdirSync(path.dirname(FULL_JSONL), { recursive: true })
  fs.mkdirSync(path.dirname(LITE_PATH), { recursive: true })

  const stats = {
    builtAt: new Date().toISOString(),
    source: path.relative(ROOT, rawPath),
    sampleLimit: sample || null,
    rowsRead: 0,
    skipped: { invalidBarcode: 0, emptyName: 0, badPrice: 0 },
    duplicates: 0,
    unique: 0,
    lite: { maxBytes: maxLiteBytes, count: 0, bytes: 0, ratio: 0 },
  }

  /** @type {Map<string, { n: string, p: number, brand: string }>} */
  const unique = new Map()

  const rl = readline.createInterface({
    input: fs.createReadStream(rawPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  let isHeader = true
  for await (const line of rl) {
    if (!line.trim()) continue
    if (isHeader) {
      isHeader = false
      continue
    }
    stats.rowsRead++
    if (sample && stats.rowsRead > sample) break

    const cols = parseCsvLine(line)
    const barcode = normalizeBarcode(cols[COL.barcode])
    if (!barcode) {
      stats.skipped.invalidBarcode++
      continue
    }

    const displayName = buildDisplayName(
      cols[COL.name] ?? '',
      cols[COL.spec] ?? '',
      cols[COL.unit] ?? '',
    )
    if (!displayName) {
      stats.skipped.emptyName++
      continue
    }

    const price = normalizePrice(cols[COL.price])
    if (price === null) {
      stats.skipped.badPrice++
      continue
    }

    if (unique.has(barcode)) {
      stats.duplicates++
      continue
    }
    const brand = String(cols[COL.brand] ?? '').trim()
    unique.set(barcode, { n: displayName, p: price, brand })
  }

  stats.unique = unique.size

  const fullStream = fs.createWriteStream(FULL_JSONL, { encoding: 'utf8' })
  for (const [b, rec] of unique) {
    const tuple = /** @type {[string, string, number]} */ ([b, rec.n, rec.p])
    fullStream.write(`${JSON.stringify(tuple)}\n`)
  }
  await new Promise((res, rej) => {
    fullStream.end(() => res())
    fullStream.on('error', rej)
  })

  fs.copyFileSync(FULL_JSONL, PUBLIC_JSONL)
  const publicBytes = fs.statSync(PUBLIC_JSONL).size

  const probe = '6921168520015'
  let probeInFull = false
  for (const [b] of unique) {
    if (b === probe) {
      probeInFull = true
      break
    }
  }

  stats.public = {
    path: path.relative(ROOT, PUBLIC_JSONL),
    count: unique.size,
    bytes: publicBytes,
    probe6921168520015: probeInFull,
  }

  if (buildLite) {
    const liteBuilt = buildLitePayload(unique, maxLiteBytes, LITE_FORMAT_VERSION)
    const litePayload = { v: liteBuilt.v, items: liteBuilt.items }
    const liteBody = JSON.stringify(litePayload)
    fs.writeFileSync(LITE_PATH, liteBody, 'utf8')
    stats.lite = {
      maxBytes: maxLiteBytes,
      count: litePayload.items.length,
      bytes: Buffer.byteLength(liteBody, 'utf8'),
      sampling: 'food-major-brand-score',
      probe6921168520015: litePayload.items.some((t) => t[0] === probe),
    }
  }

  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2), 'utf8')

  console.log('[barcode-ref] 完成')
  console.log(`  读取行数: ${stats.rowsRead}`)
  console.log(`  去重后:   ${stats.unique}`)
  console.log(`  重复丢弃: ${stats.duplicates}`)
  console.log(`  全量:     ${path.relative(ROOT, FULL_JSONL)}`)
  console.log(
    `  App 参考库: ${stats.public.path} (${(stats.public.bytes / 1024 / 1024).toFixed(2)} MB, ${stats.public.count} 条)`,
  )
  if (stats.lite) {
    console.log(
      `  可选 lite:  ${path.relative(ROOT, LITE_PATH)} (${(stats.lite.bytes / 1024 / 1024).toFixed(2)} MB, ${stats.lite.count} 条)`,
    )
  }
  console.log(`  统计:     ${path.relative(ROOT, STATS_PATH)}`)
}

main().catch((err) => {
  console.error('[barcode-ref] 失败', err)
  process.exit(1)
})
