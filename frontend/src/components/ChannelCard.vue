<template>
  <div class="channel-card">
    <!-- 彩色头部 -->
    <div class="c-header">{{ data.title }}</div>

    <div class="c-body">
      <!-- ARPU 提升 -->
      <div class="kv">
        <span class="kv-label">AHPU提升</span>
        <span class="kv-value big"><strong>{{ data.arpuLift.toLocaleString() }}</strong><span class="unit">{{ data.arpuUnit }}</span></span>
      </div>
      <!-- 同比 -->
      <div class="kv">
        <span class="kv-label">同比增长</span>
        <span class="kv-value" :class="data.yoy >= 0 ? 'up' : 'down'">
          {{ data.yoy >= 0 ? '+' : '' }}{{ data.yoy }}%
        </span>
      </div>

      <!-- 目标达成率 -->
      <div class="sub-label">目标达成率</div>
      <div class="bar">
        <div class="bar-fill" :style="{ width: data.achieve + '%' }"></div>
        <span class="bar-num">{{ data.achieve }}%</span>
      </div>

      <!-- 环形图 -->
      <div class="donut">
        <EChart :option="donutOption" height="140px" />
      </div>

      <!-- 运营用户量 -->
      <div class="kv row">
        <span class="kv-label">运营用户量</span>
        <span class="kv-value big-dark"><strong>{{ data.userCount }}</strong><span class="unit">{{ data.userCountUnit }}</span></span>
      </div>
      <!-- 价值贡献率 -->
      <div class="kv row">
        <span class="kv-label">价值贡献率</span>
        <span class="kv-value" :class="data.valueContribution >= 0 ? 'up' : 'down'">
          {{ data.valueContribution >= 0 ? '+' : '' }}{{ data.valueContribution }}%
        </span>
      </div>

      <!-- 渠道用户占比 -->
      <div class="sub-label">目标达成率</div>
      <div class="bar">
        <div class="bar-fill blue2" :style="{ width: data.userShare + '%' }"></div>
        <span class="bar-num">{{ data.userShare }}%</span>
      </div>

      <!-- 柱线混合图 -->
      <div class="mix">
        <EChart :option="mixOption" height="130px" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import EChart from './EChart.vue'
import { donutColorsPalette } from '@/mock/dashboard'

const props = defineProps({
  data: { type: Object, required: true }
})

const donutOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
  legend: {
    orient: 'horizontal',
    bottom: 0,
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { fontSize: 10, color: '#606266' }
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '68%'],
      center: ['50%', '40%'],
      avoidLabelOverlap: true,
      label: {
        show: true,
        position: 'center',
        formatter: () => `{a|${props.data.achieve}%}\n{b|完成度}`,
        rich: {
          a: { fontSize: 16, fontWeight: 700, color: '#1e6ecf' },
          b: { fontSize: 10, color: '#909399', padding: [2, 0, 0, 0] }
        }
      },
      labelLine: { show: false },
      animationType: 'expansion',
      animationDuration: 1200,
      data: props.data.donut,
      color: donutColorsPalette
    }
  ]
}))

const mixOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 32, right: 36, top: 24, bottom: 22 },
  legend: {
    data: ['运营用户数', '价值贡献率'],
    top: 0,
    textStyle: { fontSize: 10 },
    itemWidth: 8,
    itemHeight: 8
  },
  xAxis: {
    type: 'category',
    data: props.data.mix.x,
    axisLabel: { fontSize: 9, color: '#909399' },
    axisLine: { lineStyle: { color: '#ebeef5' } }
  },
  yAxis: [
    {
      type: 'value',
      axisLabel: { fontSize: 9, color: '#909399' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f2f5' } }
    },
    {
      type: 'value',
      axisLabel: { formatter: '{value}%', fontSize: 9, color: '#909399' },
      axisLine: { show: false },
      splitLine: { show: false }
    }
  ],
  series: [
    {
      name: '运营用户数',
      type: 'bar',
      data: props.data.mix.bars,
      itemStyle: { color: '#4a90e2', borderRadius: [3, 3, 0, 0] },
      barWidth: 10,
      animationDelay: (idx) => idx * 80
    },
    {
      name: '价值贡献率',
      type: 'line',
      yAxisIndex: 1,
      data: props.data.mix.line,
      smooth: true,
      lineStyle: { width: 2, color: '#f2c037' },
      itemStyle: { color: '#f2c037' },
      symbolSize: 5
    }
  ]
}))
</script>

<style lang="scss" scoped>
.channel-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.c-header {
  background: linear-gradient(90deg, #1e6ecf, #4a90e2);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  padding: 10px 0;
  letter-spacing: 1px;
  flex-shrink: 0;
}
.c-body {
  padding: 12px 14px 14px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.kv {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 4px 0;
  &.row {
    margin-top: 6px;
  }
  .kv-label {
    font-size: 12px;
    color: #909399;
  }
  .kv-value {
    font-weight: 700;
    font-size: 14px;
    &.big {
      color: #1e6ecf;
      font-size: 18px;
      strong {
        font-size: 20px;
      }
    }
    &.big-dark {
      color: #303133;
      font-size: 16px;
      strong {
        font-size: 18px;
      }
    }
    &.up {
      color: #67c23a;
    }
    &.down {
      color: #f56c6c;
    }
    .unit {
      font-size: 11px;
      font-weight: 400;
      margin-left: 2px;
      color: #606266;
    }
  }
}
.sub-label {
  font-size: 11px;
  color: #909399;
  margin-top: 10px;
  margin-bottom: 4px;
}
.bar {
  position: relative;
  height: 8px;
  background: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e6ecf, #4a90e2);
  border-radius: 4px;
  transition: width 0.8s;
  &.blue2 {
    background: linear-gradient(90deg, #4a90e2, #67c3e8);
  }
}
.bar-num {
  position: absolute;
  right: 4px;
  top: -2px;
  font-size: 9px;
  color: #1e6ecf;
  font-weight: 700;
}
.donut {
  margin: 6px 0;
  flex: 1 1 auto;
  min-height: 140px;
  :deep(> div) { height: 100% !important; }
}
.mix {
  margin-top: 8px;
  flex: 1 1 auto;
  min-height: 130px;
  :deep(> div) { height: 100% !important; }
}
</style>
