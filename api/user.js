import { post, get } from './request'
import { BASE_URL } from './common'

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

/**
 * 上传头像
 * @param {string} filePath 本地文件路径（从 uni.chooseImage 获取的 tempFilePaths[0]）
 * @returns {Promise} 返回上传后的头像URL
 */
export const uploadAvatar = (filePath) => {
	return new Promise((resolve, reject) => {
		// 获取token
		const token = uni.getStorageSync('token')
		if (!token) {
			reject(new Error('未登录，请先登录'))
			return
		}

		// 构建完整URL
		const uploadUrl = `${BASE_URL}/api/user/upload-avatar`

		// 上传文件
		uni.uploadFile({
			url: uploadUrl,
			filePath: filePath,
			name: 'file',
			header: {
				'Authorization': `Bearer ${token}`
			},
			success: (res) => {
				try {
					// 解析响应数据
					const data = JSON.parse(res.data)
					if (data.code === 0) {
						// 返回头像URL
						resolve(data.data)
					} else {
						reject(new Error(data.message || '上传失败'))
					}
				} catch (err) {
					reject(new Error('解析响应失败'))
				}
			},
			fail: (err) => {
				reject(new Error(err.errMsg || '上传失败'))
			}
		})
	})
}
