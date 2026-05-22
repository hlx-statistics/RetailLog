<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Category, Goods } from '@/types'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import CategoryCombo from '@/components/goods/CategoryCombo.vue'
import { goodsService } from '@/services/goods.service'
import { categoryService } from '@/services/category.service'
import { useAppStore } from '@/stores/app.store'
import { useToast } from '@/composables/useToast'
import { UNCATEGORIZED_LABEL } from '@/constants'
import { asFormText } from '@/utils/form-text'
import { shouldConfirmCloseOnCancel } from '@/utils/goods-form-close'
import { barcodeRefService } from '@/services/barcode-ref.service'

const props = defineProps<{
  show: boolean
  goods: Goods | null
  presetBarcode?: string
  /** 参考库预填名称（扫码未命中店主商品时） */
  presetName?: string
  /** 参考库预填售价 */
  presetPrice?: number
  categories: Category[]
}>()

const emit = defineEmits<{
  close: []
  saved: []
  deleted: []
  scanBarcode: []
}>()

const store = useAppStore()
const { show: showToast } = useToast()

const barcode = ref('')
const name = ref('')
const price = ref('')
const stock = ref(0)
const category = ref(UNCATEGORIZED_LABEL)
const remark = ref('')
const saving = ref(false)
const initialSnapshot = ref('')
const showDiscardConfirm = ref(false)
const showDeleteConfirm = ref(false)

const isEdit = computed(() => !!props.goods)
const title = computed(() => (isEdit.value ? '编辑商品' : '添加商品'))

function normalizeStock(value: unknown): number {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
}

function formPayload() {
  return {
    barcode: barcode.value.trim(),
    name: name.value.trim(),
    price: asFormText(price.value),
    stock: normalizeStock(stock.value),
    category: category.value.trim() || UNCATEGORIZED_LABEL,
    remark: remark.value.trim(),
  }
}

function captureSnapshot() {
  initialSnapshot.value = JSON.stringify(formPayload())
}

function resetForm() {
  barcode.value = props.goods?.barcode ?? props.presetBarcode ?? ''
  name.value = props.goods?.name ?? props.presetName ?? ''
  const presetP = props.presetPrice
  price.value = props.goods
    ? String(props.goods.price)
    : presetP != null && Number.isFinite(presetP)
      ? String(presetP)
      : ''
  stock.value = props.goods?.stock ?? 0
  category.value = props.goods?.category ?? UNCATEGORIZED_LABEL
  remark.value = props.goods?.remark ?? ''
  captureSnapshot()
}

async function applyRefFromBarcode(code: string) {
  if (isEdit.value || !code.trim()) return
  const ref = barcodeRefService.lookup(code)
  if (!ref) return
  if (!name.value.trim()) name.value = ref.name
  if (!asFormText(price.value)) price.value = String(ref.price)
}

const isDirty = computed(() => {
  if (!props.show || !initialSnapshot.value) return false
  return JSON.stringify(formPayload()) !== initialSnapshot.value
})

/** 扫码仅预填条码时需二次确认；参考库已带出名称售价且未改动的可直接关 */
const shouldConfirmClose = computed(() => {
  const p = formPayload()
  return shouldConfirmCloseOnCancel(
    isDirty.value,
    isEdit.value,
    { barcode: p.barcode, name: p.name, price: p.price },
    Boolean(props.presetBarcode?.trim()),
  )
})

watch(
  () => [props.show, props.goods] as const,
  () => {
    if (!props.show) return
    resetForm()
  },
  { immediate: true },
)

watch(
  () => props.show,
  (visible) => {
    if (!visible) {
      showDiscardConfirm.value = false
      showDeleteConfirm.value = false
    }
  },
)

watch(
  () =>
    [props.presetBarcode, props.presetName, props.presetPrice, props.show] as const,
  ([code, presetN, presetP, visible]) => {
    if (!visible || isEdit.value) return
    if (code) {
      barcode.value = code
      void applyRefFromBarcode(code)
    }
    if (presetN) name.value = presetN
    if (presetP != null && Number.isFinite(presetP)) price.value = String(presetP)
    if (!isDirty.value) captureSnapshot()
  },
)

watch(barcode, (code) => {
  if (!props.show || isEdit.value) return
  void applyRefFromBarcode(code)
})

function requestClose() {
  if (shouldConfirmClose.value) {
    showDiscardConfirm.value = true
    return
  }
  emit('close')
}

function confirmDiscard() {
  showDiscardConfirm.value = false
  emit('close')
}

function cancelDiscard() {
  showDiscardConfirm.value = false
}

async function resolveCategoryForSave(): Promise<string> {
  const raw = category.value.trim()
  if (!raw || raw === UNCATEGORIZED_LABEL) return UNCATEGORIZED_LABEL

  const existing = props.categories.find((c) => c.name === raw)
  if (existing) return existing.name

  const created = await categoryService.add(raw)
  await store.refreshCategories()
  showToast(`已新建分类：${created.name}`)
  return created.name
}

