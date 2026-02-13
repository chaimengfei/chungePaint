<template>
  <view class="order-detail-container">
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click.stop="navigateBack" @tap.stop="navigateBack">
        <image src="/static/images/back.png" mode="aspectFit" class="back-icon"/>
      </view>
      <text class="nav-title">单据详情</text>
    </view>

    <!-- 订单卡片 -->
    <view class="order-card">
      <view class="order-header">
        <view class="order-no-wrapper">
          <text class="order-no">单号：{{ order.inquiry_no }}</text>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="product-list">
        <view class="section-title">商品信息</view>
        <view v-for="item in order.items" :key="item.id" class="product-item">
          <image class="product-image" :src="item.product_image || '/static/images/empty-inquiry.png'" mode="aspectFill"/>
          <view class="product-info">
            <view class="product-name-wrapper">
              <text class="product-name">{{ item.product_name }}</text>
              <view class="price-line">
                <text class="product-price">¥{{ item.unit_price }}</text>
                <text v-if="item.unit" class="product-unit">/{{ item.unit }}</text>
                <text class="product-quantity">×{{ item.quantity }}</text>
              </view>
            </view>
            <view class="total-price">
              <text class="total-price-text">参考小计: ¥{{ item.total_price }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="order-info">
        <view class="info-row">
          <text class="info-label">创建时间</text>
          <text class="info-value">{{ formatTime(order.created_at) }}</text>
        </view>
        <view v-if="order.note" class="info-row">
          <text class="info-label">需求备注</text>
          <text class="info-value">{{ order.note }}</text>
        </view>
      </view>

      <!-- 金额汇总 -->
      <view class="amount-summary">
        <view class="amount-row total-row">
          <text>合计参考金额</text>
          <text>¥{{ order.final_quote || order.estimated_total || 0 }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button class="action-btn share-btn" open-type="share">分享</button>
      <button class="action-btn contact-btn" @click="contactService">联系客服</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { getInquiryDetail } from '@/api/inquiry.js'
import { showContactService } from '@/api/common.js'

const order = ref({
  items: [],
  total_amount: 0,
  estimated_total: 0,
  final_quote: 0,
  created_at: '',
  inquiry_no: '',
  id: 0
})

const isInquiry = ref(true)

// 加载单据详情
const loadInquiryData = async (inquiryNo) => {
  try {
    const res = await getInquiryDetail(inquiryNo)
    if (res.code === 0) {
      const inquiryData = res.data
      order.value = {
        items: inquiryData.items.map(item => {
          // 尝试多种可能的规格字段名
          const spec = item.product_specification || item.specification || item.spec || null
          return {
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_image: item.product_image,
            specification: spec,
            unit_price: item.reference_unit_price || 0,
            total_price: item.reference_total || 0,
            quantity: item.quantity,
            unit: item.unit,
            remark: item.remark
          }
        }),
        inquiry_no: inquiryData.inquiry_no,
        total_amount: inquiryData.estimated_total || 0,
        created_at: inquiryData.created_at,
        note: inquiryData.note,
        total_quantity: inquiryData.total_quantity,
        estimated_total: inquiryData.estimated_total,
        final_quote: inquiryData.final_quote
      }
      isInquiry.value = true
    }
  } catch (err) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

// 页面加载
onLoad((options) => {
  const inquiryNo = options.inquiry_no
  
  if (inquiryNo) {
    loadInquiryData(inquiryNo)
  } else {
    uni.showToast({ title: '单号缺失', icon: 'none' })
  }
})

// 分享给朋友（页面级分享）
onShareAppMessage(() => {
  return {
    title: `单据详情 - ${order.value.inquiry_no || ''}`,
    desc: `单号：${order.value.inquiry_no || ''}`,
    path: `/pages/inquiry/detail?inquiry_no=${order.value.inquiry_no || ''}`,
    imageUrl: ''
  }
})

const statusText = computed(() => {
  if (order.value.final_quote) {
    return '已报价'
  }
  return '待处理'
})

// 返回上一页
const navigateBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    // 如果没有上一页，跳转到首页
    uni.switchTab({
      url: '/pages/index/index'
    })
  }
}

// 格式化时间
const formatTime = (timeStr) => {
  return new Date(timeStr).toLocaleString()
}

// 联系客服
const contactService = () => {
  showContactService()
}

</script>

<style scoped>
.order-detail-container {
  padding-bottom: 100rpx;
  background-color: #f7f7f7;
  min-height: 100vh;
}

.nav-bar {
  height: 88rpx;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  padding-top: calc(env(safe-area-inset-top) + 30rpx);
  padding-bottom: 20rpx;
  background-color: #fff;
  position: relative;
  border-bottom: 1rpx solid #f1f1f1;
  z-index: 999;
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
.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 34rpx;
  font-weight: 500;
}

.order-card {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 12rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
}

.order-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx dashed #eee;
  margin-bottom: 20rpx;
}
.order-no-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 20rpx 30rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
}
.order-no {
  color: #333;
  font-size: 32rpx;
  font-weight: bold;
}
.order-status {
  color: #e93b3d;
  font-size: 43rpx;
  font-weight: bold;
}

.section-title {
  font-size: 28rpx;
  color: #333;
  margin: 20rpx 0;
  font-weight: bold;
}
.product-item {
  display: flex;
  margin-bottom: 30rpx;
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
.product-name-wrapper {
  display: flex;
  align-items: flex-start;
  position: relative;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.product-name {
  font-size: 28rpx;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  flex: 1;
  min-width: 0;
  padding-right: 120rpx;
}

.price-line {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  position: absolute;
  right: 0;
  bottom: 0;
}

.product-price {
  color: #e93b3d;
  font-size: 30rpx;
  font-weight: bold;
}

.product-quantity {
  color: #666;
  font-size: 24rpx;
}

.product-spec {
  font-size: 22rpx;
  color: #666;
  margin-left: 8rpx;
  font-weight: normal;
  flex-shrink: 0;
}

.product-unit {
  color: #666;
  font-size: 24rpx;
}
.total-price {
  margin-top: 8rpx;
}
.total-price-text {
  font-size: 24rpx;
  color: #666;
}

.order-info {
  margin-top: 40rpx;
  border-top: 1rpx dashed #eee;
  padding-top: 20rpx;
}
.info-row {
  display: flex;
  margin-bottom: 20rpx;
  font-size: 28rpx;
}
.info-label {
  width: 160rpx;
  color: #666;
}
.info-value {
  flex: 1;
}

.amount-summary {
  margin-top: 30rpx;
  border-top: 1rpx dashed #eee;
  padding-top: 20rpx;
}
.amount-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15rpx;
  font-size: 28rpx;
}
.total-row {
  font-weight: bold;
  color: #e93b3d;
  margin-top: 10rpx;
  font-size: 32rpx;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 30rpx;
  box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.05);
  gap: 20rpx;
}
.action-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  font-size: 28rpx;
  border: none;
  text-align: center;
}
.share-btn {
  background-color: #ff9500;
  color: #fff;
}
.contact-btn {
  background-color: #fff;
  color: #666;
  border: 1rpx solid #ddd;
}
</style>
