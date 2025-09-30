<template>
  <view class="form-container">
    <view class="form-item">
      <text class="label">收货人</text>
      <input v-model="form.name" placeholder="请输入收货人姓名" />
    </view>
    <view class="form-item">
      <text class="label">手机号</text>
      <input v-model="form.phone" placeholder="请输入手机号" :disabled="isEdit" />
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
import { BASE_URL } from '@/api/common';

const form = ref({
  id: null,
  name: '',
  phone: '',
  region: [],
  detail: '',
  is_default: false
});

// 保存原始数据用于比较
const originalData = ref({
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

// 比较数据并返回变更的字段
const getChangedFields = () => {
  const changedFields = {};
  
  // 比较收货人姓名
  if (form.value.name !== originalData.value.name) {
    changedFields.recipient_name = form.value.name;
  }
  
  // 比较手机号
  if (form.value.phone !== originalData.value.phone) {
    changedFields.recipient_phone = form.value.phone;
  }
  
  // 比较省市区
  const currentRegion = form.value.region;
  const originalRegion = originalData.value.region;
  if (JSON.stringify(currentRegion) !== JSON.stringify(originalRegion)) {
    changedFields.province = currentRegion[0];
    changedFields.city = currentRegion[1];
    changedFields.district = currentRegion[2];
  }
  
  // 比较详细地址
  if (form.value.detail !== originalData.value.detail) {
    changedFields.detail = form.value.detail;
  }
  
  // 比较是否默认地址
  if (form.value.is_default !== originalData.value.is_default) {
    changedFields.is_default = form.value.is_default;
  }
  
  return changedFields;
};

onLoad((options) => {
  if (options.id) {
    isEdit.value = true;
    uni.request({
      url: `${BASE_URL}/api/address/detail/${options.id}`,
      success: (res) => {
        if (res.data.code === 0) {
          const d = res.data.data;
          const formData = {
            id: d.address_id,
            name: d.recipient_name,
            phone: d.recipient_phone,
            region: [d.province, d.city, d.district],
            detail: d.detail,
            is_default: d.is_default
          };
          
          // 设置表单数据
          form.value = formData;
          
          // 保存原始数据用于比较
          originalData.value = {
            name: d.recipient_name,
            phone: d.recipient_phone,
            region: [d.province, d.city, d.district],
            detail: d.detail,
            is_default: d.is_default
          };
        }
      },
      fail: (err) => {
        console.error('获取地址详情失败:', err);
        uni.showToast({
          title: '获取地址详情失败',
          icon: 'none'
        });
      }
    });
  }
});

const submit = () => {
  if (isEdit.value) {
    // 更新地址 - 只传递变更的字段
    const changedFields = getChangedFields();
    
    // 如果没有字段变更，提示用户
    if (Object.keys(changedFields).length === 0) {
      uni.showToast({ 
        title: '没有检测到变更', 
        icon: 'none' 
      });
      return;
    }
    
    // 添加地址ID到请求数据中
    const updateData = {
      address_id: form.value.id,
      ...changedFields
    };
    
    // 将数据包装在data字段中
    const requestData = {
      data: updateData
    };
    
    console.log('只传递变更的字段:', requestData);
    
    uni.request({
      url: `${BASE_URL}/api/address/update`,
      method: 'POST',
      data: requestData,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.data.code === 0) {
          uni.showToast({ title: '更新成功' });
          uni.navigateBack();
        } else {
          uni.showToast({ 
            title: res.data.message || '更新失败', 
            icon: 'none' 
          });
        }
      },
      fail: (err) => {
        console.error('更新地址失败:', err);
        uni.showToast({ 
          title: '更新失败', 
          icon: 'none' 
        });
      }
    });
  } else {
    // 新增地址 - 传递所有字段
    const data = {
      recipient_name: form.value.name,
      recipient_phone: form.value.phone,
      province: form.value.region[0],
      city: form.value.region[1],
      district: form.value.region[2],
      detail: form.value.detail,
      is_default: form.value.is_default
    };
    
    createAddress(data).then(() => {
      uni.showToast({ title: '添加成功' });
      uni.navigateBack();
    }).catch((err) => {
      console.error('添加地址失败:', err);
      uni.showToast({ 
        title: '添加失败', 
        icon: 'none' 
      });
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

/* 禁用状态的样式 */
input:disabled {
  background-color: #f5f5f5;
  color: #999;
  opacity: 0.6;
}
</style>
