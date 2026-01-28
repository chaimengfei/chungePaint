<template>
  <view class="webview-container">
    <!-- #ifdef MP-WEIXIN -->
    <web-view :src="url"></web-view>
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <view class="tip">请在微信小程序中打开</view>
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      url: ''
    }
  },
  onLoad(options) {
    if (options.url) {
      this.url = decodeURIComponent(options.url)
    }
  }
}
</script>

<style scoped>
.webview-container {
  width: 100%;
  height: 100vh;
}

.tip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 32rpx;
  color: #999;
}
</style>
