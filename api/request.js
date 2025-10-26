import { BASE_URL } from './common'

/**
 * 通用请求函数
 * @param {Object} options 请求配置
 * @param {string} options.url 接口路径（不包含BASE_URL）
 * @param {string} options.method 请求方法，默认GET
 * @param {Object} options.data 请求数据
 * @param {boolean} options.needAuth 是否需要认证，默认true
 * @param {Object} options.header 额外的请求头
 * @returns {Promise} 返回Promise对象
 */
export const request = (options) => {
  return new Promise((resolve, reject) => {
    const { 
      url, 
      method = 'GET', 
      data, 
      needAuth = true,
      header = {}
    } = options
    
    // 构建完整URL
    const fullUrl = `${BASE_URL}${url}`
    
    // 构建请求头
    const requestHeader = {
      'Content-Type': 'application/json',
      ...header
    }
    
    // 只有需要认证的接口才添加 Authorization
    if (needAuth) {
      const token = uni.getStorageSync('token')
      if (token) {
        requestHeader.Authorization = `Bearer ${token}`
        console.log(`API请求 - ${method} ${url} - 已添加Authorization头`)
      } else {
        console.warn(`API请求 - ${method} ${url} - 需要认证但token为空`)
      }
    } else {
      console.log(`API请求 - ${method} ${url} - 无需认证`)
    }
    
    // 构建请求参数
    const requestOptions = {
      url: fullUrl,
      method,
      header: requestHeader
    }
    
    // 只有POST、PUT、PATCH等请求才添加data
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      requestOptions.data = data
    } else if (data && method.toUpperCase() === 'GET') {
      // GET请求将data作为查询参数
      const queryString = Object.keys(data)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
        .join('&')
      requestOptions.url += (queryString ? `?${queryString}` : '')
    }
    
    console.log(`API请求 - ${method} ${fullUrl}`, requestOptions)
    
    uni.request({
      ...requestOptions,
      success: (res) => {
        console.log(`API响应 - ${method} ${url}`, res)
        resolve(res)
      },
      fail: (err) => {
        console.error(`API错误 - ${method} ${url}`, err)
        reject(err)
      }
    })
  })
}

/**
 * GET请求快捷方法
 * @param {string} url 接口路径
 * @param {Object} params 查询参数
 * @param {boolean} needAuth 是否需要认证
 * @returns {Promise}
 */
export const get = (url, params = {}, needAuth = true) => {
  return request({
    url,
    method: 'GET',
    data: params,
    needAuth
  })
}

/**
 * POST请求快捷方法
 * @param {string} url 接口路径
 * @param {Object} data 请求数据
 * @param {boolean} needAuth 是否需要认证
 * @returns {Promise}
 */
export const post = (url, data = {}, needAuth = true) => {
  return request({
    url,
    method: 'POST',
    data,
    needAuth
  })
}

/**
 * PUT请求快捷方法
 * @param {string} url 接口路径
 * @param {Object} data 请求数据
 * @param {boolean} needAuth 是否需要认证
 * @returns {Promise}
 */
export const put = (url, data = {}, needAuth = true) => {
  return request({
    url,
    method: 'PUT',
    data,
    needAuth
  })
}

/**
 * DELETE请求快捷方法
 * @param {string} url 接口路径
 * @param {boolean} needAuth 是否需要认证
 * @returns {Promise}
 */
export const del = (url, needAuth = true) => {
  return request({
    url,
    method: 'DELETE',
    needAuth
  })
}
