<template>
  <view class="container">
    <!-- 企业信息展示区域 -->
    <view class="company-info">
      <view class="company-card">
        <text class="company-title">贸彩漆业</text>
        <text class="company-desc">供应：汽车漆、工业漆、雕塑漆、广告牌漆\n辅料：固态灰、喷枪、遮蔽膜等\n 目前覆盖了燕郊50%的工业客户</text>
        <!-- 联系方式 -->
        <view class="company-contact">
          <text class="contact-label">李增春-13161621688</text>
        </view>
        <!-- 视频号入口 -->
        <view class="video-channel-entry" @click="openVideoChannel">
          <text class="video-channel-btn">进入视频号</text>
        </view>
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
      <swiper 
        class="cases-swiper" 
        :current="currentCaseIndex"
        @change="onCaseChange"
        :indicator-dots="true"
        :indicator-color="'rgba(0, 0, 0, 0.3)'"
        :indicator-active-color="'#ff9500'"
        :autoplay="false"
        :circular="true"
        :duration="300"
      >
        <swiper-item 
          v-for="(caseItem, index) in cases" 
          :key="index"
        >
          <view class="case-item">
            <image 
              class="case-image" 
              :src="caseItem.image" 
              mode="aspectFit"
              @error="handleImageError(index)"
            />
            <view class="case-info">
              <text class="case-name">{{ caseItem.name }}</text>
              <text class="case-value">{{ caseItem.completionTime }}</text>
              <text class="case-value scene-tag" :class="caseItem.scene === '户外' ? 'scene-outdoor' : 'scene-indoor'">{{ caseItem.scene }}</text>
              <text class="case-value case-description">{{ caseItem.description }}</text>
            </view>
          </view>
        </swiper-item>
      </swiper>
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
          description: '商业综合体外墙涂装，采用高品质外墙涂料，确保长期耐候性和美观度。贸彩漆在身边，第一站：燕郊永旺！',
          image: '/static/images/cases/yongwang.jpg'
        },
        {
          name: '北京全聚德烤鸭',
          completionTime: '2023-09',
          scene: '户外',
          description: '传统建筑翻新涂装，保持古建筑风格的同时提升建筑保护性能',
          image: '/static/images/cases/quanjude.jpg'
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
      currentCaseIndex: 0, // 当前显示的案例索引
      videoChannelInfo: {
        name: '贸彩漆业',
        videoCount: 3,
        avatar: '/static/images/share-logo.png', // 视频号头像，可以使用logo
        finderUserName: 'sphMv5ZIs8oa9Hg', // 视频号ID
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
      this.cases[index].image = '/static/images/share-logo.png'
    },
    onCaseChange(e) {
      // swiper切换时更新当前索引
      this.currentCaseIndex = e.detail.current
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
      this.videoChannelInfo.avatar = '/static/images/share-logo.png'
    },
    openVideoChannel() {
      // 跳转到微信视频号
      // #ifdef MP-WEIXIN
      if (this.videoChannelInfo.finderUserName) {
        const finderUserName = String(this.videoChannelInfo.finderUserName).trim()
        
        if (!finderUserName) {
          uni.showToast({
            title: '视频号ID配置错误',
            icon: 'none'
          })
          return
        }
        
        // 检测是否在开发者工具中
        const systemInfo = uni.getSystemInfoSync()
        const isDevTool = systemInfo.platform === 'devtools'
        
        if (isDevTool) {
          uni.showModal({
            title: '提示',
            content: '视频号功能需要在真机上测试\n\n开发者工具可能不支持此功能，请在真机上测试',
            showCancel: false
          })
          return
        }
        
        console.log('准备打开视频号主页，视频号ID:', finderUserName)
        
        // 使用 wx.openChannelsUserProfile 打开视频号主页
        // 从基础库 2.21.2 开始支持
        // 根据官方文档：finderUserName 代表视频号ID
        // 查看路径：微信客户端->我tab->视频号->右上角->视频号名字-视频号ID
        wx.openChannelsUserProfile({
          finderUserName: finderUserName, // 视频号ID（必填）
          success: (res) => {
            console.log('打开视频号主页成功', res)
          },
          fail: (err) => {
            console.error('打开视频号主页失败', err)
            
            // 如果打开失败，提供备用方案：复制链接
            const videoChannelUrl = `https://channels.weixin.qq.com/${finderUserName}`
            
            // 检查错误类型
            let errorMsg = err.errMsg || '打开视频号主页失败'
            if (err.errMsg && err.errMsg.includes('invalid args')) {
              errorMsg = '参数错误\n\n请确认视频号ID是否正确\n\n视频号ID：' + finderUserName + '\n\n查看路径：微信客户端->我tab->视频号->右上角->视频号名字-视频号ID'
            } else if (err.errMsg && err.errMsg.includes('not found') || err.errMsg.includes('不存在')) {
              errorMsg = '视频号不存在\n\n请确认视频号ID是否正确\n\n视频号ID：' + finderUserName
            }
            
            // 提供备用方案：复制链接
            uni.setClipboardData({
              data: videoChannelUrl,
              success: () => {
                uni.showModal({
                  title: '提示',
                  content: errorMsg + '\n\n已复制视频号链接到剪贴板\n\n请在微信中粘贴链接打开',
                  showCancel: false,
                  confirmText: '知道了'
                })
              },
              fail: () => {
                uni.showModal({
                  title: '提示',
                  content: errorMsg + '\n\n请手动访问：\n' + videoChannelUrl,
                  showCancel: false
                })
              }
            })
          }
        })
      } else {
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
  background-color: #fff3cd; /* 与产品展示页顶部公告栏背景色一致 */
  margin-bottom: 20rpx;
}

.company-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
  background-color: #fff; /* 白色背景 */
  border-radius: 16rpx;
}

.company-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  text-align: center;
}

.company-desc {
  font-size: 30rpx;
  color: #666;
  line-height: 1.5;
  text-align: left;
  margin-bottom: 10rpx;
  white-space: pre-line; /* 支持换行符 */
}

/* 联系方式 */
.company-contact {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx;
  margin-top: 10rpx;
  border-radius: 8rpx;
  gap: 8rpx;
  font-size: 30rpx;
}


.contact-info {
  font-size: 32rpx;
  color: #333;
  font-weight: 600;
}

/* 视频号入口 */
.video-channel-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 30rpx;
  margin-top: 10rpx;
  cursor: pointer;
  transition: opacity 0.2s;
}

.video-channel-entry:active {
  opacity: 0.7;
}

.video-channel-btn {
  font-size: 28rpx;
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
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-left: 10rpx;
}

.cases-swiper {
  width: 100%;
  height: 450rpx; /* 根据左右布局调整，减少留白 */
  margin-bottom: 0;
}

/* 自定义指示点样式 */
.cases-swiper ::v-deep .wx-swiper-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin: 0 8rpx;
}

.cases-swiper ::v-deep .wx-swiper-dot.wx-swiper-dot-active {
  width: 32rpx;
  border-radius: 8rpx;
}

.case-item {
  width: 100%;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 20rpx;
  gap: 20rpx;
}

.case-image {
  width: 300rpx;
  flex-shrink: 0;
  height: 410rpx; /* 适应swiper高度，减少留白 */
  background-color: #f0f0f0;
  border-radius: 8rpx;
  object-fit: contain; /* 确保图片完整显示 */
}

.case-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 0;
}

.case-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  margin-bottom: 4rpx;
}

.case-value {
  font-size: 26rpx;
  color: #333;
  line-height: 1.4;
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
