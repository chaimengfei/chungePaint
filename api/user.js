import { post } from './request'

// 调用后端登录接口
export const goLogin = (data) => {
	return post('/api/login', data, false) // 登录接口不需要认证
}