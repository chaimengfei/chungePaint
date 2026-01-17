<template>
  <view class="container">
    <view class="header">
      <text class="title">我的询价</text>
    </view>
    
    <!-- 询价状态选项卡 -->
    <view class="order-tabs">
      <text 
        v-for="tab in tabs" 
        :key="tab.status" 
        class="tab" 
        :class="{ 
          active: activeTab === tab.status,
          'tab-all': tab.status === 0
        }"
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
            <text class="order-no">询价单号：{{ order.order_no }}</text>
            <view class="header-right">
              <text class="order-status">[状态：{{ getStatusText(order) }}]</text>
            </view>
          </view>
          
          <view class="inquiry-time">
            <text class="time-label">**提交时间：**</text>
            <text class="time-value">{{ formatTime(order.created_at) }}</text>
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
            <view class="total-amount">
              <text class="amount-label">**合计参考金额：**</text>
              <text class="amount-value">¥{{ order.total_amount }}</text>
            </view>
            
            <!-- 客服备注 -->
            <view v-if="order.remark" class="service-remark">
              <text class="remark-label">**客服备注：**</text>
              <text class="remark-text">{{ order.remark }}</text>
            </view>
            
            <!-- 已报价显示报价信息 -->
            <view v-if="order.order_status === 2" class="quote-info">
              <text class="quote-label">**客服报价：**</text>
              <text class="quote-value">¥{{ order.payment_amount || order.total_amount }}</text>
              <text v-if="order.quote_note" class="quote-note">({{ order.quote_note }})</text>
            </view>
            
            <view class="action-buttons">
              <!-- 待处理状态：显示联系客服按钮 -->
              <button 
                v-if="order.order_status === 1" 
                class="action-btn contact-btn"
                @click.stop="contactService(order)"
              >
                📞 联系客服
              </button>
              <!-- 已报价状态：显示查看报价单和联系下单按钮 -->
              <button 
                v-if="order.order_status === 2" 
                class="action-btn view-quote-btn"
                @click.stop="viewOrderDetail(order.order_no)"
              >
                💬 查看报价单
              </button>
              <button 
                v-if="order.order_status === 2" 
                class="action-btn contact-order-btn"
                @click.stop="contactService(order)"
              >
                📞 联系下单
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
import { getOrderList, confirmReceipt, rebuyOrder } from '@/api/order.js'

export default {
  data() {
    return {
      tabs: [
        { name: '全部', status: 0 },
        { name: '待处理', status: 1 },
        { name: '已报价', status: 2 },
        { name: '已完成', status: 3 }
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
    // 重新启动定时检查
    this.startOrderCheckTimer()
  },
  onUnload() {
    // 页面卸载时的清理工作
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
      const startTime = Date.now()
      console.log(`[订单列表] 开始加载 - 页码: ${this.page}, 状态: ${this.activeTab}`)
      
      try {
        const params = {
          page: this.page,
          page_size: this.pageSize
        }
        
        // status: 0=全部, 1=待付款, 2=已付款
        if (this.activeTab !== 0) {
          params.status = this.activeTab
        }
        
        const requestStartTime = Date.now()
        const res = await getOrderList(params)
        const requestEndTime = Date.now()
        const requestDuration = requestEndTime - requestStartTime
        
        console.log(`[订单列表] API请求耗时: ${requestDuration}ms`)
        console.log(`[订单列表] API返回数据量: ${res.data?.list?.length || 0} 条`)
        
        if (res.code === 0) {
          const processStartTime = Date.now()
          const newOrders = res.data.list || []
          if (this.page === 1) {
            this.orders = newOrders
          } else {
            this.orders = [...this.orders, ...newOrders]
          }
          this.hasMore = newOrders.length >= this.pageSize
          this.page++
          const processEndTime = Date.now()
          const processDuration = processEndTime - processStartTime
          
          const totalDuration = Date.now() - startTime
          console.log(`[订单列表] 数据处理耗时: ${processDuration}ms`)
          console.log(`[订单列表] 总耗时: ${totalDuration}ms (API: ${requestDuration}ms, 处理: ${processDuration}ms)`)
        }
      } catch (err) {
        const totalDuration = Date.now() - startTime
        console.error(`[订单列表] 获取订单失败 (总耗时: ${totalDuration}ms):`, err)
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
    
    // 格式化时间
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}/${month}/${day} ${hours}:${minutes}`
    },
    
    // 获取询价状态文本
    getStatusText(order) {
      // 如果传入的是订单对象
      if (typeof order === 'object' && order !== null) {
        const status = order.order_status
        
        // 询价状态映射
        const statusMap = {
          1: '待处理',
          2: '已报价',
          3: '已完成'
        }
        return statusMap[status] || '未知状态'
      }
      
      // 兼容旧代码：如果传入的是数字
      const statusMap = {
        1: '待处理',
        2: '已报价',
        3: '已完成'
      }
      return statusMap[order] || '未知状态'
    },
    
    // 联系客服
    contactService(order) {
      // 可以跳转到客服页面或拨打电话
      uni.makePhoneCall({
        phoneNumber: '13161621688',
        success: () => {
          console.log('拨打电话成功')
        },
        fail: (err) => {
          console.log('拨打电话失败:', err)
          uni.showToast({
            title: '请手动拨打客服电话：13161621688',
            icon: 'none',
            duration: 3000
          })
        }
      })
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
    
    // 再次购买：将已完成订单中的商品重新加入购物车
    async buyAgain(order) {
      if (!order.order_no) {
        uni.showToast({
          title: '订单号缺失',
          icon: 'none'
        })
        return
      }
      
      // 检查订单状态，只能对已完成的订单（order_status = 2）进行再次购买
      if (order.order_status !== 2) {
        uni.showToast({
          title: '只能对已完成的订单进行再次购买',
          icon: 'none'
        })
        return
      }
      
      uni.showLoading({
        title: '正在加入购物车...'
      })
      
      try {
        const res = await rebuyOrder(order.order_no)
        
        if (res.code === 0) {
          uni.hideLoading()
          uni.showToast({
            title: res.message || '商品已加入购物车',
            icon: 'success'
          })
          
          // 延迟跳转到购物车页面
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/cart/index'
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
        console.error('再次购买失败:', err)
        uni.hideLoading()
        const errorMsg = err.message || '加入购物车失败'
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
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

.tab-all {
  font-size: 32rpx;
  font-weight: bold;
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
  position: relative;
}

/* 禁用状态的红色按钮，添加红色遮罩层 */
.pay-btn-disabled {
  background-color: #e93b3d;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.pay-btn-disabled::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(200, 30, 35, 0.4);
  border-radius: 30rpx;
  pointer-events: none;
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