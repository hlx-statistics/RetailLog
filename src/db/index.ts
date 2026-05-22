import { openDB, type IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION } from '@/constants'
import type { RuralKeeperDB } from './schema'

let dbInstance: IDBPDatabase<RuralKeeperDB> | null = null

export async function getDb(): Promise<IDBPDatabase<RuralKeeperDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<RuralKeeperDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('goods')) {
        const goodsStore = db.createObjectStore('goods', { keyPath: 'id' })
        goodsStore.createIndex('barcode', 'barcode', { unique: true })
      }
      if (!db.objectStoreNames.contains('categories')) {
        const catStore = db.createObjectStore('categories', { keyPath: 'id' })
        catStore.createIndex('name', 'name', { unique: true })
      }
      if (!db.objectStoreNames.contains('sales')) {
        db.createObjectStore('sales', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('logs')) {
        db.createObjectStore('logs', { keyPath: 'id' })
      }
    },
  })

  return dbInstance
}
