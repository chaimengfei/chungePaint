<template>
  <view class="order-detail-container">
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="navigateBack">
        <image src="/static/images/back.png" mode="aspectFit" class="back-icon"/>
      </view>
      <text class="nav-title">订单详情</text>
    </view>

    <!-- 订单卡片 -->
    <view class="order-card">
      <view class="order-header">
        <text class="order-status">{{ statusText }}</text>
        <view class="order-no-wrapper">
          <text class="order-no">订单号：{{ order.order_no }}</text>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="product-list">
        <view class="section-title">商品信息</view>
        <view v-for="item in order.order_items" :key="item.id" class="product-item">
          <image class="product-image" :src="item.product_image" mode="aspectFill"/>
          <view class="product-info">
            <text class="product-name">{{ item.product_name }}</text>
            <view class="price-line">
              <text class="product-price">¥{{ item.product_price }}</text>
              <text class="product-quantity">x{{ item.quantity }}</text>
            </view>
            <text class="product-unit">{{ item.unit }}</text>
          </view>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="order-info">
        <view class="info-row">
          <text class="info-label">创建时间</text>
          <text class="info-value">{{ formatTime(order.created_at) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">支付方式</text>
          <text class="info-value">{{ paymentTypeText }}<text v-if="paymentStatusText" class="payment-status">（{{ paymentStatusText }}）</text></text>
        </view>
        <view class="info-row">
          <text class="info-label">收货信息</text>
          <text class="info-value">{{ order.receiver_name }} {{ order.receiver_phone }}</text>
        </view>
        <view class="info-row address-row">
          <text class="info-value">{{ order.receiver_address }}</text>
        </view>
      </view>

      <!-- 金额汇总 -->
      <view class="amount-summary">
        <view class="amount-row">
          <text>商品总额</text>
          <text>¥{{ order.total_amount }}</text>
        </view>
        <view class="amount-row">
          <text>运费</text>
          <text>¥{{ order.shipping_fee || 0 }}</text>
        </view>
        <view class="amount-row total-row">
          <text>实付金额</text>
          <text>¥{{ order.payment_amount }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar" v-if="order.order_status === 1">
      <button class="action-btn secondary" @click="cancelOrderFn">取消订单</button>
      <button class="action-btn primary" @click="payOrder">立即支付</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getOrderDetail, cancelOrder } from '@/api/order.js'

const order = ref({
  order_items: [],
  receiver_name: '',
  receiver_phone: '',
  receiver_address: '',
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

// 加载订单详情
const loadData = async (orderNo) => {
  try {
    const res = await getOrderDetail(orderNo)
    if (res.code === 0) {
      order.value = res.data
    }
  } catch (err) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

// 页面加载
onLoad((options) => {
  const orderNo = options.order_no
  if (!orderNo) {
    uni.showToast({ title: '订单号缺失', icon: 'none' })
    return
  }
  loadData(orderNo)
})

// 计算订单状态
const statusText = computed(() => {
  const statusMap = {
    1: '待付款',
    2: '已支付',
    3: '待收货',
    4: '已取消',
    5: '已完成'
  }
  return statusMap[order.value.order_status] || '未知状态'
})

// 计算支付方式
const paymentTypeText = computed(() => {
  // 支付方式映射: 1:微信支付, 2:支付宝, 3:余额支付
  const paymentTypeMap = {
    1: '微信支付',
    2: '支付宝',
    3: '余额支付'
  }
  
  // 如果有支付方式字段，显示具体支付方式
  if (order.value.payment_type && order.value.payment_type > 0) {
    return paymentTypeMap[order.value.payment_type] || '未知支付方式'
  }
  
  // 如果订单状态不是"待付款"(1)，说明已支付，但不知道支付方式
  if (order.value.order_status !== 1) {
    return '已支付'
  }
  
  // 订单状态是"待付款"，显示未支付
  return '未支付'
})

// 计算支付状态
const paymentStatusText = computed(() => {
  // 支付状态映射: 1:未支付, 2:支付中, 3:已支付, 4:退款中, 5:已退款, 6:支付失败
  const paymentStatusMap = {
    1: '未支付',
    2: '支付中',
    3: '已支付',
    4: '退款中',
    5: '已退款',
    6: '支付失败'
  }
  
  // 如果有支付状态字段，显示支付状态
  if (order.value.payment_status && order.value.payment_status > 0) {
    return paymentStatusMap[order.value.payment_status] || ''
  }
  
  return ''
})

// 返回上一页
const navigateBack = () => {
  uni.navigateBack()
}

// 格式化时间
const formatTime = (timeStr) => {
  return new Date(timeStr).toLocaleString()
}

// 取消订单
const cancelOrderFn = () => {
  uni.showModal({
    title: '确认取消订单？',
    success: async (res) => {
      if (res.confirm) {
        await cancelOrder(order.value.order_no)
        uni.showToast({ title: '已取消' })
        loadData(order.value.order_no)
      }
    }
  })
}

// 去支付
const payOrder = () => {
  uni.navigateTo({
    url: `/pages/order/pay?id=${order.value.id}`
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
.product-unit {
  color: #999;
  font-size: 24rpx;
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
.address-row {
  margin-top: -15rpx;
  padding-left: 160rpx;
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
  justify-content: flex-end;
  padding: 0 30rpx;
  box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.05);
}
.action-btn {
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  font-size: 28rpx;
  margin-left: 20rpx;
  padding: 0 40rpx;
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