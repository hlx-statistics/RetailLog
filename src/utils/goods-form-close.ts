import { asFormText } from './form-text.ts'

export interface GoodsFormClosePayload {
  barcode: string
  name: string
  price: string
}

/** 关闭添加商品表单时是否需二次确认 */
export function shouldConfirmCloseOnCancel(
  isDirty: boolean,
  isEdit: boolean,
  payload: GoodsFormClosePayload,
  hasPresetBarcode: boolean,
): boolean {
  if (isDirty) return true
  if (!isEdit && hasPresetBarcode) {
    const onlyBarcode =
      payload.barcode.trim() &&
      !payload.name.trim() &&
      !asFormText(payload.price)
    if (onlyBarcode) return true
  }
  return false
}
