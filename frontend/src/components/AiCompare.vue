<template>
  <div class="ai-compare">
    <div class="ac-title">
      <svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 10h3v4H2zm4-6h3v10H6zm4 3h3v7h-3z" fill="#1e6ecf"/></svg>
      <span>AI运营情况对比图 (2026年)</span>
    </div>

    <div class="ac-main">
      <!-- 左列：AI / 人工 说明 + 指标 -->
      <div class="ac-side left">
        <div class="side-block ai">
          <div class="side-head">
            <span class="dot blue"></span>
            <div class="side-title">{{ data.ai.title }}</div>
          </div>
          <div class="side-desc">{{ data.ai.desc }}</div>
          <div class="ind-grid">
            <div class="ind" v-for="(it, i) in data.ai.indicators" :key="'ai-'+i">
              <div class="ind-title">{{ it.label }}</div>
              <div class="ind-val blue">{{ it.value }}<span class="u">{{ it.unit }}</span></div>
            </div>
          </div>
        </div>

        <div class="side-block manual">
          <div class="side-head">
            <span class="dot dark"></span>
            <div class="side-title">{{ data.manual.title }}</div>
          </div>
          <div class="side-desc">{{ data.manual.desc }}</div>
          <div class="ind-grid">
            <div class="ind" v-for="(it, i) in data.manual.indicators" :key="'m-'+i">
              <div class="ind-title">{{ it.label }}</div>
              <div class="ind-val dark">{{ it.value }}<span class="u">{{ it.unit }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右列：双环图 -->
      <div class="ac-ring">
        <svg class="ring-svg" viewBox="0 0 320 320">
          <circle cx="160" cy="160" r="118" fill="none" stroke="#e6eef9" stroke-width="26" />
          <circle cx="160" cy="160" r="118" fill="none" stroke="#1e6ecf" stroke-width="26"
            stroke-dasharray="520 220" stroke-linecap="round"
            transform="rotate(-90 160 160)"
            class="ring-anim" />
          <circle cx="160" cy="160" r="82" fill="none" stroke="#eef3fb" stroke-width="22" />
          <circle cx="160" cy="160" r="82" fill="none" stroke="#0a3a78" stroke-width="22"
            stroke-dasharray="340 200" stroke-linecap="round"
            transform="rotate(-90 160 160)"
            class="ring-anim-2" />
        </svg>
        <div class="center-text">
          <div class="ct-label">{{ data.center.label1 }}</div>
          <div class="ct-value up">{{ data.center.value1 }}</div>
          <div class="divider"></div>
          <div class="ct-value">{{ data.center.value2 }}</div>
          <div class="ct-label">营收同比增长</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, required: true } })
</script>

<style lang="scss" scoped>
.ai-compare {
  background: #fff;
  border-radius: 8px;
  padding: 14px 18px 18px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}
.ac-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #303133;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
}
.ac-main {
  display: grid;
  grid-template-columns: 1fr minmax(220px, 260px);
  gap: 16px;
  margin-top: 14px;
  flex: 1;
}

/* 左侧说明 + 指标 */
.ac-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.side-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.side-head {
  display: flex;
  align-items: center;
  gap: 8px;
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    &.blue { background: #1e6ecf; }
    &.dark { background: #0a3a78; }
  }
  .side-title {
    font-size: 13px;
    font-weight: 700;
    color: #303133;
  }
}
.side-desc {
  font-size: 11px;
  color: #909399;
  line-height: 1.55;
}
.ind-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 10px;
  margin-top: 4px;
}
.ind {
  background: #f7faff;
  border: 1px solid #eef3fb;
  border-radius: 6px;
  padding: 6px 8px;
  .ind-title {
    font-size: 11px;
    color: #909399;
    line-height: 1.2;
  }
  .ind-val {
    font-weight: 700;
    font-size: 15px;
    margin-top: 2px;
    line-height: 1.2;
    &.blue { color: #1e6ecf; }
    &.dark { color: #0a3a78; }
    .u {
      font-size: 11px;
      font-weight: 400;
      color: #606266;
      margin-left: 2px;
    }
  }
}

/* 右侧环 */
.ac-ring {
  position: relative;
  align-self: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  max-width: 260px;
  margin: 0 auto;
}
.ring-svg {
  width: 100%;
  height: 100%;
  display: block;
}
.ring-anim { animation: ring-draw 1.4s ease-out; }
.ring-anim-2 { animation: ring-draw 1.8s ease-out; }
@keyframes ring-draw {
  from { stroke-dasharray: 0 1500; }
}
.center-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
  pointer-events: none;
  .ct-label {
    font-size: 11px;
    color: #909399;
  }
  .ct-value {
    font-size: 20px;
    font-weight: 800;
    color: #103a70;
    margin: 2px 0;
    &.up { color: #1e6ecf; }
  }
  .divider {
    width: 60%;
    height: 1px;
    background: #e4e7ed;
    margin: 4px auto;
  }
}
</style>
