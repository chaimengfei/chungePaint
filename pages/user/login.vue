<template>
  <view class="login-container">
    <button 
      type="primary" 
      open-type="getPhoneNumber"
      @getphonenumber="loginHandler"
    >
      微信一键登录
    </button>
  </view>
</template>

<script>
	import { goLogin } from '@/api/user.js'
	export default {
	  methods: {
		async loginHandler(e) {
		  try {
			uni.showLoading({ title: '登录中...' })

			// 1. 直接获取微信登录 code（昵称/头像使用默认值，避免 getUserProfile 的手势限制）
			const loginRes = await new Promise((resolve, reject) => {
			  uni.login({
				success: resolve,
				fail: reject
			  })
			})

			const code = loginRes.code
			if (!code) throw new Error("无法获取微信登录 code")

			// 使用默认昵称与头像
			const nickname = '微信用户'
			const avatar = '/static/images/default-avatar.png'
			
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
}
</style>
