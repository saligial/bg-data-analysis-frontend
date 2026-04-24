<template>
  <div class="product-selector">
    <!-- 标题行 -->
    <div class="sec-head">
      <div class="sec-ico">
        <svg viewBox="0 0 18 18" width="16" height="16" fill="none">
          <rect x="2" y="3" width="14" height="12" rx="1.5" stroke="#1e6ecf" stroke-width="1.5"/>
          <path d="M2 7h14M6 3v12" stroke="#1e6ecf" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="sec-title">产品库选择产品</div>
      <div class="step-badge">{{ stepLabel }}</div>
    </div>
    <div class="sec-desc">选择本次运营场景所要推广产品，支持5G套餐、权益包及宽带组合业务。</div>

    <div class="search-row">
      <button
        v-if="enableSegmentRecommend"
        class="recommend-btn"
        :disabled="recommendLoading"
        @click="handleRecommendBySegment"
      >
        {{ recommendLoading ? '推荐中...' : '产品推荐' }}
      </button>
      <div class="search-wrap">
        <el-input
          v-model="keyword"
          placeholder="输入产品信息或名称"
          clearable
        >
          <template #suffix>
            <svg viewBox="0 0 16 16" width="14" height="14"><circle cx="7" cy="7" r="5" stroke="#909399" stroke-width="1.5" fill="none"/><path d="M11 11l3 3" stroke="#909399" stroke-width="1.5"/></svg>
          </template>
        </el-input>
      </div>
      <button class="query-btn" :disabled="searchLoading" @click="handleSearch">
        {{ searchLoading ? '查询中...' : '查询' }}
      </button>
    </div>

    <div class="cards" v-if="products.length">
      <div
        v-for="(p, idx) in pagedProducts"
        :key="p.id"
        class="p-card"
        :class="[{ selected: isSelected(p) }, 'theme-' + (idx % 4)]"
        @click="toggleSelect(p)"
      >
        <div class="check" v-if="isSelected(p)">  
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M3 8l3 3 6-7" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="p-head">
          <div class="p-icon">
            <svg v-if="idx % 4 === 0" viewBox="0 0 20 20" width="20" height="20" fill="none"><path d="M3 17V7l3 5 4-10 3 7 4-3v11H3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none"/></svg>
            <svg v-else-if="idx % 4 === 1" viewBox="0 0 20 20" width="20" height="20" fill="none"><path d="M2 10a8 8 0 0116 0M5 10a5 5 0 0110 0M8 10a2 2 0 014 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="14" r="1.3" fill="currentColor"/></svg>
            <svg v-else-if="idx % 4 === 2" viewBox="0 0 20 20" width="20" height="20" fill="none"><path d="M10 2l2.5 5 5.5.8-4 4 1 5.5L10 14.8 5 17.3l1-5.5-4-4 5.5-.8L10 2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none"/></svg>
            <svg v-else viewBox="0 0 20 20" width="20" height="20" fill="none"><rect x="3" y="5" width="14" height="11" rx="1.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M7 5V3h6v2M3 9h14" stroke="currentColor" stroke-width="1.6"/></svg>
          </div>
          <div class="p-name-wrap">
            <div class="p-name">{{ p.name }}</div>
            <div class="p-cat">{{ p.category }}</div>
          </div>
         
        </div>
        <div class="p-divider"></div>
        <div class="p-info">
          <div><span class="lbl">产品售价</span>  <span style="font-weight: bold;">¥{{p.price}}</span></div>
          <div><span class="lbl">适用范围</span><span class="val">{{ p.scope }}</span></div>
          <div><span class="lbl">产品描述</span><span class="val">{{ p.desc }}</span></div>
        </div>
        <div class="p-footer">查看详情</div>
      </div>
    </div>
    <div v-else class="empty">暂无产品，请在上方搜索或让小助手推荐</div>

    <div class="pager" v-if="products.length > pageSize">
      <el-pagination
        background
        layout="prev, pager, next, jumper, total"
        :total="products.length"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { searchProducts, recommendBySegment } from '@/api/product'

const props = defineProps({
  products: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] },
  enableSegmentRecommend: { type: Boolean, default: false },
  currentSegment: { type: Object, default: null },
  stepLabel: { type: String, default: 'setp1' }
})

