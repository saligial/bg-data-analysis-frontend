<template>
  <div class="page product-ops">
    <AssistantBar
      v-model="assistantText"
      :loading="assistantLoading"
      @analyze="handleAnalyze"
    />
    <ProductSelector
      v-model="selectedProducts"
      :products="products"
      step-label="setp1"
      @update:products="(list) => (products = list)"
      class="block-mt"
    />
    <SegmentSelector
      :selected-products="selectedProducts"
      :show-product-recommend="true"
      step-label="setp2"
      @change="handleSegmentChange"
      class="block-mt"
    />
    <GenerateBar
      v-model="generateText"
      :loading="generateLoading"
      step-label="setp3"
      @generate="handleGenerate"
      class="block-mt"
    />
    <StrategyArea
      :strategy-data="strategyData"
      :execution-data="executionData"
      :predict-data="predictData"
      :selected-products="selectedProducts"
      :audience-ids="segmentInfo.audienceIds"
      :plan-id="planId"
      :script-ids="scriptIds"
      :segment-count="segmentInfo.total"
      publish-label="发布策略"
      class="block-mt"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import AssistantBar from '@/components/ops/AssistantBar.vue'
import ProductSelector from '@/components/ops/ProductSelector.vue'
import SegmentSelector from '@/components/ops/SegmentSelector.vue'
import GenerateBar from '@/components/ops/GenerateBar.vue'
import StrategyArea from '@/components/ops/StrategyArea.vue'
import { recommendProducts } from '@/api/product'
import { generateStrategy, executeStrategy, predictStrategy } from '@/api/strategy'
import { useSegmentStore } from '@/stores/segment'

const store = useSegmentStore()

const assistantText = ref('')
const assistantLoading = ref(false)
const products = ref([])
const selectedProducts = ref([])

const segmentInfo = reactive({
  total: 0,
  parts: [],
  conditionName: '',
  condition: '',
  audienceIds: []
})
const generateText = ref('')
const generateLoading = ref(false)

const strategyData = ref(null)
const executionData = ref(null)
const predictData = ref(null)

const planId = ref('')
const scriptIds = ref([])

function handleSegmentChange(info) {
  segmentInfo.total = info.total
  segmentInfo.parts = info.parts
  segmentInfo.conditionName = info.conditionName
  segmentInfo.condition = info.condition
  segmentInfo.audienceIds = info.audienceIds || []
}

async function handleAnalyze(text) {
  if (!text?.trim()) {
    ElMessage.warning('请先输入运营目标/产品特征')
    return
  }
  assistantLoading.value = true
  try {
    const res = await recommendProducts({ text })
    products.value = res
    ElMessage.success('已推荐 TOP4 产品')
  } finally {
    assistantLoading.value = false
  }
}

async function handleGenerate(text) {
  if (!selectedProducts.value.length) {
    ElMessage.warning('请先在产品库选择产品')
    return
  }
  generateLoading.value = true
  try {
    // §4 生成策略
    const strategyRes = await generateStrategy({
      text: text || assistantText.value,
      products: selectedProducts.value,
      audienceIds: segmentInfo.audienceIds,
      segment: {
        name: segmentInfo.conditionName,
        condition: segmentInfo.condition,
        count: segmentInfo.total
      }
    })
    strategyData.value = strategyRes
    store.setStrategyId(strategyRes.id)

    // §5 执行优化
    const execRes = await executeStrategy({
      strategyId: strategyRes.id,
      productIds: selectedProducts.value.map((p) => p.id),
      audienceIds: segmentInfo.audienceIds,
      text: text || assistantText.value
    })
    executionData.value = execRes
    planId.value = execRes.planId
    scriptIds.value = execRes.scriptIds
    store.setExecutionArtifacts({ planId: execRes.planId, scriptIds: execRes.scriptIds })

    // §6 评估
    const predRes = await predictStrategy({ strategyId: strategyRes.id, dimension: 'region' })
    predictData.value = predRes

    ElMessage.success('策略已生成')
  } finally {
    generateLoading.value = false
  }
}

</script>

<style lang="scss" scoped>
.page {
  padding-bottom: 30px;
}
.block-mt {
  margin-top: 14px;
}
</style>
