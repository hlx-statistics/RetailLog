<script setup lang="ts">
import { computed, ref } from 'vue'
import { MAX_SALE_RECORDS_DISPLAY } from '@/constants'
import { backupService } from '@/services/backup.service'
import { categoryService } from '@/services/category.service'
import { useAppStore } from '@/stores/app.store'
import { useToast } from '@/composables/useToast'
import { formatMoney, formatSaleTime } from '@/utils/format'
import { isNativeApp } from '@/utils/platform'
import type { SaleRecord } from '@/types'
import SalesAnalyticsPanel from '@/components/profile/SalesAnalyticsPanel.vue'

const store = useAppStore()
const { show } = useToast()
const newCategoryName = ref('')
const restoreInput = ref<HTMLInputElement | null>(null)

async function backup() {
  try {
    await backupService.downloadBackup()
    show(isNativeApp ? '请选择保存位置或分享备份文件' : '备份已下载')
  } catch {
    show('备份已取消或失败')
  }
}

function triggerRestore() {
  restoreInput.value?.click()
}

async function onRestoreFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!confirm('恢复将完全覆盖当前数据，是否继续？')) return
  try {
    await backupService.importData(file)
    await store.refreshAll()
    alert('恢复成功')
  } catch {
    alert('恢复失败：文件格式错误')
  }
  ;(e.target as HTMLInputElement).value = ''
}

async function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name) {
    alert('请输入分类名')
    return
  }
  try {
    await categoryService.add(name)
    newCategoryName.value = ''
    await store.refreshCategories()
    show('分类已添加')
  } catch (e) {
    if (e instanceof Error && e.message === 'CATEGORY_EXISTS') {
      alert('分类已存在')
    }
  }
}

async function deleteCategory(id: string, name: string) {
  if (!confirm(`删除分类「${name}」？该分类商品将改为「其他」`)) return
  await categoryService.remove(id, name)
  await store.refreshAll()
}

function showSaleDetail(sale: SaleRecord) {
  const detail = sale.items
    .map((i) => `  ${i.name} ×${i.quantity}  ¥${formatMoney(i.price * i.quantity)}`)
    .join('\n')
  alert(`销售明细\n${detail}\n\n合计 ¥${formatMoney(sale.totalAmount)}`)
}

const displaySales = computed(() => store.sales.slice(0, MAX_SALE_RECORDS_DISPLAY))
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">设置与备份</h1>
    </header>

    <section class="panel">
      <h4>📖 使用说明</h4>
      <p class="help-text">
        <strong>卖货：</strong>「销售」页连续扫码 → 看合计 → 确认售出扣库存。<br />
        <strong>入库：</strong>商品页点「入库+」，扫一次码后填写数量。<br />
        <strong>收款：</strong>顾客扫您线下收款码，本 App 不处理支付。
      </p>
    </section>

    <section class="panel">
      <h4>📁 数据备份</h4>
      <button class="btn-primary backup-btn" @click="backup">💾 备份数据</button>
      <button class="btn-secondary restore-btn" @click="triggerRestore">📂 恢复数据</button>
      <input ref="restoreInput" type="file" accept=".json" hidden @change="onRestoreFile" />
      <p class="hint">备份含商品与销售记录；恢复将完全覆盖当前数据</p>
    </section>

    <section class="panel">
      <h4>📋 近期销售</h4>
      <p class="section-hint">最近 {{ MAX_SALE_RECORDS_DISPLAY }} 笔，可在框内上下滑动查看</p>
      <div v-if="displaySales.length === 0" class="muted">暂无记录</div>
      <div v-else class="panel-scroll">
        <button
          v-for="s in displaySales"
          :key="s.id"
          type="button"
          class="sale-record"
          @click="showSaleDetail(s)"
        >
          <div class="sale-record-time">{{ formatSaleTime(s.createdAt) }}</div>
          <div class="sale-record-sum">{{ s.totalQty }} 件 · ¥{{ formatMoney(s.totalAmount) }}</div>
        </button>
      </div>
    </section>

    <SalesAnalyticsPanel />

    <section class="panel">
      <h4>🏷️ 分类管理</h4>
      <div class="category-tags">
        <span v-for="c in store.categories" :key="c.id" class="category-tag">
          {{ c.name }}
          <button type="button" class="del-cat" @click="deleteCategory(c.id, c.name)">❌</button>
        </span>
      </div>
      <div class="add-category">
        <input v-model="newCategoryName" type="text" placeholder="新分类名称" />
        <button class="btn-primary" @click="addCategory">添加</button>
      </div>
    </section>

    <p class="footer-note">乡程掌柜 · 离线本地版</p>
  </div>
</template>

<style scoped>
.backup-btn {
  width: 100%;
  margin-top: 8px;
  background: #2c3e50;
}
.restore-btn {
  width: 100%;
  margin-top: 10px;
}
.hint,
.section-hint {
  font-size: 12px;
  color: #888;
  margin-top: 0;
  margin-bottom: 10px;
}
.muted {
  color: #aaa;
  font-size: 14px;
}
.sale-record {
  display: block;
  width: 100%;
  text-align: left;
  padding: 12px 0;
  border: none;
  border-bottom: 1px solid #f0f0f0;
  background: none;
  cursor: pointer;
}
.sale-record:last-child {
  border-bottom: none;
}
.sale-record-time {
  font-size: 12px;
  color: #888;
}
.sale-record-sum {
  font-weight: 600;
  color: var(--color-primary);
  margin-top: 4px;
}
.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;
}
.category-tag {
  background: #f1f3f5;
  padding: 6px 12px;
  border-radius: 40px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.del-cat {
  background: none;
  border: none;
  cursor: pointer;
}
.add-category {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.add-category input {
  flex: 1;
  padding: 10px;
  border-radius: 30px;
  border: 1px solid #ddd;
}
.add-category .btn-primary {
  padding: 10px 16px;
  flex: 0;
}
.help-text {
  font-size: 13px;
  color: #555;
  line-height: 1.6;
}
.footer-note {
  margin-top: 12px;
  font-size: 12px;
  color: #aaa;
  text-align: center;
}
</style>
