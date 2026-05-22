import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Category, Goods, SaleRecord } from '@/types'
import { categoryService } from '@/services/category.service'
import { goodsService } from '@/services/goods.service'
import { saleService } from '@/services/sale.service'
import { initAppData } from '@/services/backup.service'
import { barcodeRefService } from '@/services/barcode-ref.service'

export const useAppStore = defineStore('app', () => {
  const ready = ref(false)
  const goods = ref<Goods[]>([])
  const categories = ref<Category[]>([])
  const sales = ref<SaleRecord[]>([])

  async function bootstrap() {
    await Promise.all([initAppData(), barcodeRefService.load()])
    await refreshAll()
    ready.value = true
  }

  async function refreshGoods() {
    goods.value = await goodsService.list()
  }

  async function refreshCategories() {
    categories.value = await categoryService.list()
  }

  async function refreshSales() {
    sales.value = await saleService.listRecords()
  }

  async function refreshAll() {
    await Promise.all([refreshGoods(), refreshCategories(), refreshSales()])
  }

  return {
    ready,
    goods,
    categories,
    sales,
    bootstrap,
    refreshGoods,
    refreshCategories,
    refreshSales,
    refreshAll,
  }
})
