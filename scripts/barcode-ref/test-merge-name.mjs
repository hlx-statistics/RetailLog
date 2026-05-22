/**
 * 商品名合并逻辑回归
 * node scripts/barcode-ref/test-merge-name.mjs
 */
import { buildDisplayName, nameAlreadyHasToken } from './lib/merge-name.mjs'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

// 名称已含规格，不再拼
assert(
  buildDisplayName('500g万丽厕精', '500g', '瓶') === '500g万丽厕精',
  'name already has spec',
)
assert(
  buildDisplayName('六神清凉爽肤沐浴露200ml', '200ml', '瓶') ===
    '六神清凉爽肤沐浴露200ml',
  'name already has ml spec',
)

// 名称无规格，拼 spec/unit
assert(
  buildDisplayName('六神百合除菌香皂', '125克', '块') ===
    '六神百合除菌香皂 125克/块',
  'append spec and unit',
)

// 仅缺单位
assert(
  buildDisplayName('某品牌矿泉水', '550ml', '瓶') === '某品牌矿泉水 550ml/瓶',
  'append both when missing',
)

// 仅 spec 与 unit 重复在 spec 字段
assert(
  buildDisplayName('99%莲花味精', '500g/500g', '袋') === '99%莲花味精 500g/500g',
  'spec contains slash unit',
)

assert(nameAlreadyHasToken('六神除菌香皂（金盏菊）125g', '125g'), 'has 125g')
assert(!nameAlreadyHasToken('六神百合除菌香皂', '125克'), 'no 125克')

console.log('[barcode-ref] merge-name 测试通过')
