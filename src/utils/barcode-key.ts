/** 生成参考库查询用的条码键（EAN-13 / UPC-A 互查） */
export function barcodeLookupKeys(barcode: string): string[] {
  const k = barcode.trim()
  if (!k) return []
  const keys = new Set<string>([k])
  if (k.length === 12) keys.add(`0${k}`)
  if (k.length === 13 && k.startsWith('0')) keys.add(k.slice(1))
  return [...keys]
}
