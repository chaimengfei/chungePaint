<template>
  <view class="container">
    <view class="address-list" v-if="addressList.length">
      <view
        v-for="(item, index) in addressList"
        :key="item.id"
        class="address-item"
        @tap="chooseAddress(item)"
      >
        <view class="address-info">
          <view class="name-phone">
            <text>{{ item.name }}</text>
            <text class="phone">{{ item.phone }}</text>
          </view>
          <view class="detail">{{ item.province }}{{ item.city }}{{ item.district }} {{ item.detail }}</view>
        </view>
        <view class="actions">
          <button size="mini" @tap.stop="editAddress(item)">编辑</button>
          <button size="mini" type="warn" @tap.stop="deleteAddress(item.id)">删除</button>
        </view>
      </view>
    </view>
    <view v-else class="empty">暂无地址，请新增</view>

    <button class="add-btn" type="primary" @tap="goAdd">新增地址</button>
  </view>
</template>

<script>
import { getAddressList,deleteAddress } from '@/api/address.js'

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
	  const res = await getAddressList()
      this.addressList = res.data || [];
    },
    goAdd() {
      uni.navigateTo({ url: '/pages/address/edit' });
    },
    editAddress(address) {
      uni.navigateTo({
        url: `/pages/address/edit.vue?id=${address.id}`
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
}
.name-phone {
  font-weight: bold;
  font-size: 30rpx;
  margin-bottom: 10rpx;
}
.phone {
  float: right;
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
