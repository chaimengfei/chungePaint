<template>
  <view class="container">
    <!-- 企业信息展示区域 -->
    <view class="company-info">
      <view class="company-card">
        <text class="company-title">贸彩漆业</text>
        <text class="company-desc">汽车漆、工业漆、雕塑&广告牌漆、各种辅料</text>
      </view>
    </view>

    <!-- 视频号入口横幅 -->
    <view class="video-channel-banner" @click="openVideoChannel">
      <view class="video-channel-left">
        <image 
          class="video-channel-avatar" 
          :src="videoChannelInfo.avatar" 
          mode="aspectFill"
          @error="handleAvatarError"
        />
        <view class="video-channel-info">
          <text class="video-channel-name">{{ videoChannelInfo.name }}</text>
          <text class="video-channel-count">{{ videoChannelInfo.videoCount }}条原创内容</text>
        </view>
      </view>
      <view class="video-channel-right">
        <text class="video-channel-icon">▶</text>
        <text class="video-channel-text">进入视频号</text>
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
          :style="{ animationDelay: `${rowIndex * 0.5}s` }"
        >
          <view class="faq-tags" :style="{ animationDuration: getRowAnimationDuration(rowIndex) }">
            <view 
              v-for="(item, index) in row" 
              :key="index" 
              class="faq-tag"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <text 
                class="faq-tag-icon"
                :class="{ 'faq-tag-icon-filled': isLiked(rowIndex, index) }"
                @click.stop="toggleLike(rowIndex, index)"
              >{{ isLiked(rowIndex, index) ? '♥' : '♡' }}</text>
              <text class="faq-tag-text">{{ item }}</text>
            </view>
            <!-- 复制一份用于无缝循环 -->
            <view 
              v-for="(item, index) in row" 
              :key="`copy-${index}`" 
              class="faq-tag"
              :style="{ animationDelay: `${(index + row.length) * 0.1}s` }"
            >
              <text 
                class="faq-tag-icon"
                :class="{ 'faq-tag-icon-filled': isLiked(rowIndex, index) }"
                @click.stop="toggleLike(rowIndex, index)"
              >{{ isLiked(rowIndex, index) ? '♥' : '♡' }}</text>
              <text class="faq-tag-text">{{ item }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 企业案例展示区域 -->
    <view class="cases-section">
      <view class="section-title">企业案例</view>
      <scroll-view class="cases-scroll" scroll-y="true">
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
              <view class="case-header">
                <text class="case-name">项目名：{{ caseItem.name }}</text>
              </view>
              <view class="case-detail-row">
                <text class="case-label">完工时间：</text>
                <text class="case-value">{{ caseItem.completionTime }}</text>
              </view>
              <view class="case-detail-row">
                <text class="case-label">场景：</text>
                <text class="case-value scene-tag" :class="caseItem.scene === '户外' ? 'scene-outdoor' : 'scene-indoor'">{{ caseItem.scene }}</text>
              </view>
              <view class="case-detail-row">
                <text class="case-label">说明：</text>
                <text class="case-value case-description">{{ caseItem.description }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
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
          completionTime: '2023-06',
          scene: '户外',
          description: '商业综合体外墙涂装，采用高品质外墙涂料，确保长期耐候性和美观度',
          image: '/static/images/cases/yongwang.jpg'
        },
        {
          name: '北京全聚德烤鸭',
          completionTime: '2023-09',
          scene: '户外',
          description: '传统建筑翻新涂装，保持古建筑风格的同时提升建筑保护性能',
          image: '/static/images/cases/quanjude.jpg'
        },
        {
          name: 'xxxx项目',
          completionTime: '2024-03',
          scene: '室内',
          description: '室内墙面涂装项目，提供专业的室内涂料解决方案',
          image: '/static/images/cases/case3.jpg'
        }
      ],
      marqueeItems: [
        '2K漆能加固化剂吗？',
        '固化剂配比多少？',
        '拉丝效果怎么做？',
        '工业漆的干燥时间？',
        '如何选择合适的稀释剂？',
        '底漆和面漆的区别？',
        '如何防止漆面起泡？',
        '漆膜厚度如何控制？'
      ],
      animationDuration: '20s',
      likedItems: {}, // 存储点赞状态，格式：{ 'rowIndex-itemIndex': true }
      videoChannelInfo: {
        name: '贸彩漆业-汽车漆-氟碳漆-工业漆',
        videoCount: 3,
        avatar: '/static/images/maocai-logo.png', // 视频号头像，可以使用logo
        finderUsername: '' // 视频号finderUsername，需要配置
      }
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
    },
    getRowAnimationDuration(rowIndex) {
      // 前2行（rowIndex 0和1）滚动慢一点，第3行保持原速度
      if (rowIndex < 2) {
        // 前2行速度减半
        const baseDuration = parseInt(this.animationDuration)
        return `${baseDuration * 2}s`
      }
      return this.animationDuration
    },
    isLiked(rowIndex, itemIndex) {
      const key = `${rowIndex}-${itemIndex}`
      return this.likedItems[key] || false
    },
    toggleLike(rowIndex, itemIndex) {
      const key = `${rowIndex}-${itemIndex}`
      this.$set(this.likedItems, key, !this.likedItems[key])
    },
    handleAvatarError() {
      // 头像加载失败时使用默认logo
      this.videoChannelInfo.avatar = '/static/images/maocai-logo.png'
    },
    openVideoChannel() {
      // 跳转到微信视频号
      // 方式1: 使用 wx.openChannelsUserProfile (需要视频号的finderUsername)
      // #ifdef MP-WEIXIN
      if (this.videoChannelInfo.finderUsername) {
        wx.openChannelsUserProfile({
          finderUsername: this.videoChannelInfo.finderUsername,
          success: (res) => {
            console.log('打开视频号成功', res)
          },
          fail: (err) => {
            console.error('打开视频号失败', err)
            uni.showToast({
              title: '打开视频号失败',
              icon: 'none'
            })
          }
        })
      } else {
        // 如果没有配置finderUsername，提示用户
        uni.showToast({
          title: '视频号功能暂未配置',
          icon: 'none'
        })
      }
      // #endif
      
      // #ifndef MP-WEIXIN
      uni.showToast({
        title: '请在微信中打开',
        icon: 'none'
      })
      // #endif
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

/* 视频号入口横幅 */
.video-channel-banner {
  margin: 20rpx 30rpx;
  padding: 24rpx 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: transform 0.2s, box-shadow 0.2s;
}

.video-channel-banner:active {
  transform: scale(0.98);
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.1);
}

