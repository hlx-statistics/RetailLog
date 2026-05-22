<script setup lang="ts">
defineOptions({ name: 'GoodsView' })

import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GoodsCard from '@/components/goods/GoodsCard.vue'
import GoodsFormModal from '@/components/goods/GoodsFormModal.vue'
import AppModal from '@/components/common/AppModal.vue'
import ScannerView from '@/components/common/ScannerView.vue'
import { useAppStore } from '@/stores/app.store'
import { goodsService } from '@/services/goods.service'
import { barcodeRefService } from '@/services/barcode-ref.service'
import { stockService } from '@/services/stock.service'
import { useScanner } from '@/composables/useScanner'
import { useScanFlash } from '@/composables/useScanFlash'
import { useToast } from '@/composables/useToast'
import { ScanMode } from '@/constants'
import type { Goods } from '@/types'

/** 扫码用途：添加商品 / 查商品 / 表单内扫条码 */
type ScanIntent = 'add' | 'lookup' | 'form'

const store = useAppStore()
const route = useRoute()
const { show } = useToast()
const { flash } = useScanFlash()
const { start, stop } = useScanner()

const search = ref('')
const categoryFilter = ref('all')
const showForm = ref(false)
const editingGoods = ref<Goods | null>(null)
const presetBarcode = ref('')
const presetName = ref('')
const presetPrice = ref<number | undefined>(undefined)
const showScan = ref(false)
const scanIntent = ref<ScanIntent>('add')
const goodsScanRef = ref<InstanceType<typeof ScannerView> | null>(null)

const scanModalTitle = computed(() => {
  if (scanIntent.value === 'add') return '扫码添加商品'
  if (scanIntent.value === 'form') return '扫描条码'
  return '扫码查商品'
})

const scanModalZIndex = computed(() => (showForm.value ? 220 : 200))

const scanModalTip = computed(() => {
  if (scanIntent.value === 'add') {
    return '对准商品条码，扫到后自动填入并打开添加表单'
  }
  if (scanIntent.value === 'form') {
    return '对准条码，将填入当前表单的条码栏'
  }
  return '扫到已有商品可编辑；新条码可快速建档'
})

const filteredGoods = computed(() =>
  goodsService.filter(store.goods, search.value, categoryFilter.value),
)

function clearPreset() {
  presetBarcode.value = ''
  presetName.value = ''
  presetPrice.value = undefined
}

function closeForm() {
  showForm.value = false
  clearPreset()
}

function openAdd() {
  editingGoods.value = null
  clearPreset()
  showForm.value = true
}

function openEdit(goods: Goods) {
  editingGoods.value = goods
  clearPreset()
  showForm.value = true
}

async function openAddWithBarcode(barcode: string) {
  editingGoods.value = null
  presetBarcode.value = barcode
  const ref = barcodeRefService.lookup(barcode)
  presetName.value = ref?.name ?? ''
  presetPrice.value = ref?.price
  showForm.value = true
  if (ref) {
    show(`已匹配参考库，请核对售价后保存`)
  } else {
    show('已识别条码，请补全商品信息')
  }
}

function openScan(intent: ScanIntent) {
  scanIntent.value = intent
  showScan.value = true
}

function openAddScan() {
  openScan('add')
}

function openGoodsScanModal() {
  openScan('lookup')
}

function openFormScan() {
  if (!showForm.value) return
  openScan('form')
}

async function onFormSaved() {
  await store.refreshGoods()
}

async function adjustStock(id: string, type: 'in' | 'out') {
  const goods = store.goods.find((g) => g.id === id)
  if (!goods) return
  const label =
    type === 'in'
      ? `入库「${goods.name}」\n扫一次码已定位，请输入本次入库数量：`
      : `非销售出库「${goods.name}」\n请输入出库数量：`
  const qty = prompt(label, '1')
  if (qty === null) return
  const num = parseInt(qty, 10)
  if (isNaN(num) || num <= 0) {
    alert('请输入正整数')
    return
  }
  try {
    if (type === 'in') {
      await stockService.stockIn(id, num)
      show(`已入库 +${num}`)
    } else {
      await stockService.stockOut(id, num)
      show(`已出库 -${num}`)
    }
    await store.refreshGoods()
  } catch (e) {
    if (e instanceof Error && e.message === 'INSUFFICIENT_STOCK') {
      alert('库存不足')
    }
  }
}

async function startGoodsScanner(retry = 0) {
  await nextTick()
  const video = goodsScanRef.value?.getVideoEl()
  if (!video) {
    if (retry < 8) setTimeout(() => void startGoodsScanner(retry + 1), 80)
    return
  }
  await start(video, ScanMode.Goods, handleScanBarcode)
}

watch(showScan, async (open) => {
  if (open) {
    await startGoodsScanner()
  } else {
    await stop()
  }
})

