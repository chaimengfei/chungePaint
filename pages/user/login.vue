<template>
  <view class="login-container">
    <!-- 非首次登录显示加载提示 -->
    <view v-if="isFirstLoginComplete" class="loading-container">
      <text class="loading-tip">正在登录...</text>
    </view>
    
    <!-- 首次登录：授权手机号 -->
    <view v-else class="auth-container">
      <!-- 授权手机号 -->
      <view class="auth-step">
        <text class="required-tip">首次登录需绑定手机号</text>
		<text class="required-tip"></text>
        <button 
          class="auth-btn" 
          type="primary" 
          open-type="getPhoneNumber"
          @getphonenumber="getPhoneAuth"
        >
          授权手机号登录
        </button>
      </view>
    </view>
  </view>
</template>

<script>
	import { goLogin } from '@/api/user.js'
	import { ENV_INFO } from '@/api/common.js'
	export default {
	  data() {
		return {
		  isFirstLoginComplete: false,
		  phoneAuth: null  // 存储手机号授权结果
		}
	  },
	  onLoad() {
		// 页面加载时检查是否已登录过
		const hasStoredUserInfo = uni.getStorageSync('hasStoredUserInfo')
		if (hasStoredUserInfo) {
		  // 非首次登录，直接自动登录，无需授权步骤
		  this.isFirstLoginComplete = true // 隐藏授权界面，显示加载提示
		  this.autoLogin()
		}
	  },
	  methods: {
		// ========== 首次登录授权流程 ==========
		
		// 获取手机号授权（微信原生授权）
		getPhoneAuth(e) {
		  const { encryptedData, iv, code: phoneCode } = e.detail || {}
		  if (!encryptedData || !iv) {
			uni.showToast({ 
			  title: '首次登录需要授权手机号', 
			  icon: 'none',
			  duration: 2000
			})
			return
		  }
		  
		  this.phoneAuth = {
			encryptedData,
			iv,
			phoneCode
		  }
		  
		  // 手机号授权完成，执行登录
		  this.completeLogin()
		},
		
		// 完成登录（手机号和用户信息都已获取）
		async completeLogin() {
		  if (!this.phoneAuth) {
			uni.showToast({ 
			  title: '请先授权手机号', 
			  icon: 'none'
			})
			return
		  }
		  
		  try {
			uni.showLoading({ title: '登录中...' })
			
			// 获取微信登录 code
			const loginRes = await new Promise((resolve, reject) => {
			  uni.login({
				success: resolve,
				fail: reject
			  })
			})

			const code = loginRes.code
			if (!code) throw new Error("无法获取微信登录 code")

			// 构建登录数据（nickname 和 avatar 在 api/user/update 接口中单独调用）
			const loginData = {
			  code: code,
			  encryptedData: this.phoneAuth.encryptedData,
			  iv: this.phoneAuth.iv
			}
			
			if (this.phoneAuth.phoneCode) {
			  loginData.phone_code = this.phoneAuth.phoneCode
			}

			// 调用登录接口
			const loginApiRes = await goLogin(loginData)
			
			// 从响应头获取 token（新机制：token 不再从 data 返回，只从响应头返回）
			const headers = loginApiRes.header || {}
			let token = null
			for (const key in headers) {
				if (key.toLowerCase() === 'x-token') {
					token = headers[key]
					break
				}
			}
			if (!token) {
				throw new Error('登录失败：未获取到token')
			}
			
			// 从响应数据获取用户信息
			const { user_id, nickname: backendNickname, avatar: backendAvatar } = loginApiRes.data.data

			// 使用后端返回的用户信息（nickname 和 avatar 在 api/user/update 接口中单独调用）
			const user_info = {
				id: user_id,
				nickname: backendNickname || '微信用户',  // 使用后端返回的，如果没有则使用默认值
				avatar: backendAvatar || '/static/images/default-avatar.png'    // 使用后端返回的，如果没有则使用默认值
			}

			// 存储登录信息
			uni.setStorageSync('token', token)
			uni.setStorageSync('userInfo', user_info)
			uni.setStorageSync('hasStoredUserInfo', true)
			// 存储当前环境标识
			uni.setStorageSync('env', ENV_INFO.env)

			uni.hideLoading()
			uni.showToast({ title: '注册成功', icon: 'success' })

			// 返回上一页
			setTimeout(() => {
			  uni.navigateBack()
			}, 500)
		  } catch (err) {
			uni.hideLoading()
			uni.showToast({ title: '登录失败，请重试', icon: 'none' })
		  }
		},
		
		// ========== 非首次登录（保持不变）==========
		
		// 非首次登录的自动登录（无需授权）
		async autoLogin() {
		  try {
			uni.showLoading({ title: '登录中...' })
			
			// 只获取 code，无需任何授权
			const loginRes = await new Promise((resolve, reject) => {
			  uni.login({
				success: resolve,
				fail: reject
			  })
			})

			const code = loginRes.code
			if (!code) throw new Error("无法获取微信登录 code")

			// 非首次登录只传递code（后端已经知道用户的店铺信息）
			const loginData = { 
			  code: code
			}

			const loginApiRes = await goLogin(loginData)
			
			// 从响应头获取 token（新机制：token 不再从 data 返回，只从响应头返回）
			const headers = loginApiRes.header || {}
			let token = null
			for (const key in headers) {
				if (key.toLowerCase() === 'x-token') {
					token = headers[key]
					break
				}
			}
			if (!token) {
				throw new Error('登录失败：未获取到token')
			}
			
			// 从响应数据获取用户信息
			const { user_id, nickname: backendNickname, avatar: backendAvatar } = loginApiRes.data.data

			// 使用后端返回的用户信息（nickname 和 avatar）
			const user_info = {
				id: user_id,
				nickname: backendNickname || '微信用户',  // 优先使用后端返回的
				avatar: backendAvatar || '/static/images/default-avatar.png'  // 优先使用后端返回的
			}

			// 存储登录信息
			uni.setStorageSync('token', token)
			uni.setStorageSync('userInfo', user_info)
			// 存储当前环境标识
			uni.setStorageSync('env', ENV_INFO.env)

			uni.hideLoading()
			uni.showToast({ title: '登录成功', icon: 'success' })

			// 返回上一页
			setTimeout(() => {
			  uni.navigateBack()
			}, 500)
		  } catch (err) {
			uni.hideLoading()
			// 如果自动登录失败，清除登录标记，让用户重新进行首次登录
			uni.removeStorageSync('hasStoredUserInfo')
			uni.removeStorageSync('token')
			uni.removeStorageSync('userInfo')
			this.isFirstLoginComplete = false // 显示授权界面，让用户重新登录
			uni.showToast({ title: '登录失败，请重新授权', icon: 'none' })
		  }
		}
	  }
	}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 40rpx;
  background-color: #f5f5f5;
}

/* 授权容器 */
.auth-container {
  width: 100%;
  max-width: 600rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.auth-step {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}


.step-desc {
  display: block;
  font-size: 28rpx;
  color: #666;
  text-align: center;
  margin-bottom: 60rpx;
  line-height: 1.6;
}

.auth-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 32rpx;
  border-radius: 44rpx;
}

.required-tip {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #ff6b6b;
  margin-top: 20rpx;
}

/* 加载提示样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.loading-tip {
  font-size: 28rpx;
  color: #666;
  margin-top: 20rpx;
}
</style>
