import { BASE_URL } from './common'

/**
 * 获取订单列表
 * @param {Object} params 查询参数
 * @param {number} [params.status] - 订单状态
 * @param {number} [params.page] - 页码
 * @param {number} [params.page_size] - 每页数量
 */
export const getOrderList = (params = {}) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/order/list`,
      method: 'GET',
      data: params,
      success: (res) => {
        resolve(res.data)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}


/**
 * 获取订单详情
 * @param {number} id - 订单ID
 */
// 获取订单详情
export const getOrderDetail = (orderNo) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/order/detail?order_no=${orderNo}`,
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

// 结算订单
export const checkoutOrder = (data) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/order/checkout`,
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

/**
 * 取消订单
 * @param {number} id - 订单ID
 */
export const cancelOrder = (orderNo) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/order/cancel`,
      method: 'POST',
	  data: {
	    order_no: orderNo
	  },
      success: (res) => {
        resolve(res.data)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 确认收货
 * @param {Object} data 
 * @param {number} data.order_id - 订单ID
 */
export const confirmReceipt = (data) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/order/confirm_receipt`,
      method: 'POST',
      data,
      success: (res) => {
        resolve(res.data)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 支付订单
 * @param {Object} data 
 * @param {number} data.order_id - 订单ID
 * @param {number} data.payment_type - 支付方式(1:微信,2:支付宝,3:余额)
 */
export const payOrder = (data) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/order/pay`,
      method: 'POST',
      data,
      success: (res) => {
        resolve(res.data)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}
