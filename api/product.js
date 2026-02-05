import { BASE_URL } from './common'
import { get } from './request'

/**
 * 解析商品列表API响应数据
 * 后端统一返回格式: {code: 0, data: {categories: [], products: [], ...}}
 * @param {Object} res API响应对象
 * @param {boolean} isLoggedIn 前端是否认为已登录
 * @returns {Object} 解析后的数据对象
 */
function parseProductListResponse(res, isLoggedIn) {
  // 检查响应数据是否存在
  const hasData = res.data && typeof res.data === 'object'
  
  // 只针对 401 状态码进行特殊处理（引导重新登录）
  if (res.statusCode === 401) {
    // 清除本地存储
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    
    // 如果响应数据中有message，使用message作为错误信息
    const errorMessage = (hasData && res.data.message) ? res.data.message : '登录已过期，请重新登录'
    
    // 抛出特殊标记的错误，方便前端识别为401登录错误
    const error = new Error(errorMessage)
    error.is401LoginError = true // 标记为401登录错误
    throw error
  }
  
  // 其他非200状态码，正常处理错误信息
  if (res.statusCode !== 200) {
    // 如果响应数据中有message，优先使用message作为错误信息
    if (hasData && res.data.message) {
      throw new Error(res.data.message)
    }
    // 如果没有message，使用状态码错误
    throw new Error(`API请求失败，状态码: ${res.statusCode}`)
  }
  
  // 检查响应数据是否存在
  if (!hasData) {
    throw new Error('API返回数据格式错误')
  }
  
  // 后端返回格式: {code: 0, data: {...}} 或 {code: -1, message: "..."}
  // 如果 code !== 0，直接抛出错误，使用 message 作为错误信息
  if (res.data.code !== undefined && res.data.code !== 0) {
    const errorMessage = res.data.message || 'API返回错误'
    throw new Error(errorMessage)
  }
  
  // 成功响应，检查是否有 data 字段
  if (!res.data.data) {
    throw new Error('API返回数据为空')
  }
  
  const responseData = res.data.data
  
  // 返回数据: {categories: [], products: [], has_more, total, page, page_size, current_category}
  return responseData
}

/**
 * 获取商品列表
 * @param {Object} options 请求参数
 * @param {string} [options.searchName] 搜索关键词（可选）
 * @param {number} [options.categoryId] 分类ID（可选，100表示热销分类，其他值表示具体分类）
 * @param {number} [options.page=1] 页码（可选，默认1）
 * @param {number} [options.pageSize=20] 每页数量（可选，默认20）
 * @returns {Promise} 返回商品列表数据
 */
export const getProductList = (options = {}) => {
  return new Promise((resolve, reject) => {
    // 解析参数
    const searchName = options.searchName || ''
    const categoryId = options.categoryId !== undefined ? options.categoryId : null
    const page = options.page || 1
    const pageSize = options.pageSize || 20
    
    // 检查是否已登录
    const token = uni.getStorageSync('token')
    const isLoggedIn = !!token
    
    // 构建查询参数
    const params = {}
    if (searchName && searchName.trim()) {
      params.name = searchName.trim()
    }
    if (categoryId !== null) {
      params.category_id = categoryId
    }
    params.page = page
    params.page_size = pageSize
    
    // 统一使用get函数，后端根据Authorization自动判断（已登录用户）或使用默认逻辑（未登录用户）
    get('/api/product/list', params, isLoggedIn)
      .then(res => {
        try {
          const data = parseProductListResponse(res, isLoggedIn)
          resolve(data)
        } catch (err) {
          reject(err)
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}