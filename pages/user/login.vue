<template>
  <view class="login-container">
    <!-- 非首次登录显示加载提示 -->
    <view v-if="isFirstLoginComplete" class="loading-container">
      <text class="loading-tip">正在登录...</text>
    </view>
    
    <!-- 首次登录：分步授权 -->
    <view v-else class="auth-container">
      <!-- 第一步：授权微信信息 -->
      <view v-if="authStep === 'userInfo'" class="auth-step">
        <text class="step-title">授权微信信息</text>
        <button 
          class="auth-btn" 
          type="primary"
          open-type="getUserInfo"
          @getuserinfo="getUserInfoAuth"
        >
          授权微信头像和昵称
        </button>
      </view>
      
      <!-- 第二步：授权手机号 -->
      <view v-else-if="authStep === 'phone'" class="auth-step">
        <text class="step-title">授权手机号</text>
        <text class="step-desc">用于接收订单通知和售后服务</text>
        <button 
          class="auth-btn" 
          type="primary" 
          open-type="getPhoneNumber"
          @getphonenumber="getPhoneAuth"
        >
          授权手机号登录
        </button>
        <text class="required-tip">首次登录需要绑定手机号</text>
      </view>
    </view>
  </view>
</template>

<script>
	import { goLogin } from '@/api/user.js'
	export default {
	  data() {
		return {
		  isFirstLoginComplete: false,
		  authStep: 'userInfo',  // 'userInfo' | 'phone'
		  userInfo: null,  // 存储用户信息授权结果
		  phoneAuth: null  // 存储手机号授权结果
		}
	  },
	  onLoad() {
		// 页面加载时检查是否已登录过
		const hasStoredUserInfo = uni.getStorageSync('hasStoredUserInfo')
		if (hasStoredUserInfo) {
		  // 非首次登录，直接自动登录，无需授权步骤
		  console.log('检测到非首次登录，自动登录中...')
		  this.isFirstLoginComplete = true // 隐藏授权界面，显示加载提示
		  this.autoLogin()
		}
	  },
	  methods: {
		// ========== 首次登录授权流程 ==========
		
		// 获取用户信息授权（微信头像和昵称）
		getUserInfoAuth(e) {
		  const { userInfo } = e.detail || {}
		  if (userInfo) {
			this.userInfo = userInfo
			console.log('获取用户信息成功:', userInfo)
		  } else {
			console.warn('用户未授权用户信息，使用默认值')
			// 即使未授权也继续，使用默认值
			this.userInfo = null
		  }
		  // 进入下一步：授权手机号
		  this.authStep = 'phone'
		},
		
		// 获取手机号授权（微信原生授权）
		getPhoneAuth(e) {
		  const { encryptedData, iv, code: phoneCode } = e.detail || {}
		  if (!encryptedData || !iv) {
			console.warn('用户未提供手机号加密数据')
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
		  console.log('获取手机号授权成功')
		  
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

			// 使用之前存储的位置信息，如果没有则使用默认值
			let latitude = 39.9042
			let longitude = 116.4074
			const storedLocation = uni.getStorageSync('location')
			if (storedLocation) {
			  latitude = storedLocation.latitude
			  longitude = storedLocation.longitude
			}

			// 处理用户信息
			let nickname = '微信用户'
			let avatar = '/static/images/default-avatar.png'
			
			if (this.userInfo) {
			  nickname = this.userInfo.nickName || nickname
			  avatar = this.userInfo.avatarUrl || avatar
			}
			
			// 验证和处理头像URL
			let finalAvatar = avatar
			if (!avatar || !avatar.startsWith('http')) {
			  finalAvatar = '/static/images/default-avatar.png'
			}

			// 构建登录数据
			const loginData = {
			  code: code,
			  encryptedData: this.phoneAuth.encryptedData,
			  iv: this.phoneAuth.iv,
			  nickname: nickname,
			  avatar: finalAvatar,
			  latitude: latitude,
			  longitude: longitude
			}
			
			if (this.phoneAuth.phoneCode) {
			  loginData.phone_code = this.phoneAuth.phoneCode
			}

			console.log('首次登录，传递完整信息:', loginData)

			// 调用登录接口
			const loginApiRes = await goLogin(loginData)
			const { token, user_id, nickname: backendNickname, avatar: backendAvatar } = loginApiRes.data.data

			// 使用后端返回的用户信息（nickname 和 avatar）
			const user_info = {
				id: user_id,
				nickname: backendNickname || nickname,  // 优先使用后端返回的，如果没有则使用前端传递的
				avatar: backendAvatar || finalAvatar    // 优先使用后端返回的，如果没有则使用前端传递的
			}

			// 存储登录信息
			uni.setStorageSync('token', token)
			uni.setStorageSync('userInfo', user_info)
			uni.setStorageSync('hasStoredUserInfo', true)

			uni.hideLoading()
			uni.showToast({ title: '注册成功', icon: 'success' })

			// 返回上一页
			setTimeout(() => {
			  uni.navigateBack()
			}, 500)
		  } catch (err) {
			uni.hideLoading()
			console.error('登录失败:', err)
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

			// 获取地理位置（从存储中获取或使用默认值）
			let latitude = 39.9042
			let longitude = 116.4074
			const storedLocation = uni.getStorageSync('location')
			if (storedLocation) {
			  latitude = storedLocation.latitude
			  longitude = storedLocation.longitude
			}

			// 非首次登录传递code和位置信息
			const loginData = { 
			  code: code,
			  latitude: latitude,
			  longitude: longitude
			}
			console.log('非首次登录，传递code和位置信息')

			const loginApiRes = await goLogin(loginData)
			const { token, user_id, nickname: backendNickname, avatar: backendAvatar } = loginApiRes.data.data

			// 使用后端返回的用户信息（nickname 和 avatar）
			const user_info = {
				id: user_id,
				nickname: backendNickname || '微信用户',  // 优先使用后端返回的
				avatar: backendAvatar || '/static/images/default-avatar.png'  // 优先使用后端返回的
			}

			// 存储登录信息
			uni.setStorageSync('token', token)
			uni.setStorageSync('userInfo', user_info)

			uni.hideLoading()
			uni.showToast({ title: '登录成功', icon: 'success' })

			// 返回上一页
			setTimeout(() => {
			  uni.navigateBack()
			}, 500)
		  } catch (err) {
			uni.hideLoading()
			console.error('自动登录失败:', err)
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

.step-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  text-align: center;
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
