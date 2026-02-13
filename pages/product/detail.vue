<template>
  <view class="product-detail-container">
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click.stop="navigateBack" @tap.stop="navigateBack">
        <image src="/static/images/back.png" mode="aspectFit" class="back-icon"/>
      </view>
      <text class="nav-title">产品详情</text>
    </view>

    <!-- 商品图片 -->
    <view class="product-image-section">
      <image 
        class="product-main-image" 
        :src="product.image || '/static/images/empty-inquiry.png'" 
        mode="aspectFill"
      />
    </view>

    <!-- 商品信息 -->
    <view class="product-info-section">
      <view class="product-name-section">
        <text class="product-name">{{ product.name }}</text>
        <text v-if="product.specification" class="product-spec">{{ product.specification }}</text>
      </view>

      <view class="price-section">
        <text class="price-label">参考价：</text>
        <text class="product-price">¥{{ product.reference_price }}</text>
        <text class="product-unit">/ {{ product.unit }}</text>
      </view>
      <text class="price-tip">（价格可能浮动）</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button class="action-btn contact-btn" @click="contactService">联系客服</button>
      <button class="action-btn add-draft-btn" @click="addToDraft">加入购物车</button>
    </view>
  </view>
</template>

<script>
import { addToDraft as addToDraftApi } from '@/api/draft.js'
import { showContactService } from '@/api/common.js'

export default {
  data() {
    return {
      product: {
        id: null,
        name: '',
        image: '',
        specification: '',
        reference_price: 0,
        unit: ''
      }
    }
  },
  onLoad(options) {
    // 从页面参数中获取商品信息
    if (options.product) {
      try {
        this.product = JSON.parse(decodeURIComponent(options.product))
      } catch (e) {
        uni.showToast({
          title: '商品数据错误',
          icon: 'none'
        })
        setTimeout(() => {
          this.navigateBack()
        }, 1500)
      }
    } else if (options.productId) {
      // 如果只传了商品ID，可以调用API获取详情
      // 这里暂时使用传入的数据
      uni.showToast({
        title: '商品ID缺失',
        icon: 'none'
      })
    }
  },
  methods: {
    navigateBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      } else {
        uni.switchTab({
          url: '/pages/index/index'
        })
      }
    },
    async addToDraft() {
      if (!this.product.id) {
        uni.showToast({
          title: '商品ID缺失',
          icon: 'none'
        })
        return
      }

      try {
        // 检查登录状态，未登录时与需求单页一致：先弹窗提示，用户确认后再跳转登录
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showModal({
            title: '提示',
            content: '您还未登录，是否注册登录？',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: '/pages/user/login'
                })
              }
            }
          })
          return
        }

        const res = await addToDraftApi({ product_id: this.product.id })
        
        if (res.data.code === 0) {
          uni.showToast({
            title: '已加入购物车',
            icon: 'success'
          })
        } else {
          uni.showToast({
            title: res.data.message || '加入失败',
            icon: 'none'
          })
        }
      } catch (err) {
        uni.showToast({
          title: err.message || '加入失败',
          icon: 'none'
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
.product-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
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

.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 34rpx;
  font-weight: 500;
}

/* 商品图片区域 */
.product-image-section {
  width: 100%;
  background-color: #fff;
  margin-top: calc(env(safe-area-inset-top) + 108rpx);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.product-main-image {
  width: 100%;
  height: 600rpx;
  object-fit: cover;
}

/* 商品信息区域 */
.product-info-section {
  background-color: #fff;
  margin: 20rpx;
  padding: 40rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.product-name-section {
  margin-bottom: 30rpx;
  display: flex;
  align-items: baseline;
  gap: 20rpx;
  flex-wrap: wrap;
}

.product-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.5;
}

.product-spec {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

.price-section {
  display: flex;
  align-items: baseline;
  margin-bottom: 10rpx;
}

.price-label {
  font-size: 28rpx;
  color: #666;
  margin-right: 10rpx;
}

.product-price {
  font-size: 40rpx;
  font-weight: bold;
  color: #e93b3d;
  margin-right: 10rpx;
}

.product-unit {
  font-size: 24rpx;
  color: #999;
}

.price-tip {
  font-size: 24rpx;
  color: #999;
  display: block;
}

/* 底部操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 30rpx;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
  gap: 20rpx;
  z-index: 999;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
  text-align: center;
}

.contact-btn {
  background-color: #ff9500;
  color: #fff;
}

.contact-btn:active {
  background-color: #e6850e;
}

.add-draft-btn {
  background-color: #e8e8e8;
  color: #888;
}

.add-draft-btn:active {
  background-color: #d8d8d8;
}
</style>
