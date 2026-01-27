<template>
  <view class="container">
    <!-- 公告栏 -->
    <view class="notice-bar">
      <text class="notice-icon">📢</text>
      <text class="notice-text">本平台为产品展示中心,如需采购请联系13161621688(同微信)</text>
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
        <!-- 热销分类（固定显示在最前面） -->
        <view 
          class="category-item"
          :class="{ active: activeCategory === 100 }"
          @click="changeCategory(100)"
        >
          热销
        </view>
        <!-- 其他分类 -->
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
      <scroll-view 
        class="product-list" 
        scroll-y
        @scrolltolower="loadMore"
        :lower-threshold="100"
      >
      <view v-if="currentProducts && currentProducts.length > 0" class="product-grid">
        <view 
          v-for="product in currentProducts" 
          :key="product.id"
          class="product-item"
          @click="handleProductClick(product)"
        >
          <view class="product-image-wrapper">
            <image class="product-image" :src="product.image" mode="aspectFill" />
          </view>
          <view class="product-info">
            <view class="product-name-wrapper">
              <text class="product-name">{{ product.name }}</text>
              <text v-if="product.specification" class="product-specification">{{ product.specification }}</text>
            </view>
            <view class="price-info">
              <text class="price-label">参考价：</text>
              <text class="product-price">¥{{ product.reference_price }}</text>
              <text class="product-unit">/ {{ product.unit }}</text>
            </view>
            <text class="price-tip">（价格可能浮动）</text>
            <view class="product-actions">
              <button class="action-btn add-draft-btn" @tap.stop="addToDraft(product.id)">
                加入需求单
              </button>
              <button class="action-btn contact-btn" @tap.stop="contactService">
                联系客服
              </button>
            </view>
          </view>
        </view>
        <!-- 加载更多提示 -->
        <view v-if="isLoading" class="loading-more">
          <text>加载中...</text>
        </view>
        <view v-else-if="!hasMore && currentProducts.length > 0" class="no-more">
          <text>没有更多商品了</text>
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
import { addToDraft as addToDraftApi, getDraftList } from '@/api/draft.js'
import { goLogin } from '@/api/user.js'
import { getNearestShop, isServicePointIdExpired, showContactService } from '@/api/common.js'

