import { BASE_URL } from './common'

export const getProductList = () => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/product/list`,
      method: 'GET',
      success: (res) => {
        resolve(res.data)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}