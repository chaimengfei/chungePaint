<template>
  <view class="success-container">
    <view class="success-header">
      <view class="success-icon">
        <view class="icon-circle">
          <text class="checkmark">✓</text>
        </view>
      </view>
      <text class="success-title">提交成功</text>
      <text class="success-subtitle">客服将尽快联系您...</text>
    </view>

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
      inquiryInfo: '',
      servicePhone: '131-6162-1688'
    }
  },
  onLoad(options) {
    if (options.inquiry_no) {
      this.orderNo = options.inquiry_no
    }
    if (options.inquiry_info) {
      this.inquiryInfo = decodeURIComponent(options.inquiry_info)
    }
  },
  methods: {
    viewOrderDetail() {
      if (this.orderNo) {
        uni.redirectTo({
          url: `/pages/inquiry/detail?inquiry_no=${this.orderNo}`
        })
      } else {
        uni.navigateTo({
          url: '/pages/inquiry/index'
        })
      }
    },
    contactService() {
      showContactService()
    }
  }
}
</script>

<style scoped>
.success-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
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
