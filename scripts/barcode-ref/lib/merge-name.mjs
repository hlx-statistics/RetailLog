/**
 * 将 spec / unit 并入商品名（用于条码参考库展示名）。
 * 若名称中已包含对应片段，则不再重复拼接。
 */

/** @param {string} s */
function norm(s) {
  return (s ?? '').trim().replace(/\s+/g, ' ')
}

/**
 * 名称是否已包含 token（大小写不敏感；忽略 token 内空格差异）
 * @param {string} name
 * @param {string} token
 */
export function nameAlreadyHasToken(name, token) {
  const t = norm(token)
  if (!t) return true
  const n = norm(name).toLowerCase()
  const tl = t.toLowerCase()
  if (n.includes(tl)) return true
  // 无空格 token：如 "125克" 与名称中 "125 克"
  const tlCompact = tl.replace(/\s+/g, '')
  if (tlCompact.length >= 2 && n.replace(/\s+/g, '').includes(tlCompact)) return true
  return false
}

/**
 * @param {string} name
 * @param {string} spec
 * @param {string} unit
 * @returns {string}
 */
export function buildDisplayName(name, spec, unit) {
  const base = norm(name)
  if (!base) return ''

  const s = norm(spec)
  const u = norm(unit)

  const addSpec = s && !nameAlreadyHasToken(base, s)
  const specAlreadyInName = Boolean(s && !addSpec)
  // 名称已含规格时，不再单独拼「瓶/袋」等包装单位
  const addUnit =
    u && !nameAlreadyHasToken(base, u) && !specAlreadyInName

  if (!addSpec && !addUnit) return base

  if (addSpec && addUnit) {
    // spec 已用斜杠带规格/单位（如 500g/500g）时不再追加 unit
    if (s.includes('/')) return `${base} ${s}`
    if (nameAlreadyHasToken(s, u)) return `${base} ${s}`
    return `${base} ${s}/${u}`
  }
  if (addSpec) return `${base} ${s}`
  return `${base} ${u}`
}
