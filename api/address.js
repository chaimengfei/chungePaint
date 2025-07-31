import { BASE_URL } from './common'

export const getAddressList = () => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/address/list`,
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

export const deleteAddress = (id) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/addresses/delete/${id}`,
      method: 'DELETE',
	  success: (res) => {
	    resolve(res)
	  },
	  fail: (err) => {
	    reject(err)
	  }
    })
  })
}


// 创建地址
export const createAddress = (data) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/address/create`,
      method: 'POST',
	  data: { data }, 
	  header: {
	     'Content-Type': 'application/json'
	  },
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}


// 更新地址
export const updateAddress = (data) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/address/update`,
      method: 'POST',
      data: { data },
      header: {
         'Content-Type': 'application/json'
      },
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}
