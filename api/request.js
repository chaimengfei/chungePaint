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
      }
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
    
    const requestStartTime = Date.now()
    uni.request({
      ...requestOptions,
      success: (res) => {
        // 检查响应头中是否有新的 token（自动刷新机制）
        // 注意：uni.request 的响应头在 res.header 中，需要兼容不同的大小写
        const headers = res.header || {}
        // 查找 X-Token 响应头（兼容不同的大小写）
        let newToken = null
        for (const key in headers) {
          if (key.toLowerCase() === 'x-token') {
            newToken = headers[key]
            break
          }
        }
        
        if (newToken) {
          uni.setStorageSync('token', newToken)
        }
        
        // 统一处理需要重新登录的情况（直接内联逻辑，避免函数引用问题）
        let needReLogin = false
        // 检查 401 状态码
        if (res.statusCode === 401) {
          needReLogin = true
        } else if (res.data && typeof res.data === 'object') {
          const message = res.data.message || ''
          const code = res.data.code
          
          // 检查错误码（-1 通常表示需要登录）
          if (code === -1) {
            needReLogin = true
          } else {
            // 检查错误信息中是否包含重新登录的关键词
            const reLoginKeywords = ['请重新登录', '重新登录', '登录已过期', 'token', '未登录', '需要登录']
            const lowerMessage = message.toLowerCase()
            for (const keyword of reLoginKeywords) {
              if (lowerMessage.includes(keyword.toLowerCase())) {
                needReLogin = true
                break
              }
            }
          }
        }
        
        if (needReLogin) {
          // 先检查是否之前登录过（在清除之前检查）
          const hasStoredUserInfo = uni.getStorageSync('hasStoredUserInfo')
          
          // 清除无效的 token 和用户信息
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.removeStorageSync('hasStoredUserInfo')
          uni.removeStorageSync('env')
          
          // 提示用户重新登录（直接内联逻辑，避免函数引用问题）
          const title = hasStoredUserInfo ? '登录已过期' : '需要登录'
          const content = res.data?.message && res.data.message !== '请重新登录' 
            ? res.data.message 
            : (hasStoredUserInfo ? '您的登录已过期，是否重新登录？' : '您还未登录，是否注册登录？')
          
          uni.showModal({
            title: title,
            content: content,
            confirmText: '去登录',
            cancelText: '稍后',
            showCancel: true,
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 用户确认，跳转到登录页
                uni.navigateTo({
                  url: '/pages/user/login'
                })
              } else {
                // 用户取消，显示提示
                uni.showToast({
                  title: '部分功能需要登录后使用',
                  icon: 'none',
                  duration: 2000
                })
              }
            }
          })
        }
        resolve(res)
      },
      fail: (err) => {
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
