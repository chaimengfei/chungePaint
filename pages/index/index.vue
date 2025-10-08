<template>
  <view class="container">
    <!-- 品牌展示区域 -->
    <view class="brand-header">
      <view class="brand-info">
        <text class="brand-name">贸彩漆业</text>
        <text class="brand-desc">汽车漆、工业漆、雕塑&广告牌漆供应</text>
        <text class="contact-info">联系人 李增春-13161621688</text>
      </view>
      <view class="action-buttons">
        <view class="phone-btn" @click="makeCall">
          <text class="phone-icon">📞</text>
        </view>
        <view class="share-btn" @click="shareToFriend">
          <text class="share-icon">📤</text>
        </view>
      </view>
    </view>
    
    <!-- 商品区域 -->
    <view class="product-container">
      <!-- 左侧分类栏 -->
      <scroll-view class="category-list" scroll-y>
        <view 
          v-for="item in categories" 
          :key="item.id"
          class="category-item"
          :class="{ active: activeCategory === item.id }"
          @click="changeCategory(item.id)"
        >
          {{ item.name }}
        </view>
      </scroll-view>
      
      <!-- 右侧商品列表 -->
      <scroll-view class="product-list" scroll-y>
      <view v-if="currentProducts.length > 0">
        <view 
          v-for="product in currentProducts" 
          :key="product.id"
          class="product-item"
        >
          <image class="product-image" :src="product.image" mode="aspectFill" />
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-price">¥{{ product.seller_price }}</text>
            <text class="product-unit">{{ product.unit }}</text>
            <view class="action-buttons">
              <button class="add-btn" @click="addToCart(product.id)">加入购物车</button>
              <button class="buy-btn" @click="buyNow(product)">立即购买</button>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty">
        暂无商品
      </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { getProductList } from '@/api/product.js'
import { addToCart, getCartList } from '@/api/cart.js'
import { checkoutOrder } from '@/api/order.js'
import { goLogin } from '@/api/user.js'

