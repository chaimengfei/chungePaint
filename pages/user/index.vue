<template>
  <view class="content">
    <view class="user-header">
      <image 
        class="avatar" 
        :src="isLogin && userInfo.avatar ? userInfo.avatar : '/static/images/default-avatar.png'"
        mode="aspectFill"
      ></image>
      <text class="username">{{ isLogin && userInfo.nickname ? userInfo.nickname : '未登录' }}</text>
      <button v-if="!isLogin" class="login-btn" @click="goLogin">登录/注册</button>
    </view>
    
    <view class="menu-list">
      <view class="menu-item" @click="goToAddress">
        <text class="label">收货地址</text>
        <uni-icons type="arrowright" size="16" color="#999"></uni-icons>
      </view>
      <view class="menu-item">
        <text class="label">设置</text>
        <uni-icons type="arrowright" size="16" color="#999"></uni-icons>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {},
      isLogin: false
    }
  },
  onShow() {
    // tab切换时显示确认提示
    const token = uni.getStorageSync('token')
    if (!token) {
      this.checkLoginStatusWithPrompt()
    } else {
      this.checkLoginStatus()
    }
  },
  
  onLoad() {
    this.checkLoginStatus()
  },
  
  methods: {
    // 检查登录状态并更新用户信息
    checkLoginStatus() {
      const token = uni.getStorageSync('token')
      const user = uni.getStorageSync('userInfo')
      
      if (!token) {
        // 未登录，只更新状态，不自动跳转
        this.isLogin = false
        this.userInfo = {}
        // 不自动跳转，让用户点击"登录/注册"按钮或通过tab切换触发
        return
      }
      
      // 已登录，更新用户信息
      this.isLogin = true
      this.userInfo = user || {}
      console.log('我的页面 - 用户信息已更新:', this.userInfo)
    },
    
    // 检查登录状态（用于tab切换时）
    checkLoginStatusWithPrompt() {
      const token = uni.getStorageSync('token')
      const user = uni.getStorageSync('userInfo')
      
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
              // 用户取消，停留在当前页面（我的页面，显示未登录状态）
              // 不进行任何跳转，只更新登录状态
              this.isLogin = false
              this.userInfo = {}
            }
          }
        })
        return false
      }
      
      // 已登录，更新用户信息
      this.isLogin = true
      this.userInfo = user || {}
      return true
    },
    
    goLogin() {
      uni.navigateTo({
        url: '/pages/user/login'
      })
    },
    
    goToAddress() {
      // 检查登录状态
      const token = uni.getStorageSync('token')
      if (!token) {
        // 未登录，提示需要登录
        uni.showToast({
          title: '需登录才能查看',
          icon: 'none',
          duration: 2000
        })
        return
      }
      // 已登录，跳转到地址列表
      uni.navigateTo({
        url: '/pages/address/list'
      })
    }
  }
}
</script>

<style>
.content {
  background-color: #f8f8f8;
  min-height: 100vh;
}

.user-header {
  background-color: #4169E1;
  padding: 60rpx 40rpx;
  display: flex;
  align-items: center;
  color: white;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255,255,255,0.3);
  margin-right: 30rpx;
}

.username {
  font-size: 32rpx;
  flex: 1;
}

.login-btn {
  background-color: transparent;
  color: white;
  border: 1rpx solid white;
  font-size: 24rpx;
  height: 50rpx;
  line-height: 50rpx;
  padding: 0 30rpx;
  border-radius: 25rpx;
}

.menu-list {
  background-color: white;
  margin: 20rpx;
  border-radius: 10rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.menu-item .label {
  flex: 1;
  font-size: 28rpx;
}
</style>