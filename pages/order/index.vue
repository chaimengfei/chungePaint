<template>
  <view class="content">
    <view class="header">
      <text class="title">我的订单</text>
    </view>
    <view class="order-tabs">
      <text class="tab active">全部</text>
      <text class="tab">待付款</text>
      <text class="tab">待发货</text>
      <text class="tab">待收货</text>
    </view>
    <view class="empty-order">
      <image src="/static/images/empty-order.png" mode="aspectFit"></image>
      <text class="tip">暂无订单</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {}
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

.order-tabs {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
}

.tab {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  padding: 15rpx 0;
}

.tab.active {
  color: #e93b3d;
  font-weight: bold;
  position: relative;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 4rpx;
  background-color: #e93b3d;
}

.empty-order {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100rpx;
}

.empty-order image {
  width: 300rpx;
  height: 300rpx;
  margin-bottom: 40rpx;
}

.tip {
  font-size: 28rpx;
  color: #999;
}
</style>