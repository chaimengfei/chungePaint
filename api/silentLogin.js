/**
 * 静默登录：仅用 wx.login 的 code 调后端复登接口，恢复 token（免手机号授权）。
 * 用于：App 启动无 token、401 时尝试恢复、进入购物车等需登录页面前先尝试恢复。
 */
import { BASE_URL } from './common'

export function trySilentLogin() {
  return new Promise((resolve) => {
    uni.login({
      provider: 'weixin',
      success: (loginRes) => {
        if (!loginRes.code) {
          resolve(false)
          return
        }
        uni.request({
          url: `${BASE_URL}/api/login`,
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { code: loginRes.code },
          success: (res) => {
            if (res.statusCode === 200 && res.header) {
              let token = null
              const headers = res.header
              for (const key in headers) {
                if (key.toLowerCase() === 'x-token') {
                  token = headers[key]
                  break
                }
              }
              if (token && res.data && res.data.code === 0 && res.data.data) {
                const d = res.data.data
                uni.setStorageSync('token', token)
                uni.setStorageSync('userInfo', {
                  id: d.user_id,
                  nickname: d.nickname || '微信用户',
                  avatar: d.avatar || '/static/images/default-avatar.png'
                })
                uni.setStorageSync('hasStoredUserInfo', true)
                resolve(true)
                return
              }
            }
            resolve(false)
          },
          fail: () => resolve(false)
        })
      },
      fail: () => resolve(false)
    })
  })
}

