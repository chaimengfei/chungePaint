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
    BASE_URL: 'https://paint-mini.maocai.shop', 
    name: '生产环境'
  }
}

// 当前环境设置 (dev/test/prod)
const CURRENT_ENV = 'prod' // 修改这里来切换环境

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
          fail: (err) => {
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
    }
  })
}
