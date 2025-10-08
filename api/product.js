import { BASE_URL } from './common'

export const getProductList = (searchName = '') => {
  return new Promise((resolve, reject) => {
    // 构建URL，如果有搜索名称则添加到查询参数中
    let url = `${BASE_URL}/api/product/list`
    if (searchName && searchName.trim()) {
      url += `?name=${encodeURIComponent(searchName.trim())}`
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
  })
}