export const DB_NAME = 'RuralKeeperDB'
export const DB_VERSION = 1

export const SCAN_DEBOUNCE_MS = 1000
export const MAX_LOGS = 500
export const MAX_SALE_RECORDS_DISPLAY = 20

export const UNCATEGORIZED_LABEL = '未分类'

export const DEFAULT_CATEGORIES = ['食品', '饮料', '日用品', '其他'] as const

export enum ScanMode {
  Sale = 'sale',
  Goods = 'goods',
}

export enum AppRoute {
  Goods = 'goods',
  Sale = 'sale',
  Profile = 'profile',
}
