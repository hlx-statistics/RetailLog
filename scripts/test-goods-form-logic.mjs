/**
 * 商品表单关键逻辑回归（node scripts/test-goods-form-logic.mjs）
 */
import { asFormText } from '../src/utils/form-text.ts'
import { shouldConfirmCloseOnCancel } from '../src/utils/goods-form-close.ts'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

// 售价：number 输入曾导致 .trim 抛错、保存无反应
assert(asFormText(12.5) === '12.5', 'number price')
assert(asFormText(' 9.9 ') === '9.9', 'string price trim')
assert(asFormText('') === '', 'empty price')
assert(asFormText(null) === '', 'null price')

let threw = false
try {
  // 旧逻辑在 number 上会失败
  ;(12.5).trim()
} catch {
  threw = true
}
assert(threw, 'number.trim should throw (documents root cause)')

// 脏检查 / 预填条码关闭确认（纯数据模拟）
function isDirty(snapshot, payload) {
  return JSON.stringify(payload) !== snapshot
}
const presetOnly = {
  barcode: '690123',
  name: '',
  price: '',
  stock: 0,
  category: '未分类',
  remark: '',
}
const snap = JSON.stringify(presetOnly)
assert(!isDirty(snap, presetOnly), 'preset only not dirty')
assert(
  shouldConfirmCloseOnCancel(
    false,
    false,
    { barcode: '690123', name: '', price: '' },
    true,
  ),
  'barcode-only needs confirm on close',
)

const filled = { ...presetOnly, name: '可乐', price: '3.5' }
assert(isDirty(snap, filled), 'filled form is dirty')
assert(
  shouldConfirmCloseOnCancel(
    true,
    false,
    { barcode: '690123', name: '可乐', price: '3.5' },
    true,
  ),
  'dirty form needs confirm',
)
assert(
  !shouldConfirmCloseOnCancel(
    false,
    false,
    { barcode: '690123', name: '可乐', price: '3.5' },
    true,
  ),
  'ref prefilled unchanged no confirm',
)

console.log('OK: goods form logic tests passed')
