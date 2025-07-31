<template>
  <view class="form-container">
    <view class="form-item">
      <text class="label">收货人</text>
      <input v-model="form.name" placeholder="请输入收货人姓名" />
    </view>
    <view class="form-item">
      <text class="label">手机号</text>
      <input v-model="form.phone" placeholder="请输入手机号" />
    </view>
    <view class="form-item">
      <text class="label">省市区</text>
      <picker mode="region" @change="onRegionChange" :value="region">
        <view class="picker">{{ form.region?.join(' ') || '请选择省市区' }}</view>
      </picker>
    </view>
    <view class="form-item">
      <text class="label">详细地址</text>
      <input v-model="form.detail" placeholder="请输入详细地址" />
    </view>

	<button class="save-btn" type="primary" @tap="submit">保存</button>

  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { createAddress, updateAddress } from '@/api/address';

const form = ref({
  id: null,
  name: '',
  phone: '',
  region: [],
  detail: '',
  is_default: false
});

const isEdit = ref(false);

const onRegionChange = (e) => {
  form.value.region = e.detail.value;
};

onLoad((options) => {
  if (options.id) {
    isEdit.value = true;
    uni.request({
      url: `/api/user/address/detail/${options.id}`,
      success: (res) => {
        const d = res.data.data;
        form.value = {
          id: d.id,
          name: d.name,
          phone: d.phone,
          region: [d.province, d.city, d.district],
          detail: d.detail,
          is_default: d.is_default
        };
      }
    });
  }
});

const submit = () => {
  const data = {
    recipient_name: form.value.name,
    recipient_phone: form.value.phone,
    province: form.value.region[0],
    city: form.value.region[1],
    district: form.value.region[2],
    detail: form.value.detail,
    is_default: form.value.is_default
  };

  if (isEdit.value) {
    updateAddress(form.value.id, data).then(() => {
      uni.showToast({ title: '更新成功' });
      uni.navigateBack();
    });
  } else {
    createAddress(data).then(() => {
      uni.showToast({ title: '添加成功' });
      uni.navigateBack();
    });
  }
};
</script>


<style scoped>
.form-container {
  padding: 30rpx;
}
.form-item {
  margin-bottom: 30rpx;
}
.label {
  display: block;
  margin-bottom: 10rpx;
  font-weight: bold;
}
.picker {
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
}
.save-btn {
  margin-top: 50rpx;
}
</style>
