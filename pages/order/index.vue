<template>
  <view class="container">
    <view class="header">
      <text class="title">我的订单</text>
    </view>
    
    <!-- 订单状态选项卡 -->
    <view class="order-tabs">
      <text 
        v-for="tab in tabs" 
        :key="tab.status" 
        class="tab" 
        :class="{ active: activeTab === tab.status }"
        @click="changeTab(tab.status)"
      >
        {{ tab.name }}
      </text>
    </view>
    
    <!-- 订单列表 -->
    <scroll-view class="order-list" scroll-y>
      <view v-if="orders.length > 0">
        <view 
          v-for="order in orders" 
          :key="order.id" 
          class="order-item"
          @click="viewOrderDetail(order.id)"
        >
          <view class="order-header">
            <text class="order-no">订单号: {{ order.order_no }}</text>
            <text class="order-status">{{ getStatusText(order.order_status) }}</text>
          </view>
          
          <view class="order-body">
            <view v-for="item in order.order_items" :key="item.id" class="order-product">
              <image class="product-image" :src="item.product_image" mode="aspectFill" />
              <view class="product-info">
                <text class="product-name">{{ item.product_name }}</text>
                <text class="product-price">¥{{ item.product_price }}</text>
                <text class="product-quantity">x{{ item.quantity }}</text>
              </view>
            </view>
          </view>
          
          <view class="order-footer">
            <text class="total-amount">共{{ order.order_items.length }}件商品 合计: ¥{{ order.total_amount }}</text>
            
            <view class="action-buttons">
              <button 
                v-if="order.order_status === 1" 
                class="action-btn pay-btn"
                @click.stop="payOrder(order.id)"
              >
                去支付
              </button>
              <button 
                v-if="order.order_status === 1" 
                class="action-btn cancel-btn"
                @click.stop="cancelOrder(order.id)"
              >
                取消订单
              </button>
              <button 
                v-if="order.order_status === 3" 
                class="action-btn confirm-btn"
                @click.stop="confirmReceipt(order.id)"
              >
                确认收货
              </button>
              <button 
                v-if="order.order_status === 4 || order.order_status === 5" 
                class="action-btn view-btn"
                @click.stop="viewOrderDetail(order.id)"
              >
                查看详情
              </button>
            </view>
          </view>
        </view>
        
        <view class="load-more" @click="loadMore" v-if="hasMore">
          {{ loading ? '加载中...' : '点击加载更多' }}
        </view>
      </view>
      
      <view v-else class="empty-order">
        <image src="/static/images/empty-order.png" mode="aspectFit"></image>
        <text class="tip">暂无订单</text>
        <button class="btn" @click="goToIndex">去逛逛</button>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { getOrderList, cancelOrder, confirmReceipt } from '@/api/order.js'

