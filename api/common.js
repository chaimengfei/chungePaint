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
    BASE_URL: 'https://paint-proj-test-191125-4-1363297976.sh.run.tcloudbase.com',
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
 * 根据经纬度确定最近的店铺
 * @param {number} latitude 用户纬度
 * @param {number} longitude 用户经度
 * @returns {number} 店铺ID
 */
export function getNearestShop(latitude, longitude) {
  if (!latitude || !longitude) {
    // 如果位置信息无效，返回第一个店铺（默认店铺）
    console.warn('位置信息无效，使用默认店铺')
    return SHOPS[0].id
  }
  
  let minDistance = Infinity
  let nearestShopId = SHOPS[0].id // 默认返回第一个店铺
  
  for (const shop of SHOPS) {
    const distance = calculateDistance(
      latitude, 
      longitude, 
      shop.latitude, 
      shop.longitude
    )
    if (distance < minDistance) {
      minDistance = distance
      nearestShopId = shop.id
    }
  }
  
  console.log(`用户位置: (${latitude}, ${longitude}), 最近店铺ID: ${nearestShopId}, 距离: ${minDistance.toFixed(2)}km`)
  return nearestShopId
}
