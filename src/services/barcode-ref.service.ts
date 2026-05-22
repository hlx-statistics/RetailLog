import type { BarcodeRefEntry, BarcodeRefTuple } from '@/types/barcode-ref'
import { barcodeLookupKeys } from '@/utils/barcode-key'

const REF_URL = `${import.meta.env.BASE_URL}barcode-ref.jsonl`

const map = new Map<string, BarcodeRefEntry>()
let loaded = false
let loadPromise: Promise<void> | null = null

function ingestLine(line: string): void {
  const trimmed = line.trim()
  if (!trimmed) return
  try {
    const row = JSON.parse(trimmed) as BarcodeRefTuple
    if (!Array.isArray(row) || row.length < 3) return
    const [barcode, name, price] = row
    if (
      typeof barcode === 'string' &&
      typeof name === 'string' &&
      typeof price === 'number' &&
      barcode
    ) {
      map.set(barcode, { name, price })
    }
  } catch {
    // 跳过坏行
  }
}

export const barcodeRefService = {
  /** 启动时加载全量参考库（public/barcode-ref.jsonl，约 26MB） */
  async load(): Promise<void> {
    if (loaded) return
    if (loadPromise) return loadPromise

    loadPromise = (async () => {
      try {
        const res = await fetch(REF_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        let start = 0
        for (let i = 0; i < text.length; i++) {
          if (text[i] === '\n') {
            ingestLine(text.slice(start, i))
            start = i + 1
          }
        }
        if (start < text.length) ingestLine(text.slice(start))
        console.info(`[barcode-ref] 已加载 ${map.size} 条`)
      } catch (e) {
        console.warn('[barcode-ref] 参考库加载失败，扫码将仅预填条码', e)
      } finally {
        loaded = true
      }
    })()

    return loadPromise
  },

  lookup(barcode: string): BarcodeRefEntry | undefined {
    for (const key of barcodeLookupKeys(barcode)) {
      const hit = map.get(key)
      if (hit) return hit
    }
    return undefined
  },

  get count(): number {
    return map.size
  },

  get ready(): boolean {
    return loaded
  },
}
