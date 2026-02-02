<template>
  <view class="success-container">
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click.stop="navigateBack" @tap.stop="navigateBack">
        <image src="/static/images/back.png" mode="aspectFit" class="back-icon"/>
      </view>
    </view>
    <!-- 支付成功提示区域 -->
    <view class="success-header">
      <view class="success-icon">
        <view class="icon-circle">
          <text class="checkmark">✓</text>
        </view>
      </view>
      <text class="success-title">{{  '提交成功'  }}</text>
      <text class="success-subtitle">{{  '客服将尽快联系您...' }}</text>
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
        </view>
      </view>
    </view>

    <!-- 操作按钮区域 -->
    <view class="action-buttons">
      <button class="view-detail-btn" @click="viewOrderDetail">查看详情</button>
      <button class="contact-service-btn" @click="contactService">联系客服</button>
    </view>
  </view>
</template>

<script>
import { showContactService } from '@/api/common.js'

export default {
  data() {
    return {
      orderNo: '',
      inquiryInfo: '', // 询价信息提示
      servicePhone: '131-6162-1688' // 客服电话
    }
  },
  onLoad(options) {
    if (options.order_no) {
      this.orderNo = options.order_no
    }
    if (options.inquiry_info) {
      this.inquiryInfo = decodeURIComponent(options.inquiry_info)
    } else if (options.payment_info) {
      // 兼容旧参数名
      this.inquiryInfo = decodeURIComponent(options.payment_info)
    }
  },
  methods: {
    // 返回上一页
    navigateBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      } else {
        // 如果没有上一页，跳转到首页
        uni.switchTab({
          url: '/pages/index/index'
        })
      }
    },
    // 查看询价详情
    viewOrderDetail() {
      if (this.orderNo) {
        // 跳转到询价详情页
        uni.redirectTo({
          url: `/pages/order/detail?inquiry_no=${this.orderNo}`
        })
      } else {
        // 如果没有询价单号，跳转到询价列表
        uni.navigateTo({
          url: '/pages/order/index'
        })
      }
    },
    // 联系客服
    contactService() {
      showContactService()
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
  padding-top: calc(env(safe-area-inset-top) + 108rpx);
}

/* 自定义导航栏 */
.nav-bar {
  height: 88rpx;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  padding-top: calc(env(safe-area-inset-top) + 30rpx);
  padding-bottom: 20rpx;
  background-color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  border-bottom: 1rpx solid #f1f1f1;
  z-index: 999;
  box-sizing: border-box;
}

.nav-back {
  width: 100rpx;
  height: 100rpx;
  min-width: 100rpx;
  min-height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1000;
  padding: 25rpx;
  margin-left: -25rpx;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  background-color: #f5f5f5;
  border-radius: 50%;
}

.back-icon {
  width: 50rpx;
  height: 50rpx;
  pointer-events: none;
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
  background-color: #4169E1;
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

/* 操作按钮区域 */
.action-buttons {
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 40rpx;
}

.view-detail-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  background-color: #4169E1;
  color: #fff;
  border: none;
}

.view-detail-btn:active {
  background-color: #3151B8;
}

.contact-service-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  background-color: #fff;
  color: #333;
  border: 1rpx solid #ddd;
}
</style>
