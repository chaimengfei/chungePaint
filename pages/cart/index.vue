<template>
  <view class="content">
    <view class="header">
      <text class="title">购物车</text>
    </view>
    <view class="empty-cart" v-if="true"> <!-- 这里可以根据实际数据判断 -->
      <image src="/static/images/empty-cart.png" mode="aspectFit"></image>
      <text class="tip">购物车还是空的</text>
      <button class="btn" @click="goToIndex">去逛逛</button>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    goToIndex() {
      uni.switchTab({
        url: '/pages/index/index'
      })
    }
  }
}
</script>

<style>
.content {
  padding: 20rpx;
}

.header {
  padding: 30rpx 0;
  border-bottom: 1rpx solid #eee;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100rpx;
}

.empty-cart image {
  width: 300rpx;
  height: 300rpx;
  margin-bottom: 40rpx;
}

.tip {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.btn {
  background-color: #e93b3d;
  color: white;
  width: 200rpx;
  height: 70rpx;
  line-height: 70rpx;
  font-size: 28rpx;
  border-radius: 35rpx;
}
</style>