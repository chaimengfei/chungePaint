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
              <text class="total-price-text">小计: ¥{{ item.total_price }}</text>
            </view>
            <text v-if="item.unit" class="product-unit">{{ item.unit }}</text>
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
        <view class="amount-row total-row">
          <text>实付金额</text>
          <text>¥{{ order.payment_amount }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button class="action-btn share-btn" @click="shareOrder">分享</button>
      <button class="action-btn rebuy-btn" @click="rebuyOrder">再次下单</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { getOrderDetail } from '@/api/order.js'
import { rebuyOrder as rebuyOrderApi } from '@/api/order.js'

const order = ref({
  items: [],
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

// 分享给朋友（页面级分享）
onShareAppMessage(() => {
  return {
    title: `订单详情 - ${order.value.order_no || ''}`,
    desc: `订单金额：¥${order.value.payment_amount || 0}`,
    path: `/pages/order/detail?order_no=${order.value.order_no || ''}`,
    imageUrl: '' // 可以设置分享图片
  }
})

// 计算订单状态
const statusText = computed(() => {
  const statusMap = {
    1: '待付款',
    2: '已付款'
  }
  return statusMap[order.value.order_status] || '未知状态'
})

// 计算支付方式
const paymentTypeText = computed(() => {
  // 支付方式映射: 1:线下转账, 2:余额支付, 3:微信支付, 4:余额+线下组合支付
  const paymentTypeMap = {
    1: '线下转账',
    2: '余额支付',
    3: '微信支付',
    4: '混合支付'
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

// 分享订单
const shareOrder = () => {
  // 触发分享功能
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  })
  
  // 提示用户使用右上角分享
  uni.showToast({
    title: '请点击右上角分享',
    icon: 'none',
    duration: 2000
  })
}

// 再次下单
const rebuyOrder = async () => {
  if (!order.value.order_no) {
    uni.showToast({
      title: '订单号缺失',
      icon: 'none'
    })
    return
  }
  
  uni.showLoading({
    title: '正在加入购物车...'
  })
  
  try {
    const res = await rebuyOrderApi(order.value.order_no)
    
    if (res.code === 0) {
      uni.hideLoading()
      uni.showToast({
        title: res.message || '商品已加入购物车',
        icon: 'success'
      })
      
      // 延迟跳转到购物车页面
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/draft/index'
        })
      }, 1000)
    } else {
      uni.hideLoading()
      uni.showToast({
        title: res.message || '加入购物车失败',
        icon: 'none',
        duration: 2000
      })
    }
  } catch (err) {
    console.error('再次下单失败:', err)
    uni.hideLoading()
    const errorMsg = err.message || '加入购物车失败'
    uni.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 2000
    })
  }
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