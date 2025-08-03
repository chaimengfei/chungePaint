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
			// 获取 code
			const res = await new Promise((resolve, reject) => {
			  uni.login({
				success: resolve,
				fail: reject
			  })
			})

			const code = res.code
			if (!code) throw new Error("无法获取微信登录 code")

			
			const loginRes = await goLogin({code:code})
			const { token, user_info } = loginRes.data.data

			// 存储 token
			uni.setStorageSync('token', token)
			uni.setStorageSync('userInfo', user_info)

			// 设置全局请求头中的 Authorization token，在 uni-app 中常用于登录后将 token 附加到所有请求上
			uni.$u.http.setConfig((config) => {
			  config.header.Authorization = `Bearer ${token}`
			  return config
			})

			uni.showToast({ title: '登录成功' })

			// 返回上一页或跳转
			setTimeout(() => {
			  uni.navigateBack()
			}, 500)
		  } catch (err) {
			uni.showToast({ title: '登录失败', icon: 'none' })
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
