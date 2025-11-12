<template>
  <view class="container">
    <view class="address-list" v-if="addressList.length">
      <view
        v-for="(item, index) in addressList"
        :key="item.address_id"
        class="address-item"
        @tap="chooseAddress(item)"
      >
        <view class="address-left">
          <view class="radio-container" @tap.stop="setDefaultAddress(item)">
            <radio :checked="item.is_default" color="#4169E1" />
            <text class="radio-label">默认</text>
          </view>
        </view>
        <view class="address-info">
          <view class="name-phone">
            <text>{{ item.recipient_name }}</text>
            <text class="phone">{{ item.recipient_phone }}</text>
          </view>
          <view class="detail">{{ item.province }}{{ item.city }}{{ item.district }} {{ item.detail }}</view>
        </view>
        <view class="actions">
          <button size="mini" @tap.stop="editAddress(item)">编辑</button>
          <button size="mini" type="warn" @tap.stop="deleteAddress(item.address_id)">删除</button>
        </view>
      </view>
    </view>
    <view v-else class="empty">暂无地址，请新增</view>

    <button class="add-btn" type="primary" @tap="goAdd">新增地址</button>
  </view>
</template>

<script>
import { getAddressList,deleteAddress } from '@/api/address.js'
import { BASE_URL } from '@/api/common.js'

export default {
  data() {
    return {
      addressList: []
    };
  },
  onShow() {
    this.getAddressList();
  },
  methods: {
    async getAddressList() {
      try {
        const res = await getAddressList()
        console.log('地址列表API返回:', res)
        // API返回格式: { code: 0, data: [...] }
        if (res.code === 0) {
          this.addressList = res.data || []
        } else {
          console.error('获取地址列表失败:', res.message)
          this.addressList = []
        }
      } catch (err) {
        console.error('获取地址列表异常:', err)
        this.addressList = []
      }
    },
    goAdd() {
      uni.navigateTo({ url: '/pages/address/edit' });
    },
    editAddress(address) {
      uni.navigateTo({
        url: `/pages/address/edit?id=${address.address_id}`
      });
    },
    deleteAddress(id) {
      uni.showModal({
        title: '提示',
        content: '确认删除该地址？',
        success: async (res) => {
          if (res.confirm) {
			await deleteAddress(id)
            this.getAddressList();
          }
        }
      });
    },
    chooseAddress(item) {
      // 如果从结算页跳转过来选择地址
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage.route === 'pages/order/checkout') {
        uni.setStorageSync('selected_address', item);
        uni.navigateBack();
      }
    },
    // 设置默认地址
    async setDefaultAddress(item) {
      try {
        // 如果已经是默认地址，则不需要操作
        if (item.is_default) {
          return;
        }
        
        uni.showLoading({ title: '设置中...' });
        
        const res = await uni.request({
          url: `${BASE_URL}/api/address/set_default/${item.address_id}`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${uni.getStorageSync('token')}`
          }
        });
        
        uni.hideLoading();
        
        if (res.data.code === 0) {
          // 更新本地数据
          this.addressList.forEach(addr => {
            addr.is_default = addr.address_id === item.address_id;
          });
          
          uni.showToast({
            title: '设置成功',
            icon: 'success'
          });
        } else {
          uni.showToast({
            title: res.data.message || '设置失败',
            icon: 'none'
          });
        }
      } catch (err) {
        uni.hideLoading();
        console.error('设置默认地址失败:', err);
        uni.showToast({
          title: '设置失败',
          icon: 'none'
        });
      }
    }
  }
};
</script>

<style scoped>
.container {
  padding: 20rpx;
}
.address-item {
  border: 1px solid #eee;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  background: #fff;
  display: flex;
  align-items: flex-start;
}

.address-left {
  margin-right: 20rpx;
  margin-top: 10rpx;
}

.radio-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.radio-container radio {
  transform: scale(0.75);
  transform-origin: center;
}

.radio-label {
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
}
.address-info {
  flex: 1;
}

.name-phone {
  font-weight: bold;
  font-size: 30rpx;
  margin-bottom: 10rpx;
  display: flex;
  align-items: center;
}
.name-phone text:first-child {
  margin-right: 20rpx;
}
.phone {
  font-size: 26rpx;
  color: #666;
}
.detail {
  color: #666;
  font-size: 26rpx;
}
.actions {
  margin-top: 10rpx;
  display: flex;
  justify-content: flex-end;
}

.actions button {
  margin: 0;
  margin-left: 20rpx;
}

.actions button:first-child {
  margin-left: 0;
}
.add-btn {
  position: fixed;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
}
.empty {
  text-align: center;
  margin-top: 200rpx;
  color: #999;
}
</style>
