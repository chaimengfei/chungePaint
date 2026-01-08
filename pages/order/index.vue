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
          @click="viewOrderDetail(order.order_no)"
        >
          <view class="order-header">
            <text class="order-no">订单号: {{ order.order_no }}</text>
            <view class="header-right">
              <text class="order-status">{{ getStatusText(order.order_status) }}</text>
              <!-- 已付款订单在头部显示"查看详情"链接 -->
              <text 
                v-if="order.order_status === 2" 
                class="view-detail-link"
                @click.stop="viewOrderDetail(order.order_no)"
              >
                查看详情 >
              </text>
            </view>
          </view>
          
          <view class="order-body">
            <!-- 只显示前2个商品 -->
            <view v-for="item in getDisplayItems(order.items)" :key="item.id" class="order-product">
              <image class="product-image" :src="item.product_image || '/static/images/empty-cart.png'" mode="aspectFill" />
              <view class="product-info">
                <text class="product-name">{{ item.product_name }}</text>
                <view class="price-quantity">
                  <text class="product-price">¥{{ item.unit_price }}</text>
                  <text class="product-quantity">×{{ item.quantity }}</text>
                </view>
              </view>
            </view>
            <!-- 如果商品数量超过2个，显示"还有X件商品"提示 -->
            <view v-if="order.items && order.items.length > 2" class="more-products-tip">
              <text class="more-text">还有 {{ order.items.length - 2 }} 件商品，点击查看详情</text>
            </view>
          </view>
          
          <view class="order-footer">
            <text class="total-amount">共{{ order.items ? order.items.length : 0 }}件商品 合计: ¥{{ order.total_amount }}</text>
            
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
                @click.stop="cancelOrder(order.order_no)"
              >
                取消订单
              </button>
              <!-- 已付款订单显示"再次购买"按钮 -->
              <button 
                v-if="order.order_status === 2" 
                class="action-btn buy-again-btn"
                @click.stop="buyAgain(order)"
              >
                再次购买
              </button>
            </view>
          </view>
        </view>
        
        <view class="load-more" v-if="hasMore">
          {{ loading ? '加载中...' : '上拉加载更多' }}
        </view>
        <view class="load-more" v-else-if="orders.length > 0">
          没有更多订单了
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
import { addToCart } from '@/api/cart.js'

