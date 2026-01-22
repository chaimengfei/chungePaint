<template>
  <view class="content">
    <view class="user-header">
      <image 
        class="avatar" 
        :src="isLogin && userInfo.avatar ? userInfo.avatar : '/static/images/default-avatar.png'"
        mode="aspectFill"
      ></image>
      <text class="username">{{ isLogin && userInfo.nickname ? userInfo.nickname : '微信用户' }}</text>
      <text class="welcome-text">（欢迎，如需采购咨询请随时联系）</text>
      <button v-if="!isLogin" class="login-btn" @click="goLogin">登录/注册</button>
    </view>
    
    <!-- 核心功能入口 -->
    <view class="function-grid">
      <view class="function-item" @click="goToInquiry">
        <text class="function-icon">📋</text>
        <text class="function-label">我的询价</text>
      </view>
      <view class="function-item" @click="contactService">
        <text class="function-icon">📞</text>
        <text class="function-label">联系客服</text>
      </view>
      <view class="function-item" @click="addEnterpriseWechat">
        <text class="function-icon">🏢</text>
        <text class="function-label">企业微信</text>
      </view>
    </view>
    
    <!-- 信息管理 -->
    <view class="menu-list">
      <view class="menu-item" @click="goToProfile">
        <text class="label">我的资料</text>
        <uni-icons type="arrowright" size="16" color="#999"></uni-icons>
      </view>
      <view class="menu-item contact-info">
        <text class="label">客服电话：400-XXX-XXXX</text>
      </view>
      <view class="menu-item contact-info">
        <text class="label">在线时间：工作日 8:30-17:30</text>
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
    
    // 跳转到我的询价
    goToInquiry() {
      uni.navigateTo({
        url: '/pages/inquiry/index'
      })
    },
    
    // 联系客服
    contactService() {
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
    
    // 添加企业微信
    addEnterpriseWechat() {
      // 这里可以跳转到企业微信添加页面或复制微信号
      uni.showToast({
        title: '请添加企业微信客服',
        icon: 'none',
        duration: 2000
      })
      // 可以添加复制微信号到剪贴板的功能
      // uni.setClipboardData({
      //   data: '企业微信号',
      //   success: () => {
      //     uni.showToast({
      //       title: '微信号已复制',
      //       icon: 'success'
      //     })
      //   }
      // })
    },
    
    // 我的资料
    goToProfile() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showToast({
          title: '需登录才能查看',
          icon: 'none',
          duration: 2000
        })
        return
      }
      // 可以跳转到个人资料编辑页面
      uni.showToast({
        title: '个人资料功能开发中',
        icon: 'none'
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
  flex-direction: column;
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
  font-size: 36rpx;
  font-weight: bold;
  margin-top: 20rpx;
  margin-bottom: 10rpx;
}

.welcome-text {
  font-size: 24rpx;
  opacity: 0.9;
  margin-bottom: 20rpx;
}

.function-grid {
  display: flex;
  justify-content: space-around;
  padding: 40rpx 20rpx;
  background-color: #fff;
  margin: 20rpx;
  border-radius: 10rpx;
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.function-icon {
  font-size: 60rpx;
  margin-bottom: 10rpx;
}

.function-label {
  font-size: 24rpx;
  color: #333;
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

.menu-item .sub-label {
  font-size: 22rpx;
  color: #999;
  margin-left: 10rpx;
}

.menu-item.contact-info {
  background-color: #f8f8f8;
}

.menu-item.contact-info .label {
  color: #666;
  font-size: 26rpx;
}
</style>