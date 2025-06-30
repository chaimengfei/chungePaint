<template>
  <view class="container">
    <!-- 结算页面内容 -->
    <view v-if="orderData">
      <!-- 收货地址 -->
      <view class="section address-section" @click="selectAddress">
        <view v-if="selectedAddress" class="address-info">
          <view class="address-header">
            <text class="name">{{ selectedAddress.recipient_name }}</text>
            <text class="phone">{{ selectedAddress.recipient_phone }}</text>
          </view>
          <text class="address-detail">{{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}</text>
        </view>
        <view v-else class="add-address">
          <text>+ 添加收货地址</text>
        </view>
        <uni-icons type="arrowright" size="20" color="#999"></uni-icons>
      </view>

      <!-- 商品清单 -->
      <view class="section">
        <view class="section-title">商品清单</view>
        <view v-for="item in orderData.order_items" :key="item.product_id" class="order-item">
          <image :src="item.product_image" class="product-image" mode="aspectFill"></image>
          <view class="product-info">
            <text class="product-name">{{ item.product_name }}</text>
            <text class="product-spec">{{ item.unit }}</text>
            <view class="price-line">
              <text class="product-price">¥{{ item.product_price }}</text>
              <text class="product-quantity">×{{ item.quantity }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 订单金额 -->
      <view class="section">
        <view class="section-title">订单金额</view>
        <view class="price-row">
          <text>商品总价</text>
          <text>¥{{ orderData.total_amount }}</text>
        </view>
        <view class="price-row">
          <text>运费</text>
          <text>¥{{ orderData.shipping_fee }}</text>
        </view>
        <view class="price-row total">
          <text>应付总额</text>
          <text>¥{{ orderData.payment_amount }}</text>
        </view>
      </view>

      <!-- 备注 -->
      <view class="section remark-section">
        <view class="section-title">备注</view>
        <textarea 
          v-model="orderNote" 
          placeholder="请输入备注信息(选填)" 
          class="remark-input"
          maxlength="100"
        ></textarea>
      </view>
      
      <!-- 提交按钮 -->
      <view class="footer">
        <view class="price-total">
          <text>合计:</text>
          <text class="price">¥{{ orderData.payment_amount }}</text>
        </view>
        <button 
          class="submit-btn" 
          :disabled="!selectedAddress || submitting" 
          @click="submitOrder"
        >
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
    
    <!-- 错误提示 -->
    <view v-if="error" class="error-message">
      <text>{{ error }}</text>
      <button class="retry-btn" @click="fetchCheckoutData">重试</button>
    </view>
  </view>
</template>

<script>
import { checkoutOrder } from '@/api/order.js'

export default {
  data() {
    return {
      orderData: null,
      loading: true,
      error: null,
      submitting: false,
      cartIds: [],
      selectedAddress: null,
      orderNote: '',
      addressList: []
    }
  },
  onLoad(options) {
    if (options.cart_ids) {
      try {
        this.cartIds = JSON.parse(options.cart_ids)
        this.fetchCheckoutData()
        this.loadAddressList()
      } catch (e) {
        this.handleError('参数解析失败')
      }
    } else {
      this.handleError('缺少必要参数')
    }
  },
  methods: {
    // 获取结算数据
    async fetchCheckoutData() {
      this.loading = true
      this.error = null
      try {
        const res = await checkoutOrder({
          cart_ids: this.cartIds
        })
        
        if (res.data.code === 0) {
          this.orderData = res.data.data
        } else {
          this.handleError(res.data.msg || '获取结算数据失败')
        }
      } catch (err) {
        console.error('结算接口错误:', err)
        this.handleError('网络请求失败，请重试')
      } finally {
        this.loading = false
      }
    },

    // 加载收货地址
    async loadAddressList() {
      try {
        // 模拟数据
        this.addressList = [{
          id: 1,
          recipient_name: "张三",
          recipient_phone: "13800138000",
          province: "广东省",
          city: "深圳市",
          district: "南山区",
          detail: "科技园路100号",
          is_default: 1
        }]
        
        // 设置默认地址
        const defaultAddress = this.addressList.find(item => item.is_default === 1)
        if (defaultAddress) {
          this.selectedAddress = defaultAddress
        }
      } catch (err) {
        console.error('获取地址失败:', err)
      }
    },

    // 选择地址
    selectAddress() {
      uni.navigateTo({
        url: '/pages/address/list?selectMode=1'
      })
    },

    // 处理错误
    handleError(message) {
      this.error = message
      uni.showToast({
        title: message,
        icon: 'none'
      })
    },
    
    // 提交订单并支付
    async submitOrder() {
      if (!this.selectedAddress) {
        uni.showToast({
          title: '请选择收货地址',
          icon: 'none'
        })
        return
      }

      this.submitting = true
      uni.showLoading({
        title: '支付中...',
        mask: true
      })
      
      try {
        // 直接使用结算接口返回的order_no进行支付
        await uni.requestPayment({
          provider: 'wxpay',
          orderInfo: {
            orderNo: this.orderData.order_no,
            amount: this.orderData.payment_amount
          }
        })
        
        uni.showToast({
          title: '支付成功',
          icon: 'success'
        })
        
        // 支付成功后跳转到订单详情页
        setTimeout(() => {
          uni.redirectTo({
            url: `/pages/order/detail?order_no=${this.orderData.order_no}`
          })
        }, 1500)
      } catch (err) {
        console.error('支付失败:', err)
        let errMsg = '支付失败'
        if (err.errMsg === 'requestPayment:fail cancel') {
          errMsg = '您已取消支付'
        }
        uni.showToast({
          title: errMsg,
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