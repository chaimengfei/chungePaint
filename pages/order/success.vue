<template>
  <view class="success-container">
    <!-- 支付成功提示区域 -->
    <view class="success-header">
      <view class="success-icon">
        <view class="icon-circle">
          <text class="checkmark">✓</text>
        </view>
      </view>
      <text class="success-title">下单成功</text>
      <text class="success-subtitle" v-if="orderStatus === 1">等待接单...</text>
      <text class="success-order-no" v-if="orderNo">订单号：{{ orderNo }}</text>
      <text class="success-amount" v-if="displayAmount">{{ displayAmount }}</text>
      <text class="payment-info" v-if="paymentInfo">{{ paymentInfo }}</text>
    </view>

    <!-- 订单信息卡片 -->
    <view v-if="orderInfo" class="order-info-card">
      <view v-if="orderInfo.items && orderInfo.items.length > 0" class="order-item-preview">
        <image 
          v-if="orderInfo.items[0].product_image" 
          class="product-thumb" 
          :src="orderInfo.items[0].product_image" 
          mode="aspectFill"
        />
        <view class="product-details">
          <text class="product-name">{{ orderInfo.items[0].product_name }}</text>
          <text v-if="orderInfo.items[0].specification" class="product-spec">{{ orderInfo.items[0].specification }}</text>
          <text v-if="orderInfo.receiver_address" class="delivery-address">{{ orderInfo.receiver_address }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="bottom-actions">
      <button class="view-detail-btn" @click="viewOrderDetail">查看详情</button>
    </view>
  </view>
</template>

<script>
import { getOrderDetail } from '@/api/order.js'

export default {
  data() {
    return {
      orderNo: '',
      paymentAmount: '',
      orderInfo: null,
      orderStatus: null, // 1: 待支付, 2: 已支付
      paymentInfo: '' // 支付信息提示
    }
  },
  computed: {
    displayAmount() {
      if (this.orderInfo && this.orderInfo.pay_summary) {
        return this.orderInfo.pay_summary
      }
      if (this.paymentAmount) {
        return `¥${this.paymentAmount}`
      }
      return ''
    }
  },
  onLoad(options) {
    if (options.order_no) {
      this.orderNo = options.order_no
      this.loadOrderInfo()
    }
    if (options.amount) {
      this.paymentAmount = options.amount
    }
    if (options.order_status) {
      this.orderStatus = parseInt(options.order_status)
    }
    if (options.payment_info) {
      this.paymentInfo = decodeURIComponent(options.payment_info)
    }
  },
  methods: {
    // 加载订单信息
    async loadOrderInfo() {
      if (!this.orderNo) return
      
      try {
        const res = await getOrderDetail(this.orderNo)
        if (res.code === 0 && res.data) {
          this.orderInfo = res.data
        }
      } catch (err) {
        console.error('加载订单信息失败:', err)
      }
    },
    // 查看订单详情
    viewOrderDetail() {
      if (this.orderNo) {
        uni.redirectTo({
          url: `/pages/order/detail?order_no=${this.orderNo}`
        })
      } else {
        // 如果没有订单号，跳转到询价列表
        uni.navigateTo({
          url: '/pages/order/index'
        })
      }
    }
  }
}
</script>

<script setup>
</script>

<style scoped>
.success-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  padding-bottom: 120rpx;
}

.success-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 80rpx 40rpx 60rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.success-icon {
  margin-bottom: 40rpx;
}

.icon-circle {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background-color: #e93b3d;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkmark {
  color: #fff;
  font-size: 96rpx;
  font-weight: bold;
  line-height: 1;
}

.success-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.success-subtitle {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.success-amount {
  font-size: 36rpx;
  color: #666;
  margin-top: 10rpx;
}

.success-order-no {
  margin-top: 8rpx;
  font-size: 28rpx;
  color: #888;
}

.payment-info {
  margin-top: 10rpx;
  font-size: 28rpx;
  color: #999;
  line-height: 1.5;
  text-align: center;
  padding: 0 40rpx;
}

/* 订单信息卡片 */
.order-info-card {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.order-item-preview {
  display: flex;
  align-items: flex-start;
}

.product-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.product-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.product-spec {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.delivery-address {
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
}

/* 底部操作按钮 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 40rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.view-detail-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  background-color: #e93b3d;
  color: #fff;
  border: none;
}
</style>
