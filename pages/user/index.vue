<template>
  <view class="content">
    <view class="user-header">
      <image 
        class="avatar" 
        :src="isLogin && userInfo.avatar ? userInfo.avatar : '/static/images/default-avatar.png'"
        mode="aspectFill"
        @click="handleAvatarClick"
      ></image>
      <text class="username" @click="handleUsernameClick">{{ isLogin && userInfo.nickname ? userInfo.nickname : '微信用户' }}</text>
      <text class="welcome-text">欢迎 如需采购请联系客服</text>
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
    </view>
    
    <!-- 信息管理 -->
    <view class="menu-list">
      <view class="menu-item contact-info">
        <text class="label">客服电话：13161621688</text>
      </view>
      <view class="menu-item contact-info">
        <text class="label">营业时间：7:30-20:00</text>
      </view>
    </view>
  </view>
</template>

<script>
import { showContactService } from '@/api/common.js'
import { updateUserInfo, uploadAvatar } from '@/api/user.js'

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
      showContactService()
    },
    
    // 添加客服微信
    addCustomerWechat() {
      console.log('点击客服微信按钮')
      const wechatNumber = '13161621688'
      uni.showModal({
        title: '',
        content: `请添加 ${wechatNumber}`,
        showCancel: true,
        cancelText: '取消',
        confirmText: '复制',
        success: (res) => {
          console.log('showModal success:', res)
          if (res.confirm) {
            // 用户点击复制
            uni.setClipboardData({
              data: wechatNumber,
              success: () => {
                uni.showToast({
                  title: '微信号已复制',
                  icon: 'success'
                })
              },
              fail: (err) => {
                console.error('复制失败:', err)
                uni.showToast({
                  title: '复制失败',
                  icon: 'none'
                })
              }
            })
          }
        },
        fail: (err) => {
          console.error('showModal fail:', err)
        }
      })
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
    },
    
    // 点击头像
    handleAvatarClick() {
      if (!this.isLogin) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }
      
      uni.showActionSheet({
        itemList: ['获取微信头像', '从相册选择'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 获取微信头像
            this.getWechatAvatar()
          } else if (res.tapIndex === 1) {
            // 从相册选择
            this.chooseImageFromAlbum()
          }
        }
      })
    },
    
    // 获取微信头像
    getWechatAvatar() {
      uni.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          console.log('获取微信头像成功:', res)
          const avatarUrl = res.userInfo.avatarUrl
          if (avatarUrl) {
            this.updateUserAvatar(avatarUrl)
          }
        },
        fail: (err) => {
          console.error('获取微信头像失败:', err)
          uni.showToast({
            title: '获取微信头像失败',
            icon: 'none'
          })
        }
      })
    },
    
    // 从相册选择图片
    chooseImageFromAlbum() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          console.log('选择的图片:', tempFilePath)
          // 先上传图片，然后更新用户信息
          this.uploadAndUpdateAvatar(tempFilePath)
        },
        fail: (err) => {
          console.error('选择图片失败:', err)
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          })
        }
      })
    },
    
    // 上传并更新头像（用于本地图片）
    async uploadAndUpdateAvatar(filePath) {
      try {
        uni.showLoading({ title: '上传中...' })
        
        // 先上传图片
        const avatarUrl = await uploadAvatar(filePath)
        console.log('头像上传成功，URL:', avatarUrl)
        
        // 上传成功后，更新用户信息
        await this.updateUserAvatar(avatarUrl)
      } catch (err) {
        console.error('上传头像失败:', err)
        uni.hideLoading()
        uni.showToast({
          title: err.message || '上传头像失败',
          icon: 'none'
        })
      }
    },
    
    // 更新用户头像（用于微信头像URL或已上传的URL）
    async updateUserAvatar(avatarUrl) {
      try {
        uni.showLoading({ title: '更新中...' })
        
        const res = await updateUserInfo({
          avatar: avatarUrl
        })
        
        // res 是 uni.request 的完整响应对象，数据在 res.data 中
        const responseData = res.data || {}
        
        if (responseData.code === 0) {
          // 更新本地用户信息
          // 如果后端返回了新的头像URL，使用返回的；否则使用传入的
          const newAvatarUrl = responseData.data?.avatar || avatarUrl
          this.userInfo.avatar = newAvatarUrl
          uni.setStorageSync('userInfo', this.userInfo)
          
          uni.hideLoading()
          uni.showToast({
            title: responseData.data?.message || responseData.message || '头像更新成功',
            icon: 'success'
          })
        } else {
          throw new Error(responseData.data?.message || responseData.message || '更新失败')
        }
      } catch (err) {
        console.error('更新头像失败:', err)
        uni.hideLoading()
        uni.showToast({
          title: err.message || '更新头像失败',
          icon: 'none'
        })
      }
    },
    
    // 点击用户名
    handleUsernameClick() {
      if (!this.isLogin) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }
      
      uni.showActionSheet({
        itemList: ['获取微信昵称', '自定义昵称'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 获取微信昵称
            this.getWechatNickname()
          } else if (res.tapIndex === 1) {
            // 自定义昵称
            this.setCustomNickname()
          }
        }
      })
    },
    
    // 获取微信昵称
    getWechatNickname() {
      uni.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          console.log('获取微信账户名成功:', res)
          const nickname = res.userInfo.nickName
          if (nickname) {
            // 显示确认对话框，让用户查看并确认微信昵称
            uni.showModal({
              title: '微信昵称',
              content: nickname,
              editable: true,
              placeholderText: nickname,
              confirmText: '使用',
              cancelText: '取消',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  // 用户确认使用，可以使用编辑后的昵称或原昵称
                  const finalNickname = modalRes.content?.trim() || nickname
                  if (finalNickname.length > 20) {
                    uni.showToast({
                      title: '昵称不能超过20个字符',
                      icon: 'none'
      })
                    return
                  }
                  this.updateUserNickname(finalNickname)
                }
              }
            })
          }
        },
        fail: (err) => {
          console.error('获取微信账户名失败:', err)
          uni.showToast({
            title: '获取微信账户名失败',
            icon: 'none'
          })
        }
      })
    },
    
    // 自定义昵称
    setCustomNickname() {
      uni.showModal({
        title: '自定义昵称',
        editable: true,
        placeholderText: '请输入昵称',
        success: (res) => {
          if (res.confirm) {
            const nickname = res.content?.trim()
            if (!nickname) {
              uni.showToast({
                title: '昵称不能为空',
                icon: 'none'
              })
              return
            }
            if (nickname.length > 20) {
              uni.showToast({
                title: '昵称不能超过20个字符',
                icon: 'none'
              })
              return
            }
            this.updateUserNickname(nickname)
          }
        }
      })
    },
    
    // 更新用户昵称
    async updateUserNickname(nickname) {
      try {
        uni.showLoading({ title: '更新中...' })
        
        const res = await updateUserInfo({
          nickname: nickname
        })
        
        // res 是 uni.request 的完整响应对象，数据在 res.data 中
        const responseData = res.data || {}
        
        if (responseData.code === 0) {
          // 更新本地用户信息
          // 如果后端返回了新的昵称，使用返回的；否则使用传入的
          const newNickname = responseData.data?.nickname || nickname
          this.userInfo.nickname = newNickname
          uni.setStorageSync('userInfo', this.userInfo)
          
          uni.hideLoading()
          uni.showToast({
            title: responseData.data?.message || responseData.message || '昵称更新成功',
            icon: 'success'
          })
        } else {
          throw new Error(responseData.data?.message || responseData.message || '更新失败')
        }
      } catch (err) {
        console.error('更新昵称失败:', err)
        uni.hideLoading()
        uni.showToast({
          title: err.message || '更新昵称失败',
          icon: 'none'
        })
      }
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
  cursor: pointer;
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