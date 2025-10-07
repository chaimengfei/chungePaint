<template>
  <view class="login-container">
    <button type="primary" @click="login">微信一键登录</button>
  </view>
</template>

<script>
	import { goLogin } from '@/api/user.js'
	export default {
	  methods: {
		async login() {
		  try {
			uni.showLoading({ title: '登录中...' })
			
			// 1. 获取微信登录 code
			const loginRes = await new Promise((resolve, reject) => {
			  uni.login({
				success: resolve,
				fail: reject
			  })
			})

			const code = loginRes.code
			if (!code) throw new Error("无法获取微信登录 code")

			// 2. 获取用户信息（昵称和头像）
			const userInfoRes = await new Promise((resolve, reject) => {
			  uni.getUserProfile({
				desc: '用于完善用户资料',
				success: resolve,
				fail: reject
			  })
			})

			const { nickName: nickname, avatarUrl: avatar } = userInfoRes.userInfo
			
			// 确保avatar是完整的URL格式
			console.log('获取到的微信头像URL:', avatar)
			
			// 验证和处理头像URL
			let finalAvatar = avatar
			if (!avatar || !avatar.startsWith('http')) {
			  // 如果头像URL无效，使用默认头像
			  finalAvatar = '/static/images/default-avatar.png'
			  console.warn('微信头像URL无效，使用默认头像:', finalAvatar)
			}

			// 3. 检查是否首次登录（需要传递地理位置）
			const hasStoredUserInfo = uni.getStorageSync('hasStoredUserInfo')
			let loginData = {
			  code: code,
			  nickname: nickname,
			  avatar: finalAvatar
			}

			// 只在首次登录时获取和传递地理位置
			if (!hasStoredUserInfo) {
			  console.log('首次登录，获取地理位置信息...')
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
			  console.log('首次登录，传递地理位置:', { latitude, longitude })
			} else {
			  console.log('非首次登录，跳过地理位置获取')
			}

			const loginApiRes = await goLogin(loginData)
			const { token, user_info } = loginApiRes.data.data

			// 5. 存储登录信息
			uni.setStorageSync('token', token)
			uni.setStorageSync('userInfo', user_info)
			// 标记用户信息已存储（用于判断是否首次登录）
			uni.setStorageSync('hasStoredUserInfo', true)

			// 6. 设置全局请求头
			uni.$u.http.setConfig((config) => {
			  config.header.Authorization = `Bearer ${token}`
			  return config
			})

			uni.hideLoading()
			// 根据是否首次登录显示不同的提示
			const wasFirstLogin = !uni.getStorageSync('hasStoredUserInfo')
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
