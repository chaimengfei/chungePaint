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
          {{ submitting ? '提交中...' : '提交订单' }}
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
import {  checkoutOrder, createOrder } from '@/api/order.js'

export default {
  data() {
    return {
      orderData: null,
      loading: true,
      error: null,
      submitting: false,
      cartIds: [],
      selectedAddress: null, // 选择的收货地址
      orderNote: '', // 订单备注
      addressList: [] // 地址列表
    }
  },
  onLoad(options) {
	  console.log(options,'999999')
    if (options.cart_ids) {
      try {
        this.cartIds = JSON.parse(options.cart_ids)
        this.fetchCheckoutData()
        this.loadAddressList() // 加载收货地址
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
        // 这里替换为实际获取地址列表的API调用
        // const res = await getAddressList()
        // this.addressList = res.data.list
        
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
    
    // 提交订单
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
        title: '提交中...',
        mask: true
      })
      
      try {
        const orderData = {
          cart_ids: this.cartIds,
          product_id: 0, // 根据实际情况填写
          quantity: 0,   // 根据实际情况填写
          address_id: this.selectedAddress.id,
          coupon_id: 0, // 如果有优惠券
          note: this.orderNote
        }

        const res = await createOrder(orderData)
        
        if (res.data.code === 0) {
          uni.hideLoading()
          uni.showToast({
            title: res.data.message || '订单创建成功',
            icon: 'success'
          })
          
          // 提交成功后跳转到订单详情页
          setTimeout(() => {
            uni.redirectTo({
              url: `/pages/order/detail?order_no=${res.data.message.split(':')[1].trim()}`
            })
          }, 1500)
        } else {
          throw new Error(res.data.message || '订单创建失败')
        }
      } catch (err) {
        console.error('提交订单失败:', err)
        uni.hideLoading()
        uni.showToast({
          title: err.message || '提交订单失败',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.container {
  padding-bottom: 120rpx;
  background-color: #f7f7f7;
  min-height: 100vh;
}

.section {
  margin: 20rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.02);
}

.address-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
}

.address-info {
  flex: 1;
}

.address-header {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.address-header .name {
  font-size: 30rpx;
  font-weight: bold;
  margin-right: 20rpx;
}

.address-header .phone {
  font-size: 28rpx;
  color: #666;
}

.address-detail {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.add-address {
  flex: 1;
  text-align: center;
  color: #999;
  padding: 20rpx 0;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #333;
}

.order-item {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.product-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
}

.product-spec {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.price-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 15rpx;
}

.product-price {
  font-size: 30rpx;
  color: #e93b3d;
  font-weight: bold;
}

.product-quantity {
  font-size: 26rpx;
  color: #666;
}

.price-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #666;
}

.price-row.total {
  font-weight: bold;
  font-size: 32rpx;
  color: #e93b3d;
  border-top: 1rpx solid #eee;
  margin-top: 10rpx;
  padding-top: 20rpx;
}

.remark-section {
  margin-bottom: 30rpx;
}

.remark-input {
  width: 100%;
  height: 120rpx;
  font-size: 28rpx;
  padding: 10rpx;
  box-sizing: border-box;
  background-color: #f9f9f9;
  border-radius: 8rpx;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
  border-top: 1rpx solid #eee;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.price-total {
  display: flex;
  align-items: center;
}

.price-total .price {
  font-size: 32rpx;
  color: #e93b3d;
  font-weight: bold;
  margin-left: 10rpx;
}

.submit-btn {
  background: #e93b3d;
  color: white;
  height: 80rpx;
  line-height: 80rpx;
  padding: 0 60rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
}

.submit-btn[disabled] {
  background: #ccc;
}

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
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

.error-message {
  padding: 30rpx;
  text-align: center;
  color: #e93b3d;
}

.retry-btn {
  margin-top: 20rpx;
  background: #e93b3d;
  color: white;
  width: 200rpx;
}
</style>