<template>
  <div class="segment-selector">
    <div class="sec-head">
      <div class="sec-ico">
        <svg viewBox="0 0 18 18" width="16" height="16" fill="none">
          <circle cx="6" cy="6" r="2.5" stroke="#1e6ecf" stroke-width="1.5"/>
          <circle cx="13" cy="6" r="2.5" stroke="#1e6ecf" stroke-width="1.5"/>
          <circle cx="6" cy="13" r="2.5" stroke="#1e6ecf" stroke-width="1.5"/>
          <circle cx="13" cy="13" r="2.5" stroke="#1e6ecf" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="sec-title">多维客群精准圈选</div>
      <div class="step-badge">{{ stepLabel }}</div>
      <div class="total">
        <span class="total-label">当前圈选目标客户规模</span>
        <span class="total-value"><CountNumber :end="totalCount" /> <span class="unit">条</span></span>
      </div>
    </div>
    <div class="sec-desc">多种方式圈选运营目标客群客户。</div>

    <div class="methods-grid" :class="'cols-' + methodCount">
      <!-- 口径方式 -->
      <div class="method-card" :class="{ active: condition.confirmed }">
        <div class="mc-head">
          <div class="mc-icon c-blue">
            <svg viewBox="0 0 18 18" width="14" height="14"><rect x="2" y="2" width="6" height="6" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="10" y="2" width="6" height="6" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="2" y="10" width="6" height="6" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="10" y="10" width="6" height="6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
          </div>
          <div class="mc-title">口径（特征组合）方式</div>
        </div>
        <div class="mc-sub">请选择口径或选择客群库</div>
        <el-select
          v-model="condition.segmentName"
          placeholder="口径圈选"
          clearable
          filterable
          :loading="audienceNamesLoading"
          size="default"
          style="width: 100%"
          @visible-change="onConditionSelectVisible"
        >
          <el-option
            v-for="n in audienceNameList"
            :key="n"
            :label="n"
            :value="n"
          />
        </el-select>

        <div class="mc-count">圈选用户数：<strong>{{ conditionCountDisplay.toLocaleString() }}</strong> 人</div>
        <div class="mc-actions">
          <button class="btn-ghost" @click="cancelMethod('condition')">取消圈选</button>
          <button class="btn-primary" :disabled="condition.loading" @click="runCondition">
            {{ condition.loading ? '...' : '确定圈选' }}
          </button>
        </div>
      </div>

      <!-- 种子扩散 -->
      <div class="method-card" :class="{ active: seed.confirmed }">
        <div class="mc-head">
          <div class="mc-icon c-blue">
            <svg viewBox="0 0 18 18" width="14" height="14"><path d="M9 2 L15 14 L3 14 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
          </div>
          <div class="mc-title">种子用户扩散方式</div>
        </div>
        <div class="mc-target-row">
          <div class="mc-sub mc-sub-strong">
            <span class="req-star" title="必填">*</span>目标客群量
          </div>
          <el-input
            v-model="seed.target"
            placeholder="请输入正整数，必填"
            style="width: 100%"
            size="default"
          />
        </div>
        <div class="mc-box">
          <textarea v-model="seed.seeds" rows="2" placeholder="请输入种子用户的电话号、user_id，并使用“;”分割。" />
          <button class="mc-inline-btn" :disabled="seed.compLoading" @click="runSeedCompute">
            {{ seed.compLoading ? '计算中' : '开始计算' }}
          </button>
        </div>
        <div class="mc-count">圈选用户数：<strong>{{ seed.count.toLocaleString() }}</strong> 人</div>
        <div class="mc-actions">
          <button class="btn-ghost" @click="cancelMethod('seed')">取消圈选</button>
          <button class="btn-primary" @click="confirmMethod('seed')">确定圈选</button>
        </div>
      </div>

      <!-- 产品推荐客群 -->
      <div v-if="showProductRecommend" class="method-card" :class="{ active: productSeg.confirmed }">
        <div class="mc-head">
          <div class="mc-icon c-blue">
            <svg viewBox="0 0 18 18" width="14" height="14"><path d="M9 3 L9 15 M3 9 L15 9" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
          </div>
          <div class="mc-title">产品推荐客群方式</div>
        </div>
        <div class="mc-target-row">
          <div class="mc-sub mc-sub-strong">
            <span class="req-star" title="必填">*</span>目标客群量
          </div>
          <el-input
            v-model="productSeg.target"
            placeholder="请输入正整数，必填"
            style="width: 100%"
            size="default"
          />
        </div>
        <div class="mc-ring">
          <svg viewBox="0 0 80 80" width="80" height="80">
            <circle cx="40" cy="40" r="30" stroke="#d8e4f3" stroke-width="6" fill="none" />
            <circle cx="40" cy="40" r="30" stroke="#1e6ecf" stroke-width="6" fill="none"
              stroke-dasharray="110 200" stroke-linecap="round" transform="rotate(-90 40 40)" />
            <circle cx="40" cy="10" r="3" fill="#1e6ecf" />
          </svg>
        </div>
        <div class="mc-count">圈选用户数：<strong>{{ productSeg.count.toLocaleString() }}</strong> 人</div>
        <div class="mc-actions">
          <button class="btn-ghost" @click="cancelMethod('productSeg')">取消圈选</button>
          <button class="btn-primary" :disabled="productSeg.loading" @click="runProductSeg">
            {{ productSeg.loading ? '...' : '确定圈选' }}
          </button>
        </div>
      </div>

      <!-- 用户清单 -->
      <div class="method-card" :class="{ active: upload.confirmed }">
        <div class="mc-head">
          <div class="mc-icon c-blue">
            <svg viewBox="0 0 18 18" width="14" height="14"><rect x="2" y="4" width="14" height="11" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M2 7h14M5 4v11M12 4v11" stroke="currentColor" stroke-width="1.5"/></svg>
          </div>
          <div class="mc-title">用户清单方式</div>
        </div>
        <el-upload
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          class="up-drag"
          accept=".csv,.xls,.xlsx"
        >
          <div class="upload-tip">
            <div class="upload-cloud">
              <svg viewBox="0 0 40 32" width="32" height="26"><path d="M30 12a8 8 0 00-15.3-3A6 6 0 005 14a6 6 0 006 6h19a6 6 0 000-12z" fill="none" stroke="#1e6ecf" stroke-width="1.5"/><path d="M20 14v10M16 18l4-4 4 4" fill="none" stroke="#1e6ecf" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <div class="upload-text">点击或下载文件到此区，开始上传</div>
          </div>
        </el-upload>
        <div class="mc-sub-small" v-if="upload.file">已选择: {{ upload.file.name }}</div>
        <div class="mc-count">圈选用户数：<strong>{{ upload.count.toLocaleString() }}</strong> 人</div>
        <div class="mc-actions">
          <button class="btn-ghost" @click="cancelMethod('upload')">取消圈选</button>
          <button class="btn-primary" :disabled="upload.loading || !upload.file" @click="runUpload">
            {{ upload.loading ? '...' : '确定圈选' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import CountNumber from '@/components/CountNumber.vue'
import { seedExpand, segmentByProduct, uploadUsers } from '@/api/strategy'
import { useSegmentStore } from '@/stores/segment'
import { getSegmentList, queryBySql, SQL_AUDIENCE_GROUP_NAMES } from '@/api/segment'

const props = defineProps({
  selectedProducts: { type: Array, default: () => [] },
  showProductRecommend: { type: Boolean, default: true },
  stepLabel: { type: String, default: 'setp2' }
})

const emit = defineEmits(['change'])

const store = useSegmentStore()
const savedSegments = computed(() => store.savedSegments)

/** 点击展开下拉时由 POST /audience/execute 拉取；data 行 -> name 列 */
const audienceNameList = ref([])
const audienceNamesLoading = ref(false)

const condition = reactive({ segmentName: '', count: 0, audienceIds: [], loading: false, confirmed: false })
const seed = reactive({ target: '', seeds: '', count: 0, audienceIds: [], compLoading: false, confirmed: false })
const productSeg = reactive({ target: '', count: 0, audienceIds: [], loading: false, confirmed: false })
const upload = reactive({ file: null, count: 0, audienceIds: [], loading: false, confirmed: false })

const methodCount = computed(() => (props.showProductRecommend ? 4 : 3))

/** 未确定圈选前为 0；确定后展示实际圈选人数 */
const conditionCountDisplay = computed(() => {
  if (condition.confirmed) return condition.count
  return 0
})

const totalCount = computed(() => {
  let sum = 0
  if (condition.confirmed) sum += condition.count
  if (seed.confirmed) sum += seed.count
  if (productSeg.confirmed) sum += productSeg.count
  if (upload.confirmed) sum += upload.count
  return sum
})

watch(totalCount, () => emitChange())

function emitChange() {
  const parts = []
  const audienceIds = []
  if (condition.confirmed) {
    parts.push({ method: 'condition', name: condition.segmentName, count: condition.count })
    audienceIds.push(...condition.audienceIds)
  }
  if (seed.confirmed) {
    parts.push({ method: 'seed', count: seed.count })
    audienceIds.push(...seed.audienceIds)
  }
  if (productSeg.confirmed) {
    parts.push({ method: 'product', count: productSeg.count })
    audienceIds.push(...productSeg.audienceIds)
  }
  if (upload.confirmed) {
    parts.push({ method: 'upload', count: upload.count })
    audienceIds.push(...upload.audienceIds)
  }
  // 去重
  const uniqIds = Array.from(new Set(audienceIds))
  store.setAudienceIds(uniqIds)
  emit('change', {
    total: totalCount.value,
    parts,
    audienceIds: uniqIds,
    conditionName: condition.segmentName,
    condition:
      savedSegments.value.find((s) => s.name === condition.segmentName)?.condition ||
      (condition.confirmed && condition.segmentName
        ? `SELECT user_id FROM audience_groups WHERE name = '${String(condition.segmentName).replace(/'/g, "''")}'`
        : '')
  })
}

function cancelMethod(key) {
  if (key === 'condition') {
    condition.count = 0
    condition.audienceIds = []
    condition.confirmed = false
    condition.segmentName = ''
  } else if (key === 'seed') {
    seed.count = 0
    seed.audienceIds = []
    seed.confirmed = false
    seed.seeds = ''
  } else if (key === 'productSeg') {
    productSeg.count = 0
    productSeg.audienceIds = []
    productSeg.confirmed = false
    productSeg.target = ''
  } else if (key === 'upload') {
    upload.count = 0
    upload.audienceIds = []
    upload.confirmed = false
    upload.file = null
  }
  emitChange()
}

function confirmMethod(key) {
  if (key === 'seed') {
    if (!seed.count) {
      ElMessage.warning('请先点击 开始计算')
      return
    }
    if (parseTargetCountRequired(seed.target) == null) {
      ElMessage.warning('请填写目标客群量（正整数）')
      return
    }
    seed.confirmed = true
    emitChange()
    ElMessage.success('已加入待运营客群')
  }
}

function pickNameFromRow(r) {
  if (!r || typeof r !== 'object') return ''
  if (r.name != null && r.name !== '') return String(r.name)
  if (r.NAME != null && r.NAME !== '') return String(r.NAME)
  const v = Object.values(r)[0]
  return v != null && v !== '' ? String(v) : ''
}

/** 拉取 audience_groups 客群名称；POST /audience/execute { sql }。下拉展开时调用 */
async function loadAudienceGroupNameList() {
  audienceNamesLoading.value = true
  try {
    const res = await queryBySql({ sql: SQL_AUDIENCE_GROUP_NAMES })
    const rows = res.rows || []
    const names = [...new Set(rows.map(pickNameFromRow).filter(Boolean))]
    const extra = (store.savedSegments || [])
      .map((s) => s.name)
      .filter(Boolean)
    audienceNameList.value = [...new Set([...names, ...extra])]
  } catch (e) {
    audienceNameList.value = (store.savedSegments || [])
      .map((s) => s.name)
      .filter(Boolean)
  } finally {
    audienceNamesLoading.value = false
  }
}

function onConditionSelectVisible(visible) {
  if (visible) {
    void loadAudienceGroupNameList()
  }
}

// 将保存的客群 SQL（可能是 SELECT city_id, count(*) FROM user_behavior WHERE ... GROUP BY ... LIMIT ...）
// 改写成 SELECT user_id FROM user_behavior WHERE ...，用于圈选真实用户清单
function buildUserListSql(savedSql) {
  if (!savedSql) return 'SELECT user_id FROM user_behavior LIMIT 1000'
  const s = String(savedSql).replace(/;+\s*$/, '').trim()
  // 截取 FROM ... 到 GROUP BY / ORDER BY / LIMIT 之前
  const m = s.match(/from\s+user_behavior[\s\S]*?(?=(\bgroup\s+by\b|\border\s+by\b|\blimit\b|$))/i)
  const fromWhere = m ? m[0].trim() : 'FROM user_behavior'
  return `SELECT user_id ${fromWhere}`.trim()
}

async function runCondition() {
  if (!condition.segmentName) {
    ElMessage.warning('请先选择客群')
    return
  }
  const name = condition.segmentName
  const saved = savedSegments.value.find((s) => s.name === name)
  const inLoadedList = audienceNameList.value.includes(name)
  if (!saved?.condition && !inLoadedList) {
    ElMessage.warning('该客群不在可选列表中，请重新选择或刷新页面')
    return
  }

  condition.loading = true
  try {
    let res
    if (saved && saved.condition) {
      res = await queryBySql({ sql: buildUserListSql(saved.condition) })
    } else {
      const esc = String(name).replace(/'/g, "''")
      res = await queryBySql({
        sql: `SELECT user_id FROM audience_groups WHERE name = '${esc}'`
      })
    }
    const ids = (res.rows || [])
      .map((r) => r && (r.user_id ?? r.USER_ID))
      .filter((v) => v !== undefined && v !== null && v !== '')
    condition.audienceIds = Array.from(new Set(ids.map(String)))
    condition.count = res.total ?? condition.audienceIds.length
    condition.confirmed = true
    emitChange()
    ElMessage.success(`已加入待运营客群，共圈选 ${condition.count} 人`)
  } finally {
    condition.loading = false
  }
}

/** 必填项：无有效输入时返回 null；否则为 1～5000 万 的正整数 */
function parseTargetCountRequired(raw) {
  const s = String(raw ?? '')
    .replace(/,/g, '')
    .trim()
  if (s === '') return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 1) return null
  return Math.min(Math.floor(n), 50_000_000)
}

async function runSeedCompute() {
  if (!seed.seeds.trim()) {
    ElMessage.warning('请输入种子 user_id / 电话号')
    return
  }
  const target = parseTargetCountRequired(seed.target)
  if (target == null) {
    ElMessage.warning('请填写目标客群量（正整数）')
    return
  }
  seed.compLoading = true
  try {
    const res = await seedExpand({ seeds: seed.seeds, target })
    seed.count = res.count
    seed.audienceIds = res.audienceIds || []
    ElMessage.success(`已扩散至 ${res.count.toLocaleString()} 人`)
  } finally {
    seed.compLoading = false
  }
}

async function runProductSeg() {
  if (!props.selectedProducts.length) {
    ElMessage.warning('请先在产品库选择产品')
    return
  }
  const target = parseTargetCountRequired(productSeg.target)
  if (target == null) {
    ElMessage.warning('请填写目标客群量（正整数）')
    return
  }
  productSeg.loading = true
  try {
    const res = await segmentByProduct({
      productIds: props.selectedProducts.map((p) => p.id),
      target
    })
    productSeg.count = res.count
    productSeg.audienceIds = res.audienceIds || []
    productSeg.confirmed = true
    emitChange()
    ElMessage.success('已加入待运营客群')
  } finally {
    productSeg.loading = false
  }
}

function handleFileChange(file) {
  upload.file = file.raw
  upload.count = 0
  upload.confirmed = false
}

async function runUpload() {
  if (!upload.file) return
  const fd = new FormData()
  fd.append('file', upload.file)
  upload.loading = true
  try {
    const res = await uploadUsers(fd)
    upload.count = res.count
    upload.audienceIds = res.audienceIds || []
    upload.confirmed = true
    emitChange()
    ElMessage.success('已加入待运营客群')
  } finally {
    upload.loading = false
  }
}

onMounted(async () => {
  try {
    if (!store.savedSegments.length) {
      const list = await getSegmentList()
      store.setList(list)
    }
    const extra = (store.savedSegments || [])
      .map((s) => s.name)
      .filter(Boolean)
    if (extra.length) {
      audienceNameList.value = [...new Set([...audienceNameList.value, ...extra])]
    }
  } catch (e) {}
})
</script>

<style lang="scss" scoped>
.segment-selector {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.sec-head {
  position: relative;
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
.total {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-align: center;
  .total-label {
    color: #909399;
    font-size: 12px;
    line-height: 1;
  }
  .total-value {
    color: #1e6ecf;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.2;
    .unit {
      font-size: 12px;
      margin-left: 2px;
      color: #606266;
    }
  }
}
.sec-desc {
  color: #909399;
  margin-top: 4px;
  margin-bottom: 14px;
  font-size: 12px;
}
.methods-grid {
  display: grid;
  gap: 12px;
  &.cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }
  &.cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}
.method-card {
  background: #f8fafd;
  border: 1px solid #e5edf8;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
  &.active {
    border-color: #1e6ecf;
    background: #f0f6ff;
  }
}
.mc-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mc-icon {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  &.c-blue {
    background: #eaf1fb;
    color: #1e6ecf;
  }
}
.mc-title {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
}
.mc-sub {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}
.mc-sub-strong {
  font-weight: 700;
  color: #303133;
  margin-top: 0;
  white-space: nowrap;
}
.mc-target-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.req-star {
  color: #f56c6c;
  margin-right: 2px;
  font-weight: 700;
}
.mc-sub-small {
  font-size: 11px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mc-list {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 4px 8px;
  max-height: 88px;
  overflow-y: auto;
  .mc-li {
    padding: 2px 0;
    :deep(.el-checkbox__label) {
      font-size: 12px;
    }
  }
}
.mc-count {
  font-size: 12px;
  color: #303133;
  strong {
    color: #1e6ecf;
    font-size: 14px;
    margin: 0 2px;
  }
  margin-top: auto;
}
.mc-box {
  position: relative;
  background: #f2f3f5;
  border: 1px solid #dce3ef;
  border-radius: 16px;
  padding: 6px 8px 30px;
  textarea {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-size: 12px;
    color: #303133;
    &::placeholder {
      color: #c0c4cc;
      font-size: 11px;
    }
  }
}
.mc-inline-btn {
  position: absolute;
  right: 6px;
  bottom: 6px;
  background: #1e6ecf;
  color: #fff;
  border: none;
  border-radius: 3px;
  padding: 3px 10px;
  font-size: 11px;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
  }
}
.mc-ring {
  display: flex;
  justify-content: center;
  padding: 6px 0;
}
.mc-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.btn-ghost,
.btn-primary {
  flex: 1;
  padding: 6px 0;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.btn-ghost {
  background: #fff;
  color: #606266;
  border-color: #dce3ef;
  &:hover {
    color: #1e6ecf;
    border-color: #1e6ecf;
  }
}
.btn-primary {
  background: #1e6ecf;
  color: #fff;
  &:hover:not(:disabled) {
    background: #1857a8;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
.up-drag :deep(.el-upload-dragger) {
  height: 84px;
  padding: 6px;
  background: #fff;
  border: 1px dashed #c7d3e6;
}
.upload-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 11px;
  padding-top: 2px;
}
.upload-cloud {
  color: #1e6ecf;
}
</style>
