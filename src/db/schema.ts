import type { DBSchema } from 'idb'
import type { Category, Goods, SaleRecord, StockLog } from '@/types'

export interface RuralKeeperDB extends DBSchema {
  goods: {
    key: string
    value: Goods
    indexes: { barcode: string }
  }
  categories: {
    key: string
    value: Category
    indexes: { name: string }
  }
  sales: {
    key: string
    value: SaleRecord
  }
  logs: {
    key: string
    value: StockLog
  }
}
