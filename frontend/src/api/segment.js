import request, { createApi } from './request'
import { mockSegment } from './mock/segment'

/**
 * 页面2：客群分析
 * 文档章节 1 + 辅助接口 10
 */

// 1.1 自然语言生成 SQL（不执行）
//   POST /audience/nl2sql   { question, user_id }  ->  { sql }
export const textToSql = createApi(
  async ({ text } = {}) => {
    const data = await request.post('/audience/nl2sql', { question: text })
    return { sql: data.sql }
  },
  (payload) => mockSegment.textToSql(payload)
)

// 已保存客群名称列表（口径圈选下拉）：与后端约定在 ClickHouse 上执行
export const SQL_AUDIENCE_GROUP_NAMES = 'select name from audience_groups group by name'

// 1.2 执行 SQL 查询
//   POST /audience/execute  { sql, user_id }
//   ->  { columns: string[], data: any[][], total }
// 前端表格用的是 [{prop,label}] + [{prop:value}] 格式，需要转换
export const queryBySql = createApi(
  async ({ sql } = {}) => {
    const data = await request.post('/audience/execute', { sql })
    const cols = (data.columns || []).map((c) => ({ prop: c, label: c }))
    const rows = (data.data || []).map((r) => {
      const obj = {}
      ;(data.columns || []).forEach((c, idx) => (obj[c] = r[idx]))
      return obj
    })
    return { columns: cols, rows, total: data.total ?? rows.length, sql }
  },
  (payload) => mockSegment.query(payload)
)

// 1.3 保存客群
//   POST /audience/save { name, condition_sql, user_id } -> { status, audience_id }
export const saveSegment = createApi(
  async ({ name, condition } = {}) => {
    const data = await request.post('/audience/save', {
      name,
      condition_sql: condition
    })
    if (data.status === 'error') {
      throw new Error(data.message || '保存失败')
    }
    return { id: data.audience_id, name, condition }
  },
  (payload) => mockSegment.save(payload)
)

// 1.4 多维分析 —— 通过多次 /audience/execute 实现（文档示例里也是前端直接写 SQL）
// 入参 { sql } 为当前客群基础 SQL（含 FROM ... WHERE ...）
function extractFromWhere(sql) {
  const s = (sql || '').replace(/;+\s*$/, '')
  const m = s.match(/(FROM[\s\S]*?)(group\s+by|order\s+by|limit|$)/i)
  return m ? m[1].trim() : 'FROM user_behavior'
}

const diagnosisDefault = [
  { period: '入网期', sticky: 100, value: 140, compete: 230, sense: 100, active: 130, spread: 148 },
  { period: '成长期', sticky: 150, value: 100, compete: 200, sense: 140, active: 100, spread: 140 },
  { period: '成熟期', sticky: 194, value: 120, compete: 132, sense: 165, active: 220, spread: 152 }
]

function normalizeDiagnosisTable(rows) {
  if (!Array.isArray(rows) || !rows.length) return diagnosisDefault
  return rows.map((row) => ({
    period: row.period || row.stage || '',
    sticky: Number(row.sticky) || 0,
    value: Number(row.value) || 0,
    compete: Number(row.compete) || 0,
    sense: Number(row.sense) || 0,
    active: Number(row.active) || 0,
    spread: Number(row.spread) || 0
  }))
}

function buildDiagnosisTableFromExecuteResult(result) {
  const cols = result?.columns || []
  const rows = result?.data || []
  if (!Array.isArray(cols) || !Array.isArray(rows) || !cols.length || !rows.length) {
    return null
  }

  const idx = {}
  cols.forEach((name, i) => {
    idx[name] = i
  })

  const getVal = (row, ...keys) => {
    const colIdx = keys.map((k) => idx[k]).find((v) => typeof v === 'number')
    return typeof colIdx === 'number' ? Number(row[colIdx]) || 0 : 0
  }

  return rows.map((row) => ({
    period: row[idx.smzq] || row[idx.period] || row[idx.stage] || '',
    sticky: getVal(row, '粘性', 'sticky'),
    value: getVal(row, '价值', 'value'),
    compete: getVal(row, '竞抢', 'compete'),
    sense: getVal(row, '感知', 'sense'),
    active: getVal(row, '活跃', 'active'),
    spread: getVal(row, '传播', 'spread')
  }))
}