async function save() {
  if (saving.value) return
  const b = barcode.value.trim()
  const n = name.value.trim()
  if (!b || !n) {
    showToast('请填写条码和商品名称')
    return
  }
  const priceStr = asFormText(price.value)
  if (!priceStr) {
    showToast('请填写售价')
    return
  }
  const p = parseFloat(priceStr)
  if (isNaN(p) || p < 0) {
    showToast('请输入有效售价')
    return
  }
  const s = normalizeStock(stock.value)
  if (s < 0) {
    showToast('库存不能为负数')
    return
  }

  saving.value = true
  try {
    const categoryName = await resolveCategoryForSave()
    const payload = {
      barcode: b,
      name: n,
      price: p,
      stock: s,
      category: categoryName,
      remark: remark.value,
    }

    if (props.goods) {
      await goodsService.update(props.goods.id, payload)
    } else {
      await goodsService.create({ ...payload, cost: 0 })
    }
    showToast(isEdit.value ? '已保存' : '商品已添加')
    emit('saved')
    emit('close')
  } catch (e) {
    if (e instanceof Error && e.message === 'BARCODE_EXISTS') {
      showToast('该条码已被其他商品使用')
    } else if (e instanceof Error && e.message === 'CATEGORY_EXISTS') {
      showToast('分类已存在')
    } else {
      showToast('保存失败，请重试')
    }
  } finally {
    saving.value = false
  }
}

function requestRemove() {
  if (!props.goods) return
  showDeleteConfirm.value = true
}

async function confirmRemove() {
  if (!props.goods) return
  showDeleteConfirm.value = false
  await goodsService.remove(props.goods.id)
  emit('deleted')
  emit('close')
}
</script>

<template>
  <AppModal
    :show="show"
    :z-index="210"
    :close-on-backdrop="false"
    @close="requestClose"
  >
    <h3>{{ title }}</h3>
    <section class="form-group">
      <label>条码 *</label>
      <section class="barcode-row">
        <input v-model="barcode" placeholder="扫描或手动输入" />
        <button type="button" class="btn-scan" title="扫描条码" @click="emit('scanBarcode')">
          扫
        </button>
      </section>
    </section>
    <section class="form-group">
      <label>商品名 *</label>
      <input v-model="name" />
    </section>
    <section class="form-group">
      <label>售价 (元) *</label>
      <input
        v-model="price"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        placeholder="0.00"
      />
    </section>
    <section class="form-group">
      <label>库存</label>
      <input v-model.number="stock" type="number" inputmode="numeric" min="0" />
    </section>

    <CategoryCombo v-model="category" :categories="categories" />

    <section class="form-group">
      <label>备注</label>
      <input v-model="remark" />
    </section>
    <p v-if="!isEdit" class="form-hint">
      同一款商品共用一条条码；未建档时会尝试匹配内置参考库预填名称与售价，请核对后点「确认保存」
    </p>
    <button v-if="isEdit" type="button" class="btn-delete" @click="requestRemove">
      删除商品
    </button>

    <template #footer>
      <section class="modal-buttons">
        <button type="button" class="btn-secondary" @click="requestClose">取消</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : '确认保存' }}
        </button>
      </section>
    </template>
  </AppModal>

  <ConfirmDialog
    :show="showDiscardConfirm"
    title="放弃编辑？"
    message="内容尚未保存，确定要关闭吗？"
    confirm-text="关闭"
    cancel-text="继续编辑"
    :z-index="270"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />

  <ConfirmDialog
    :show="showDeleteConfirm"
    title="删除商品"
    :message="goods ? `确定删除「${goods.name}」？此操作不可恢复。` : ''"
    confirm-text="删除"
    cancel-text="取消"
    danger
    :z-index="270"
    @confirm="confirmRemove"
    @cancel="showDeleteConfirm = false"
  />
</template>

<style scoped>
h3 {
  margin-bottom: 16px;
}
.form-group {
  margin-bottom: 14px;
}
.form-group label {
  font-size: 14px;
  font-weight: 500;
  display: block;
  margin-bottom: 4px;
}
.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 16px;
  font-size: 16px;
}
.barcode-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.barcode-row input {
  flex: 1;
}
.btn-scan {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 16px;
  background: var(--color-primary);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.form-hint {
  font-size: 12px;
  color: var(--color-muted);
  margin-bottom: 8px;
  line-height: 1.5;
}
.btn-delete {
  width: 100%;
  margin-top: 4px;
  padding: 10px;
  background: #fee;
  color: var(--color-danger);
  border: none;
  border-radius: 20px;
  cursor: pointer;
}
.modal-buttons {
  display: flex;
  gap: 12px;
}
.modal-buttons .btn-primary,
.modal-buttons .btn-secondary {
  flex: 1;
  min-height: 48px;
  font-size: 16px;
}
.modal-buttons .btn-primary:disabled {
  opacity: 0.6;
}
</style>
