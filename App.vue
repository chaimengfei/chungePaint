<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
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