export default {
  data() {
    return {
      categories: [],         // 分类列表
      products: [],          // 当前页商品列表（新接口返回的是数组）
      activeCategory: null,   // 当前选中的分类ID
      currentProducts: [],    // 当前显示的商品列表
      isLogin: false,         // 登录状态
      userInfo: {},           // 用户信息
      currentTime: '09:16',   // 当前时间
      searchKeyword: '',      // 搜索关键词
      isSearching: false,     // 是否正在搜索
      originalCategories: null, // 原始分类数据（用于搜索后恢复）
      originalProducts: null,   // 原始商品数据（用于搜索后恢复）
      // 分页相关
      currentPage: 1,         // 当前页码
      pageSize: 20,           // 每页数量
      hasMore: false,         // 是否还有更多商品
      total: 0,               // 总商品数
      isLoading: false        // 是否正在加载
    }
  },
  onLoad() {
    // 先进行登录，登录成功后再加载商品数据
    this.initPage()
  },
  onShow() {
    // 每次显示页面时，检查登录状态并确保加载商品数据
    const token = uni.getStorageSync('token')
    const userInfo = uni.getStorageSync('userInfo')
    
    if (token && userInfo) {
      // 用户已登录
      const wasLogin = this.isLogin
      this.isLogin = true
      this.userInfo = userInfo
      
      // 如果之前未登录，或者商品列表为空，则加载商品数据
      if (!wasLogin || !this.currentProducts || this.currentProducts.length === 0) {
        console.log('检测到用户已登录，加载商品数据')
        // 已登录用户不需要传shopId，使用热销分类
        this.fetchData(null, 100, 1)
      }
    } else {
      // 用户未登录
      if (this.isLogin) {
        this.isLogin = false
        this.userInfo = {}
      }
      // 未登录时，如果商品列表为空，尝试加载（使用默认店铺）
      if (!this.currentProducts || this.currentProducts.length === 0) {
        console.log('用户未登录，使用默认店铺加载商品数据')
        this.fetchData(1, 100, 1) // 使用默认店铺ID
      }
    }
  },
  onShareAppMessage() {
    // 分享给微信好友
    return {
      title: '贸彩漆业 - 汽车漆、工业漆、雕塑漆、广告牌漆供应',
      desc: '联系人 李增春-13161621688',
      path: '/pages/index/index',
      imageUrl: '/static/images/share-logo.png' // 可以设置分享图片
    }
  },
  onShareTimeline() {
    // 分享到朋友圈
    return {
      title: '贸彩漆业 -汽车漆、工业漆、雕塑漆、广告牌漆供应',
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
          // 已登录，直接加载商品数据（后端根据Authorization自动返回对应店铺的商品）
          this.isLogin = true
          this.userInfo = userInfo
          console.log('用户已登录，直接加载商品数据')
          // 已登录用户不需要传shopId，使用热销分类（category_id=100）
          await this.fetchData(null, 100, 1)
        } else {
          // 未登录，需要获取位置信息并计算店铺
          console.log('未登录，检查店铺ID缓存')
          
          let shopId = null
          
          // 检查店铺ID缓存是否过期
          if (isServicePointIdExpired()) {
            // 店铺ID缓存过期或不存在，需要重新获取位置并计算
            console.log('店铺ID缓存已过期或不存在，重新获取位置并计算')
            await this.getLocationOnly()
            // 从缓存中获取计算好的店铺ID
            const servicePointIdCache = uni.getStorageSync('servicePointIdCache')
            shopId = servicePointIdCache ? servicePointIdCache.servicePointId : null
          } else {
            // 店铺ID缓存仍然有效，直接使用
            const servicePointIdCache = uni.getStorageSync('servicePointIdCache')
            shopId = servicePointIdCache ? servicePointIdCache.servicePointId : null
            console.log('使用缓存的店铺ID:', shopId)
          }
          
          // 如果还是没有shop_id，使用默认店铺
          if (!shopId) {
            shopId = 1 // 默认使用第一个店铺
            // 存储默认店铺ID（带时间戳）
            uni.setStorageSync('servicePointIdCache', {
              servicePointId: shopId,
              timestamp: Date.now()
            })
            console.warn('店铺ID无效，使用默认店铺ID:', shopId)
          }
          
          // 加载商品数据，传递店铺ID（首次加载使用热销分类，category_id=100）
          await this.fetchData(shopId, 100, 1)
        }
      } catch (error) {
        console.error('页面初始化失败:', error)
        // 即使获取位置失败，也尝试加载商品数据
        // 检查是否有token，如果有则按已登录处理，否则使用默认店铺
        const fallbackToken = uni.getStorageSync('token')
        if (fallbackToken) {
          this.isLogin = true
          this.userInfo = uni.getStorageSync('userInfo') || {}
          await this.fetchData(null, 100, 1)
        } else {
          await this.fetchData(1, 100, 1)
        }
      }
    },
    
    // 获取位置信息并计算店铺ID（不调用登录接口）
    async getLocationOnly() {
      try {
        const locationRes = await new Promise((resolve, reject) => {
          uni.getLocation({
            type: 'gcj02',
            success: resolve,
            fail: (err) => {
              console.warn('获取地理位置失败:', err)
              // 获取位置失败，返回null，后续使用默认店铺ID
              resolve(null)
            }
          })
        })
        
        let shopId = null
        
        if (locationRes && locationRes.latitude && locationRes.longitude) {
          // 成功获取位置，根据位置计算店铺ID
          shopId = getNearestShop(locationRes.latitude, locationRes.longitude)
          console.log('已获取位置信息并计算店铺ID:', {
            location: locationRes,
            shopId: shopId,
            timestamp: new Date().toLocaleString()
          })
        } else {
          // 获取位置失败，使用默认店铺ID
          shopId = 1 // 默认使用第一个店铺
          console.warn('获取位置信息失败，使用默认店铺ID:', shopId)
        }
        
        // 存储服务网点ID和时间戳
        uni.setStorageSync('servicePointIdCache', {
          servicePointId: shopId,
          timestamp: Date.now()
        })
      } catch (err) {
        console.warn('获取位置信息异常:', err)
        // 异常情况，使用默认服务网点ID
        uni.setStorageSync('servicePointIdCache', {
          servicePointId: 1, // 默认使用第一个服务网点
          timestamp: Date.now()
        })
      }
    },
    
    // 自动登录（非首次登录时使用）
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
          return false
        }

        // 使用默认昵称与头像
        const nickname = '微信用户'
        const avatar = '/static/images/default-avatar.png'
        
        // 获取服务网点ID（从缓存中获取，如果没有则使用默认值）
        const servicePointIdCache = uni.getStorageSync('servicePointIdCache')
        let shopId = servicePointIdCache ? servicePointIdCache.servicePointId : null
        if (!shopId) {
          // 如果没有服务网点ID，使用默认服务网点
          shopId = 1 // 默认使用第一个服务网点
          console.warn('登录时未找到服务网点ID缓存，使用默认服务网点')
        }

        const loginData = {
          code: code,
          nickname: nickname,
          avatar: avatar,
          service_point_id: shopId
        }

        console.log('调用登录接口，数据:', loginData)
        const loginApiRes = await goLogin(loginData)
        
        if (loginApiRes.data.code === 0) {
          // 从响应头获取 token（新机制：token 不再从 data 返回，只从响应头返回）
          const headers = loginApiRes.header || {}
          let token = null
          for (const key in headers) {
            if (key.toLowerCase() === 'x-token') {
              token = headers[key]
              break
            }
          }
          if (!token) {
            throw new Error('登录失败：未获取到token')
          }
          
          // 从响应数据获取用户信息
          const { user_id, nickname: backendNickname, avatar: backendAvatar } = loginApiRes.data.data
          
          // 使用后端返回的用户信息（nickname 和 avatar）
          const user_info = {
            id: user_id,
            nickname: backendNickname || nickname,  // 优先使用后端返回的，如果没有则使用前端传递的
            avatar: backendAvatar || avatar           // 优先使用后端返回的，如果没有则使用前端传递的
          }

          // 存储登录信息
          uni.setStorageSync('token', token)
          uni.setStorageSync('userInfo', user_info)
          uni.setStorageSync('hasStoredUserInfo', true)
          
          // 登录成功后，清除servicePointIdCache（因为后端已经有了用户的服务网点信息）
          // 以后登录只需要传code，不需要传shop_id
          uni.removeStorageSync('servicePointIdCache')

          // 更新页面状态
          this.isLogin = true
          this.userInfo = user_info
          
          console.log('自动登录成功:', user_info)
          
          return true
        } else {
          console.error('登录接口返回错误:', loginApiRes.data?.message || '未知错误')
          return false
        }
      } catch (err) {
        console.error('自动登录失败:', err)
        return false
      }
    },
    
    async fetchData(shopId = null, categoryId = null, page = 1) {
      const startTime = Date.now()
      console.log(`[商品列表] 开始加载 - 页码: ${page}, 分类ID: ${categoryId}, 店铺ID: ${shopId || '已登录用户'}`)
      
      try {
        this.isLoading = true
        
        // 如果传了shopId，说明是未登录用户
        // 如果没传shopId，说明是已登录用户（后端根据Authorization判断）
        // 新接口支持分页和分类筛选
        // 确定分类ID：优先使用传入的categoryId，否则使用当前选中的分类，默认使用热销分类(100)
        const finalCategoryId = categoryId !== null ? categoryId : (this.activeCategory || 100)
        
        const requestStartTime = Date.now()
        const res = await getProductList({
          searchName: '',
          shopId: shopId,
          categoryId: finalCategoryId,
          page: page,
          pageSize: this.pageSize
        })
        const requestEndTime = Date.now()
        const requestDuration = requestEndTime - requestStartTime
        
        console.log(`[商品列表] API请求耗时: ${requestDuration}ms`)
        console.log(`[商品列表] API返回数据量: 分类${res.categories?.length || 0}个, 商品${res.products?.length || 0}条`)
        
        const processStartTime = Date.now()
        
        // 新接口返回结构: {categories: [], products: [], has_more, total, page, page_size, current_category}
        this.categories = res.categories || []
        this.hasMore = res.has_more || false
        this.total = res.total || 0
        this.currentPage = res.page || page
        
        // 如果是第一页，直接替换；如果是加载更多，追加到现有列表
        if (page === 1) {
          this.products = res.products || []
        } else {
          // 加载更多，追加商品
          this.products = [...this.products, ...(res.products || [])]
        }
        
        // 保存原始数据（用于搜索后恢复，只在首次加载且是热销分类时保存）
        if (page === 1 && finalCategoryId === 100) {
          this.originalCategories = res.categories || []
          this.originalProducts = res.products || []
        }
        
        // 更新当前显示的商品列表
        this.currentProducts = this.products
        
        // 首次加载时，默认选中热销分类
        if (page === 1 && !this.activeCategory) {
          this.activeCategory = 100 // 默认显示热销分类
        }
        
        const processEndTime = Date.now()
        const processDuration = processEndTime - processStartTime
        const totalDuration = Date.now() - startTime
        
        console.log(`[商品列表] 数据处理耗时: ${processDuration}ms`)
        console.log(`[商品列表] 总耗时: ${totalDuration}ms (API: ${requestDuration}ms, 处理: ${processDuration}ms)`)
        
      } catch (err) {
        const totalDuration = Date.now() - startTime
        console.error(`[商品列表] 加载商品数据失败 (总耗时: ${totalDuration}ms):`, err)
        
        // 获取错误信息
        const errorMessage = err.message || '数据加载失败'
        
        // 只针对 401 状态码的登录错误显示引导登录弹框
        if (err.is401LoginError) {
          // 清除登录状态
          this.isLogin = false
          this.userInfo = {}
          
          // 检查是否之前登录过（有 hasStoredUserInfo 标记）
          const hasStoredUserInfo = uni.getStorageSync('hasStoredUserInfo')
          
          // 直接显示引导登录的弹框，不显示toast
          uni.showModal({
            title: hasStoredUserInfo ? '登录已过期' : '需要登录',
            content: hasStoredUserInfo 
              ? '您的登录已过期，是否重新登录？' 
              : '您还未登录，是否注册登录？',
            confirmText: '去登录',
            cancelText: '稍后',
            success: (modalRes) => {
              if (modalRes.confirm) {
                uni.navigateTo({
                  url: '/pages/user/login'
                })
              } else {
                // 用户取消，显示提示
                uni.showToast({
                  title: '部分功能需要登录后使用',
                  icon: 'none',
                  duration: 2000
                })
              }
            }
          })
        } else {
          // 其他错误，显示toast提示
          uni.showToast({
            title: errorMessage,
            icon: 'none',
            duration: 2000
          })
        }
      } finally {
        this.isLoading = false
      }
    },
    
    async changeCategory(categoryId) {
      this.activeCategory = categoryId
      // 切换分类时，重新加载第一页数据
      this.currentPage = 1
      this.products = []
      this.currentProducts = []
      
      // 获取当前店铺ID（未登录用户需要）
      const token = uni.getStorageSync('token')
      let shopId = null
      if (!token) {
        const shopIdCache = uni.getStorageSync('shopIdCache')
        shopId = shopIdCache ? shopIdCache.shopId : null
      }
      
      // 重新加载该分类的商品
      await this.fetchData(shopId, categoryId, 1)
    },
    
    // 添加商品到需求单
    async addToCart(productId) {
      try {
        console.log('首页 - 开始添加商品到需求单，商品ID:', productId)
        
        // 检查登录状态，如果未登录则跳转到登录页
        const token = uni.getStorageSync('token')
        if (!token) {
          console.log('首页 - 用户未登录，跳转到登录页')
          uni.navigateTo({
            url: '/pages/user/login'
          })
          return
        }
        
        console.log('首页 - 开始添加商品到需求单')
        const res = await addToDraftApi({ product_id: productId })
        console.log('首页 - 需求单添加API返回:', res)
        
        if (res.data.code === 0) {
          uni.showToast({
            title: '已加入需求单',
            icon: 'success'
          })
          
          // 更新底部需求单徽标
          this.updateCartBadge()
          
          // 延迟跳转到需求单页面，让用户看到提示
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/draft/index'
            })
          }, 1000)
        } else {
          console.error('首页 - 需求单添加失败:', res.data.message)
          uni.showToast({
            title: res.data.message || '添加需求单失败',
            icon: 'none'
          })
        }
      } catch (err) {
        console.error('首页 - 需求单添加异常:', err)
        uni.showToast({
          title: '添加需求单失败',
          icon: 'none'
        })
      }
    },
    
    // 立即询价 - 显示联系客服弹窗
    goToInquiry(product) {
      showContactService()
    },
    
    // 处理商品点击
    handleProductClick(product) {
      uni.showActionSheet({
        itemList: ['查看详情', '联系客服'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 查看详情 - 显示商品详细信息
            this.showProductDetail(product)
          } else if (res.tapIndex === 1) {
            // 联系客服
            showContactService()
          }
        }
      })
    },
    
    // 添加到需求单
    async addToDraft(productId) {
      await this.addToCart(productId)
    },
    
    // 联系客服
    contactService() {
      console.log('点击联系客服按钮')
      try {
        const result = showContactService()
        console.log('showContactService 调用结果:', result)
      } catch (err) {
        console.error('联系客服失败:', err)
        uni.showToast({
          title: '联系客服失败',
          icon: 'none'
        })
      }
    },
    
    // 显示商品详情
    showProductDetail(product) {
      // 显示商品详细信息弹窗
      const productName = product.specification ? `${product.name} ${product.specification}` : product.name
      const content = `商品名称：${productName}\n参考价：¥${product.reference_price} / ${product.unit}\n\n如需了解更多信息或询价，请联系客服。`
      uni.showModal({
        title: '商品详情',
        content: content,
        showCancel: true,
        cancelText: '关闭',
        confirmText: '联系客服',
        success: (res) => {
          if (res.confirm) {
            showContactService()
          }
        }
      })
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
        title: '贸彩漆业',
        summary: '汽车漆、工业漆、雕塑漆、广告牌漆供应',
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
    
    // 更新需求单徽标
    async updateCartBadge() {
      // 只有在已登录状态下才更新需求单徽标
      if (!this.isLogin) {
        console.log('用户未登录，跳过需求单徽标更新')
        return
      }
      
      try {
        console.log('开始更新需求单徽标...')
        const res = await getDraftList()
        if (res.data.code === 0) {
          const draftItems = res.data.data || []
          const uniqueItemCount = draftItems.length
          
          console.log('需求单商品数量:', uniqueItemCount)
          
          if (uniqueItemCount > 0) {
            uni.setTabBarBadge({
              index: 2, // 需求单tab的索引是2
              text: uniqueItemCount.toString()
            })
          } else {
            uni.removeTabBarBadge({
              index: 2 // 需求单tab的索引是2
            })
          }
        } else {
          console.error('获取需求单列表失败:', res.data.message)
        }
      } catch (error) {
        console.error('更新需求单徽标失败:', error)
        // 如果是401错误，说明token可能过期，可以尝试重新登录
        if (error.statusCode === 401) {
          console.log('需求单接口返回401，可能需要重新登录')
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
      
      const startTime = Date.now()
      console.log(`[商品搜索] 开始搜索 - 关键词: "${this.searchKeyword}"`)
      
      this.isSearching = true
      
      try {
        // 确定店铺ID（未登录用户需要传shop_id）
        const token = uni.getStorageSync('token')
        let shopId = null
        if (!token) {
          // 未登录用户：从缓存获取服务网点ID
          const servicePointIdCache = uni.getStorageSync('servicePointIdCache')
          shopId = servicePointIdCache ? servicePointIdCache.servicePointId : null
          if (!shopId) {
            // 如果缓存中没有shop_id，使用默认店铺
            // （正常情况下，initPage中已经获取了位置和shop_id）
            shopId = 1 // 默认使用第一个店铺
            console.warn('搜索时未找到店铺ID，使用默认店铺')
          }
        }
        // 已登录用户：不需要传shopId，后端根据Authorization自动判断
        
        const requestStartTime = Date.now()
        // 调用后端API进行搜索（新接口支持搜索）
        const res = await getProductList({
          searchName: this.searchKeyword,
          shopId: shopId,
          categoryId: null, // 搜索时不限制分类
          page: 1,
          pageSize: this.pageSize
        })
        const requestEndTime = Date.now()
        const requestDuration = requestEndTime - requestStartTime
        
        console.log(`[商品搜索] API请求耗时: ${requestDuration}ms`)
        console.log(`[商品搜索] API返回数据量: 分类${res.categories?.length || 0}个, 商品${res.products?.length || 0}条`)
        console.log('搜索关键词:', this.searchKeyword)
        console.log('搜索API返回数据:', res)
        
        const processStartTime = Date.now()
        
        // 检查API返回的数据结构
        if (res && typeof res === 'object') {
          // 保存原始的分类和商品数据（用于清空搜索时恢复）
          if (!this.originalCategories) {
            this.originalCategories = this.categories
            this.originalProducts = this.products
          }
          
          // 新接口返回结构: {categories: [], products: [], has_more, total, page, page_size}
          this.categories = res.categories || []
          this.products = res.products || [] // 新接口返回的是数组
          this.currentProducts = res.products || []
          this.hasMore = res.has_more || false
          this.total = res.total || 0
          this.currentPage = res.page || 1
          
          // 清空当前选中的分类，因为显示的是搜索结果
          this.activeCategory = null
          
          // 根据搜索结果给出不同的提示
          if (this.currentProducts.length === 0) {
            console.log('搜索完成，未找到匹配的商品')
            // 不显示错误提示，只是显示空结果
          } else {
            console.log('搜索成功，找到商品数量:', this.currentProducts.length, '总计:', this.total)
          }
          
          const processEndTime = Date.now()
          const processDuration = processEndTime - processStartTime
          const totalDuration = Date.now() - startTime
          
          console.log(`[商品搜索] 数据处理耗时: ${processDuration}ms`)
          console.log(`[商品搜索] 总耗时: ${totalDuration}ms (API: ${requestDuration}ms, 处理: ${processDuration}ms)`)
        } else {
          const processEndTime = Date.now()
          const processDuration = processEndTime - processStartTime
          const totalDuration = Date.now() - startTime
          
          console.log(`[商品搜索] 数据处理耗时: ${processDuration}ms`)
          console.log(`[商品搜索] 总耗时: ${totalDuration}ms (API: ${requestDuration}ms, 处理: ${processDuration}ms)`)
          
          console.log('搜索失败，返回数据格式错误:', res)
          uni.showToast({
            title: '搜索失败，请重试',
            icon: 'none'
          })
        }
      } catch (error) {
        const totalDuration = Date.now() - startTime
        console.error(`[商品搜索] 搜索失败 (总耗时: ${totalDuration}ms):`, error)
        uni.showToast({
          title: '搜索失败，请重试',
          icon: 'none'
        })
      } finally {
        this.isSearching = false
      }
    },
    
    // 清空搜索
    async clearSearch() {
      this.searchKeyword = ''
      this.isSearching = false
      
      // 恢复原始数据（新接口返回的是数组）
      if (this.originalCategories && this.originalProducts) {
        this.categories = this.originalCategories
        this.products = Array.isArray(this.originalProducts) ? this.originalProducts : []
        this.currentProducts = this.products
        
        // 恢复原始的分类选择（热销分类或第一个分类）
        if (this.categories.length > 0) {
          // 如果之前选择的是热销分类，恢复为热销分类
          this.activeCategory = 100 // 默认显示热销分类
        }
      } else {
        // 如果没有原始数据，重新加载
        try {
          // 确定店铺ID（未登录用户需要传shop_id）
          const token = uni.getStorageSync('token')
          let shopId = null
          if (!token) {
            // 未登录用户：从缓存获取店铺ID
            const servicePointIdCache = uni.getStorageSync('servicePointIdCache')
            shopId = servicePointIdCache ? servicePointIdCache.servicePointId : null
            if (!shopId) {
              // 如果缓存中没有shop_id，使用默认店铺
              // （正常情况下，initPage中已经获取了位置和shop_id）
              shopId = 1 // 默认使用第一个店铺
              console.warn('清空搜索时未找到店铺ID，使用默认店铺')
            }
          }
          // 已登录用户：不需要传shopId，后端根据Authorization自动判断
          
          // 重新加载数据（使用热销分类，category_id=100）
          this.currentPage = 1
          this.activeCategory = 100 // 默认显示热销分类
          await this.fetchData(shopId, 100, 1)
        } catch (error) {
          console.error('重新加载数据失败:', error)
          uni.showToast({
            title: '重新加载失败',
            icon: 'none'
          })
        }
      }
    },
    
    // 显示当前分类的商品（新接口返回的是数组，需要重新加载）
    async showCurrentCategoryProducts() {
      // 新接口返回的是数组，切换分类时需要重新请求
      if (this.activeCategory) {
        const token = uni.getStorageSync('token')
        let shopId = null
        if (!token) {
          const shopIdCache = uni.getStorageSync('shopIdCache')
          shopId = shopIdCache ? shopIdCache.shopId : null
        }
        // 重新加载该分类的商品
        this.currentPage = 1
        this.products = []
        await this.fetchData(shopId, this.activeCategory, 1)
      } else {
        this.currentProducts = []
      }
    },
    
    // 加载更多商品（滚动到底部时触发）
    async loadMore() {
      // 如果正在加载或没有更多商品，不执行
      if (this.isLoading || !this.hasMore || this.isSearching) {
        return
      }
      
      // 加载下一页
      const nextPage = this.currentPage + 1
      const token = uni.getStorageSync('token')
      let shopId = null
      if (!token) {
        const shopIdCache = uni.getStorageSync('shopIdCache')
        shopId = shopIdCache ? shopIdCache.shopId : null
      }
      
      // 获取当前分类ID（热销分类为100）
      const categoryId = this.activeCategory === 100 ? 100 : this.activeCategory
      
      await this.fetchData(shopId, categoryId, nextPage)
    },
    
    // 处理 token 过期
    handleTokenExpired() {
      console.warn('token 无效或已过期，清除登录状态')
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
      this.isLogin = false
      this.userInfo = {}
      
      // 检查是否之前登录过（有 hasStoredUserInfo 标记）
      const hasStoredUserInfo = uni.getStorageSync('hasStoredUserInfo')
      
      if (hasStoredUserInfo) {
        // 之前登录过，尝试自动重新登录
        uni.showModal({
          title: '登录已过期',
          content: '您的登录已过期，是否重新登录？',
          confirmText: '重新登录',
          cancelText: '稍后',
          success: (res) => {
            if (res.confirm) {
              // 用户确认，跳转到登录页面（会自动重新登录）
              uni.navigateTo({
                url: '/pages/user/login'
              })
            } else {
              // 用户取消，显示提示
              uni.showToast({
                title: '部分功能需要登录后使用',
                icon: 'none',
                duration: 2000
              })
            }
          }
        })
      } else {
        // 首次使用，提示需要登录
        uni.showModal({
          title: '需要登录',
          content: '查看余额等功能需要登录，是否前往登录？',
          confirmText: '去登录',
          cancelText: '稍后',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/user/login'
              })
            } else {
              uni.showToast({
                title: '部分功能需要登录后使用',
                icon: 'none',
                duration: 2000
              })
            }
          }
        })
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
  padding: 0;
  height: 100%;
  background-color: #f5f5f5;
}