.video-channel-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.video-channel-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  flex-shrink: 0;
  background-color: #f0f0f0;
}

.video-channel-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.video-channel-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-channel-count {
  font-size: 24rpx;
  color: #999;
}

.video-channel-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 20rpx;
}

.video-channel-icon {
  font-size: 24rpx;
  color: #ff9500;
  margin-right: 8rpx;
}

.video-channel-text {
  font-size: 26rpx;
  color: #ff9500;
  font-weight: 500;
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
  animation: fadeInRow 1s ease-out both;
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
  transform: scaleY(0.85);
  display: inline-block;
  cursor: pointer;
  transition: transform 0.2s;
}

.faq-tag-icon:active {
  transform: scaleY(0.85) scale(1.1);
}

.faq-tag-icon-filled {
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
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-left: 10rpx;
}

.cases-scroll {
  max-height: 1200rpx; /* 限制最大高度，超出可滚动 */
}

.cases-grid {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  padding-bottom: 20rpx;
}

.case-item {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.case-item:active {
  transform: scale(0.98);
}

.case-image {
  width: 100%;
  height: 400rpx;
  background-color: #f0f0f0;
}

.case-info {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.case-header {
  margin-bottom: 8rpx;
}

.case-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.5;
}

.case-detail-row {
  display: flex;
  align-items: flex-start;
  line-height: 1.6;
}

.case-label {
  font-size: 26rpx;
  color: #666;
  min-width: 140rpx;
  flex-shrink: 0;
}

.case-value {
  font-size: 26rpx;
  color: #333;
  flex: 1;
}

.scene-tag {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.scene-outdoor {
  background-color: #e3f2fd;
  color: #1976d2;
}

.scene-indoor {
  background-color: #fff3e0;
  color: #f57c00;
}

.case-description {
  line-height: 1.8;
  color: #666;
}
</style>
