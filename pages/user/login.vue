<template>
  <view class="login-container">
    <!-- 只有首次登录才显示授权步骤 -->
    <view v-if="!isFirstLoginComplete" class="step-container">
      <view v-if="!userProfile">
        <text class="step-tip">第一步：获取用户信息</text>
        <button 
          type="primary" 
          @tap="getUserProfile"
        >
          授权获取昵称和头像
        </button>
        <button 
          type="default" 
          class="skip-btn"
          @tap="skipUserProfile"
        >
          跳过，使用默认信息
        </button>
      </view>
      <view v-else>
        <text class="step-tip">第二步：授权手机号完成登录</text>
        <button 
          type="primary" 
          open-type="getPhoneNumber"
          @getphonenumber="(e) => loginHandler(e, userProfile)"
        >
          微信一键登录
        </button>
      </view>
    </view>
    <!-- 非首次登录显示加载提示 -->
    <view v-else class="loading-container">
      <text class="loading-tip">正在登录...</text>
    </view>
  </view>
</template>

<script>
	import { goLogin } from '@/api/user.js'
	export default {
	  data() {
		return {
		  userProfile: null,
		  isFirstLoginComplete: false
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
		},
		// 获取用户信息
		getUserProfile() {
		  uni.getUserProfile({
			desc: '用于完善用户资料',
			success: (res) => {
			  // 检查是否被降级（返回的是默认信息）
			  if (res.userInfo && res.userInfo.is_demote === true) {
				console.warn('微信返回的是降级后的默认信息，将使用默认头像和昵称')
				uni.showToast({
				  title: '获取失败，将使用默认信息',
				  icon: 'none',
				  duration: 2000
				})
				// 即使被降级也继续，但标记为使用默认值
				this.userProfile = { userInfo: {} }
			  } else {
				this.userProfile = res
				console.log('获取用户信息成功:', res.userInfo)
			  }
			},
			fail: (err) => {
			  console.warn('获取用户信息失败，将使用默认值:', err)
			  // 即使失败也继续，使用默认值（允许用户跳过这一步）
			  this.userProfile = { userInfo: {} }
			}
		  })
		},
		// 跳过用户信息获取，直接登录（使用默认值）
		skipUserProfile() {
		  this.userProfile = { userInfo: {} }
		},
		async loginHandler(e, userProfile = null) {
		  try {
			// 1. 处理用户信息（从参数传入，如果未传入则使用默认值）
			let nickname = '微信用户'
			let avatar = '/static/images/default-avatar.png'
			
			if (userProfile && userProfile.userInfo) {
			  // 检查是否被降级（is_demote为true时，返回的是默认信息，不使用）
			  const isDemote = userProfile.userInfo.is_demote === true
			  if (!isDemote) {
				nickname = userProfile.userInfo.nickName || nickname
				avatar = userProfile.userInfo.avatarUrl || avatar
				console.log('使用微信返回的真实用户信息')
			  } else {
				console.warn('微信返回的是降级后的默认信息，使用默认值')
			  }
			}

			uni.showLoading({ title: '登录中...' })

			// 2. 获取微信登录 code
			const loginRes = await new Promise((resolve, reject) => {
			  uni.login({
				success: resolve,
				fail: reject
			  })
			})

			const code = loginRes.code
			if (!code) throw new Error("无法获取微信登录 code")
			
			// 确保avatar是完整的URL格式
			console.log('获取到的微信头像URL:', avatar)
			
			// 验证和处理头像URL
			let finalAvatar = avatar
			if (!avatar || !avatar.startsWith('http')) {
			  // 如果头像URL无效，使用默认头像
			  finalAvatar = '/static/images/default-avatar.png'
			  console.warn('微信头像URL无效，使用默认头像:', finalAvatar)
			}

			// 3. 检查是否首次登录
			const hasStoredUserInfo = uni.getStorageSync('hasStoredUserInfo')
			let loginData = {
			  code: code
			}

			// 首次登录时传递完整信息：code + encryptedData + iv + nickname + avatar
			if (!hasStoredUserInfo) {
			  console.log('首次登录，获取手机号和地理位置信息...')
			  
			  // 处理手机号授权结果（需要 encryptedData 与 iv，用于后端解密手机号）
			  const { encryptedData, iv, code: phoneCode } = e.detail || {}
			  if (encryptedData && iv) {
				loginData.encryptedData = encryptedData
				loginData.iv = iv
				console.log('获取到手机号加密数据与iv')
			  } else {
				console.warn('用户未提供手机号加密数据，首次登录需要手机号授权')
				uni.hideLoading()
				uni.showToast({ title: '首次登录需要授权手机号', icon: 'none' })
				return
			  }

			  // 同时传递手机号授权 code，后端可用其刷新/校验 session_key
			  if (phoneCode) {
				loginData.phone_code = phoneCode
			  }

			  // 添加用户信息
			  loginData.nickname = nickname
			  loginData.avatar = finalAvatar

			  // 获取地理位置
			  const locationRes = await new Promise((resolve, reject) => {
				uni.getLocation({
				  type: 'gcj02',
				  success: resolve,
				  fail: (err) => {
					console.warn('获取地理位置失败:', err)
					// 如果获取地理位置失败，使用默认值
					resolve({
					  latitude: 39.9042,  // 北京默认纬度
					  longitude: 116.4074  // 北京默认经度
					})
				  }
				})
			  })

			  const { latitude, longitude } = locationRes
			  loginData.latitude = latitude
			  loginData.longitude = longitude
			  console.log('首次登录，传递完整信息(含encryptedData/iv与code):', loginData)
			} else {
			  console.log('非首次登录，只传递code')
			}

			const loginApiRes = await goLogin(loginData)
			const { token, user_info } = loginApiRes.data.data

			// 5. 存储登录信息
			uni.setStorageSync('token', token)
			uni.setStorageSync('userInfo', user_info)
			// 标记用户信息已存储（用于判断是否首次登录）
			uni.setStorageSync('hasStoredUserInfo', true)

            // 6. 无需设置全局请求头，请求层会自动从本地读取token并附加

			uni.hideLoading()
			// 根据是否首次登录显示不同的提示
			const wasFirstLogin = !hasStoredUserInfo
			const successMsg = wasFirstLogin ? '注册成功' : '登录成功'
			uni.showToast({ title: successMsg })

			// 返回上一页或跳转
			setTimeout(() => {
			  uni.navigateBack()
			}, 500)
		  } catch (err) {
			uni.hideLoading()
			console.error('登录失败:', err)
			
			let errorMsg = '登录失败'
			if (err.errMsg && err.errMsg.includes('getUserProfile:fail')) {
			  errorMsg = '需要授权获取用户信息'
			} else if (err.errMsg && err.errMsg.includes('getLocation:fail')) {
			  errorMsg = '需要授权获取地理位置'
			}
			
			uni.showToast({ title: errorMsg, icon: 'none' })
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
  height: 100vh;
  padding: 40rpx;
}

.step-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.step-tip {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 40rpx;
  text-align: center;
}

.skip-btn {
  margin-top: 20rpx;
  background-color: #f5f5f5;
  color: #666;
}

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
