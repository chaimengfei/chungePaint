<template>
  <view class="container">
    <!-- 企业信息展示区域 -->
    <view class="company-info">
      <view class="company-card">
        <text class="company-title">贸彩漆业</text>
        <text class="company-desc">汽车漆、工业漆、雕塑&广告牌漆、各种辅料</text>
      </view>
    </view>

    <!-- 企业案例展示区域 -->
    <view class="cases-section">
      <view class="section-title">企业案例</view>
      <view class="cases-grid">
        <view 
          v-for="(caseItem, index) in cases" 
          :key="index" 
          class="case-item"
        >
          <image 
            class="case-image" 
            :src="caseItem.image" 
            mode="aspectFill"
            @error="handleImageError(index)"
          />
          <view class="case-info">
            <text class="case-name">{{ caseItem.name }}</text>
            <text class="case-desc">{{ caseItem.description }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      cases: [
        {
          name: '燕郊永旺',
          description: '商业综合体外墙涂装',
          image: '/static/images/cases/yongwang.jpg'
        },
        {
          name: '北京全聚德烤鸭',
          description: '传统建筑翻新涂装',
          image: '/static/images/cases/quanjude.jpg'
        },
        {
          name: 'xxxx',
          description: '项目案例描述',
          image: '/static/images/cases/case3.jpg'
        }
      ]
    }
  },
  methods: {
    handleImageError(index) {
      // 图片加载失败时使用默认图片
      this.cases[index].image = '/static/images/maocai-logo.png'
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20rpx;
}

/* 企业信息区域 */
.company-info {
  padding: 40rpx 30rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.company-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
  background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.company-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  text-align: center;
}

.company-desc {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  text-align: center;
}

/* 案例展示区域 */
.cases-section {
  padding: 0 30rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-left: 10rpx;
}

.cases-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.case-item {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}

.case-item:active {
  transform: scale(0.98);
}

.case-image {
  width: 100%;
  height: 240rpx;
  background-color: #f0f0f0;
}

.case-info {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.case-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.case-desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