function buildRadarValueFromExecuteResult(result) {
  const cols = result?.columns || []
  const first = result?.data?.[0] || []
  if (!Array.isArray(cols) || !Array.isArray(first) || !cols.length || !first.length) {
    return []
  }
  const idx = {}
  cols.forEach((name, i) => {
    idx[String(name).trim()] = i
  })
  const getVal = (...keys) => {
    const colIdx = keys
      .map((k) => idx[String(k).trim()])
      .find((v) => typeof v === 'number')
    return typeof colIdx === 'number' ? Number(first[colIdx]) || 0 : null
  }
  let values = [
    getVal('粘性', 'sticky'),
    getVal('价值', 'value'),
    getVal('竞抢', 'compete'),
    getVal('感知', 'sense'),
    getVal('活跃', 'active'),
    getVal('传播', 'spread')
  ]

  // 列名兜底失败时，按返回顺序取前 6 个值（对应指标顺序）
  if (values.some((v) => v === null)) {
    values = first.slice(0, 6).map((v) => Number(v) || 0)
  }

  // 当前雷达图指标 max=100；后端若返回 0~1 比例，这里自动转为百分制
  const shouldScaleToPercent = values.length && values.every((v) => typeof v === 'number' && v <= 1)
  if (shouldScaleToPercent) {
    values = values.map((v) => +(v * 100).toFixed(2))
  }

  return values
}

