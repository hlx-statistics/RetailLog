/**
 * 解析带引号的 CSV 行（与 phpMyAdmin 导出格式兼容）
 * @param {string} line
 * @returns {string[]}
 */
export function parseCsvLine(line) {
  const fields = []
  let cur = ''
  let inQuotes = false
  let i = 0
  while (i < line.length) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      cur += c
      i++
      continue
    }
    if (c === '"') {
      inQuotes = true
      i++
      continue
    }
    if (c === ',') {
      fields.push(cur)
      cur = ''
      i++
      continue
    }
    cur += c
    i++
  }
  fields.push(cur)
  return fields
}

/** CSV 列索引（与源表头一致） */
export const COL = {
  id: 0,
  barcode: 1,
  name: 2,
  spec: 3,
  unit: 4,
  price: 5,
  brand: 6,
}