.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  padding: 20rpx;
}

.product-item {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.product-item:active {
  transform: scale(0.98);
  box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.12);
}

.product-image-wrapper {
  width: 100%;
  height: 320rpx;
  background-color: #f5f5f5;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.product-info {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-name-wrapper {
  display: flex;
  align-items: baseline;
  margin-bottom: 12rpx;
  line-height: 1.4;
}

.product-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.product-specification {
  font-size: 22rpx;
  color: #999;
  margin-left: 8rpx;
  font-weight: normal;
}

/* 公告栏样式 */
.notice-bar {
  background-color: #fff3cd;
  margin: 0 20rpx 20rpx;
  padding: 20rpx;
  border-radius: 8rpx;
  border-left: 4rpx solid #ffc107;
  display: flex;
  align-items: flex-start;
}

.notice-icon {
  font-size: 32rpx;
  margin-right: 10rpx;
  flex-shrink: 0;
}

.notice-text {
  font-size: 24rpx;
  color: #856404;
  line-height: 1.6;
  flex: 1;
}

.price-info {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  margin-bottom: 8rpx;
}

.price-label {
  font-size: 22rpx;
  color: #666;
  margin-right: 4rpx;
}

.product-price {
  color: #e93b3d;
  font-size: 28rpx;
  font-weight: bold;
  margin-right: 4rpx;
}

.product-unit {
  color: #999;
  font-size: 22rpx;
}

.price-tip {
  font-size: 20rpx;
  color: #999;
  line-height: 1.4;
  margin-bottom: 16rpx;
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 8rpx;
}

.action-btn {
  width: 100%;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  border: none;
  padding: 0;
  margin: 0;
  position: relative;
  z-index: 10;
}

.add-draft-btn {
  background-color: #4169E1;
  color: #fff;
}

.add-draft-btn:active {
  background-color: #3151B8;
}

.contact-btn {
  background-color: #ff9500;
  color: #fff;
}

.contact-btn:active {
  background-color: #e6850e;
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
}

.loading-more {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 24rpx;
}

.no-more {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 24rpx;
}
</style>