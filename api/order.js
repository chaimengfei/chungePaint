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
 * 结算订单（已废弃，保留用于兼容）
 * @param {Object} data 结算数据
 */
export const checkoutOrder = (data) => {
  return post('/api/order/checkout', data)
}

/**
 * 提交询价
 * @param {Object} data 询价数据
 * @param {Array<number>} [data.draft_ids] - 草稿ID列表（从草稿创建询价）
 * @param {number} [data.product_id] - 商品ID（立即询价）
 * @param {number} [data.quantity] - 数量（立即询价，支持小数）
 */
export const submitInquiry = (data) => {
  return post('/api/inquiry/submit', data)
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
 * @param {number} data.payment_type - 支付方式(1:线下转账,2:余额支付,3:微信支付,4:余额+线下组合支付)
 */
export const payOrder = (data) => {
  return post('/api/order/pay', data).then(res => res.data)
}

/**
 * 组合支付接口（后端自动判断余额/微信）
 * @param {Object} data
 * @param {string} [data.code] - 微信登录code（余额不足时使用）
 * @param {string} data.order_no - 订单号
 * @param {number} [data.total] - 支付总金额，可选校验
 * @param {string} [data.note] - 备注
 */
export const payCombined = (data) => {
  return post('/api/pay/combined', data)
}

/**
 * 确认支付接口（取消线上支付，直接确认下单）
 * @param {Object} data
 * @param {string} data.order_no - 订单号
 * @param {number} [data.total] - 支付总金额，可选校验
 * @param {string} [data.note] - 备注
 */
export const payConfirm = (data) => {
  return post('/api/pay/confirm', data).then(res => res.data)
}

/**
 * 再次购买：将已完成订单中的商品重新加入购物车
 * @param {string} orderNo - 订单号
 */
export const rebuyOrder = (orderNo) => {
  return post(`/api/order/rebuy?order_no=${encodeURIComponent(orderNo)}`, {}).then(res => res.data)
}
