import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { getDb } from '@/db'
import { categoriesRepository } from '@/db/repositories/categories.repository'
import { goodsRepository } from '@/db/repositories/goods.repository'
import { logsRepository } from '@/db/repositories/logs.repository'
import { salesRepository } from '@/db/repositories/sales.repository'
import { categoryService } from '@/services/category.service'
import { goodsService } from '@/services/goods.service'
import type { BackupData, Category, Goods, SaleRecord } from '@/types'
import { blobToBase64 } from '@/utils/blob'
import { backupFileName } from '@/utils/format'
import { createId } from '@/utils/id'
import { isNativeApp } from '@/utils/platform'

const BACKUP_VERSION = 2

export const backupService = {
  async exportData(): Promise<{ blob: Blob; filename: string }> {
    const backup: BackupData = {
      version: BACKUP_VERSION,
      app: 'RuralKeeper',
      date: new Date().toISOString(),
      goods: await goodsRepository.getAll(),
      categories: await categoriesRepository.getAll(),
      sales: await salesRepository.getAll(),
      logs: await logsRepository.getAll(),
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })
    return { blob, filename: backupFileName() }
  },

  async downloadBackup(): Promise<void> {
    const { blob, filename } = await this.exportData()
    if (isNativeApp) {
      const base64 = await blobToBase64(blob)
      const written = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      })
      await Share.share({
        title: '乡程掌柜数据备份',
        files: [written.uri],
        dialogTitle: '保存备份到手机',
      })
      return
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  },

  async importData(file: File): Promise<void> {
    const text = await file.text()
    const data = JSON.parse(text) as BackupData
    await this.applyBackup(data)
  },

  async loadDemoBackup(): Promise<void> {
    const res = await fetch(`${import.meta.env.BASE_URL}demo-backup.json`)
    if (!res.ok) throw new Error('DEMO_NOT_FOUND')
    const data = (await res.json()) as BackupData
    await this.applyBackup(data)
  },

  async applyBackup(data: BackupData): Promise<void> {
    if (!data.goods || !Array.isArray(data.goods)) {
      throw new Error('INVALID_BACKUP')
    }

    const db = await getDb()
    const tx = db.transaction(['goods', 'categories', 'sales', 'logs'], 'readwrite')
    await Promise.all([
      tx.objectStore('goods').clear(),
      tx.objectStore('categories').clear(),
      tx.objectStore('sales').clear(),
      tx.objectStore('logs').clear(),
    ])
    await tx.done

    for (const cat of data.categories ?? []) {
      const c: Category = { id: cat.id || createId(), name: cat.name }
      await categoriesRepository.add(c)
    }

    for (const g of data.goods) {
      const goods: Goods = {
        ...g,
        id: g.id || createId(),
        createdAt: g.createdAt ?? Date.now(),
        updatedAt: g.updatedAt ?? Date.now(),
      }
      await goodsRepository.add(goods)
    }

    for (const s of data.sales ?? []) {
      const sale: SaleRecord = {
        ...s,
        id: s.id || createId(),
      }
      await salesRepository.add(sale)
    }

    for (const log of data.logs ?? []) {
      await logsRepository.add({ ...log, id: log.id || createId() })
    }

    await categoryService.initDefaults()
    const count = (await goodsService.list()).length
    if (count === 0) await seedSampleGoods()
  },
}

async function seedSampleGoods(): Promise<void> {
  const samples = [
    {
      barcode: '6901234567890',
      name: '农夫山泉 550ml',
      price: 2.0,
      cost: 1.2,
      stock: 30,
      category: '饮料',
      remark: '',
    },
    {
      barcode: '6920152467899',
      name: '康师傅红烧牛肉面',
      price: 4.5,
      cost: 3.2,
      stock: 15,
      category: '食品',
      remark: '',
    },
    {
      barcode: '6972183820126',
      name: '清风抽纸 3包',
      price: 9.9,
      cost: 7.0,
      stock: 8,
      category: '日用品',
      remark: '',
    },
  ]
  for (const g of samples) {
    await goodsService.create(g)
  }
}

export async function initAppData(): Promise<void> {
  await categoryService.initDefaults()
  const goods = await goodsService.list()
  if (goods.length === 0) {
    await seedSampleGoods()
  }
}