const emit = defineEmits(['update:modelValue', 'update:products'])

const keyword = ref('')
const searchLoading = ref(false)
const recommendLoading = ref(false)

const pageSize = 8
const currentPage = ref(1)

const pagedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return props.products.slice(start, start + pageSize)
})

watch(
  () => props.products,
  () => {
    currentPage.value = 1
  }
)

function handlePageChange(page) {
  currentPage.value = page
}

const selected = computed(() => props.modelValue)

function isSelected(p) {
  return selected.value.some((s) => s.id === p.id)
}

function toggleSelect(p) {
  const list = [...selected.value]
  const idx = list.findIndex((s) => s.id === p.id)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    if (list.length >= 3) {
      ElMessage.warning('最多选择 3 个产品')
      return
    }
    list.push(p)
  }
  emit('update:modelValue', list)
}

async function handleSearch() {
  searchLoading.value = true
  try {
    const res = await searchProducts({ keyword: keyword.value })
    emit('update:products', res)
  } finally {
    searchLoading.value = false
  }
}

async function handleRecommendBySegment() {
  if (!props.currentSegment || !props.currentSegment.count) {
    ElMessage.warning('请先圈选客群')
    return
  }
  recommendLoading.value = true
  try {
    const res = await recommendBySegment({
      segment: props.currentSegment,
      audienceIds: props.currentSegment.audienceIds || [],
      text: props.currentSegment.name || '希望提升ARPU'
    })
    emit('update:products', res)
    ElMessage.success('已推荐适配客群的产品')
  } finally {
    recommendLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.product-selector {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.sec-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sec-ico {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sec-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}
.step-badge {
  background: #eef3fb;
  color: #1e6ecf;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 4px;
  font-weight: 600;
}
.sec-desc {
  color: #909399;
  margin-top: 4px;
  margin-bottom: 14px;
  font-size: 12px;
}
.search-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
}
.search-wrap {
  flex: 1;
  max-width: 420px;
  margin: 0 auto;
}
.recommend-btn {
  background: #1e6ecf;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: #1857a8;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
.query-btn {
  background: #1e6ecf;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 24px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: #1857a8;
  }
}
.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.p-card {
  position: relative;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    background: var(--theme);
  }
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  &.selected {
    border-color: var(--theme);
    box-shadow: 0 0 0 1px var(--theme) inset, 0 4px 20px rgba(30, 110, 207, 0.15);
  }
  &.theme-0 { --theme: #1e6ecf; .p-icon { color: #1e6ecf; background: #eaf1fb; } }
  &.theme-1 { --theme: #f2c037; .p-icon { color: #f2c037; background: #fdf6e4; } }
  &.theme-2 { --theme: #a855f7; .p-icon { color: #a855f7; background: #f4ecfe; } }
  &.theme-3 { --theme: #67c23a; .p-icon { color: #67c23a; background: #ecf8e4; } }
}
.check {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--theme);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.p-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.p-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.p-name-wrap {
  flex: 1;
  min-width: 0;
}
.p-name {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.p-cat {
  margin-top: 2px;
  display: inline-block;
  padding: 1px 6px;
  background: #f5f7fa;
  color: #909399;
  font-size: 11px;
  border-radius: 2px;
}
.p-price {
  font-size: 15px;
  font-weight: 700;
  color: #f56c6c;
  white-space: nowrap;
}
.p-divider {
  height: 1px;
  background: #f0f2f5;
  margin: 10px 0 8px;
}
.p-info {
  font-size: 12px;
  color: #606266;
  line-height: 1.8;
  .lbl {
    color: #909399;
    margin-right: 170px;
    margin-left: 10px;
  }
  .val {
    color: #303133;
  }
}
.p-desc {
  color: #909399;
  font-size: 11px;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
  min-height: 32px;
}
.p-footer {
  margin-top: 10px;
  height: 25px;
  border: 1px solid #bcdcff;
  border-radius: 12px;
  background: #f5faff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #1e6ecf;
}
.empty {
  text-align: center;
  color: #909399;
  padding: 30px 0;
  background: #f5f7fa;
  border-radius: 8px;
}
.pager {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
