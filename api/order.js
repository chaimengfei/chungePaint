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
export const getOrderDetail = (id) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/order/detail?id=${id}`,
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

// 购物车结算(后面会兼容直接下单)
export const checkoutOrder = (data) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/cart/checkout`,
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
 * 创建订单
 * @param {Object} data 订单数据
 * @param {Array} [data.cart_ids] - 购物车ID数组
 * @param {number} [data.product_id] - 立即购买商品ID
 * @param {number} [data.quantity] - 立即购买数量
 * @param {number} [data.address_id] - 收货地址ID
 * @param {number} [data.coupon_id] - 优惠券ID
 * @param {string} [data.note] - 订单备注
 */
export const createOrder = (data) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/order/create`,
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
 * 取消订单
 * @param {number} id - 订单ID
 */
export const cancelOrder = (id) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/order/cancel?id=${id}`,
      method: 'POST',
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
