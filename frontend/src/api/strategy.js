import request, { createApi } from './request'
import { mockStrategy } from './mock/strategy'

/**
 * 页面3 / 页面4 共用：客群圈选（§2） + 策略生成（§4） + 执行优化（§5） + 评估（§6） + 发布（§7）
 */

// ------------------------------------------------------------------
// §2 客群圈选
// ------------------------------------------------------------------

// 2.1 种子扩散 POST /audience/seed
export const seedExpand = createApi(
  async ({ seeds, target } = {}) => {
    const seedList = String(seeds || '')
      .split(/[;,\n\r\t ]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const data = await request.post('/audience/seed', {
      seed_users: seedList,
      target_count: target || 1000
    })
    return {
      count: data.total ?? (data.audience_ids || []).length,
      audienceIds: data.audience_ids || []
    }
  },
  (payload) => mockStrategy.seedExpand(payload)
)

// 2.2 特征组合法（按已保存客群名） POST /audience/feature
export const segmentByCondition = createApi(
  async ({ name } = {}) => {
    const data = await request.post('/audience/feature', {
      audience_name: name
    })
    return {
      count: data.total ?? (data.audience_ids || []).length,
      audienceIds: data.audience_ids || []
    }
  },
  (payload) => mockStrategy.segmentByCondition(payload)
)

// 2.4 产品适配客群 POST /audience/product
export const segmentByProduct = createApi(
  async ({ productIds, target } = {}) => {
    const data = await request.post('/audience/product', {
      product_id: (productIds && productIds[0]) || '',
      target_count: target || 1000
    })
    return {
      count: data.total ?? (data.audience_ids || []).length,
      audienceIds: data.audience_ids || []
    }
  },
  (payload) => mockStrategy.segmentByProduct(payload)
)

// 2.5 导入用户清单 POST /audience/import（base64 文件内容）
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result || ''
      const idx = result.indexOf(',')
      resolve(idx >= 0 ? result.slice(idx + 1) : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 后端 /audience/import 要求传 file_type（xlsx / csv / txt）
// 优先从文件扩展名推断，无扩展名时回退到 MIME 类型
function detectFileType(file) {
  const name = (file && file.name) || ''
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  if (ext === 'csv') return 'csv'
  if (ext === 'txt') return 'txt'

  const mime = (file && file.type) || ''
  if (mime.includes('sheet') || mime.includes('excel')) return 'xlsx'
  if (mime.includes('csv')) return 'csv'
  if (mime.includes('text/plain')) return 'txt'
  return 'csv'
}

export const uploadUsers = createApi(
  async (formData) => {
    let file = null
    if (formData instanceof FormData) {
      file = formData.get('file')
    } else if (formData && formData.file) {
      file = formData.file
    }
    if (!file) throw new Error('文件不能为空')
    const base64 = await readFileAsBase64(file)
    const fileType = detectFileType(file)
    const data = await request.post('/audience/import', {
      file_content: base64,
      file_type: fileType
    })
    return {
      count: data.total ?? (data.audience_ids || []).length,
      audienceIds: data.audience_ids || []
    }
  },
  () => mockStrategy.uploadUsers()
)

// ------------------------------------------------------------------
// §4 策略生成
// ------------------------------------------------------------------

// 后端 detail.category 是字符串，前端用 checkbox 组（多选）需要数组
// 这里给几种常见映射
function toCategoryArray(cat) {
  if (!cat) return []
  if (Array.isArray(cat)) return cat
  return String(cat).split(/[,，、\/\s]+/).filter(Boolean)
}

export const generateStrategy = createApi(
  async ({ text, products = [], segment = {}, audienceIds = [] } = {}) => {
    const productIds = (products || []).map((p) => p.id).filter(Boolean)
    const hasAudience = audienceIds && audienceIds.length > 0
    const body = {
      method: hasAudience ? 'product_audience' : 'product_only',
      product_ids: productIds,
      audience_ids: audienceIds,
      goal: text || ''
    }
    const data = await request.post('/strategy/generate', body)
    const d = data.detail || {}
    return {
      id: data.strategy_id,
      name: d.name || '',
      categories: toCategoryArray(d.category),
      condition: d.conditions || '',
      descDetail: {
        desc: d.description || d.activity_desc || '',
        paymentMethod: d.charge_method || '',
        relatedProducts: products.map((p) => p.name).join(','),
        benefits: d.rights_content || '',
        validity: d.valid_period || ''
      },
      expectedArpuLift: d.audience_scale ? `约 ${d.audience_scale} 人受益` : '',
      segmentSize: d.audience_scale || segment.count || 0,
      raw: data
    }
  },
  (payload) => mockStrategy.generate(payload)
)

// ------------------------------------------------------------------
// §5 执行优化
// ------------------------------------------------------------------

const CHANNEL_ID_MAP = {
  短信: 'sms',
  APP推送: 'app',
  APP: 'app',
  公众号: 'wechat',
  微信: 'wechat',
  外呼: 'outcall',
  电话: 'outcall',
  邮件: 'email',
  EMAIL: 'email'
}
const WEEKDAY_MAP = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7
}

export const executeStrategy = createApi(
  async ({ strategyId, productIds = [], audienceIds = [], text = '' } = {}) => {
    const data = await request.post('/execution/optimize', {
      user_input: text || '希望提高转化率',
      product_ids: productIds,
      strategy_id: strategyId,
      audience_ids: audienceIds
    })

    // 通道列表转换：给每个通道派一个 id、rank
    const rawChannels = data.channels || []
    const channels = rawChannels.map((c, idx) => ({
      id: CHANNEL_ID_MAP[c.channel] || `ch_${idx}`,
      name: c.channel,
      rank: idx + 1
    }))

    // 话术按通道 id 分组
    const scripts = {}
    rawChannels.forEach((c, idx) => {
      const chId = CHANNEL_ID_MAP[c.channel] || `ch_${idx}`
      scripts[chId] = (c.scripts || []).map((content, i) => ({
        id: `${chId}_s${i + 1}`,
        title: `${c.channel} - 话术 ${i + 1}`,
        content
      }))
    })

    // 频率 & 最佳时机
    const waveCount = data.wave_count || 2
    const intervalHours = data.wave_interval_hours || 24
    const frequency = {
      level: waveCount >= 4 ? '激进' : waveCount >= 2 ? '标准' : '保守',
      times: waveCount,
      options: [
        { label: '保守', times: 1 },
        { label: '标准', times: 2 },
        { label: '激进', times: 4 }
      ]
    }
    const tp = data.time_preference || {}
    const weekdays = (tp.weekdays || []).map((w) => WEEKDAY_MAP[w] || 0).filter(Boolean)
    const bestTime = {
      weekdays,
      label: `${(tp.weekdays || []).map((w) => '周' + w).join('、')} · ${(tp.times || []).join(' / ')}，间隔 ${intervalHours}h`
    }

    return {
      channels,
      scripts,
      frequency,
      bestTime,
      planId: data.plan_id || '',
      scriptIds: data.script_ids || []
    }
  },
  (payload) => mockStrategy.execute(payload)
)

// ------------------------------------------------------------------
// §6 评估 POST /evaluation
// ------------------------------------------------------------------

export const predictStrategy = createApi(
  async ({ strategyId, dimension } = {}) => {
    const data = await request.post('/evaluation', { strategy_id: strategyId })
    const pCvr = Number(data.predicted_conversion_rate || 0)
    const pRoi = Number(data.predicted_roi || 0)
    const pRr = Number(data.predicted_click_rate || 0)

    // 趋势曲线：后端未提供，按 dimension 生成示意曲线（围绕 pCvr 做一点波动）
    const dimMap = {
      region: { name: '区域', cats: ['华北', '华东', '华南', '华中', '西北', '西南', '东北'] },
      arpu: { name: 'ARPU', cats: ['0-30', '30-60', '60-90', '90-120', '120-150', '150-200', '200+'] },
      age: { name: '年龄段', cats: ['<20', '20-30', '30-40', '40-50', '50-60', '60+'] }
    }
    const dim = dimMap[dimension] || dimMap.region
    const base = pCvr || 0.12
    const noise = (i) => (Math.sin(i + 1) * 0.02 + (i % 3) * 0.005)
    return {
      pCvr: { from: 0, to: pCvr.toFixed(3) },
      pRoi: { from: 0, to: `1:${(pRoi || 0).toFixed(2)}` },
      pRr: { from: 0, to: pRr.toFixed(3) },
      categories: dim.cats,
      series: [
        {
          name: '预测转化率',
          data: dim.cats.map((_, i) => +(base + noise(i)).toFixed(3))
        }
      ]
    }
  },
  (payload) => mockStrategy.predict(payload)
)

// ------------------------------------------------------------------
// §7 发布 POST /publish
// ------------------------------------------------------------------

export const publishStrategy = createApi(
  async ({ strategyId, productIds = [], audienceIds = [], planId = '', scriptIds = [] } = {}) => {
    if (!strategyId) throw new Error('缺少 strategy_id')
    const data = await request.post('/publish', {
      strategy_id: strategyId,
      product_ids: productIds,
      audience_ids: audienceIds,
      plan_id: planId,
      script_ids: scriptIds
    })
    return { message: data.message || '发布成功' }
  },
  (payload) => mockStrategy.publish(payload)
)

// ------------------------------------------------------------------
// 10.3 策略列表 GET /strategies
// ------------------------------------------------------------------
export const listStrategies = createApi(
  async () => {
    const data = await request.get('/strategies')
    return data.strategies || []
  },
  () => []
)
