<template>
  <view class="container">
    <view v-if="orderData">
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
        <button class="submit-btn" @tap="testClick" @click="testClick">
          确认支付
        </button>
        <!-- 调试信息 -->
        <view v-if="false" style="font-size: 12px; color: red; padding: 5px;">
          调试: submitting={{ submitting }}, 
          orderData={{ !!orderData }}, order_no={{ orderData?.order_no }}
        </view>
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
import { checkoutOrder, payConfirm, getOrderDetail } from '@/api/order.js'

export default {
  data() {
    return {
      draftIds: [],
      productId: null,
      quantity: 1,
      orderData: null,
      orderNote: '',
      loading: true,
      error: null,
      submitting: false
    }
  },
  onLoad(options) {
    console.log('结算页面 onLoad - 接收到的参数:', options)
    if (options.draft_ids) {
      // 需求单结算
      try {
        this.draftIds = JSON.parse(options.draft_ids)
        console.log('需求单结算 - 解析后的 draftIds:', this.draftIds)
        if (!Array.isArray(this.draftIds) || this.draftIds.length === 0) {
          this.handleError('需求单ID无效')
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
    // 地址功能已移除
  },
  methods: {
    async fetchCheckoutData() {
      this.loading = true
      this.error = null
      try {
        let requestData
        if (this.draftIds.length > 0) {
          // 需求单结算
          requestData = { draft_ids: this.draftIds }
          console.log('需求单结算 - 请求数据:', JSON.stringify(requestData))
        } else {
          // 立即购买
          requestData = {
            draft_ids: null,
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
        } else {
          this.handleError(res.data.msg || '获取结算信息失败')
        }
      } catch (err) {
        this.handleError('网络错误，请稍后重试')
      } finally {
        this.loading = false
      }
    },
	handleError(msg) {
      this.error = msg
      uni.showToast({
        title: msg,
        icon: 'none'
      })
    },
    testClick(e) {
      console.log('123')
      console.log('========== [测试] 按钮被点击 ==========')
      console.log('[测试] 事件对象:', e)
      console.log('[测试] submitting:', this.submitting)
      console.log('[测试] orderData:', this.orderData)
      this.submitOrder(e)
    },
    async submitOrder(e) {
      console.log('========== [确认支付] 开始执行 submitOrder 方法 ==========')
      console.log('[确认支付] 事件对象:', e)
      console.log('[确认支付] orderData:', this.orderData)
      console.log('[确认支付] submitting:', this.submitting)
      
      if (!this.orderData || !this.orderData.order_no) {
        console.warn('[确认支付] 订单信息异常，提前返回', {
          hasOrderData: !!this.orderData,
          orderNo: this.orderData?.order_no
        })
		return uni.showToast({ title: '订单信息异常', icon: 'none' })
	  }
      
        console.log('[确认支付] 通过验证，开始调用接口')
      this.submitting = true
      uni.showLoading({ title: '支付中...', mask: true })

      try {
        // 构建确认支付请求数据
        // 直接使用结算接口返回的 payment_amount 值（已经是"分"为单位）
        const payRequestData = {
          order_no: this.orderData.order_no,
          total: this.orderData.payment_amount, // 直接使用结算接口返回的值
          note: this.orderNote || ''
        }

        console.log('[确认支付] 开始调用 /api/pay/confirm，请求数据:', JSON.stringify(payRequestData))
        console.log('[确认支付] payConfirm 函数:', typeof payConfirm, payConfirm)
        
        const payRes = await payConfirm(payRequestData)
        console.log('[确认支付] /api/pay/confirm 接口返回:', JSON.stringify(payRes))

        if (payRes.code === 0) {
          const payData = payRes.data || {}
          const orderStatus = payData.order_status // 1: 待支付, 2: 已支付
          const message = payData.message || '下单成功'
          const offlineAmount = Number(payData.offline_amount || 0)
          const wechatAmount = Number(payData.wechat_amount || 0) // 注意：这里实际表示线下支付金额

          this.submitting = false
          uni.hideLoading()

          // 构建支付信息字符串，传递给成功页
          let paymentInfo = ''
          const offlinePayAmount = offlineAmount || wechatAmount
          
          if (orderStatus === 2) {
            // 已支付
            paymentInfo = message || '下单成功'
          } else if (orderStatus === 1) {
            // 待支付（需要线下支付）
            if (offlinePayAmount > 0) {
              // 完全线下支付
              paymentInfo = `需线下支付 ¥${(offlinePayAmount / 100).toFixed(2)}`
            } else {
              paymentInfo = message || '下单成功'
            }
          }

          console.log('下单成功，订单状态:', orderStatus, '支付信息:', paymentInfo)
          
          // 统一跳转到成功页，传递订单状态和支付信息
          uni.redirectTo({
            url: `/pages/order/success?order_no=${this.orderData.order_no}&amount=${this.orderData.payment_amount}&order_status=${orderStatus}&payment_info=${encodeURIComponent(paymentInfo)}`
          })
        } else {
          console.error('[确认支付] 接口返回错误:', payRes)
          uni.showToast({ 
            title: payRes.message || '支付失败', 
            icon: 'none' 
          })
        }
      } catch (err) {
        console.error('[确认支付] 接口调用失败:', err)
        uni.showToast({ 
          title: err.message || '支付失败，请重试', 
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
  z-index: 1000;
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
  position: relative;
  z-index: 1001;
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