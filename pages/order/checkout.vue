<template>
  <view class="container">
    <view v-if="orderData">
      <!-- 地址 -->
      <view class="section address-section" @click="selectAddress">
        <view v-if="selectedAddress" class="address-info">
          <view class="address-header">
            <text class="name">{{ selectedAddress.recipient_name }}</text>
            <text class="phone">{{ selectedAddress.recipient_phone }}</text>
          </view>
          <text class="address-detail">
            {{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}
          </text>
        </view>
        <view v-else class="add-address">
          <text>+ 添加收货地址</text>
        </view>
        <uni-icons type="arrowright" size="20" color="#999"></uni-icons>
      </view>

      <!-- 商品 -->
      <view class="section">
        <view class="section-title">商品清单</view>
        <view v-for="item in orderData.items" :key="item.product_id" class="order-item">
          <image :src="item.product_image || '/static/images/empty-cart.png'" class="product-image" mode="aspectFill"></image>
          <view class="product-info">
            <text class="product-name">{{ item.product_name }}</text>
            <text class="product-spec">{{ item.specification }}</text>
            <view class="price-line">
              <text class="product-price">¥{{ item.unit_price }}</text>
              <text class="product-quantity">×{{ item.quantity }}</text>
            </view>
            <view class="total-price">
              <text class="total-price-text">小计: ¥{{ item.total_price }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 金额 -->
      <view class="section">
        <view class="price-row"><text>商品总价</text><text>¥{{ orderData.total_amount }}</text></view>
        <view class="price-row total"><text>应付总额</text><text>¥{{ orderData.payment_amount }}</text></view>
      </view>

      <!-- 备注 -->
      <view class="section remark-section">
        <view class="section-title">备注</view>
        <textarea v-model="orderNote" placeholder="请输入备注信息(选填)" class="remark-input" maxlength="100"></textarea>
      </view>

      <!-- 支付按钮 -->
      <view class="footer">
        <view class="price-total"><text>合计:</text><text class="price">¥{{ orderData.payment_amount }}</text></view>
        <button class="submit-btn" :disabled="!selectedAddress || submitting" @click="submitOrder">
          {{ submitting ? '支付中...' : '立即支付' }}
        </button>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-mask">
      <view class="loading-content">
        <uni-loading type="circle" size="36" color="#e93b3d"></uni-loading>
        <text>加载中...</text>
      </view>
    </view>

    <!-- 错误 -->
    <view v-if="error" class="error-message">
      <text>{{ error }}</text>
      <button class="retry-btn" @click="fetchCheckoutData">重试</button>
    </view>
  </view>
</template>

<script>
import { checkoutOrder, payData, getOrderDetail } from '@/api/order.js'
import { ENV_INFO } from '@/api/common.js'
import { getAddressList } from '@/api/address.js'
import { getUserBalance } from '@/api/user.js'

export default {
  data() {
    return {
      cartIds: [],
      productId: null,
      quantity: 1,
      orderData: null,
      selectedAddress: null,
      orderNote: '',
      loading: true,
      error: null,
      submitting: false,
	  incomingAddressId: null,
      paymentCheckTimer: null, // 支付状态检查定时器
      paymentSuccessHandled: false // 标记支付成功是否已处理
    }
  },
  onLoad(options) {
    console.log('结算页面 onLoad - 接收到的参数:', options)
    if (options.cart_ids) {
      // 购物车结算
      try {
        this.cartIds = JSON.parse(options.cart_ids)
        console.log('购物车结算 - 解析后的 cartIds:', this.cartIds)
        if (!Array.isArray(this.cartIds) || this.cartIds.length === 0) {
          this.handleError('购物车ID无效')
          return
        }
      } catch (err) {
        console.error('参数解析失败:', err)
        this.handleError('参数解析失败')
        return
      }
      this.fetchCheckoutData()
    } else if (options.product_id && options.quantity) {
      // 立即购买
      this.productId = parseInt(options.product_id)
      this.quantity = parseInt(options.quantity)
      console.log('立即购买 - productId:', this.productId, 'quantity:', this.quantity)
      this.fetchCheckoutData()
    } else {
      console.error('缺少必要参数 - options:', options)
      this.handleError('缺少必要参数')
    }
  },
  onShow() {
    const address = uni.getStorageSync('selected_address')
    if (address) {
      this.selectedAddress = address
      uni.removeStorageSync('selected_address')
    }else {
      this.loadAddress(); // 没有缓存才调用接口获取
    }
  },
  onUnload() {
    // 页面卸载时清除支付状态检查定时器
    if (this.paymentCheckTimer) {
      clearInterval(this.paymentCheckTimer)
      this.paymentCheckTimer = null
    }
  },
  methods: {
    async fetchCheckoutData() {
      this.loading = true
      this.error = null
      try {
        let requestData
        if (this.cartIds.length > 0) {
          // 购物车结算
          requestData = { cart_ids: this.cartIds }
          console.log('购物车结算 - 请求数据:', JSON.stringify(requestData))
        } else {
          // 立即购买
          requestData = {
            cart_ids: null,
            product_id: this.productId,
            quantity: this.quantity,
            address_id: null
          }
          console.log('立即购买 - 请求数据:', JSON.stringify(requestData))
        }
        
        const res = await checkoutOrder(requestData)
        console.log('结算接口返回数据:', JSON.stringify(res.data))
        if (res.data.code === 0) {
          this.orderData = res.data.data
		   // ✅ 新增：把返回的 address_info 作为当前选中的地址
		   this.selectedAddress = res.data.data.address_info || null
        } else {
          this.handleError(res.data.msg || '获取结算信息失败')
        }
      } catch (err) {
        this.handleError('网络错误，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    selectAddress() {
		if (this.orderData?.address_info) {
			// 如果已有地址，进入选择地址页面
			uni.navigateTo({
			  url: '/pages/address/list?selectMode=1'
			})
		} else {
			// 如果没有地址，直接跳转到创建地址页面
			uni.navigateTo({
			  url: '/pages/address/edit'
			})
		}
    },
    async loadAddress() {
        try {
		  const res = await getAddressList()

		  if (res.code === 0) {
		    const list = res.data || [];
			if (list.length > 0) {
			  // 优先默认地址，否则取第一个
			  const defaultAddr = list.find(addr => addr.is_default);
			  this.selectedAddress = defaultAddr || list[0];
			} else {
			  // 如果列表为空，跳转引导用户新建地址
			  setTimeout(() => {
			    uni.navigateTo({ url: '/pages/address/edit' });
			  }, 300);
			}
		  } else {
		    this.handleError(res.data.msg || '获取地址失败')
		  }
        } catch (err) {
          console.error('获取地址失败', err);
        }
     },
	handleError(msg) {
      this.error = msg
      uni.showToast({
        title: msg,
        icon: 'none'
      })
    },
    // 启动支付状态轮询检查（仅开发环境启用，作为备用方案）
    startPaymentStatusCheck(orderNo, resolve, reject) {
      // 只在开发环境启用轮询，生产环境不启用（真机环境 success 回调正常触发）
      const isDevEnv = ENV_INFO.env === 'dev'
      if (!isDevEnv) {
        console.log('生产环境，不启用支付状态轮询')
        return
      }
      
      let checkCount = 0
      const maxChecks = 15 // 最多检查15次（约30秒，因为每2秒检查一次）
      
      // 延迟启动轮询，给 success 回调一些时间（真机环境通常1-2秒内就会触发）
      setTimeout(() => {
        // 如果 success 回调已经触发，不需要轮询了
        if (this.paymentSuccessHandled) {
          console.log('支付成功回调已触发，跳过轮询')
          return
        }
        
        console.log('开发环境：启动支付状态轮询检查')
        this.paymentCheckTimer = setInterval(async () => {
          // 再次检查，防止在轮询过程中 success 回调触发
          if (this.paymentSuccessHandled) {
            clearInterval(this.paymentCheckTimer)
            this.paymentCheckTimer = null
            return
          }
          
          checkCount++
          
          if (checkCount > maxChecks) {
            // 超时，停止轮询（真机环境不应该走到这里）
            console.log('轮询超时，停止检查')
            clearInterval(this.paymentCheckTimer)
            this.paymentCheckTimer = null
            return
          }
          
          try {
            // 查询订单详情，检查支付状态
            const res = await getOrderDetail(orderNo)
            if (res.code === 0 && res.data) {
              const orderStatus = res.data.order_status
              // 订单状态不是"待付款"(1)，说明已支付或已取消
              if (orderStatus !== 1) {
                // 标记支付成功已处理，防止重复处理
                this.paymentSuccessHandled = true
                // 清除轮询定时器
                clearInterval(this.paymentCheckTimer)
                this.paymentCheckTimer = null
                
                // 如果订单已支付（状态为2已支付待发货、3待收货、5已完成）
                if (orderStatus === 2 || orderStatus === 3 || orderStatus === 5) {
                  console.log('轮询检测到支付成功，订单状态:', orderStatus)
                  // 先关闭loading
                  this.submitting = false
                  uni.hideLoading()
                  // 延迟跳转，给用户时间关闭二维码弹窗（开发者工具环境）
                  setTimeout(() => {
                    uni.redirectTo({
                      url: `/pages/order/success?order_no=${orderNo}&amount=${this.orderData.payment_amount}`
                    })
                  }, 500) // 延迟500ms，让用户有时间关闭二维码弹窗
                  resolve({ success: true, fromPolling: true })
                } else if (orderStatus === 4) {
                  // 订单已取消
                  console.log('订单已取消')
                  this.submitting = false
                  uni.hideLoading()
                  uni.showToast({
                    title: '订单已取消',
                    icon: 'none'
                  })
                  reject(new Error('订单已取消'))
                }
              }
            }
          } catch (err) {
            console.error('轮询检查支付状态失败:', err)
            // 轮询失败不影响，继续检查
          }
        }, 2000) // 每2秒检查一次（降低频率，减少服务器压力）
      }, 3000) // 延迟3秒启动，给 success 回调足够的时间
    },
    async submitOrder() {
      if (!this.selectedAddress) {
        return uni.showToast({ title: '请选择收货地址', icon: 'none' })
      }
	  if (!this.orderData || !this.orderData.order_no) {
		return uni.showToast({ title: '订单信息异常', icon: 'none' })
	  }
      this.submitting = true
      this.paymentSuccessHandled = false // 重置支付成功标记
      uni.showLoading({ title: '支付中...', mask: true })

      try {
        // 1. 获取用户余额
        let userBalance = 0
        let useBalance = false
        try {
          const balanceRes = await getUserBalance()
          if (balanceRes.statusCode === 200 && balanceRes.data.code === 0) {
            userBalance = parseFloat(balanceRes.data.data.balance || 0)
            const orderAmount = parseFloat(this.orderData.payment_amount || 0)
            // 如果余额足够支付订单，使用余额支付
            if (userBalance >= orderAmount) {
              useBalance = true
              console.log('用户余额充足，使用余额支付，余额:', userBalance, '订单金额:', orderAmount)
            } else {
              console.log('用户余额不足，使用微信支付，余额:', userBalance, '订单金额:', orderAmount)
            }
          }
        } catch (err) {
          console.warn('获取用户余额失败，使用微信支付:', err)
          // 获取余额失败不影响支付流程，继续使用微信支付
        }

        // 2. 构建支付请求数据
        const payRequestData = {
          order_no: this.orderData.order_no,
          total: this.orderData.payment_amount, // 直接传 payment_amount，不转换
          note: this.orderNote || ''
        }
        
        if (useBalance) {
          // 余额支付：添加 payment_type: 2，不需要 code
          payRequestData.payment_type = 2
          console.log('使用余额支付，支付请求数据:', payRequestData)
        } else {
          // 微信支付：需要获取 code，并添加 payment_type: 1
          payRequestData.payment_type = 1
          
          // 获取微信登录code
          const loginRes = await new Promise((resolve, reject) => {
            uni.login({
              success: resolve,
              fail: reject
            })
          })

          const code = loginRes.code
          if (!code) {
            throw new Error('获取微信登录code失败')
          }
          
          payRequestData.code = code
          console.log('使用微信支付，支付请求数据:', payRequestData)
        }

        const payRes = await payData(payRequestData)
        
        if (payRes.data.code === 0) {
          if (useBalance) {
            // 余额支付：直接跳转到支付成功页面，不需要调起微信支付收银台
            console.log('余额支付成功')
            this.submitting = false
            uni.hideLoading()
            uni.redirectTo({
              url: `/pages/order/success?order_no=${this.orderData.order_no}&amount=${this.orderData.payment_amount}`
            })
          } else {
            // 微信支付：后端返回支付参数成功，调起微信支付收银台
            const payParams = payRes.data.data
            
            // 调用微信支付接口，调起收银台
            await new Promise((resolve, reject) => {
              uni.requestPayment({
                provider: 'wxpay',
                timeStamp: payParams.timeStamp,
                nonceStr: payParams.nonceStr,
                package: payParams.package,
                signType: payParams.signType,
                paySign: payParams.paySign,
                success: (res) => {
                  console.log('支付成功回调:', res)
                  // 标记支付成功已处理
                  this.paymentSuccessHandled = true
                  // 清除轮询定时器
                  if (this.paymentCheckTimer) {
                    clearInterval(this.paymentCheckTimer)
                    this.paymentCheckTimer = null
                  }
                  // 先关闭loading
                  this.submitting = false
                  uni.hideLoading()
                  // 延迟跳转，给用户时间关闭二维码弹窗（开发者工具环境）
                  setTimeout(() => {
                    uni.redirectTo({
                      url: `/pages/order/success?order_no=${this.orderData.order_no}&amount=${this.orderData.payment_amount}`
                    })
                  }, 500) // 延迟500ms，让用户有时间关闭二维码弹窗
                  resolve(res)
                },
                fail: (err) => {
                  console.error('支付失败:', err)
                  
                  // 如果支付已经成功处理（开发者工具关闭二维码弹窗后可能触发 cancel），直接忽略
                  if (this.paymentSuccessHandled) {
                    console.log('支付已成功处理，忽略后续 fail 回调')
                    return
                  }
                  
                  // 清除轮询定时器
                  if (this.paymentCheckTimer) {
                    clearInterval(this.paymentCheckTimer)
                    this.paymentCheckTimer = null
                  }
                  
                  // 用户取消支付或其他错误
                  if (err.errMsg && err.errMsg.includes('cancel')) {
                    uni.showToast({ 
                      title: '用户取消支付', 
                      icon: 'none' 
                    })
                  } else {
                    uni.showToast({ 
                      title: '支付失败，请重试', 
                      icon: 'none' 
                    })
                  }
                  reject(err)
                }
              })
              
              // 启动支付状态轮询（用于开发者工具扫码支付场景）
              // 如果 uni.requestPayment 的 success 回调没有触发，通过轮询检查订单状态
              this.startPaymentStatusCheck(this.orderData.order_no, resolve, reject)
            })
          }
        } else {
          uni.showToast({ 
            title: payRes.data.message || '获取支付信息失败', 
            icon: 'none' 
          })
        }
      } catch (err) {
        console.error('支付失败:', err)
        uni.showToast({ 
          title: err.message || '支付失败', 
          icon: 'none' 
        })
      } finally {
        this.submitting = false
        uni.hideLoading()
      }
    }
  }
}
</script>

<style scoped>
/* 原有样式保持不变 */
.container {
  padding-bottom: 100px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.section {
  background-color: #fff;
  margin-bottom: 10px;
  padding: 15px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.address-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
}

.address-info {
  flex: 1;
}

.address-header {
  margin-bottom: 8px;
}

.address-header .name {
  font-size: 16px;
  font-weight: bold;
  margin-right: 10px;
}

.address-header .phone {
  font-size: 14px;
  color: #666;
}

.address-detail {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.add-address {
  flex: 1;
  text-align: center;
  color: #e93b3d;
  font-size: 14px;
}

.order-item {
  display: flex;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f5f5f5;
}

.order-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  margin-right: 10px;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.product-spec {
  font-size: 12px;
  color: #999;
  margin: 5px 0;
}

.price-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 16px;
  color: #e93b3d;
  font-weight: bold;
}

.product-quantity {
  font-size: 14px;
  color: #666;
}

.total-price {
  margin-top: 5px;
}

.total-price-text {
  font-size: 12px;
  color: #999;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.price-row.total {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f5f5f5;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.remark-section {
  padding-bottom: 20px;
}

.remark-input {
  width: 100%;
  height: 80px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.price-total {
  display: flex;
  align-items: center;
}

.price-total .price {
  font-size: 18px;
  font-weight: bold;
  color: #e93b3d;
  margin-left: 5px;
}

.submit-btn {
  background-color: #e93b3d;
  color: white;
  border-radius: 20px;
  padding: 0 25px;
  height: 36px;
  line-height: 36px;
  font-size: 14px;
  border: none;
}

.submit-btn[disabled] {
  background-color: #ccc;
  color: #fff;
}

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-content text {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

.error-message {
  padding: 20px;
  text-align: center;
  color: #e93b3d;
}

.retry-btn {
  margin-top: 10px;
  background-color: #e93b3d;
  color: white;
  border-radius: 4px;
  padding: 5px 15px;
  font-size: 14px;
}
</style>