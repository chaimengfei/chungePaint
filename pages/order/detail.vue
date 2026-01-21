<template>
  <view class="order-detail-container">
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="navigateBack">
        <image src="/static/images/back.png" mode="aspectFit" class="back-icon"/>
      </view>
      <text class="nav-title">询价详情</text>
    </view>

    <!-- 订单卡片 -->
    <view class="order-card">
      <view class="order-header">
        <text class="order-status">{{ statusText }}</text>
        <view class="order-no-wrapper">
          <text class="order-no">询价单号：{{ order.order_no }}</text>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="product-list">
        <view class="section-title">商品信息</view>
        <view v-for="item in order.items" :key="item.id" class="product-item">
          <image class="product-image" :src="item.product_image || '/static/images/empty-cart.png'" mode="aspectFill"/>
          <view class="product-info">
            <text class="product-name">{{ item.product_name }}</text>
            <text v-if="item.specification" class="product-spec">{{ item.specification }}</text>
            <view class="price-line">
              <text class="product-price">¥{{ item.unit_price }}</text>
              <text class="product-quantity">×{{ item.quantity }}</text>
            </view>
            <view class="total-price">
              <text class="total-price-text">参考小计: ¥{{ item.total_price }}</text>
            </view>
            <text v-if="item.unit" class="product-unit">{{ item.unit }}</text>
          </view>
        </view>
      </view>

      <!-- 询价信息 -->
      <view class="order-info">
        <view class="info-row">
          <text class="info-label">创建时间</text>
          <text class="info-value">{{ formatTime(order.created_at) }}</text>
        </view>
        <view v-if="order.note" class="info-row">
          <text class="info-label">需求备注</text>
          <text class="info-value">{{ order.note }}</text>
        </view>
        <view v-if="order.final_quote" class="info-row">
          <text class="info-label">最终报价</text>
          <text class="info-value">¥{{ (order.final_quote / 100).toFixed(2) }}</text>
        </view>
      </view>

      <!-- 金额汇总 -->
      <view class="amount-summary">
        <view class="amount-row">
          <text>预估总计</text>
          <text>¥{{ order.total_amount }}</text>
        </view>
        <view v-if="order.final_quote" class="amount-row">
          <text>最终报价</text>
          <text>¥{{ (order.final_quote / 100).toFixed(2) }}</text>
        </view>
        <view class="amount-row total-row">
          <text>合计参考金额</text>
          <text>¥{{ order.payment_amount }}</text>
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
import { getInquiryDetail } from '@/api/order.js'

const order = ref({
  items: [],
  order_status: 0,
  payment_type: 0,
  payment_status: 0,
  total_amount: 0,
  shipping_fee: 0,
  payment_amount: 0,
  created_at: '',
  order_no: '',
  id: 0
})

const isInquiry = ref(true) // 默认为询价单

// 加载询价详情
const loadInquiryData = async (inquiryNo) => {
  try {
    const res = await getInquiryDetail(inquiryNo)
    if (res.code === 0) {
      const inquiryData = res.data
      // 将询价数据转换为订单格式，方便复用显示逻辑
      order.value = {
        items: inquiryData.items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          specification: item.specification || item.unit,
          unit_price: (item.reference_unit_price / 100).toFixed(2), // 分转元
          total_price: (item.reference_total / 100).toFixed(2), // 分转元
          quantity: item.quantity,
          unit: item.unit,
          remark: item.remark
        })),
        order_no: inquiryData.inquiry_no,
        total_amount: inquiryData.estimated_total ? (inquiryData.estimated_total / 100).toFixed(2) : '0.00',
        payment_amount: inquiryData.final_quote ? (inquiryData.final_quote / 100).toFixed(2) : inquiryData.estimated_total ? (inquiryData.estimated_total / 100).toFixed(2) : '0.00',
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
  const inquiryNo = options.inquiry_no || options.order_no
  
  if (inquiryNo) {
    // 询价单
    loadInquiryData(inquiryNo)
  } else {
    uni.showToast({ title: '询价单号缺失', icon: 'none' })
  }
})

// 分享给朋友（页面级分享） - 使用 inquiry_no 即可（接口无需认证）
onShareAppMessage(() => {
  return {
    title: `询价详情 - ${order.value.order_no || ''}`,
    desc: `询价单号：${order.value.order_no || ''}`,
    path: `/pages/order/detail?inquiry_no=${order.value.order_no || ''}`,
    imageUrl: '' // 可选：分享卡片图片
  }
})

// 计算询价状态
const statusText = computed(() => {
  // 询价单状态
  if (order.value.final_quote) {
    return '已报价'
  }
  return '待处理'
})


// 返回上一页
const navigateBack = () => {
  uni.navigateBack()
}

// 格式化时间
const formatTime = (timeStr) => {
  return new Date(timeStr).toLocaleString()
}


// 联系客服
const contactService = () => {
  const servicePhone = '131-6162-1688'
  uni.showActionSheet({
    itemList: [servicePhone, '呼叫', '取消'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 点击电话号码，复制到剪贴板
        uni.setClipboardData({
          data: servicePhone.replace(/-/g, ''),
          success: () => {
            uni.showToast({
              title: '电话号码已复制',
              icon: 'success'
            })
          }
        })
      } else if (res.tapIndex === 1) {
        // 点击呼叫，直接拨打电话
        uni.makePhoneCall({
          phoneNumber: servicePhone.replace(/-/g, ''),
          success: () => {
            console.log('拨打电话成功')
          },
          fail: (err) => {
            console.error('拨打电话失败:', err)
            uni.showToast({
              title: '拨打电话失败',
              icon: 'none'
            })
          }
        })
      }
    }
  })
}

</script>

<style scoped>
.order-detail-container {
  padding-bottom: 100rpx;
  background-color: #f7f7f7;
  min-height: 100vh;
}

/* 导航栏样式 */
.nav-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  background-color: #fff;
  position: relative;
  border-bottom: 1rpx solid #f1f1f1;
}
.nav-back {
  width: 60rpx;
  height: 100%;
  display: flex;
  align-items: center;
}
.back-icon {
  width: 40rpx;
  height: 40rpx;
}
.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 34rpx;
  font-weight: 500;
}

/* 订单卡片 */
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

/* 商品列表 */
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
.product-name {
  font-size: 28rpx;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.price-line {
  display: flex;
  justify-content: space-between;
}
.product-price {
  color: #e93b3d;
  font-size: 30rpx;
  font-weight: bold;
}
.product-quantity {
  color: #999;
}
.product-spec {
  font-size: 24rpx;
  color: #999;
  margin: 8rpx 0;
}
.product-unit {
  color: #999;
  font-size: 24rpx;
}
.total-price {
  margin-top: 8rpx;
}
.total-price-text {
  font-size: 24rpx;
  color: #999;
}

/* 订单信息 */
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
  color: #999;
}
.info-value {
  flex: 1;
}
.payment-status {
  color: #999;
  font-size: 24rpx;
  margin-left: 10rpx;
}

/* 金额汇总 */
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

/* 操作按钮 */
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
.rebuy-btn {
  background-color: #00c896;
  color: #fff;
}
.secondary {
  background-color: #fff;
  color: #666;
  border: 1rpx solid #ddd;
}
.primary {
  background-color: #e93b3d;
  color: #fff;
}
</style>