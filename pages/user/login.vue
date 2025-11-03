<template>
  <view class="login-container">
    <!-- 非首次登录显示加载提示 -->
    <view v-if="isFirstLoginComplete" class="loading-container">
      <text class="loading-tip">正在登录...</text>
    </view>
    
    <!-- 首次登录流程：引导页 -->
    <view v-else-if="authStep === 'guide'" class="guide-container">
      <view class="guide-header">
        <text class="guide-title">欢迎来到贸彩漆业！</text>
        <text class="guide-subtitle">为了给您提供更好的服务，我们需要：</text>
      </view>
      
      <view class="permission-list">
        <view class="permission-item">
          <text class="permission-icon">📍</text>
          <view class="permission-content">
            <text class="permission-title">获取您的位置</text>
            <text class="permission-desc">自动匹配最近门店，计算准确运费</text>
          </view>
        </view>
        
        <view class="permission-item">
          <text class="permission-icon">📱</text>
          <view class="permission-content">
            <text class="permission-title">绑定手机号</text>
            <text class="permission-desc">订单通知、售后联系</text>
          </view>
        </view>
        
        <view class="permission-item">
          <text class="permission-icon">👤</text>
          <view class="permission-content">
            <text class="permission-title">使用微信头像昵称</text>
            <text class="permission-desc">个性化购物体验</text>
          </view>
        </view>
      </view>
      
      <view class="privacy-notice">
        <text class="privacy-text">请放心，我们严格保护您的隐私信息</text>
      </view>
      
      <button class="guide-btn" type="primary" @tap="startAuthFlow">
        立即开始
      </button>
    </view>
    
    <!-- 首次登录流程：分步授权 -->
    <view v-else class="step-container">
      <!-- 进度指示 -->
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
      <text class="progress-text">{{ currentStep }}/{{ totalSteps }}</text>
      
      <!-- 第一步：用户信息 -->
      <view v-if="authStep === 'userInfo'" class="auth-step">
        <text class="step-title">使用微信头像和昵称</text>
        <text class="step-desc">这将让我们为您个性化推荐商品</text>
        <button class="auth-btn" type="primary" @tap="getUserInfoAuth">
          授权
        </button>
        <button class="skip-auth-btn" @tap="skipUserInfoAuth">
          跳过，使用默认信息
        </button>
      </view>
      
      <!-- 第二步：位置信息 -->
      <view v-else-if="authStep === 'location'" class="auth-step">
        <text class="step-title">获取您的位置</text>
        <text class="step-desc">根据您的位置匹配最近门店，计算准确运费</text>
        <button class="auth-btn" type="primary" @tap="getLocationAuth">
          授权
        </button>
        <button class="skip-auth-btn" @tap="skipLocationAuth">
          跳过，使用默认位置
        </button>
      </view>
      
      <!-- 第三步：手机号 -->
      <view v-else-if="authStep === 'phone'" class="auth-step">
        <text class="step-title">绑定手机号</text>
        <text class="step-desc">用于接收订单通知和售后服务</text>
        <button 
          class="auth-btn" 
          type="primary" 
          open-type="getPhoneNumber"
          @getphonenumber="getPhoneAuth"
        >
          授权手机号
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
		  userProfile: null,
		  isFirstLoginComplete: false,
		  // 首次登录授权流程状态
		  authStep: 'guide', // 'guide' | 'userInfo' | 'location' | 'phone'
		  currentStep: 0,
		  totalSteps: 3,
		  // 授权结果存储
		  authResult: {
			userInfo: null,
			location: null,
			phone: null
		  }
		}
	  },
	  computed: {
		progressPercent() {
		  return (this.currentStep / this.totalSteps) * 100
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
		} else {
		  // 首次登录，显示引导页
		  this.authStep = 'guide'
		}
	  },
	  methods: {
		// ========== 首次登录授权流程 ==========
		
		// 开始授权流程
		startAuthFlow() {
		  this.authStep = 'userInfo'
		  this.currentStep = 1
		},
		
		// 第一步：获取用户信息授权
		getUserInfoAuth() {
		  uni.getUserProfile({
			desc: '用于完善用户资料',
			success: (res) => {
			  // 检查是否被降级
			  if (res.userInfo && res.userInfo.is_demote === true) {
				console.warn('微信返回的是降级后的默认信息')
				this.authResult.userInfo = { userInfo: {} }
			  } else {
				this.authResult.userInfo = res
				console.log('获取用户信息成功:', res.userInfo)
			  }
			  // 进入下一步
			  this.nextAuthStep()
			},
			fail: (err) => {
			  console.warn('获取用户信息失败:', err)
			  // 即使失败也继续，使用默认值
			  this.authResult.userInfo = { userInfo: {} }
			  this.nextAuthStep()
			}
		  })
		},
		
		// 跳过用户信息授权
		skipUserInfoAuth() {
		  this.authResult.userInfo = { userInfo: {} }
		  this.nextAuthStep()
		},
		
		// 第二步：获取位置授权
		async getLocationAuth() {
		  try {
			const locationRes = await new Promise((resolve, reject) => {
			  uni.getLocation({
				type: 'gcj02',
				success: resolve,
				fail: reject
			  })
			})
			this.authResult.location = locationRes
			console.log('获取位置信息成功:', locationRes)
			this.nextAuthStep()
		  } catch (err) {
			console.warn('获取地理位置失败:', err)
			// 使用默认位置，继续下一步
			this.authResult.location = {
			  latitude: 39.9042,
			  longitude: 116.4074
			}
			this.nextAuthStep()
		  }
		},
		
		// 跳过位置授权
		skipLocationAuth() {
		  this.authResult.location = {
			latitude: 39.9042,
			longitude: 116.4074
		  }
		  this.nextAuthStep()
		},
		
		// 第三步：获取手机号授权
		getPhoneAuth(e) {
		  const { encryptedData, iv, code: phoneCode } = e.detail || {}
		  if (encryptedData && iv) {
			this.authResult.phone = {
			  encryptedData,
			  iv,
			  phoneCode
			}
			console.log('获取到手机号加密数据与iv')
			// 所有授权完成，执行登录
			this.completeAuthAndLogin()
		  } else {
			console.warn('用户未提供手机号加密数据')
			uni.showToast({ 
			  title: '首次登录需要授权手机号', 
			  icon: 'none',
			  duration: 2000
			})
		  }
		},
		
		// 进入下一步授权
		nextAuthStep() {
		  this.currentStep++
		  if (this.authStep === 'userInfo') {
			this.authStep = 'location'
		  } else if (this.authStep === 'location') {
			this.authStep = 'phone'
		  }
		},
		
		// 完成所有授权，执行登录
		async completeAuthAndLogin() {
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

			// 处理用户信息
			let nickname = '微信用户'
			let avatar = '/static/images/default-avatar.png'
			
			if (this.authResult.userInfo && this.authResult.userInfo.userInfo) {
			  const userInfo = this.authResult.userInfo.userInfo
			  const isDemote = userInfo.is_demote === true
			  if (!isDemote) {
				nickname = userInfo.nickName || nickname
				avatar = userInfo.avatarUrl || avatar
			  }
			}
			
			// 验证和处理头像URL
			let finalAvatar = avatar
			if (!avatar || !avatar.startsWith('http')) {
			  finalAvatar = '/static/images/default-avatar.png'
			}

			// 构建登录数据
			const loginData = {
			  code: code,
			  encryptedData: this.authResult.phone.encryptedData,
			  iv: this.authResult.phone.iv,
			  nickname: nickname,
			  avatar: finalAvatar,
			  latitude: this.authResult.location.latitude,
			  longitude: this.authResult.location.longitude
			}
			
			if (this.authResult.phone.phoneCode) {
			  loginData.phone_code = this.authResult.phone.phoneCode
			}

			console.log('首次登录，传递完整信息:', loginData)

			// 调用登录接口
			const loginApiRes = await goLogin(loginData)
			const { token, user_info } = loginApiRes.data.data

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

			// 非首次登录只传 code
			const loginData = { code: code }
			console.log('非首次登录，只传递code')

			const loginApiRes = await goLogin(loginData)
			const { token, user_info } = loginApiRes.data.data

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
			uni.showToast({ title: '登录失败，请重试', icon: 'none' })
			// 如果自动登录失败，可能是token过期或网络问题，允许用户手动重新授权
			this.isFirstLoginComplete = false // 显示授权界面，让用户手动登录
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

/* 引导页样式 */
.guide-container {
  width: 100%;
  max-width: 600rpx;
}

.guide-header {
  text-align: center;
  margin-bottom: 60rpx;
}

.guide-title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.guide-subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.permission-list {
  margin-bottom: 40rpx;
}

.permission-item {
  display: flex;
  align-items: flex-start;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.permission-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
  line-height: 1;
}

.permission-content {
  flex: 1;
}

.permission-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.permission-desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

.privacy-notice {
  text-align: center;
  margin-bottom: 40rpx;
}

.privacy-text {
  font-size: 24rpx;
  color: #999;
}

.guide-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 32rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #4169E1 0%, #6495ED 100%);
}

/* 分步授权样式 */
.step-container {
  width: 100%;
  max-width: 600rpx;
}

.progress-bar {
  width: 100%;
  height: 8rpx;
  background-color: #e0e0e0;
  border-radius: 4rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4169E1 0%, #6495ED 100%);
  transition: width 0.3s ease;
  border-radius: 4rpx;
}

.progress-text {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 60rpx;
}

.auth-step {
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
  background: linear-gradient(135deg, #4169E1 0%, #6495ED 100%);
  margin-bottom: 20rpx;
}

.skip-auth-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  background-color: #f5f5f5;
  color: #666;
  border-radius: 40rpx;
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
