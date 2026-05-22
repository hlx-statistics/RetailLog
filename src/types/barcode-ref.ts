/** 内置条码参考库单条（与 public/barcode-ref-lite.json 一致） */
export type BarcodeRefTuple = [barcode: string, name: string, price: number]

export interface BarcodeRefEntry {
  name: string
  price: number
}
