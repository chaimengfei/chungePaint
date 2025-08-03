import { BASE_URL } from './common'

export const getCartList = () => {
  return new Promise((resolve, reject) => {
    uni.request({
		  url: `${BASE_URL}/api/cart/list`,
		  method: 'GET',
		  success: (res) => {
		   resolve(res)
		  },
		  fail: (err) => {
		   reject(err)
		  }
     })  
  })
}

export const addToCart = (data) => {
  return new Promise((resolve, reject) => {
    uni.request({
		url: `${BASE_URL}/api/cart/add`,
		method: 'POST',
		data,
		success: (res) => {
		 resolve(res)
		},
		fail: (err) => {
		 reject(err)
		}
	})
  })
  
}

export const updateCartItem = (data) => {
  return new Promise((resolve, reject) => {
     uni.request({
		  url: `${BASE_URL}/api/cart/update`,
		  method: 'POST',
		  data,
		  success: (res) => {
		   resolve(res)
		  },
		  fail: (err) => {
		   reject(err)
		  }
     })
  })
}

export const deleteCartItem = (id) => {
  return new Promise((resolve, reject) => {
    uni.request({
		 url: `${BASE_URL}/api/cart/delete/${id}`,
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
