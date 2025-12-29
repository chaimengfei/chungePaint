import { BASE_URL } from './common'
import { get } from './request'

/**
 * 获取商品列表
 * @param {string} searchName 搜索关键词（可选）
 * @param {number} shopId 店铺ID（可选，未登录用户需要传，已登录用户不需要）
 * @returns {Promise} 返回商品列表数据
 */
export const getProductList = (searchName = '', shopId = null) => {
  return new Promise((resolve, reject) => {
    // 检查是否已登录
    const token = uni.getStorageSync('token')
    const isLoggedIn = !!token
    
    // 构建查询参数
    const params = {}
    if (searchName && searchName.trim()) {
      params.name = searchName.trim()
    }
    
    // 未登录用户需要传shop_id，已登录用户不需要（后端根据Authorization判断）
    if (!isLoggedIn && shopId) {
      params.shop_id = shopId
    }
    
    // 已登录用户使用统一的get函数（会自动添加Authorization）
    // 未登录用户使用uni.request（不传Authorization，但传shop_id）
    if (isLoggedIn) {
      // 已登录：使用统一的get函数，自动添加Authorization
      get('/api/product/list', params, true)
        .then(res => {
          if (res.statusCode === 200 && res.data && typeof res.data === 'object') {
            resolve(res.data)
          } else {
            reject(new Error('API返回数据格式错误'))
          }
        })
        .catch(err => {
          console.error('API请求失败:', err)
          reject(err)
        })
    } else {
      // 未登录：使用uni.request，不传Authorization，但传shop_id
      let url = `${BASE_URL}/api/product/list`
      const queryParams = []
      
      if (params.name) {
        queryParams.push(`name=${encodeURIComponent(params.name)}`)
      }
      if (params.shop_id) {
        queryParams.push(`shop_id=${params.shop_id}`)
      }
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`
      }
      
      uni.request({
        url: url,
        method: 'GET',
        success: (res) => {
          // 后端返回的数据结构: {categories: [], products: {}}
          if (res.data && typeof res.data === 'object') {
            resolve(res.data)
          } else {
            reject(new Error('API返回数据格式错误'))
          }
        },
        fail: (err) => {
          console.error('API请求失败:', err)
          reject(err)
        }
      })
    }
  })
}