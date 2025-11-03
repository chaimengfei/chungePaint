<template>
  <view class="container">
    <!-- 品牌展示区域 -->
    <view class="brand-card">
      <view class="brand-logo-section">
        <view class="logo-container">
          <view class="text-logo">
            <text class="logo-text">贸彩</text>
            <text class="logo-tm">®</text>
          </view>
        </view>
        <view class="brand-text">
          <text class="desc-text">汽车漆、工业漆、雕塑&广告牌漆、各种辅料供应</text>
          <view class="contact-info">
            <text class="phone-icon">📞</text>
            <text class="phone-icon"> </text>
            <text class="contact-text">李增春-13161621688</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 搜索框 -->
    <view class="search-container">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          type="text" 
          placeholder="搜索商品名称..."
          v-model="searchKeyword"
          @input="onSearchInput"
        />
        <view v-if="searchKeyword" class="clear-btn" @click="clearSearch">
          <text class="clear-icon">✕</text>
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
      <view v-if="currentProducts && currentProducts.length > 0">
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
import { addToCart as addToCartApi, getCartList } from '@/api/cart.js'
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
      currentTime: '09:16',   // 当前时间
      searchKeyword: '',      // 搜索关键词
      isSearching: false,     // 是否正在搜索
      originalCategories: null, // 原始分类数据（用于搜索后恢复）
      originalProducts: null    // 原始商品数据（用于搜索后恢复）
    }
  },
  onLoad() {
    // 先进行登录，登录成功后再加载商品数据
    this.initPage()
  },
  onShow() {
    // 首页显示时不再自动更新购物车徽标
    // 购物车徽标只在用户点击购物车图标时更新
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
    // 初始化页面
    async initPage() {
      try {
        // 先检查是否已登录
        const token = uni.getStorageSync('token')
        const userInfo = uni.getStorageSync('userInfo')
        
        if (token && userInfo) {
          // 已登录，直接加载商品数据
          this.isLogin = true
          this.userInfo = userInfo
          console.log('用户已登录，直接加载商品数据')
          await this.fetchData()
        } else {
          // 未登录，先进行登录
          console.log('用户未登录，开始登录流程')
          const loginSuccess = await this.autoLogin()
          // 无论登录是否成功，都尝试加载商品数据
          if (loginSuccess && this.isLogin) {
            console.log('登录成功，开始加载商品数据')
            await this.fetchData()
            console.log('登录成功，商品数据已加载')
          } else {
            console.log('登录失败或未完成，但仍尝试加载商品数据')
            await this.fetchData()
          }
        }
      } catch (error) {
        console.error('页面初始化失败:', error)
        // 即使登录失败，也尝试加载商品数据（因为商品列表不需要登录）
        await this.fetchData()
      }
    },
    
    // 检查登录状态（保留原方法，但不再在onLoad中直接调用）
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
        
        // 1. 获取微信登录code（非首次登录自动流程不再请求用户资料，避免非手势调用失败）
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            success: resolve,
            fail: reject
          })
        })

        const code = loginRes.code
        if (!code) {
          console.error('无法获取微信登录code')
          return false
        }

        // 使用默认昵称与头像（避免 getUserProfile 触发手势限制）
        const nickname = '微信用户'
        const avatar = '/static/images/default-avatar.png'
        
        // 头像直接使用默认图
        let finalAvatar = avatar

        // 3. 检查是否首次登录（首次登录需要手机号授权，需跳转到登录页获取 encryptedData/iv）
        const hasStoredUserInfo = uni.getStorageSync('hasStoredUserInfo')
        let loginData = {
          code: code,
          nickname: nickname,
          avatar: finalAvatar
        }
        let isFirstLogin = false

        // 只在首次登录时获取和传递地理位置
        if (!hasStoredUserInfo) {
          // 首次登录必须通过手机号授权按钮获取 encryptedData/iv，不能在首页自动获取
          console.log('检测到首次登录，跳转到手机号授权登录页')
          uni.navigateTo({ url: '/pages/user/login' })
          return false
        }

        // 非首次登录：可选地理位置（保留旧逻辑，避免后端字段变化）
        if (hasStoredUserInfo) {
          isFirstLogin = false
          console.log('非首次登录，尝试获取地理位置信息（可选）...')
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
          console.log('非首次登录，传递地理位置:', { latitude, longitude })
        }

        console.log('调用登录接口，数据:', loginData)
        const loginApiRes = await goLogin(loginData)
        
        console.log('登录接口完整响应:', loginApiRes)
        console.log('登录接口响应data:', loginApiRes.data)
        console.log('登录接口响应code:', loginApiRes.data?.code)
        
        if (loginApiRes.data.code === 0) {
          const { token, user_id } = loginApiRes.data.data
          
          // 构造用户信息对象
          const user_info = {
            id: user_id,
            nickname: loginData.nickname,
            avatar: loginData.avatar
          }

          console.log('登录成功 - 获取到的token:', token)
          console.log('登录成功 - 获取到的用户信息:', user_info)

          // 5. 存储登录信息
          uni.setStorageSync('token', token)
          uni.setStorageSync('userInfo', user_info)
          
          // 验证token是否正确存储
          const storedToken = uni.getStorageSync('token')
          console.log('登录成功 - 验证存储的token:', storedToken)
          
          // 只在首次登录时标记用户信息已存储
          if (isFirstLogin) {
            uni.setStorageSync('hasStoredUserInfo', true)
            console.log('首次登录完成，已标记用户信息已存储')
          }

          // 6. 登录成功，token已存储到本地存储中
          // 各个API会在调用时从本地存储获取token并添加到请求头
          console.log('Token已存储到本地存储:', token)

          // 7. 更新页面状态
          this.isLogin = true
          this.userInfo = user_info
          
          console.log('自动登录成功:', user_info)
          
          // 8. 显示欢迎提示
          const welcomeMsg = isFirstLogin ? `欢迎注册，${user_info.nickname || '用户'}` : `欢迎回来，${user_info.nickname || '用户'}`
          uni.showToast({
            title: welcomeMsg,
            icon: 'success',
            duration: 2000
          })
          
          // 登录成功，返回true表示登录成功
          return true
        } else {
          console.error('登录接口返回错误:', loginApiRes.data?.message || '未知错误')
          console.error('登录接口响应状态码:', loginApiRes.statusCode)
          console.error('登录接口响应数据:', loginApiRes.data)
          return false
        }
      } catch (err) {
        console.error('自动登录失败:', err)
        // 登录失败不影响商品展示，静默处理
        return false
      }
    },
    
    async fetchData() {
      try {
        const res = await getProductList()
        this.categories = res.categories
        this.products = res.products
        
        // 保存原始数据（用于搜索后恢复）
        this.originalCategories = res.categories
        this.originalProducts = res.products
        
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
        console.log('首页 - 开始添加商品到购物车，商品ID:', productId)
        console.log('首页 - 当前登录状态:', this.isLogin)
        console.log('首页 - 当前用户信息:', this.userInfo)
        
        // 检查登录状态，如果未登录则先登录
        if (!this.isLogin) {
          console.log('首页 - 用户未登录，开始自动登录...')
          const loginSuccess = await this.autoLogin()
          if (!loginSuccess) {
            uni.showToast({
              title: '请先登录',
              icon: 'none'
            })
            return
          }
        }
        
        // 再次检查token是否存在
        const token = uni.getStorageSync('token')
        if (!token) {
          console.error('首页 - 登录后token仍为空')
          uni.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          })
          return
        }
        
        console.log('首页 - 登录完成，开始添加商品到购物车')
        const res = await addToCartApi({ product_id: productId })
        console.log('首页 - 购物车添加API返回:', res)
        
        if (res.data.code === 0) {
          uni.showToast({
            title: '已加入购物车',
            icon: 'success'
          })
          
          // 更新底部购物车徽标
          this.updateCartBadge()
        } else {
          console.error('首页 - 购物车添加失败:', res.data.message)
          uni.showToast({
            title: res.data.message || '添加购物车失败',
            icon: 'none'
          })
        }
      } catch (err) {
        console.error('首页 - 购物车添加异常:', err)
        uni.showToast({
          title: '添加购物车失败',
          icon: 'none'
        })
      }
    },
    
    // 立即购买
    async buyNow(product) {
      try {
        console.log('首页 - 开始立即购买，商品ID:', product.id)
        console.log('首页 - 当前登录状态:', this.isLogin)
        
        // 检查登录状态，如果未登录则先登录
        if (!this.isLogin) {
          console.log('首页 - 用户未登录，开始自动登录...')
          const loginSuccess = await this.autoLogin()
          if (!loginSuccess) {
            uni.showToast({
              title: '请先登录',
              icon: 'none'
            })
            return
          }
        }
        
        // 再次检查token是否存在
        const token = uni.getStorageSync('token')
        if (!token) {
          console.error('首页 - 登录后token仍为空')
          uni.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          })
          return
        }
        
        uni.showLoading({ title: '处理中...' })
        
        console.log('首页 - 登录完成，开始立即购买')
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
      // 只有在已登录状态下才更新购物车徽标
      if (!this.isLogin) {
        console.log('用户未登录，跳过购物车徽标更新')
        return
      }
      
      try {
        console.log('开始更新购物车徽标...')
        const res = await getCartList()
        if (res.data.code === 0) {
          const cartItems = res.data.data || []
          const uniqueItemCount = cartItems.length
          
          console.log('购物车商品数量:', uniqueItemCount)
          
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
        } else {
          console.error('获取购物车列表失败:', res.data.message)
        }
      } catch (error) {
        console.error('更新购物车徽标失败:', error)
        // 如果是401错误，说明token可能过期，可以尝试重新登录
        if (error.statusCode === 401) {
          console.log('购物车接口返回401，可能需要重新登录')
        }
      }
    },
    
    // 搜索输入处理
    onSearchInput(e) {
      this.searchKeyword = e.detail.value
      this.performSearch()
    },
    
    // 执行搜索
    async performSearch() {
      if (!this.searchKeyword.trim()) {
        // 如果搜索关键词为空，显示当前分类的商品
        this.showCurrentCategoryProducts()
        this.isSearching = false
        return
      }
      
      this.isSearching = true
      
      try {
        // 调用后端API进行搜索
        const res = await getProductList(this.searchKeyword)
        
        console.log('搜索关键词:', this.searchKeyword)
        console.log('搜索API返回数据:', res)
        
        // 检查API返回的数据结构
        if (res && typeof res === 'object') {
          // 保存原始的分类和商品数据（用于清空搜索时恢复）
          if (!this.originalCategories) {
            this.originalCategories = this.categories
            this.originalProducts = this.products
          }
          
          // 后端返回的数据结构: {categories: [], products: {}}
          this.categories = res.categories || []
          this.products = res.products || {}
          
          // 计算所有商品数量
          const allProducts = []
          Object.values(this.products).forEach(categoryProducts => {
            if (Array.isArray(categoryProducts)) {
              allProducts.push(...categoryProducts)
            }
          })
          this.currentProducts = allProducts
          
          // 清空当前选中的分类，因为显示的是搜索结果
          this.activeCategory = null
          
          // 根据搜索结果给出不同的提示
          if (allProducts.length === 0) {
            console.log('搜索完成，未找到匹配的商品')
            // 不显示错误提示，只是显示空结果
          } else {
            console.log('搜索成功，找到商品数量:', allProducts.length)
          }
        } else {
          console.log('搜索失败，返回数据格式错误:', res)
          uni.showToast({
            title: '搜索失败，请重试',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('搜索失败:', error)
        uni.showToast({
          title: '搜索失败，请重试',
          icon: 'none'
        })
      }
    },
    
    // 清空搜索
    async clearSearch() {
      this.searchKeyword = ''
      this.isSearching = false
      
      // 恢复原始数据
      if (this.originalCategories && this.originalProducts) {
        this.categories = this.originalCategories
        this.products = this.originalProducts
        
        // 默认选中第一个分类
        if (this.categories.length > 0) {
          this.activeCategory = this.categories[0].id
          this.currentProducts = this.products[this.activeCategory] || []
        }
      } else {
        // 如果没有原始数据，重新加载
        try {
          const res = await getProductList()
          this.categories = res.categories || []
          this.products = res.products || {}
          
          // 默认选中第一个分类
          if (this.categories.length > 0) {
            this.activeCategory = this.categories[0].id
            this.currentProducts = this.products[this.activeCategory] || []
          }
        } catch (error) {
          console.error('重新加载数据失败:', error)
          uni.showToast({
            title: '重新加载失败',
            icon: 'none'
          })
        }
      }
    },
    
    // 显示当前分类的商品
    showCurrentCategoryProducts() {
      if (this.activeCategory && this.products[this.activeCategory]) {
        this.currentProducts = this.products[this.activeCategory] || []
      } else {
        this.currentProducts = []
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
.brand-card {
  background-color: #e6f7ff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  border: 2rpx solid #4169E1;
  position: relative;
  overflow: hidden;
}

.brand-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: linear-gradient(90deg, #4169E1 0%, #ffb6c1 100%);
}

.brand-logo-section {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.logo-container {
  width: 120rpx;
  height: 120rpx;
  margin-right: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo {
  width: 100rpx;
  height: 100rpx;
}

.text-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100rpx;
  height: 100rpx;
  background-color: #fff;
  border-radius: 50%;
  border: 3rpx solid #4169E1;
  position: relative;
}

.logo-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #4169E1;
  line-height: 1;
}

.logo-tm {
  font-size: 16rpx;
  color: #4169E1;
  position: absolute;
  top: 8rpx;
  right: 8rpx;
}

.brand-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
}

.desc-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  margin-bottom: 10rpx;
}

.contact-info {
  display: flex;
  align-items: center;
  margin-top: 10rpx;
}

.phone-icon {
  font-size: 24rpx;
  margin-right: 10rpx;
}

.contact-text {
  font-size: 26rpx;
  color: #666;
  font-weight: bold;
}

/* 搜索框样式 */
.search-container {
  margin: 20rpx;
  margin-top: 0;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f0f2f5;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  border: 2rpx solid #e0e0e0;
  transition: border-color 0.3s ease;
}

.search-box:focus-within {
  border-color: #4169E1;
}

.search-icon {
  font-size: 32rpx;
  color: #999;
  margin-right: 16rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  border: none;
  outline: none;
  background: transparent;
}

.search-input::placeholder {
  color: #999;
}

.clear-btn {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
}

.clear-icon {
  font-size: 24rpx;
  color: #666;
  font-weight: bold;
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
  color: #4169E1;
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
  color: #4169E1;
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
  background-color: #4169E1;
  color: #fff;
}

.buy-btn {
  background-color: #fff;
  color: #4169E1;
  border: 2rpx solid #4169E1;
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
}
</style>