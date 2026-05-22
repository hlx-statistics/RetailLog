/**
 * 生成带模拟经营数据的演示备份 → public/demo-backup.json
 * 运行: npm run demo:backup
 */
import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const MS_DAY = 24 * 60 * 60 * 1000

/** 固定基准日，便于复现；导入后以「生成时刻」为 now 重算时间戳 */
const BASE_NOW = Date.parse('2026-05-23T14:00:00+08:00')

function daysAgo(days, hour = 10, minute = 0) {
  const d = new Date(BASE_NOW - days * MS_DAY)
  d.setHours(hour, minute, 0, 0)
  return d.getTime()
}

function id() {
  return randomUUID()
}

const categories = [
  { id: 'cat-food', name: '食品' },
  { id: 'cat-drink', name: '饮料' },
  { id: 'cat-daily', name: '日用品' },
  { id: 'cat-other', name: '其他' },
]

const goodsDefs = [
  {
    key: 'water',
    barcode: '6921168509256',
    name: '农夫山泉 550ml',
    price: 2,
    cost: 1.2,
    stock: 3,
    category: '饮料',
    remark: '演示：数量榜靠前 + 建议补货',
  },
  {
    key: 'cola',
    barcode: '6901939621298',
    name: '可口可乐 330ml',
    price: 3.5,
    cost: 2.4,
    stock: 18,
    category: '饮料',
  },
  {
    key: 'noodle',
    barcode: '6920152467899',
    name: '康师傅红烧牛肉面',
    price: 4.5,
    cost: 3.2,
    stock: 4,
    category: '食品',
    remark: '演示：有销量且库存偏低',
  },
  {
    key: 'ham',
    barcode: '6901939610148',
    name: '双汇火腿肠 40g',
    price: 2.5,
    cost: 1.8,
    stock: 22,
    category: '食品',
  },
  {
    key: 'oreo',
    barcode: '6901668936422',
    name: '奥利奥原味 116g',
    price: 8.9,
    cost: 6.5,
    stock: 9,
    category: '食品',
  },
  {
    key: 'moutai',
    barcode: '6902952888888',
    name: '飞天茅台 53度 500ml',
    price: 1499,
    cost: 1200,
    stock: 2,
    category: '其他',
    remark: '演示：金额榜靠前',
  },
  {
    key: 'cigarette',
    barcode: '6901028196463',
    name: '中华香烟 软包',
    price: 65,
    cost: 58,
    stock: 6,
    category: '其他',
    remark: '演示：金额榜（单价高）',
  },
  {
    key: 'tissue',
    barcode: '6972183820126',
    name: '清风抽纸 3包',
    price: 9.9,
    cost: 7,
    stock: 11,
    category: '日用品',
  },
  {
    key: 'soap',
    barcode: '6901234567891',
    name: '舒肤佳香皂 115g',
    price: 5.5,
    cost: 3.8,
    stock: 4,
    category: '日用品',
    remark: '演示：建议补货',
  },
  {
    key: 'stale-biscuit',
    barcode: '6901234567892',
    name: '老派苏打饼干 400g',
    price: 6.5,
    cost: 4.2,
    stock: 7,
    category: '食品',
    remark: '演示：60天+未售出 → 查保质期',
  },
  {
    key: 'never-sold',
    barcode: '6901234567893',
    name: '进口榛子巧克力 200g',
    price: 28,
    cost: 18,
    stock: 12,
    category: '食品',
    remark: '演示：从未售出 → 查保质期',
  },
  {
    key: 'sold-out',
    barcode: '6901234567894',
    name: '电解质饮料 500ml',
    price: 5,
    cost: 3,
    stock: 0,
    category: '饮料',
    remark: '演示：零库存不进经营榜',
  },
]

const goods = goodsDefs.map((g) => {
  const goodsId = id()
  const createdAt = daysAgo(120, 9)
  return { ...g, goodsId, createdAt, updatedAt: daysAgo(1, 8) }
})

const byKey = Object.fromEntries(goods.map((g) => [g.key, g]))

function line(key, quantity) {
  const g = byKey[key]
  return {
    goodsId: g.goodsId,
    barcode: g.barcode,
    name: g.name,
    price: g.price,
    quantity,
  }
}

