<template>
  <div class="strategy-area">
    <div class="main-title">
      <svg viewBox="0 0 18 18" width="16" height="16"><path d="M9 2l2 5 5 .5-4 3 1 5-4-3-4 3 1-5-4-3 5-.5z" fill="#1e6ecf"/></svg>
      <span>智能运营策略生成</span>
    </div>

    <!-- 策略内容详细配置 -->
    <div class="sc-card">
      <div class="sc-card-head">
        <span class="sc-head-icon">📋</span>
        <span class="sc-head-title">策略内容详细配置</span>
        <span class="sc-head-badge">符合业态合规</span>
      </div>
      <div class="sc-card-body">
        <div class="strategy-config-grid">
          <div class="config-left">
            <div class="field-label">策略名称</div>
            <el-input v-model="strategy.name" placeholder="（自动生成后可修改）" />

            <div class="field-label mt-12">策略类别</div>
            <el-select v-model="categoryValue" placeholder="请选择策略类别" style="width: 100%">
              <el-option label="挽留" value="挽留" />
              <el-option label="升级" value="升级" />
              <el-option label="交叉销售" value="交叉销售" />
              <el-option label="新客拉新" value="新客拉新" />
            </el-select>

            <div class="field-label mt-12">适用条件说明</div>
            <el-input
              v-model="strategy.condition"
              type="textarea"
              :rows="5"
              placeholder="若无圈选客群此处为空"
            />
          </div>

          <div class="config-right">
            <div class="right-card-title">策略详细版（活动策略）</div>
            <div class="detail-card">
              <div class="detail-line">
                <span class="detail-label">策略描述:</span>
                <span class="detail-value">{{ strategy.descDetail.desc || '--' }}</span>
              </div>
              <div class="detail-line">
                <span class="detail-label">扣费比例:</span>
                <span class="detail-value">{{ strategy.descDetail.paymentMethod || '--' }}</span>
              </div>
              <div class="detail-line">
                <span class="detail-label">关联产品:</span>
                <span class="detail-value">{{ strategy.descDetail.relatedProducts || '--' }}</span>
              </div>
              <div class="detail-line">
                <span class="detail-label">权益内容:</span>
                <span class="detail-value">{{ strategy.descDetail.benefits || '--' }}</span>
              </div>
              <div class="detail-line detail-line-arpu">
                <span class="detail-label">预计 ARPU提升值:</span>
                <span class="detail-value detail-arpu">{{ strategy.expectedArpuLift || '--' }}</span>
              </div>
            </div>
            <div class="field-label mt-12">客群规模确认</div>
            <div class="metric-box dark-bg">
              <span class="metric-label">有效库内人数</span>
              <span class="metric-num">{{ (strategy.segmentSize || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 执行渠道与话术 + 营销调度设置 -->
    <div class="sc-dual-grid">
      <!-- 左卡：执行渠道与话术 -->
      <div class="sc-card">
        <div class="sc-card-head">
          <span class="sc-head-icon">💬</span>
          <span class="sc-head-title">执行渠道与话术</span>
        </div>
        <div class="sc-card-body">
          <div class="sub-title">推荐渠道</div>
          <div class="channel-cards">
            <div
              v-for="ch in execution.channels"
              :key="ch.id"
              class="ch-card"
              :class="{ selected: selectedChannelId === ch.id }"
              @click="selectChannel(ch)"
            >
              <div class="check" v-if="selectedChannelId === ch.id">✓</div>
              <div class="ch-icon">{{ iconFor(ch) }}</div>
              <div class="ch-name">{{ ch.name }}</div>
              <div v-if="selectedChannelId === ch.id" class="tag-main">主推荐渠道</div>
              <div v-else class="tag-rank">TOP{{ ch.rank }}</div>
            </div>
            <div v-if="!execution.channels.length" class="empty">点击"开始生成策略"查看推荐渠道</div>
          </div>

          <div class="sub-title">AI 多版本话术对比</div>
          <div class="script-cards">
            <div
              v-for="s in currentScripts"
              :key="s.id"
              class="s-card"
              :class="{ selected: selectedScriptId === s.id }"
              @click="selectScript(s)"
            >
              <div class="check" v-if="selectedScriptId === s.id">✓</div>
              <div class="s-title">{{ s.title }}</div>
              <div class="s-content">{{ s.content }}</div>
              <div v-if="selectedScriptId === s.id" class="tag-main">主推话术</div>
            </div>
            <div v-if="!currentScripts.length" class="empty">请先选择推荐渠道</div>
          </div>
        </div>
      </div>

      <!-- 右卡：营销调度设置 -->
      <div class="sc-card">
        <div class="sc-card-head">
          <span class="sc-head-icon">⏰</span>
          <span class="sc-head-title">营销调度设置</span>
        </div>
        <div class="sc-card-body">
          <div class="freq-head">
            <div class="field-label">{{ frequencyLabel }}</div>
            <div class="freq-value">{{ frequencyValueText }}</div>
          </div>
          <div class="freq-track">
            <div class="freq-track-active" :style="{ width: `${frequencyProgress}%` }"></div>
          </div>
          <div class="freq-levels">
            <span>保守 (1次)</span>
            <span>标准</span>
            <span>激进 (4次)</span>
          </div>

          <div class="field-label mt-12">AI 最佳营销时机建议</div>
          <div class="week-bars">
            <div
              v-for="(w, idx) in weekLabels"
              :key="idx"
              class="week-bar"
              :class="{ active: bestWeekdays.includes(idx + 1) }"
            >
              <div class="bar-fill" :style="{ height: bestWeekdays.includes(idx + 1) ? '70%' : '30%' }"></div>
              <div class="bar-label">{{ w }}</div>
            </div>
          </div>
          <div class="ai-conclusion">
            <span class="ai-prefix">AI 结论：</span>
            <span class="ai-main">{{ execution.bestTime.label || '请先点击生成策略' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 策略执行效果预测大屏 -->
    <div class="dark-block">
      <div class="dark-title">
        <svg viewBox="0 0 18 18" width="14" height="14"><path d="M2 4h14v10H2z" stroke="#f2a443" stroke-width="1.5" fill="none"/><path d="M5 10l3-3 2 2 3-4" stroke="#f2a443" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        <span>策略执行效果预测大屏</span>
      </div>

      <div class="dark-grid">
        <div class="dark-metrics">
          <div class="pm-card">
            <div class="pm-title">预测转化率 P-CVR</div>
            <div class="pm-main">
              <span class="pm-num">{{ predict.pCvr.to || '0.142' }}</span>
              <span class="pm-up">+2%</span>
            </div>
          </div>
          <div class="pm-card">
            <div class="pm-title">预测投资回报率 P-ROI</div>
            <div class="pm-main">
              <span class="pm-num">{{ predict.pRoi.to || '1:8.4' }}</span>
              <span class="pm-up">1.4倍+6</span>
            </div>
          </div>
          <div class="pm-card">
            <div class="pm-title">预测接通触达率 P-RR</div>
            <div class="pm-main">
              <span class="pm-num">{{ predict.pRr.to || '0.925' }}</span>
            </div>
          </div>
        </div>

        <div class="dark-chart-wrap">
          <div class="chart-head">
            <span class="ch-title">实施策略期限持率趋势走势 (本月P90)</span>
            <div class="dim-switch">
              <el-radio-group v-model="dimension" @change="handleDimChange" size="small">
                <el-radio-button label="region">按地区</el-radio-button>
                <el-radio-button label="arpu">按APRU</el-radio-button>
                <el-radio-button label="age">按年龄区间</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <EChart :option="predictLineOption" height="220px" />
        </div>
      </div>
    </div>

    <!-- 策略发布 -->
    <div class="publish-row">
      <button class="publish-btn" :disabled="publishLoading || !strategy.id" @click="handlePublish">
        {{ publishLoading ? '发布中...' : (publishLabel || '发布策略') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import EChart from '@/components/EChart.vue'
import { predictStrategy, publishStrategy } from '@/api/strategy'

const props = defineProps({
  strategyData: { type: Object, default: null },
  executionData: { type: Object, default: null },
  predictData: { type: Object, default: null },
  selectedProducts: { type: Array, default: () => [] },
  audienceIds: { type: Array, default: () => [] },
  planId: { type: String, default: '' },
  scriptIds: { type: Array, default: () => [] },
  segmentCount: { type: Number, default: 0 },
  publishLabel: { type: String, default: '发布策略' }
})

const emit = defineEmits(['publish'])

const weekLabels = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
const dimension = ref('region')
const publishLoading = ref(false)
const selectedChannelId = ref('')
const selectedScriptId = ref('')

const strategy = reactive({
  id: '',
  name: '',
  categories: [],
  condition: '',
  descDetail: {
    desc: '',
    paymentMethod: '',
    relatedProducts: '',
    benefits: '',
    validity: ''
  },
  expectedArpuLift: '',
  segmentSize: 0
})

const execution = reactive({
  channels: [],
  scripts: {},
  frequency: { level: '标准', times: 0, options: [] },
  bestTime: { weekdays: [], label: '' }
})

const predict = reactive({
  pCvr: { from: 0, to: 0 },
  pRoi: { from: 0, to: 0 },
  pRr: { from: 0, to: 0 },
  categories: [],
  series: []
})

watch(
  () => props.strategyData,
  (v) => {
    if (!v) return
    Object.assign(strategy, v)
    if (props.selectedProducts.length) {
      strategy.descDetail.relatedProducts = props.selectedProducts.map((p) => p.name).join(',')
    }
    if (props.segmentCount) {
      strategy.segmentSize = props.segmentCount
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.executionData,
  (v) => {
    if (!v) return
    execution.channels = v.channels || []
    execution.scripts = v.scripts || {}
    execution.frequency = v.frequency || execution.frequency
    execution.bestTime = v.bestTime || execution.bestTime
    selectedChannelId.value = execution.channels[0]?.id || ''
    selectedScriptId.value = currentScripts.value[0]?.id || ''
  },
  { immediate: true, deep: true }
)

watch(
  () => props.predictData,
  (v) => {
    if (!v) return
    Object.assign(predict, v)
  },
  { immediate: true, deep: true }
)

const currentScripts = computed(() => {
  if (!selectedChannelId.value) return []
  return execution.scripts?.[selectedChannelId.value] || []
})

const bestWeekdays = computed(() => execution.bestTime?.weekdays || [])
const frequencyLabel = computed(() => '营销频率（月度上限）')
const frequencyValueText = computed(() => `${execution.frequency?.times || 0} 次 / 月`)
const frequencyProgress = computed(() => {
  const times = Number(execution.frequency?.times || 0)
  return Math.max(0, Math.min(100, (times / 4) * 100))
})
const categoryValue = computed({
  get: () => strategy.categories?.[0] || '',
  set: (v) => {
    strategy.categories = v ? [v] : []
  }
})

function iconFor(ch) {
  const m = { app: '📱', sms: '✉️', wechat: '🗨️', outcall: '📞', email: '📧' }
  return m[ch.id] || '📌'
}

function selectChannel(ch) {
  selectedChannelId.value = ch.id
  selectedScriptId.value = currentScripts.value[0]?.id || ''
}

function selectScript(s) {
  selectedScriptId.value = s.id
}

const frequencyOption = computed(() => {
  const level = execution.frequency?.level || '标准'
  const levelTimes = { 保守: 1, 标准: 2, 激进: 4 }
  const opts = [
    { label: '保守（1次）', key: '保守', times: 1 },
    { label: '标准（2次）', key: '标准', times: 2 },
    { label: '激进（4次）', key: '激进', times: 4 }
  ]
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 94, right: 20, top: 8, bottom: 20 },
    xAxis: { type: 'value', max: 4, axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: { type: 'category', data: opts.map((o) => o.label) },
    series: [
      {
        type: 'bar',
        stack: 'freq',
        data: opts.map((o) => ({
          value: o.key === level ? (levelTimes[level] || o.times) : o.times,
          itemStyle: {
            color: o.key === level ? '#1e6ecf' : '#c9d4e2',
            borderRadius: [0, 4, 4, 0]
          }
        })),
        label: { show: true, position: 'right', formatter: '{c}', color: '#1e6ecf', fontWeight: 700 },
        barWidth: 14
      },
      {
        type: 'bar',
        stack: 'freq',
        silent: true,
        data: opts.map((o) => Math.max(0, 4 - (o.key === level ? (levelTimes[level] || o.times) : o.times))),
        itemStyle: {
          color: '#e9edf4',
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: 14
      }
    ]
  }
})

const predictLineOption = computed(() => {
  const s = predict.series || []
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { show: false },
    grid: { left: 40, right: 20, top: 16, bottom: 28 },
    xAxis: {
      type: 'category',
      data: predict.categories || [],
      axisLine: { lineStyle: { color: '#5a6a7a' } },
      axisLabel: { color: '#ccd4dc', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#2d3c4e' } },
      axisLabel: { color: '#ccd4dc', fontSize: 11 }
    },
    series: s.length
      ? s.map((item, idx) => ({
          name: item.name,
          type: 'line',
          smooth: true,
          data: item.data,
          lineStyle: { width: 2.5, color: ['#f2a443', '#4a90e2', '#67c23a'][idx % 3] },
          itemStyle: { color: ['#f2a443', '#4a90e2', '#67c23a'][idx % 3] },
          areaStyle: idx === 0
            ? { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(242,164,67,0.3)' }, { offset: 1, color: 'rgba(242,164,67,0.02)' }] } }
            : undefined,
          symbolSize: 6
        }))
      : [
          {
            type: 'line',
            smooth: true,
            data: [5, 5.2, 5.5, 6, 6.8, 7.4, 7.9, 8.2],
            lineStyle: { width: 2.5, color: '#f2a443' },
            itemStyle: { color: '#f2a443' },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(242,164,67,0.3)' }, { offset: 1, color: 'rgba(242,164,67,0.02)' }] } },
            symbolSize: 5
          }
        ]
  }
})

async function handleDimChange(d) {
  if (!strategy.id) return
  try {
    const res = await predictStrategy({ strategyId: strategy.id, dimension: d })
    Object.assign(predict, res)
  } catch (e) {}
}

async function handlePublish() {
  if (!strategy.id) {
    ElMessage.warning('请先生成策略')
    return
  }
  publishLoading.value = true
  try {
    const res = await publishStrategy({
      strategyId: strategy.id,
      productIds: (props.selectedProducts || []).map((p) => p.id),
      audienceIds: props.audienceIds || [],
      planId: props.planId || '',
      scriptIds: props.scriptIds || []
    })
    ElMessage.success(res?.message || '策略发布成功')
    emit('publish')
  } finally {
    publishLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.strategy-area {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.main-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
}
.sc-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(23, 43, 77, 0.08);
  border: 1px solid #e8edf5;
  margin-bottom: 16px;
}
.sc-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(90deg,#f8fafc 0%, #f8fafc 100%);
  border-bottom: 1px solid #e3ecf9;
}
.sc-head-icon {
  font-size: 14px;
}
.sc-head-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}
.sc-head-badge {
  margin-left: auto;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #e7f7ec;
  color: #2aaf5e;
  border: 1px solid #bfe9cc;
}
.sc-card-body {
  padding: 16px 18px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.sc-dual-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  align-items: stretch;
}
.sc-dual-grid > .sc-card {
  display: flex;
  flex-direction: column;
}
.sub-title {
  font-size: 13px;
  font-weight: 700;
  color: #606266;
  margin: 12px 0 6px;
  &:first-child {
    margin-top: 0;
  }
}
.field-label {
  font-size: 13px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}
.freq-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.freq-text {
  font-size: 12px;
  color: #606266;
  font-weight: 700;
}
.freq-value {
  font-size: 30px;
  color: #1e6ecf;
  font-weight: 700;
  line-height: 1;
}
.freq-track {
  height: 10px;
  background: #edf1f6;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 6px;
}
.freq-track-active {
  height: 100%;
  background: linear-gradient(90deg, #70a9e8, #2f62d9);
}
.freq-levels {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #9aa3b2;
  font-size: 11px;
}
.metric-box {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 20px;
  font-weight: 700;
  &.dark-bg {
    background: #1f3f9e;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
.metric-label {
  font-size: 14px;
  font-weight: 600;
}
.metric-num {
  font-size: 30px;
  line-height: 1;
}
.mt-12 {
  margin-top: 12px;
}
.strategy-config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.config-right {
  padding: 0;
}
.right-card-title {
  font-size: 13px;
  color: #303133;
  font-weight: 700;
  margin-bottom: 8px;
}
.detail-card {
  border: 1px solid #e5e7eb;
  background: #f5f7fa;
  border-radius: 10px;
  padding: 10px 14px;
}
.detail-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 12px;
  color: #606266;
  line-height: 1.9;
}
.detail-label {
  color: #909399;
  white-space: nowrap;
}
.detail-value {
  color: #303133;
  text-align: right;
  font-weight: 700;
}
.detail-line-arpu {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid #dfe3e8;
}
.detail-arpu {
  color: #1e6ecf;
  font-weight: 700;
}
.channel-cards,
.script-cards {
  display: grid;
  gap: 12px;
}
.channel-cards {
  grid-template-columns: 1fr 1fr;
}
.script-cards {
  grid-template-columns: 1fr;
}
.ch-card,
.s-card {
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  background: #fff;
  transition: all 0.2s;
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  &.selected {
    border-color: #1e6ecf;
    background: #f0f6ff;
    box-shadow: 0 0 0 1px #1e6ecf inset;
  }
  .check {
    position: absolute;
    right: 8px;
    top: 6px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #1e6ecf;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
  }
  .tag-main {
    display: inline-block;
    margin-top: 6px;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
    background: #1e6ecf;
    color: #fff;
  }
  .tag-rank {
    display: inline-block;
    margin-top: 6px;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
    background: #f0f2f5;
    color: #606266;
  }
}
.ch-card {
  display: flex;
  align-items: center;
  gap: 12px;
  .ch-icon {
    font-size: 28px;
  }
  .ch-name {
    font-size: 15px;
    font-weight: 700;
    color: #303133;
  }
}
.s-card {
  .s-title {
    font-size: 13px;
    font-weight: 700;
    color: #1e6ecf;
  }
  .s-content {
    margin-top: 6px;
    font-size: 13px;
    color: #606266;
    line-height: 1.6;
  }
}
.empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #909399;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
}
.week-bars {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  flex: 1;
  min-height: 116px;
  align-items: stretch;
  background: #f5f7fb;
  padding: 8px;
  border-radius: 8px;
}
.week-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: end;
  gap: 6px;
  background: #eef1f6;
  border-radius: 8px;
  padding: 0 0 6px;
  .bar-fill {
    width: 100%;
    background: #c9d4e2;
    border-radius: 0;
    transition: all 0.4s;
  }
  .bar-label {
    font-size: 10px;
    color: #7d8697;
  }
  &.active .bar-fill {
    background: linear-gradient(180deg, #3f8bf1, #2f62d9);
  }
  &.active .bar-label {
    color: #1e6ecf;
    font-weight: 700;
  }
}
.ai-conclusion {
  margin-top: 10px;
  background: #f1f4f9;
  border-radius: 6px;
  color: #6f798a;
  font-size: 12px;
  text-align: center;
  padding: 8px 10px;
}
.ai-prefix {
  color: #7e8898;
}
.ai-main {
  color: #2f62d9;
  font-weight: 700;
}
.dark-block {
  background: linear-gradient(135deg, #0a1f3d, #1a3358);
  border-radius: 8px;
  padding: 16px 20px 20px;
  margin-top: 20px;
  color: #fff;
}
.dark-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 14px;
}
.dark-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 18px;
}
.dark-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pm-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(74, 144, 226, 0.2);
  border-radius: 6px;
  padding: 12px 14px;
}
.pm-title {
  font-size: 12px;
  color: #aab8c8;
  margin-bottom: 6px;
}
.pm-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.pm-num {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}
.pm-up {
  color: #f2a443;
  font-size: 12px;
  font-weight: 600;
}
.dark-chart-wrap {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  padding: 12px 14px;
}
.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.ch-title {
  font-size: 12px;
  color: #ccd4dc;
}
.dim-switch :deep(.el-radio-button__inner) {
  background: transparent;
  color: #aab8c8;
  border-color: #3b5a7f;
  padding: 4px 10px;
  font-size: 11px;
}
.dim-switch :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: #f2a443;
  border-color: #f2a443;
  color: #fff;
  box-shadow: none;
}
.publish-row {
  text-align: center;
  margin-top: 20px;
}
.publish-btn {
  background: #f2a443;
  border: none;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 12px 64px;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(242, 164, 67, 0.4);
  transition: all 0.2s;
  &:hover:not(:disabled) {
    background: #e2923a;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
