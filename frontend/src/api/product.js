import request, { createApi } from './request'
import { mockProduct } from './mock/product'

/**
 * §3 产品推荐 + §10.2 产品列表
 */

function mapProduct(p) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    desc: p.description || p.desc || '',
    scope: p.applicable_scope || p.scope || ''
  }
}

// 3.1 基于文本推荐 POST /product/recommend_by_text -> { products: [...] }
export const recommendProducts = createApi(
  async ({ text } = {}) => {
    const data = await request.post('/product/recommend_by_text', {
      user_input: text || ''
    })
    return (data.products || []).map(mapProduct)
  },
  (payload) => mockProduct.recommend(payload)
)

// 3.2 基于客群推荐 POST /product/recommend_by_audience （仅客群运营页）
export const recommendBySegment = createApi(
  async ({ segment = {}, audienceIds = [], text = '' } = {}) => {
    const ids = audienceIds && audienceIds.length ? audienceIds : segment.audienceIds || []
    const data = await request.post('/product/recommend_by_audience', {
      audience_ids: ids,
      user_input: text || segment.goal || '希望提升ARPU'
    })
    return (data.products || []).map(mapProduct)
  },
  (payload) => mockProduct.recommendBySegment(payload)
)

// 10.2 产品列表 GET /products -> { products: [] }
let _productCache = null
async function loadProducts() {
  if (_productCache) return _productCache
  const data = await request.get('/products')
  _productCache = (data.products || []).map(mapProduct)
  return _productCache
}

// 3.3 前端搜索推荐产品 POST /products/search
//   参数：keyword（关键词，至少 2 个字符，少于 2 字符返回空列表）
//         limit（最大返回条数，默认 20）
//   响应：{ products: [...] }
//
// 为了兼容初始化调用 searchProducts({ keyword: '' })，约定：
//   - keyword 为空：走 GET /products 返回全量产品列表
//   - keyword 有内容但长度 < 2：直接返回空数组（符合后端约束，避免无效请求）
//   - keyword 长度 >= 2：走 POST /products/search 真正搜索
export const searchProducts = createApi(
  async ({ keyword, limit = 20 } = {}) => {
    const kw = (keyword || '').trim()
    if (!kw) {
      return await loadProducts()
    }
    if (kw.length < 2) {
      return []
    }
    const data = await request.post('/products/search', { keyword: kw, limit })
    return (data.products || []).map(mapProduct)
  },
  (payload) => mockProduct.search(payload)
)
