<template>
  <div class="dashboard">
    <div class="grid">
      <!-- 左：4 KPI -->
      <div class="col-kpi">
        <KpiCard v-for="c in kpiCards" :key="c.key" :card="c" />
      </div>

      <!-- 中：4 通道卡 -->
      <div class="col-channels">
        <ChannelCard v-for="c in channelCards" :key="c.key" :data="c" />
      </div>

      <!-- 右：AI 对比 + 渠道策略 + 价值提升 -->
      <div class="col-ai">
        <AiCompare :data="ai" />

        <!-- 渠道 AI 策略执行情况 -->
        <div class="card-block">
          <div class="cb-title">
            <svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 13h12v1H2zm1-3h2v2H3zm3-3h2v5H6zm3-3h2v8H9zm3 5h2v3h-2z" fill="#1e6ecf"/></svg>
            <span>渠道AI策略执行情况分析 (2026年)</span>
          </div>
          <div class="cb-sub">各渠道对AI策略执行情况进行对比分析</div>
          <div class="channel-row">
            <div class="ch-item" v-for="c in ai.channelLift" :key="c.name">
              <div class="ch-head">
                <div class="ch-icon">
                  <svg viewBox="0 0 16 16" width="18" height="18" v-if="c.name==='APP'"><rect x="3" y="2" width="10" height="13" rx="2" fill="none" stroke="#1e6ecf" stroke-width="1.5"/><circle cx="8" cy="12" r="1" fill="#1e6ecf"/></svg>
                  <svg viewBox="0 0 16 16" width="18" height="18" v-else-if="c.name==='公众号'"><rect x="2" y="4" width="12" height="9" rx="1.5" fill="none" stroke="#1e6ecf" stroke-width="1.5"/><path d="M2 6l6 4 6-4" stroke="#1e6ecf" stroke-width="1.5" fill="none"/></svg>
                  <svg viewBox="0 0 16 16" width="18" height="18" v-else-if="c.name==='外呼'"><path d="M3 3l3 0 1 3-2 1a8 8 0 004 4l1-2 3 1v3a1 1 0 01-1 1A11 11 0 012 4a1 1 0 011-1z" fill="none" stroke="#1e6ecf" stroke-width="1.5"/></svg>
                  <svg viewBox="0 0 16 16" width="18" height="18" v-else><path d="M2 4h12v8H2z M4 6l4 3 4-3" fill="none" stroke="#1e6ecf" stroke-width="1.5"/></svg>
                </div>
                <div class="ch-name">{{ c.name }}</div>
              </div>
              <div class="ch-val">提升 <strong>{{ c.value }}%</strong></div>
              <div class="ch-desc">{{ c.subLabel }}</div>
            </div>
          </div>
        </div>

        <!-- 价值提升情况 -->
        <div class="card-block">
          <div class="cb-title">
            <svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="6" fill="none" stroke="#1e6ecf" stroke-width="1.5"/><path d="M8 4v4l3 2" stroke="#1e6ecf" stroke-width="1.5" fill="none"/></svg>
            <span>价值提升情况分析 (2026年)</span>
          </div>
          <div class="value-lift">
            <div class="vl-ring">
              <svg viewBox="0 0 100 100" width="120" height="120">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e6eef9" stroke-width="10" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e6ecf" stroke-width="10"
                  stroke-dasharray="264" stroke-dashoffset="151" stroke-linecap="round"
                  transform="rotate(-90 50 50)" />
                <text x="50" y="54" text-anchor="middle" font-size="16" font-weight="700" fill="#1e6ecf">
                  {{ ai.valueLift.percent }}%
                </text>
              </svg>
            </div>
            <div class="vl-desc">
              <div class="vl-title">价值提升分析（2026年）</div>
              <div class="vl-text">{{ ai.valueLift.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import KpiCard from '@/components/KpiCard.vue'
import ChannelCard from '@/components/ChannelCard.vue'
import AiCompare from '@/components/AiCompare.vue'
import { kpiCards, channelCards, aiCompareData } from '@/mock/dashboard'

const ai = aiCompareData
</script>

<style lang="scss" scoped>
.dashboard {
  min-width: 1280px;
  height: calc(100vh - 92px);
  min-height: 720px;
  display: flex;
  flex-direction: column;
}
.grid {
  display: grid;
  grid-template-columns: 150px repeat(4, minmax(180px, 1fr)) minmax(420px, 1.4fr);
  gap: 12px;
  flex: 1;
  min-height: 0;
  align-items: stretch;
}
.col-kpi {
  grid-column: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  :deep(.kpi-card) {
    flex: 1;
    min-height: 0;
  }
}
.col-channels {
  grid-column: 2 / 6;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  :deep(.channel-card) {
    height: 100%;
  }
}
.col-ai {
  grid-column: 6;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  > :nth-child(1) { flex: 1.2; min-height: 0; }
  > :nth-child(2) { flex: 0.9; }
  > :nth-child(3) { flex: 0.7; }
}

.card-block {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.cb-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #303133;
}
.cb-sub {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
  margin-bottom: 10px;
}
.channel-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.ch-item {
  .ch-head {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ch-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #eef3fb;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ch-name {
    font-size: 12px;
    font-weight: 700;
    color: #303133;
  }
  .ch-val {
    margin-top: 6px;
    font-size: 12px;
    color: #606266;
    strong {
      color: #1e6ecf;
      font-size: 15px;
      margin-left: 2px;
    }
  }
  .ch-desc {
    font-size: 10px;
    color: #909399;
    line-height: 1.4;
    margin-top: 2px;
  }
}
.value-lift {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 6px;
}
.vl-ring {
  flex-shrink: 0;
}
.vl-desc {
  flex: 1;
  .vl-title {
    font-size: 13px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 4px;
  }
  .vl-text {
    font-size: 11px;
    color: #909399;
    line-height: 1.55;
  }
}
</style>
