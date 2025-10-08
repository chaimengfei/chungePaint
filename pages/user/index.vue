<template>
  <view class="content">
    <view class="user-header">
      <image class="avatar" src="/static/images/default-avatar.png"></image>
      <text class="username">未登录</text>
      <button v-if="!isLogin" class="login-btn" @click="goLogin">登录/注册</button>
    </view>
    
    <view class="menu-list">
      <view class="menu-item">
        <text class="label">我的收藏</text>
        <uni-icons type="arrowright" size="16" color="#999"></uni-icons>
      </view>
      <view class="menu-item">
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
    const token = uni.getStorageSync('token')
    const user = uni.getStorageSync('userInfo')
    this.isLogin = !!token
    this.userInfo = user || {}
  },
  methods: {
    goLogin() {
      uni.navigateTo({
        url: '/pages/user/login'
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
  background-color: #ff69b4;
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