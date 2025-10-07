// 环境配置
const ENV_CONFIG = {
  // 开发环境 - 本地开发
  dev: {
    BASE_URL: 'http://192.168.1.3:8009',
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
const CURRENT_ENV = 'test' // 修改这里来切换环境

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