function closeScan() {
  showScan.value = false
}

async function handleScanBarcode(barcode: string) {
  flash()
  await stop()
  showScan.value = false
  await nextTick()

  const intent = scanIntent.value
  const goods = await goodsService.getByBarcode(barcode)

  if (intent === 'form') {
    presetBarcode.value = barcode
    const ref = barcodeRefService.lookup(barcode)
    if (ref) {
      presetName.value = ref.name
      presetPrice.value = ref.price
      show(`已填入条码，并匹配参考库`)
    } else {
      presetName.value = ''
      presetPrice.value = undefined
      show(`已填入条码：${barcode}`)
    }
    return
  }

  if (intent === 'add') {
    if (goods) {
      const edit = confirm(
        `条码「${barcode}」已存在：${goods.name}\n\n确定 → 编辑该商品\n取消 → 继续扫码添加`,
      )
      if (edit) openEdit(goods)
      else openAddScan()
    } else {
      await openAddWithBarcode(barcode)
    }
    return
  }

  // lookup
  if (goods) {
    const edit = confirm(
      `找到：${goods.name}\n库存 ${goods.stock} · ¥${goods.price}\n\n确定 → 编辑商品\n取消 → 继续扫码`,
    )
    if (edit) openEdit(goods)
    else openGoodsScanModal()
  } else {
    const addNew = confirm(`未找到条码 ${barcode}\n是否添加新商品？`)
    if (addNew) await openAddWithBarcode(barcode)
  }
}

function manualScanInput() {
  const code = prompt('请输入条码')
  if (code) void handleScanBarcode(code.trim())
}

watch(
  () => route.query.barcode,
  (code) => {
    if (typeof code === 'string' && code) void openAddWithBarcode(code)
  },
  { immediate: true },
)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">零售日志</h1>
      <div class="header-actions">
        <button class="btn btn-icon primary" @click="openAddScan">📷 扫码添加</button>
        <button class="btn btn-icon" @click="openAdd">➕ 手动添加</button>
        <button class="btn btn-icon" @click="openGoodsScanModal">🔍 查商品</button>
      </div>
    </header>

    <div class="search-box">
      <input v-model="search" type="text" placeholder="🔍 商品名 / 条码" autocomplete="off" />
      <select v-model="categoryFilter" class="filter-select">
        <option value="all">全部分类</option>
        <option v-for="c in store.categories" :key="c.id" :value="c.name">{{ c.name }}</option>
      </select>
    </div>

    <div v-if="!store.ready" class="empty">加载中...</div>
    <div v-else-if="filteredGoods.length === 0" class="empty">暂无商品，点击「扫码添加」或 + 手动添加</div>
    <GoodsCard
      v-for="g in filteredGoods"
      :key="g.id"
      :goods="g"
      @edit="openEdit(g)"
      @stock-in="adjustStock(g.id, 'in')"
      @stock-out="adjustStock(g.id, 'out')"
    />

    <button
      v-show="!showForm && !showScan"
      class="fab"
      title="手动添加"
      @click="openAdd"
    >
      +
    </button>

    <GoodsFormModal
      :show="showForm"
      :goods="editingGoods"
      :preset-barcode="presetBarcode"
      :preset-name="presetName"
      :preset-price="presetPrice"
      :categories="store.categories"
      @close="closeForm"
      @saved="onFormSaved"
      @deleted="onFormSaved"
      @scan-barcode="openFormScan"
    />

    <AppModal :show="showScan" :z-index="scanModalZIndex" @close="closeScan">
      <h3>{{ scanModalTitle }}</h3>
      <ScannerView ref="goodsScanRef" />
      <p class="scan-tip">{{ scanModalTip }}</p>
      <template #footer>
        <div class="modal-buttons">
          <button type="button" class="btn-secondary" @click="manualScanInput">手动输入</button>
          <button type="button" class="btn-primary" @click="closeScan">关闭</button>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.search-box {
  background: white;
  border-radius: 32px;
  padding: 8px 16px;
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  align-items: center;
}
.search-box input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  background: transparent;
}
.filter-select {
  background: #f1f3f5;
  border: none;
  padding: 6px 12px;
  border-radius: 30px;
  font-size: 14px;
}
.empty {
  text-align: center;
  padding: 40px;
  color: #aaa;
}
.fab {
  position: fixed;
  bottom: 85px;
  right: 20px;
  background: var(--color-primary);
  color: white;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: none;
  cursor: pointer;
  z-index: 99;
}
.scan-tip {
  text-align: center;
  font-size: 13px;
  color: var(--color-muted);
  margin: 12px 0;
  line-height: 1.5;
}
.modal-buttons {
  display: flex;
  gap: 12px;
}
.modal-buttons button {
  flex: 1;
}
</style>
