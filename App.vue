<script>
import { getCartList } from '@/api/cart.js'

export default {
  onLaunch: function() {
    console.log('App Launch')
    // 检查登录状态
    this.checkGlobalLoginStatus()
    // 初始化购物车徽标
    this.initCartBadge()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    // 检查全局登录状态
    checkGlobalLoginStatus() {
      const token = uni.getStorageSync('token')
      const userInfo = uni.getStorageSync('userInfo')
      
      if (token && userInfo) {
        console.log('应用启动时检测到用户已登录:', userInfo.nickname || '用户')
        // 设置全局请求头
        uni.$u.http.setConfig((config) => {
          config.header.Authorization = `Bearer ${token}`
          return config
        })
      } else {
        console.log('应用启动时检测到用户未登录，将在首页进行自动登录')
      }
    },
    
    // 初始化购物车徽标
    async initCartBadge() {
      try {
        const res = await getCartList()
        if (res.data && res.data.code === 0) {
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
      } catch (err) {
        console.error('初始化购物车徽标失败:', err)
      }
    }
  }
}
</script>

<style>
/* 每个页面公共css */
page {
  height: 100%;
  box-sizing: border-box;
}
</style>