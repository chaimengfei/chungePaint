<template>
  <view class="container">
    <view v-if="orderData">
      <!-- 地址 -->
      <view class="section address-section" @click="selectAddress">
        <view v-if="selectedAddress" class="address-info">
          <view class="address-header">
            <text class="name">{{ selectedAddress.recipient_name }}</text>
            <text class="phone">{{ selectedAddress.recipient_phone }}</text>
          </view>
          <text class="address-detail">
            {{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}
          </text>
        </view>
        <view v-else class="add-address">
          <text>+ 添加收货地址</text>
        </view>
        <uni-icons type="arrowright" size="20" color="#999"></uni-icons>
      </view>

      <!-- 商品 -->
      <view class="section">
        <view class="section-title">商品清单</view>
        <view v-for="item in orderData.items" :key="item.product_id" class="order-item">
          <image :src="item.product_image || '/static/images/empty-cart.png'" class="product-image" mode="aspectFill"></image>
          <view class="product-info">
            <text class="product-name">{{ item.product_name }}</text>
            <text class="product-spec">{{ item.specification }}</text>
            <view class="price-line">
              <text class="product-price">¥{{ item.unit_price }}</text>
              <text class="product-quantity">×{{ item.quantity }}</text>
            </view>
            <view class="total-price">
              <text class="total-price-text">小计: ¥{{ item.total_price }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 金额 -->
      <view class="section">
        <view class="section-title">订单金额</view>
        <view class="price-row"><text>商品总价</text><text>¥{{ orderData.total_amount }}</text></view>
        <view class="price-row"><text>运费</text><text>¥{{ orderData.shipping_fee || 0 }}</text></view>
        <view class="price-row total"><text>应付总额</text><text>¥{{ orderData.payment_amount }}</text></view>
      </view>

      <!-- 备注 -->
      <view class="section remark-section">
        <view class="section-title">备注</view>
        <textarea v-model="orderNote" placeholder="请输入备注信息(选填)" class="remark-input" maxlength="100"></textarea>
      </view>

      <!-- 支付按钮 -->
      <view class="footer">
        <view class="price-total"><text>合计:</text><text class="price">¥{{ orderData.payment_amount }}</text></view>
        <button class="submit-btn" :disabled="!selectedAddress || submitting" @click="submitOrder">
          {{ submitting ? '支付中...' : '立即支付' }}
        </button>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-mask">
      <view class="loading-content">
        <uni-loading type="circle" size="36" color="#e93b3d"></uni-loading>
        <text>加载中...</text>
      </view>
    </view>

    <!-- 错误 -->
    <view v-if="error" class="error-message">
      <text>{{ error }}</text>
      <button class="retry-btn" @click="fetchCheckoutData">重试</button>
    </view>
  </view>
</template>

<script>
import { checkoutOrder } from '@/api/order.js'
import { getAddressList } from '@/api/address.js'

export default {
  data() {
    return {
      cartIds: [],
      orderData: null,
      selectedAddress: null,
      orderNote: '',
      loading: true,
      error: null,
      submitting: false,
	  incomingAddressId: null
    }
  },
  onLoad(options) {
    if (options.cart_ids) {
      try {
        this.cartIds = JSON.parse(options.cart_ids)
      } catch {
        this.handleError('参数解析失败')
        return
      }
      this.fetchCheckoutData()
    } else {
      this.handleError('缺少必要参数')
    }
  },
  onShow() {
    const address = uni.getStorageSync('selected_address')
    if (address) {
      this.selectedAddress = address
      uni.removeStorageSync('selected_address')
    }else {
      this.loadAddress(); // 没有缓存才调用接口获取
    }
  },
  methods: {
    async fetchCheckoutData() {
      this.loading = true
      this.error = null
      try {
        const res = await checkoutOrder({ cart_ids: this.cartIds })
        if (res.data.code === 0) {
          this.orderData = res.data.data
		   // ✅ 新增：把返回的 address_info 作为当前选中的地址
		   this.selectedAddress = res.data.data.address_info || null
        } else {
          this.handleError(res.data.msg || '获取结算信息失败')
        }
      } catch (err) {
        this.handleError('网络错误，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    selectAddress() {
		if (this.orderData?.address_info) {
			// 如果已有地址，进入选择地址页面
			uni.navigateTo({
			  url: '/pages/address/list?selectMode=1'
			})
		} else {
			// 如果没有地址，直接跳转到创建地址页面
			uni.navigateTo({
			  url: '/pages/address/edit'
			})
		}
    },
    async loadAddress() {
        try {
		  const res = await getAddressList()

		  if (res.code === 0) {
		    const list = res.data || [];
			if (list.length > 0) {
			  // 优先默认地址，否则取第一个
			  const defaultAddr = list.find(addr => addr.is_default);
			  this.selectedAddress = defaultAddr || list[0];
			} else {
			  // 如果列表为空，跳转引导用户新建地址
			  setTimeout(() => {
			    uni.navigateTo({ url: '/pages/address/edit' });
			  }, 300);
			}
		  } else {
		    this.handleError(res.data.msg || '获取地址失败')
		  }
        } catch (err) {
          console.error('获取地址失败', err);
        }
     },
	handleError(msg) {
      this.error = msg
      uni.showToast({
        title: msg,
        icon: 'none'
      })
    },
    async submitOrder() {
      if (!this.selectedAddress) {
        return uni.showToast({ title: '请选择收货地址', icon: 'none' })
      }
	  if (!this.orderData || !this.orderData.order_no) {
		return uni.showToast({ title: '订单信息异常', icon: 'none' })
	  }
      this.submitting = true
      uni.showLoading({ title: '支付中...', mask: true })

      try {
        // 直接使用结算接口返回的order_no进行支付
        // await uni.requestPayment({
        //   provider: 'wxpay',
        //   timeStamp: order.timeStamp,
        //   nonceStr: order.nonceStr,
        //   package: order.package,
        //   signType: 'MD5',
        //   paySign: order.paySign,
        //   success: () => {
        //     uni.showToast({ title: '支付成功', icon: 'success' })
        //     setTimeout(() => {
        //       uni.redirectTo({ url: `/pages/order/detail?order_no=${order.order_no}` })
        //     }, 1500)
        //   },
        //   fail: (err) => {
        //     const msg = err.errMsg === 'requestPayment:fail cancel' ? '已取消支付' : '支付失败'
        //     uni.showToast({ title: msg, icon: 'none' })
        //   }
        // })
		
		// 👉 这里你暂未对接微信支付参数（paySign等），先跳转到订单详情
		uni.showToast({ title: '订单提交成功', icon: 'success' })
		setTimeout(() => {
		  uni.redirectTo({
			url: `/pages/order/detail?order_no=${this.orderData.order_no}`
		  })
		}, 1500)
      } catch (err) {
        uni.showToast({ title: err.message || '下单失败', icon: 'none' })
      } finally {
        this.submitting = false
        uni.hideLoading()
      }
    }
  }
}
</script>

<style scoped>
/* 原有样式保持不变 */
.container {
  padding-bottom: 100px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.section {
  background-color: #fff;
  margin-bottom: 10px;
  padding: 15px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.address-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
}

.address-info {
  flex: 1;
}

.address-header {
  margin-bottom: 8px;
}

.address-header .name {
  font-size: 16px;
  font-weight: bold;
  margin-right: 10px;
}

.address-header .phone {
  font-size: 14px;
  color: #666;
}

.address-detail {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.add-address {
  flex: 1;
  text-align: center;
  color: #e93b3d;
  font-size: 14px;
}

.order-item {
  display: flex;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f5f5f5;
}

.order-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  margin-right: 10px;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.product-spec {
  font-size: 12px;
  color: #999;
  margin: 5px 0;
}

.price-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 16px;
  color: #e93b3d;
  font-weight: bold;
}

.product-quantity {
  font-size: 14px;
  color: #666;
}

.total-price {
  margin-top: 5px;
}

.total-price-text {
  font-size: 12px;
  color: #999;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.price-row.total {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f5f5f5;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.remark-section {
  padding-bottom: 20px;
}

.remark-input {
  width: 100%;
  height: 80px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.price-total {
  display: flex;
  align-items: center;
}

.price-total .price {
  font-size: 18px;
  font-weight: bold;
  color: #e93b3d;
  margin-left: 5px;
}

.submit-btn {
  background-color: #e93b3d;
  color: white;
  border-radius: 20px;
  padding: 0 25px;
  height: 36px;
  line-height: 36px;
  font-size: 14px;
  border: none;
}

.submit-btn[disabled] {
  background-color: #ccc;
  color: #fff;
}

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-content text {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

.error-message {
  padding: 20px;
  text-align: center;
  color: #e93b3d;
}

.retry-btn {
  margin-top: 10px;
  background-color: #e93b3d;
  color: white;
  border-radius: 4px;
  padding: 5px 15px;
  font-size: 14px;
}
</style>