// 环境配置
const ENV_CONFIG = {
  // 开发环境 - 本地开发
  dev: {
    // BASE_URL: 'http://127.0.0.1:8009',
	BASE_URL: 'https://paint.maocai.shop',
    name: '开发环境'
  },
  // 测试环境 - 微信云托管
  test: {
    BASE_URL: 'https://paint-mini-test-223759-8-1401997820.sh.run.tcloudbase.com',
    name: '测试环境'
  },
  // 生产环境 - 正式环境
  prod: {
    BASE_URL: 'https://your-prod-domain.com', // 请替换为您的生产环境域名
    name: '生产环境'
  }
}

// 当前环境设置 (dev/test/prod)
const CURRENT_ENV = 'dev' // 修改这里来切换环境

// 获取当前环境配置
const currentConfig = ENV_CONFIG[CURRENT_ENV]

// 导出BASE_URL
export const BASE_URL = currentConfig.BASE_URL

// 导出环境信息（用于调试）
export const ENV_INFO = {
  env: CURRENT_ENV,
  name: currentConfig.name,
  baseUrl: currentConfig.BASE_URL
}

// 环境切换说明
export const ENV_SWITCH_GUIDE = `
环境切换说明：
1. 修改 CURRENT_ENV 变量来切换环境
2. 可选值: 'dev' | 'test' | 'prod'
3. 当前环境: ${CURRENT_ENV} (${currentConfig.name})
4. 当前BASE_URL: ${currentConfig.BASE_URL}
`

// 店铺信息（硬编码）
export const SHOPS = [
  {
    id: 1,
    name: '燕郊店',
    latitude: 39.9042,
    longitude: 116.4074
  },
  {
    id: 2,
    name: '涞水店',
    latitude: 39.3908,
    longitude: 115.7119
  }
]

/**
 * 计算两点之间的距离（单位：公里）
 * 使用 Haversine 公式
 * @param {number} lat1 点1纬度
 * @param {number} lon1 点1经度
 * @param {number} lat2 点2纬度
 * @param {number} lon2 点2经度
 * @returns {number} 距离（公里）
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 根据经纬度确定最近的服务网点
 * @param {number} latitude 用户纬度
 * @param {number} longitude 用户经度
 * @returns {number} 服务网点ID
 */
export function getNearestShop(latitude, longitude) {
  if (!latitude || !longitude) {
    // 如果位置信息无效，返回第一个服务网点（默认服务网点）
    console.warn('位置信息无效，使用默认服务网点')
    return SHOPS[0].id
  }
  
  let minDistance = Infinity
  let nearestServicePointId = SHOPS[0].id // 默认返回第一个服务网点
  
  for (const shop of SHOPS) {
    const distance = calculateDistance(
      latitude, 
      longitude, 
      shop.latitude, 
      shop.longitude
    )
    if (distance < minDistance) {
      minDistance = distance
      nearestServicePointId = shop.id
    }
  }
  
  console.log(`用户位置: (${latitude}, ${longitude}), 最近服务网点ID: ${nearestServicePointId}, 距离: ${minDistance.toFixed(2)}km`)
  return nearestServicePointId
}

/**
 * 服务网点ID缓存有效期（7天）
 */
const SERVICE_POINT_ID_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000 // 7天（毫秒）

/**
 * 检查服务网点ID缓存是否过期
 * @returns {boolean} true表示过期或不存在，false表示有效
 */
export function isServicePointIdExpired() {
  const servicePointIdCache = uni.getStorageSync('servicePointIdCache')
  if (!servicePointIdCache || !servicePointIdCache.timestamp) {
    // 没有服务网点ID缓存或没有时间戳，需要重新获取
    return true
  }
  
  const now = Date.now()
  const elapsed = now - servicePointIdCache.timestamp
  
  if (elapsed > SERVICE_POINT_ID_EXPIRE_TIME) {
    // 服务网点ID缓存已过期
    console.log(`服务网点ID缓存已过期，已过去 ${Math.floor(elapsed / (24 * 60 * 60 * 1000))} 天`)
    return true
  }
  
  // 服务网点ID缓存仍然有效
  const remainingDays = Math.floor((SERVICE_POINT_ID_EXPIRE_TIME - elapsed) / (24 * 60 * 60 * 1000))
  console.log(`服务网点ID缓存有效，剩余 ${remainingDays} 天`)
  return false
}

/**
 * 联系客服 - 统一方法
 * 显示客服电话弹窗，支持复制电话号码和直接拨打
 * @param {string} [phoneNumber='131-6162-1688'] 客服电话号码，默认为 '131-6162-1688'
 */
export function showContactService(phoneNumber = '131-6162-1688') {
  const phoneNumberWithoutDash = phoneNumber.replace(/-/g, '')
  
  // 使用 showActionSheet 显示操作选项，电话号码作为第一个选项（仅显示）
  uni.showActionSheet({
    itemList: [phoneNumber, '呼叫手机号', '复制微信号'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 点击电话号码，只关闭弹窗，不执行任何操作（仅用于显示）
        return
      } else if (res.tapIndex === 1) {
        // 点击呼叫手机号，直接拨打电话
        uni.makePhoneCall({
          phoneNumber: phoneNumberWithoutDash,
          success: () => {
            console.log('拨打电话成功')
          },
          fail: (err) => {
            console.error('拨打电话失败:', err)
            uni.showToast({
              title: '拨打电话失败',
              icon: 'none'
            })
          }
        })
      } else if (res.tapIndex === 2) {
        // 点击复制微信号，复制电话号码到剪贴板
        uni.setClipboardData({
          data: phoneNumberWithoutDash,
          success: () => {
            uni.showToast({
              title: '微信号已复制',
              icon: 'success'
            })
          },
          fail: () => {
            uni.showToast({
              title: '复制失败',
              icon: 'none'
            })
          }
        })
      }
    },
    fail: (err) => {
      console.error('显示操作菜单失败:', err)
    }
  })
}
