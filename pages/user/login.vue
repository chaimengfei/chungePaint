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

			// 3. 获取地理位置
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

			// 4. 调用登录接口
			const loginData = {
			  code: code,
			  nickname: nickname,
			  avatar: avatar,
			  latitude: latitude,
			  longitude: longitude
			}

			const loginApiRes = await goLogin(loginData)
			const { token, user_info } = loginApiRes.data.data

			// 5. 存储登录信息
			uni.setStorageSync('token', token)
			uni.setStorageSync('userInfo', user_info)

			// 6. 设置全局请求头
			uni.$u.http.setConfig((config) => {
			  config.header.Authorization = `Bearer ${token}`
			  return config
			})

			uni.hideLoading()
			uni.showToast({ title: '登录成功' })

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
