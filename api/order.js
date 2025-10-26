import { get, post } from './request'

/**
 * 获取订单列表
 * @param {Object} params 查询参数
 * @param {number} [params.status] - 订单状态
 * @param {number} [params.page] - 页码
 * @param {number} [params.page_size] - 每页数量
 */
export const getOrderList = (params = {}) => {
  return get('/api/order/list', params).then(res => res.data)
}

/**
 * 获取订单详情
 * @param {string} orderNo - 订单号
 */
export const getOrderDetail = (orderNo) => {
  return get('/api/order/detail', { order_no: orderNo }).then(res => res.data)
}

/**
 * 结算订单
 * @param {Object} data 结算数据
 */
export const checkoutOrder = (data) => {
  return post('/api/order/checkout', data)
}

/**
 * 取消订单
 * @param {string} orderNo - 订单号
 */
export const cancelOrder = (orderNo) => {
  return post('/api/order/cancel', { order_no: orderNo }).then(res => res.data)
}

/**
 * 确认收货
 * @param {Object} data 
 * @param {number} data.order_id - 订单ID
 */
export const confirmReceipt = (data) => {
  return post('/api/order/confirm_receipt', data).then(res => res.data)
}

/**
 * 支付订单
 * @param {Object} data 
 * @param {number} data.order_id - 订单ID
 * @param {number} data.payment_type - 支付方式(1:微信,2:支付宝,3:余额)
 */
export const payOrder = (data) => {
  return post('/api/order/pay', data).then(res => res.data)
}

/**
 * 支付数据接口
 * @param {Object} data 
 * @param {string} data.code - 微信登录code
 * @param {string} data.order_no - 订单号
 * @param {number} data.total - 支付总金额（分）
 * @param {string} data.note - 备注信息
 */
export const payData = (data) => {
  return post('/api/pay/data', data)
}