export default {
  data() {
    return {
      tabs: [
        { name: '全部', status: 0 },
        { name: '待付款', status: 1 },
        { name: '已付款', status: 2 }
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
    // 检查是否首次登录（没有token）
    const token = uni.getStorageSync('token')
    if (!token) {
      // 显示确认提示
      uni.showModal({
        title: '提示',
        content: '您还未登录，是否注册登录？',
        success: (res) => {
          if (res.confirm) {
            // 用户确认，跳转到登录页
            uni.navigateTo({
              url: '/pages/user/login'
            })
          } else {
            // 用户取消，停留在当前页面（订单页面，只是没有订单数据）
            // 不进行任何跳转，只清空订单数据
            this.orders = []
          }
        }
      })
      return
    }
    this.loadOrders()
  },
  onShow() {
    // 检查是否首次登录（没有token）
    const token = uni.getStorageSync('token')
    if (!token) {
      // 显示确认提示
      uni.showModal({
        title: '提示',
        content: '您还未登录，是否注册登录？',
        success: (res) => {
          if (res.confirm) {
            // 用户确认，跳转到登录页
            uni.navigateTo({
              url: '/pages/user/login'
            })
          } else {
            // 用户取消，停留在当前页面（订单页面，只是没有订单数据）
            // 不进行任何跳转，只清空订单数据
            this.orders = []
          }
        }
      })
      return
    }
    // 从订单确认页返回时刷新数据
    this.refreshOrders()
  },
  onReachBottom() {
    // 滚动到底部时自动加载更多
    if (!this.loading && this.hasMore) {
      this.loadOrders()
    }
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
        const params = {
          page: this.page,
          page_size: this.pageSize
        }
        
        // status: 0=全部, 1=待付款, 2=已付款
        if (this.activeTab !== 0) {
          params.status = this.activeTab
        }
        
        const res = await getOrderList(params)
        
        if (res.code === 0) {
          const newOrders = res.data.list || []
          if (this.page === 1) {
            this.orders = newOrders
          } else {
            this.orders = [...this.orders, ...newOrders]
          }
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
        2: '已付款',
        3: '待收货',
        4: '已取消',
        5: '已完成'
      }
      return statusMap[status] || '未知状态'
    },
    
    // 获取要显示的商品列表（最多显示2个）
    getDisplayItems(items) {
      if (!items || items.length === 0) {
        return []
      }
      // 只返回前2个商品
      return items.slice(0, 2)
    },
    
    // 跳转到首页
    goToIndex() {
      uni.switchTab({
        url: '/pages/index/index'
      })
    },
    
    // 查看订单详情
    viewOrderDetail(orderNo) {
      uni.navigateTo({
        url: `/pages/order/detail?order_no=${orderNo}`
      })
    },
    
    // 支付订单
    payOrder(orderId) {
      uni.navigateTo({
        url: `/pages/order/pay?id=${orderId}`
      })
    },
    
    // 取消订单
    async cancelOrder(orderNo) {
      uni.showModal({
        title: '提示',
        content: '确定要取消该订单吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const res = await cancelOrder(orderNo)
              if (res.code === 0) {
                uni.showToast({
                  title: '订单已取消',
                  icon: 'success'
                })
                this.refreshOrders()
              }
            } catch (err) {
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
              uni.showToast({
                title: '确认收货失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    // 再次购买：将订单中的所有商品加入购物车
    async buyAgain(order) {
      if (!order.items || order.items.length === 0) {
        uni.showToast({
          title: '订单中没有商品',
          icon: 'none'
        })
        return
      }
      
      uni.showLoading({
        title: '正在加入购物车...'
      })
      
      try {
        // 遍历订单中的所有商品，逐个加入购物车
        const promises = order.items.map(item => {
          return addToCart({
            product_id: item.product_id,
            quantity: item.quantity
          })
        })
        
        // 等待所有商品都加入购物车
        const results = await Promise.all(promises)
        
        // 检查是否有失败的（API返回格式是 res.data.code）
        const failedItems = results.filter(res => !res.data || res.data.code !== 0)
        
        if (failedItems.length > 0) {
          uni.hideLoading()
          uni.showToast({
            title: '部分商品加入购物车失败',
            icon: 'none',
            duration: 2000
          })
          return
        }
        
        uni.hideLoading()
        uni.showToast({
          title: '已加入购物车',
          icon: 'success'
        })
        
        // 延迟跳转到购物车页面
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/cart/index'
          })
        }, 1000)
      } catch (err) {
        console.error('再次购买失败:', err)
        uni.hideLoading()
        uni.showToast({
          title: '加入购物车失败',
          icon: 'none'
        })
      }
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
  align-items: center;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.order-no {
  font-size: 26rpx;
  color: #666;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.order-status {
  font-size: 26rpx;
  color: #e93b3d;
}

.view-detail-link {
  font-size: 24rpx;
  color: #999;
  cursor: pointer;
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

.more-products-tip {
  padding: 15rpx 0;
  text-align: center;
  border-top: 1rpx dashed #e5e5e5;
  margin-top: 15rpx;
  background-color: #fafafa;
  border-radius: 8rpx;
}

.more-text {
  font-size: 24rpx;
  color: #666;
  position: relative;
  padding-right: 30rpx;
}

.more-text::after {
  content: '>';
  position: absolute;
  right: 0;
  color: #999;
  font-size: 20rpx;
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

.price-quantity {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10rpx;
}

.product-price {
  font-size: 28rpx;
  color: #e93b3d;
  font-weight: bold;
}

.product-quantity {
  font-size: 24rpx;
  color: #999;
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

.buy-again-btn {
  background-color: #e93b3d;
  color: #fff;
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