export default {
  data() {
    return {
      tabs: [
        { name: '全部', status: 0 },
        { name: '待付款', status: 1 },
        { name: '待发货', status: 2 },
        { name: '待收货', status: 3 },
        { name: '已完成', status: 5 }
      ],
      activeTab: 0,
      orders: [],
      page: 1,
      pageSize: 10,
      loading: false,
      hasMore: true
    }
  },
  onLoad() {
    this.loadOrders()
  },
  onShow() {
    // 从订单确认页返回时刷新数据
    this.refreshOrders()
  },
  methods: {
    // 切换订单状态选项卡
    changeTab(status) {
      this.activeTab = status
      this.page = 1
      this.hasMore = true
      this.orders = []
      this.loadOrders()
    },
    
    // 加载订单数据
    async loadOrders() {
      if (this.loading || !this.hasMore) return
      
      this.loading = true
      try {
        const res = await getOrderList({
          status: this.activeTab === 0 ? undefined : this.activeTab,
          page: this.page,
          page_size: this.pageSize
        })
        
        if (res.code === 0) {
          const newOrders = res.data.list || []
          this.orders = [...this.orders, ...newOrders]
          this.hasMore = newOrders.length >= this.pageSize
          this.page++
        }
      } catch (err) {
        console.error('获取订单失败:', err)
        uni.showToast({
          title: '获取订单失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 刷新订单数据
    async refreshOrders() {
      this.page = 1
      this.hasMore = true
      this.orders = []
      await this.loadOrders()
    },
    
    // 加载更多订单
    loadMore() {
      if (!this.loading && this.hasMore) {
        this.loadOrders()
      }
    },
    
    // 获取订单状态文本
    getStatusText(status) {
      const statusMap = {
        1: '待付款',
        2: '待发货',
        3: '待收货',
        4: '已取消',
        5: '已完成'
      }
      return statusMap[status] || '未知状态'
    },
    
    // 跳转到首页
    goToIndex() {
      uni.switchTab({
        url: '/pages/index/index'
      })
    },
    
    // 查看订单详情
    viewOrderDetail(orderId) {
      uni.navigateTo({
        url: `/pages/order/detail?id=${orderId}`
      })
    },
    
    // 支付订单
    payOrder(orderId) {
      uni.navigateTo({
        url: `/pages/order/pay?id=${orderId}`
      })
    },
    
    // 取消订单
    async cancelOrder(orderId) {
      uni.showModal({
        title: '提示',
        content: '确定要取消该订单吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const res = await cancelOrder(orderId)
              if (res.code === 0) {
                uni.showToast({
                  title: '订单已取消',
                  icon: 'success'
                })
                this.refreshOrders()
              }
            } catch (err) {
              console.error('取消订单失败:', err)
              uni.showToast({
                title: '取消订单失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    // 确认收货
    async confirmReceipt(orderId) {
      uni.showModal({
        title: '提示',
        content: '请确认已收到商品，确认后将完成订单',
        success: async (res) => {
          if (res.confirm) {
            try {
              const res = await confirmReceipt({ order_id: orderId })
              if (res.code === 0) {
                uni.showToast({
                  title: '确认收货成功',
                  icon: 'success'
                })
                this.refreshOrders()
              }
            } catch (err) {
              console.error('确认收货失败:', err)
              uni.showToast({
                title: '确认收货失败',
                icon: 'none'
              })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20rpx;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20rpx 0;
  text-align: center;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
}

.order-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  margin-bottom: 20rpx;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
}

.tab.active {
  color: #e93b3d;
  font-weight: bold;
  position: relative;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #e93b3d;
}

.order-list {
  flex: 1;
  overflow: hidden;
}

.order-item {
  background-color: #fff;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.order-no {
  font-size: 26rpx;
  color: #666;
}

.order-status {
  font-size: 26rpx;
  color: #e93b3d;
}

.order-body {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.order-product {
  display: flex;
  margin-bottom: 20rpx;
}

.order-product:last-child {
  margin-bottom: 0;
}

.product-image {
  width: 120rpx;
  height: 120rpx;
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

.product-price {
  font-size: 28rpx;
  color: #e93b3d;
}

.product-quantity {
  font-size: 24rpx;
  color: #999;
  text-align: right;
}

.order-footer {
  padding-top: 20rpx;
}

.total-amount {
  display: block;
  text-align: right;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  height: 60rpx;
  line-height: 60rpx;
  font-size: 26rpx;
  padding: 0 30rpx;
  margin-left: 20rpx;
  border-radius: 30rpx;
}

.pay-btn {
  background-color: #e93b3d;
  color: #fff;
}

.cancel-btn {
  background-color: #fff;
  color: #666;
  border: 1rpx solid #ddd;
}

.confirm-btn {
  background-color: #fff;
  color: #e93b3d;
  border: 1rpx solid #e93b3d;
}

.view-btn {
  background-color: #fff;
  color: #666;
  border: 1rpx solid #ddd;
}

.empty-order {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100rpx;
}

.empty-order image {
  width: 300rpx;
  height: 300rpx;
  margin-bottom: 30rpx;
}

.tip {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 30rpx;
}

.btn {
  width: 200rpx;
  height: 70rpx;
  line-height: 70rpx;
  background-color: #e93b3d;
  color: #fff;
  font-size: 28rpx;
}

.load-more {
  text-align: center;
  padding: 30rpx 0;
  font-size: 26rpx;
  color: #999;
}
</style>