export const multiAnalysis = createApi(
  async ({ sql } = {}) => {
    const fromWhere = extractFromWhere(sql)

      console.log('fromWhere----------',fromWhere)
    // 1) 生命周期卡片
    const sqlLifecycle = `SELECT
      countIf(user_online < 6) AS s1,
      countIf(user_online >= 6 AND user_online < 18) AS s2,
      countIf(user_online >= 18 AND user_online < 36) AS s3,
      countIf(user_online >= 36 AND user_online < 60) AS s4,
      countIf(user_online >= 60) AS s5
      ${fromWhere}`

    // 2) 高/低价值按生命周期阶段
    const sqlValue = `SELECT
      CASE
        WHEN user_online < 6 THEN '入网期'
        WHEN user_online >= 6 AND user_online < 18 THEN '成长期'
        WHEN user_online >= 18 AND user_online < 36 THEN '成熟期'
        WHEN user_online >= 36 AND user_online < 60 THEN '异动期'
        ELSE '离网期'
      END AS stage,
      countIf(arpu > 80) AS high,
      countIf(arpu <= 80) AS low
      ${fromWhere}
      GROUP BY stage`

    // 3) 雷达右侧表格（按生命周期分组）
    const sqlRadar = `SELECT
      CASE WHEN user_online <= 6 THEN '入网期' WHEN user_online <= 18 AND user_online > 6 THEN '成长期' WHEN user_online <= 36 AND user_online > 18 THEN '成熟期' WHEN user_online <= 60 AND user_online > 36 THEN '异动期' ELSE '离网期' END AS smzq,
      sum(is_rhtc) AS "粘性",
      sum(arpu120_user) AS "价值", 
      sum(is_ywsk) AS "竞抢",
      sum(is_ts) AS "感知",
      sum(active_mark) AS "活跃",
      sum(if(yw_call_opp_counts > 0,1,0)) AS "传播"
      ${fromWhere}
      GROUP BY smzq`

    // 4) 雷达图（整体占比）
    const sqlRadarForChart = `SELECT
      sum(nx_fz) / sum(COUNT_ALL) AS "粘性",
      sum(jz_fz) / sum(COUNT_ALL) AS "价值",
      sum(jq_fz) / sum(COUNT_ALL) AS "竞抢",
      sum(gz_fz) / sum(COUNT_ALL) AS "感知",
      sum(hy_fz) / sum(COUNT_ALL) AS "活跃",
      sum(cb_fz) / sum(COUNT_ALL) AS "传播"
      FROM (
        SELECT
          sum(is_rhtc) AS nx_fz,
          sum(arpu120_user) AS jz_fz,
          sum(is_ywsk) AS jq_fz,
          sum(is_ts) AS gz_fz,
          sum(active_mark) AS hy_fz,
          sum(case when yw_call_opp_counts > 0 THEN 1 ELSE 0 END) AS cb_fz,
          COUNT(*) AS COUNT_ALL
          ${fromWhere}
      ) t`

    const [lcRes, vRes, rRes, radarChartRes] = await Promise.all([
      request.post('/audience/execute', { sql: sqlLifecycle }),
      request.post('/audience/execute', { sql: sqlValue }),
      request.post('/audience/execute', { sql: sqlRadar }),
      request.post('/audience/execute', { sql: sqlRadarForChart })
    ])

    // 组装生命周期
    const lcRow = (lcRes.data && lcRes.data[0]) || []
    const toWan = (n) => (typeof n === 'number' ? n : 0)
    const lifecycle = [
      { key: 'inflow', label: '入网期', desc: '在网时长<6个月', value: toWan(lcRow[0]) },
      { key: 'growth', label: '成长期', desc: '在网时长<18个月', value: toWan(lcRow[1]) },
      { key: 'mature', label: '成熟期', desc: '在网时长<36个月', value: toWan(lcRow[2]) },
      { key: 'churn', label: '异动期', desc: '在网时长<60个月', value: toWan(lcRow[3]) },
      { key: 'leave', label: '离网期', desc: '在网时长>60个月', value: toWan(lcRow[4]) }
    ]

    // 组装高低价值
    const stageOrder = ['入网期', '成长期', '成熟期', '异动期', '离网期']
    const valueMap = {}
    ;(vRes.data || []).forEach((row) => {
      const stage = row[0]
      valueMap[stage] = { high: row[1] || 0, low: row[2] || 0 }
    })
    const valueBar = {
      categories: stageOrder,
      high: stageOrder.map((s) => valueMap[s]?.high || 0),
      low: stageOrder.map((s) => valueMap[s]?.low || 0)
    }

    // 雷达图使用整体占比 SQL 结果
    const radar = {
      indicator: [
        { name: '粘性', max: 100 },
        { name: '价值', max: 100 },
        { name: '竞抢', max: 100 },
        { name: '感知', max: 100 },
        { name: '活跃', max: 100 },
        { name: '传播', max: 100 }
      ],
      value: buildRadarValueFromExecuteResult(radarChartRes)
    }

    // 诊断表格：优先使用 sqlRadar 的 columns/data；否则再走后端 diagnosisTable 或默认示意数据
    const diagnosisTable =
      buildDiagnosisTableFromExecuteResult(rRes) || normalizeDiagnosisTable(rRes?.diagnosisTable)



    return { lifecycle, valueBar, radar, diagnosisTable, sql }
  },
  (payload) => mockSegment.multiAnalysis(payload)
)

// 1.5 已保存客群列表（前端为了方便，走 /strategies 不合适；后端没有直接客群列表接口，
// 由前端在 saveSegment 后维护 Pinia 的 savedSegments 即可；这里保留给 UI 首次加载用）
export const getSegmentList = createApi(
  async () => {
    // 目前后端没有独立的客群列表接口，返回空数组由前端自己维护
    return []
  },
  () => mockSegment.list()
)

// 10.1 获取 ClickHouse 可用字段
//   GET /clickhouse/fields -> { fields: [] }
export const getClickhouseFields = createApi(
  async () => {
    const data = await request.get('/clickhouse/fields')
    return data.fields || []
  },
  () => ['user_id', 'arpu', 'city_id', 'age', 'dou', 'user_online']
)
