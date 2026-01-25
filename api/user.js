import { post, get } from './request'

// 调用后端登录接口
export const goLogin = (data) => {
	return post('/api/login', data, false) // 登录接口不需要认证
}

/**
 * 更新用户信息
 * @param {Object} data 用户信息
 * @param {string} [data.nickname] 昵称
 * @param {string} [data.avatar] 头像URL
 */
export const updateUserInfo = (data) => {
	return post('/api/user/update', data)
}
