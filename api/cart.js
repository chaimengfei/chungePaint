import { BASE_URL } from './common'

export const getCartList = () => {
  return uni.request({
    url: `${BASE_URL}/api/cart/list`,
    method: 'GET'
  })
}

export const addToCart = (data) => {
  return uni.request({
    url: `${BASE_URL}/api/cart/add`,
    method: 'POST',
    data
  })
}

export const updateCartItem = (data) => {
  return uni.request({
    url: `${BASE_URL}/api/cart/update`,
    method: 'POST',
    data
  })
}

export const deleteCartItem = (data) => {
  return uni.request({
    url: `${BASE_URL}/api/cart/delete`,
    method: 'POST',
    data
  })
}
