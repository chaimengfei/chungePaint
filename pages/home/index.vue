<template>
  <view class="container">
    <!-- 企业信息展示区域 -->
    <view class="company-info">
      <view class="company-card">
        <text class="company-title">贸彩漆业</text>
        <text class="company-desc">汽车漆、工业漆、雕塑&广告牌漆、各种辅料</text>
      </view>
    </view>


    <view class="faq-section">
      <view class="faq-title-wrapper">
        <view class="faq-title-bar"></view>
        <text class="faq-title">一站式解决方案</text>
      </view>
      <view class="faq-container">
        <scroll-view 
          v-for="(row, rowIndex) in faqRows" 
          :key="rowIndex"
          class="faq-row"
          scroll-x="true"
          show-scrollbar="false"
          :style="{ animationDelay: `${rowIndex * 0.3}s` }"
        >
          <view class="faq-tags" :style="{ animationDuration: animationDuration }">
            <view 
              v-for="(item, index) in row" 
              :key="index" 
              class="faq-tag"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <text class="faq-tag-icon">♡</text>
              <text class="faq-tag-text">{{ item }}</text>
            </view>
            <!-- 复制一份用于无缝循环 -->
            <view 
              v-for="(item, index) in row" 
              :key="`copy-${index}`" 
              class="faq-tag"
              :style="{ animationDelay: `${(index + row.length) * 0.1}s` }"
            >
              <text class="faq-tag-icon">♡</text>
              <text class="faq-tag-text">{{ item }}</text>
            </view>
          </view>
        </scroll-view>
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
      ],
      marqueeItems: [
        '2K漆能加固化剂吗？',
        '固化剂的配比多少？',
        '拉丝效果怎么做？',
        '工业漆的干燥时间？',
        '如何选择合适的稀释剂？',
        '底漆和面漆的区别？',
        '如何防止漆面起泡？',
        '漆膜厚度如何控制？'
      ],
      animationDuration: '20s'
    }
  },
  computed: {
    faqRows() {
      // 将问题分成3排，每排约3个问题
      const rows = [[], [], []]
      this.marqueeItems.forEach((item, index) => {
        const rowIndex = index % 3
        rows[rowIndex].push(item)
      })
      return rows
    }
  },
  onLoad() {
    // 计算动画持续时间
    this.calculateAnimationDuration()
  },
  methods: {
    handleImageError(index) {
      // 图片加载失败时使用默认图片
      this.cases[index].image = '/static/images/maocai-logo.png'
    },
    calculateAnimationDuration() {
      // 根据内容数量计算动画持续时间
      // 每个标签宽度约200rpx，8个标签约1600rpx，滚动速度约每秒200rpx
      const totalWidth = this.marqueeItems.length * 220 // 每个标签约220rpx（包括gap）
      this.animationDuration = `${totalWidth / 200 * 2}s` // 滚动速度调整
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


.faq-section {
  margin: 20rpx 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.faq-title-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.faq-title-bar {
  width: 6rpx;
  height: 32rpx;
  background-color: #ff9500;
  margin-right: 12rpx;
  border-radius: 3rpx;
}

.faq-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.faq-container {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.faq-row {
  width: 100%;
  white-space: nowrap;
  animation: fadeInRow 0.8s ease-out both;
}

.faq-tags {
  display: inline-flex;
  gap: 60rpx;
  padding-right: 30rpx;
  padding-left: 20rpx;
  animation: scrollHorizontal linear infinite;
  will-change: transform;
}

.faq-tag {
  display: inline-flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background-color: #f5f5f5;
  border-radius: 30rpx;
  border: none;
  flex-shrink: 0;
  animation: fadeInScale 0.6s ease-out both;
  white-space: nowrap;
}

.faq-tag-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
  flex-shrink: 0;
  color: #e93b3d;
}

.faq-tag-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(10rpx);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fadeInRow {
  0% {
    opacity: 0;
    transform: translateY(20rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scrollHorizontal {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
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
