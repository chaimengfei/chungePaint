import { BASE_URL } from './common'

// 调用后端登录接口
export const goLogin = (data) => {
	return uni.request({
		url: `${BASE_URL}/api/user/login`,
		method: 'POST',
		data
	})
}