export default {
  data() {
    return {
      categories: [],         // 分类列表
      products: {},           // 所有商品
      activeCategory: null,   // 当前选中的分类ID
      currentProducts: [],    // 当前显示的商品列表
      isLogin: false,         // 登录状态
      userInfo: {},           // 用户信息
      currentTime: '09:16'    // 当前时间
    }
  },
  onLoad() {
    // 检查登录状态并自动登录
    this.checkLoginStatus()
    // 加载商品数据
    this.fetchData()
  },
  onShow() {
    // 每次显示首页时更新购物车徽标
    this.updateCartBadge()
  },
  onShareAppMessage() {
    // 分享给微信好友
    return {
      title: '贸彩漆业 - 汽车漆、工业漆、雕塑&广告牌漆供应',
      desc: '联系人 李增春-13161621688',
      path: '/pages/index/index',
      imageUrl: '/static/images/share-logo.png' // 可以设置分享图片
    }
  },
  onShareTimeline() {
    // 分享到朋友圈
    return {
      title: '贸彩漆业 - 汽车漆、工业漆、雕塑&广告牌漆供应',
      query: '',
      imageUrl: '/static/images/share-logo.png' // 可以设置分享图片
    }
  },
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      const token = uni.getStorageSync('token')
      const userInfo = uni.getStorageSync('userInfo')
      
      if (token && userInfo) {
        // 已登录
        this.isLogin = true
        this.userInfo = userInfo
        console.log('用户已登录:', userInfo)
      } else {
        // 未登录，自动登录
        this.autoLogin()
      }
    },
    
    // 自动登录
    async autoLogin() {
      try {
        console.log('开始自动登录流程...')
        
        // 1. 获取微信登录code
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            success: resolve,
            fail: reject
          })
        })

        const code = loginRes.code
        if (!code) {
          console.error('无法获取微信登录code')
          return
        }

        // 2. 获取用户信息（昵称和头像）
        const userInfoRes = await new Promise((resolve, reject) => {
          uni.getUserProfile({
            desc: '用于完善用户资料',
            success: resolve,
            fail: (err) => {
              console.warn('用户拒绝授权获取用户信息:', err)
              // 如果用户拒绝授权，使用默认信息
              resolve({
                userInfo: {
                  nickName: '微信用户',
                  avatarUrl: '/static/images/default-avatar.png'
                }
              })
            }
          })
        })

        const { nickName: nickname, avatarUrl: avatar } = userInfoRes.userInfo
        
        // 确保avatar是完整的URL格式
        console.log('获取到的微信头像URL:', avatar)
        
        // 验证和处理头像URL
        let finalAvatar = avatar
        if (!avatar || !avatar.startsWith('http')) {
          // 如果头像URL无效，使用默认头像
          finalAvatar = '/static/images/default-avatar.png'
          console.warn('微信头像URL无效，使用默认头像:', finalAvatar)
        }

        // 3. 检查是否首次登录（需要传递地理位置）
        const hasStoredUserInfo = uni.getStorageSync('hasStoredUserInfo')
        let loginData = {
          code: code,
          nickname: nickname,
          avatar: finalAvatar
        }

        // 只在首次登录时获取和传递地理位置
        if (!hasStoredUserInfo) {
          console.log('首次登录，获取地理位置信息...')
          const locationRes = await new Promise((resolve, reject) => {
            uni.getLocation({
              type: 'gcj02',
              success: resolve,
              fail: (err) => {
                console.warn('获取地理位置失败:', err)
                // 如果获取地理位置失败，使用默认值
                resolve({
                  latitude: 39.9042,  // 北京默认纬度
                  longitude: 116.4074  // 北京默认经度
                })
              }
            })
          })

          const { latitude, longitude } = locationRes
          loginData.latitude = latitude
          loginData.longitude = longitude
          console.log('首次登录，传递地理位置:', { latitude, longitude })
        } else {
          console.log('非首次登录，跳过地理位置获取')
        }

        console.log('调用登录接口，数据:', loginData)
        const loginApiRes = await goLogin(loginData)
        
        if (loginApiRes.data.code === 0) {
          const { token, user_info } = loginApiRes.data.data

          // 5. 存储登录信息
          uni.setStorageSync('token', token)
          uni.setStorageSync('userInfo', user_info)
          // 标记用户信息已存储（用于判断是否首次登录）
          uni.setStorageSync('hasStoredUserInfo', true)

          // 6. 设置全局请求头
          uni.$u.http.setConfig((config) => {
            config.header.Authorization = `Bearer ${token}`
            return config
          })

          // 7. 更新页面状态
          this.isLogin = true
          this.userInfo = user_info
          
          console.log('自动登录成功:', user_info)
          
          // 8. 显示欢迎提示
          const wasFirstLogin = !uni.getStorageSync('hasStoredUserInfo')
          const welcomeMsg = wasFirstLogin ? `欢迎注册，${user_info.nickname || '用户'}` : `欢迎回来，${user_info.nickname || '用户'}`
          uni.showToast({
            title: welcomeMsg,
            icon: 'success',
            duration: 2000
          })
        } else {
          console.error('登录接口返回错误:', loginApiRes.data.message)
        }
      } catch (err) {
        console.error('自动登录失败:', err)
        // 登录失败不影响商品展示，静默处理
      }
    },
    
    async fetchData() {
      try {
        const res = await getProductList()
        this.categories = res.categories
        this.products = res.products
        
        // 默认选中第一个分类
        if (this.categories.length > 0) {
          this.activeCategory = this.categories[0].id
          this.currentProducts = this.products[this.activeCategory] || []
        }
      } catch (err) {
        uni.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    },
    
    changeCategory(categoryId) {
      this.activeCategory = categoryId
      this.currentProducts = this.products[categoryId] || []
    },
    
    // 添加商品到购物车
    async addToCart(productId) {
      try {
        const res = await addToCart({ product_id: productId })
        if (res.data.code === 0) {
          uni.showToast({
            title: '已加入购物车',
            icon: 'success'
          })
          
          // 更新底部购物车徽标
          this.updateCartBadge()
        } else {
          uni.showToast({
            title: res.data.message || '添加购物车失败',
            icon: 'none'
          })
        }
      } catch (err) {
        uni.showToast({
          title: '添加购物车失败',
          icon: 'none'
        })
      }
    },
    
    // 立即购买
    async buyNow(product) {
      try {
        uni.showLoading({ title: '处理中...' })
        
        // 调用checkout接口
        const res = await checkoutOrder({
          cart_ids: null,
          product_id: product.id,
          quantity: 1,
          address_id: null // 这里可以传入默认地址ID，或者让用户在结算页面选择
        })
        
        uni.hideLoading()
        
        if (res.data.code === 0) {
          // 跳转到结算页面
          uni.navigateTo({
            url: `/pages/order/checkout?product_id=${product.id}&quantity=1`
          })
        } else {
          uni.showToast({
            title: res.data.message || '立即购买失败',
            icon: 'none'
          })
        }
      } catch (err) {
        uni.hideLoading()
        console.error('立即购买失败:', err)
        uni.showToast({
          title: '立即购买失败',
          icon: 'none'
        })
      }
    },
    
    // 拨打电话
    makeCall() {
      uni.makePhoneCall({
        phoneNumber: '13161621688',
        success: function () {
          console.log('拨打电话成功')
        },
        fail: function (err) {
          console.log('拨打电话失败:', err)
        }
      })
    },
    
    // 跳转到个人中心
    goToProfile() {
      uni.switchTab({
        url: '/pages/user/index'
      })
    },
    
    // 分享给朋友
    shareToFriend() {
      uni.share({
        provider: 'weixin',
        scene: 'WXSceneSession',
        type: 5,
        title: '贸彩漆业 - 专业涂料供应商',
        summary: '汽车漆、工业漆、雕塑&广告牌漆供应',
        href: '/pages/index/index',
        imageUrl: '/static/images/share-logo.png',
        success: function (res) {
          console.log('分享成功')
        },
        fail: function (err) {
          console.log('分享失败:', err)
        }
      })
    },
    
    // 更新购物车徽标
    async updateCartBadge() {
      try {
        const res = await getCartList()
        if (res.data.code === 0) {
          const cartItems = res.data.data || []
          const uniqueItemCount = cartItems.length
          
          if (uniqueItemCount > 0) {
            uni.setTabBarBadge({
              index: 1,
              text: uniqueItemCount.toString()
            })
          } else {
            uni.removeTabBarBadge({
              index: 1
            })
          }
        }
      } catch (error) {
        console.error('更新购物车徽标失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f5f5;
}

/* 品牌展示区域 */
.brand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: linear-gradient(135deg, #ff69b4 0%, #ffb6c1 100%);
  color: white;
  margin-bottom: 20rpx;
}

.brand-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.brand-name {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.brand-desc {
  font-size: 28rpx;
  margin-bottom: 8rpx;
  opacity: 0.9;
}

.contact-info {
  font-size: 24rpx;
  opacity: 0.8;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
}

.phone-btn, .share-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

.phone-icon, .share-icon {
  font-size: 32rpx;
}

/* 商品区域 */
.product-container {
  display: flex;
  flex: 1;
  height: calc(100% - 120rpx);
}

.category-list {
  width: 25%;
  background-color: #f5f5f5;
  height: 100%;
}

.category-item {
  padding: 20rpx;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.category-item.active {
  background-color: #fff;
  color: #ff69b4;
  font-weight: bold;
}

.product-list {
  width: 75%;
  padding: 10rpx;
  height: 100%;
}

.product-item {
  display: flex;
  padding: 20rpx;
  border-bottom: 1px solid #eee;
}

.product-image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 8rpx;
}

.product-info {
  flex: 1;
  padding-left: 20rpx;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 28rpx;
  margin-bottom: 10rpx;
}

.product-price {
  color: #ff69b4;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.product-unit {
  color: #999;
  font-size: 24rpx;
  margin-bottom: 15rpx;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.add-btn, .buy-btn {
  height: 50rpx;
  line-height: 50rpx;
  font-size: 24rpx;
  padding: 0 30rpx;
  flex: 1;
  text-align: center;
  white-space: nowrap;
  min-width: 120rpx;
}

.add-btn {
  background-color: #f5f5f5;
  color: #333;
}

.buy-btn {
  background-color: #ff69b4;
  color: #fff;
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
}
</style>