function makeSale(dayOffset, hour, items) {
  const createdAt = daysAgo(dayOffset, hour)
  const saleItems = items.map(([key, qty]) => line(key, qty))
  const totalQty = saleItems.reduce((s, i) => s + i.quantity, 0)
  const totalAmount = saleItems.reduce((s, i) => s + i.price * i.quantity, 0)
  return {
    id: id(),
    items: saleItems,
    totalQty,
    totalAmount,
    createdAt,
  }
}

/** @type {ReturnType<typeof makeSale>[]} */
const sales = []

// 近 30 天：矿泉水走量（数量榜第一 + 库存3补货）
for (let d = 0; d < 28; d += 1) {
  if (d % 2 === 0) sales.push(makeSale(d, 9 + (d % 5), [['water', 4 + (d % 4)]]))
}
for (let d = 0; d < 25; d += 3) {
  sales.push(makeSale(d, 11, [
    ['water', 2],
    ['cola', 1 + (d % 2)],
  ]))
}

// 方便面、火腿肠：稳定动销
for (let d = 1; d < 26; d += 2) {
  sales.push(makeSale(d, 14, [['noodle', 2 + (d % 3)]]))
}
for (let d = 0; d < 20; d += 4) {
  sales.push(makeSale(d, 16, [['ham', 2]]))
}

// 香皂：有销量 + stock 4
for (let d = 2; d < 24; d += 3) {
  sales.push(makeSale(d, 18, [['soap', 1]]))
}

// 奥利奥：偶尔
for (let d = 3; d < 22; d += 5) {
  sales.push(makeSale(d, 15, [['oreo', 1]]))
}

// 茅台、中华：拉高金额榜
sales.push(makeSale(2, 20, [['moutai', 1]]))
sales.push(makeSale(8, 19, [['moutai', 1]]))
sales.push(makeSale(18, 21, [['moutai', 1]]))
for (let d = 1; d < 24; d += 3) {
  sales.push(makeSale(d, 20, [['cigarette', 1 + (d % 2)]]))
}

// 抽纸：中等
for (let d = 4; d < 20; d += 6) {
  sales.push(makeSale(d, 13, [['tissue', 1]]))
}

// 电解质水：近期热卖但已售罄（零库存不进榜）
for (let d = 0; d < 10; d += 2) {
  sales.push(makeSale(d, 10, [['sold-out', 3]]))
}

// 老派苏打饼干：75 天前最后一笔 → 久未售出
sales.push(makeSale(75, 12, [['stale-biscuit', 2]]))

// 进口巧克力：无销售记录

sales.sort((a, b) => b.createdAt - a.createdAt)

const goodsOut = goods.map(({ key: _k, goodsId, ...rest }) => ({
  id: goodsId,
  barcode: rest.barcode,
  name: rest.name,
  price: rest.price,
  cost: rest.cost,
  stock: rest.stock,
  category: rest.category,
  remark: rest.remark,
  createdAt: rest.createdAt,
  updatedAt: rest.updatedAt,
}))

/** 将 createdAt 平移到「当前时间」附近，避免导入后窗口对不上 */
function shiftTimestamps(records, goodsList) {
  const shift = Date.now() - BASE_NOW
  return {
    sales: records.map((s) => ({ ...s, createdAt: s.createdAt + shift })),
    goods: goodsList.map((g) => ({
      ...g,
      createdAt: g.createdAt + shift,
      updatedAt: g.updatedAt + shift,
    })),
  }
}

const shifted = shiftTimestamps(sales, goodsOut)

const backup = {
  version: 2,
  app: 'RuralKeeper',
  date: new Date().toISOString(),
  categories,
  goods: shifted.goods,
  sales: shifted.sales,
  logs: [],
  _demo: {
    note: '演示数据：数量榜看矿泉水/方便面，金额榜看茅台/香烟，补货看矿泉水/方便面/香皂，保质期看苏打饼干/进口巧克力',
    generatedAt: new Date().toISOString(),
  },
}

const outPath = join(root, 'public', 'demo-backup.json')
writeFileSync(outPath, JSON.stringify(backup, null, 2), 'utf8')

console.log(`已生成 ${outPath}`)
console.log(`商品 ${goodsOut.length} 种，销售单 ${sales.length} 笔`)
console.log('npm run dev 时每次启动会自动导入；正式/APK 构建不会打包此文件')
