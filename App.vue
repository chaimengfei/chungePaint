<script>
import { ENV_INFO } from '@/api/common.js'

export default {
  onLaunch: function() {
    console.log('App Launch')
    // 检查环境一致性（必须在检查登录状态之前）
    this.checkEnvConsistency()
    // 检查登录状态
    this.checkGlobalLoginStatus()
    // 移除应用启动时的购物车徽标初始化，避免401错误
    // 购物车徽标只在用户点击购物车图标时更新
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    // 检查环境一致性
    checkEnvConsistency() {
      const storedEnv = uni.getStorageSync('env')
      const currentEnv = ENV_INFO.env // 从 api/common.js 导入的当前环境
      
      console.log('环境检查 - 存储的环境:', storedEnv, '当前环境:', currentEnv)
      
      if (storedEnv && storedEnv !== currentEnv) {
        // 环境已切换，清除所有登录相关缓存
        console.warn('环境已切换，从', storedEnv, '切换到', currentEnv, '，清除登录数据')
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')
        uni.removeStorageSync('hasStoredUserInfo')
        uni.removeStorageSync('env') // 清除旧的环境标识
        console.log('环境已切换，已清除登录相关缓存，需要重新登录')
      } else if (!storedEnv) {
        // 首次运行，没有存储环境标识，这是正常的
        console.log('首次运行，未检测到环境标识')
      } else {
        // 环境一致
        console.log('环境一致，无需清除缓存')
      }
    },
    
    // 检查全局登录状态
    checkGlobalLoginStatus() {
      const token = uni.getStorageSync('token')
      const userInfo = uni.getStorageSync('userInfo')
      
      if (token && userInfo) {
        console.log('应用启动时检测到用户已登录:', userInfo.nickname || '用户')
        // token已存储在本地，各个API会在调用时自动获取并添加到请求头
        console.log('应用启动时token已存在:', token)
      } else {
        console.log('应用启动时检测到用户未登录，将在首页进行自动登录')
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