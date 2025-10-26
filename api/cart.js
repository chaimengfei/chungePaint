import { get, post, del } from './request'

export const getCartList = () => {
  return get('/api/cart/list')
}

export const addToCart = (data) => {
  return post('/api/cart/add', data)
}

export const updateCartItem = (data) => {
  return post('/api/cart/update', data)
}

export const deleteCartItem = (id) => {
  return del(`/api/cart/delete/${id}`)
}
