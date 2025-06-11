<template>
  <view class="container">
    <!-- 左侧分类栏 -->
    <scroll-view class="category-list" scroll-y>
      <view 
        v-for="item in categories" 
        :key="item.id"
        class="category-item"
        :class="{ active: activeCategory === item.id }"
        @click="changeCategory(item.id)"
      >
        {{ item.name }}
      </view>
    </scroll-view>
    
    <!-- 右侧商品列表 -->
    <scroll-view class="product-list" scroll-y>
      <view v-if="currentProducts.length > 0">
        <view 
          v-for="product in currentProducts" 
          :key="product.id"
          class="product-item"
        >
          <image class="product-image" :src="product.image" mode="aspectFill" />
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-price">¥{{ product.seller_price }}</text>
            <text class="product-unit">{{ product.unit }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty">
        暂无商品
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { getProductList } from '@/api/product.js'
export default {
  data() {
    return {
      categories: [],         // 分类列表
      products: {},           // 所有商品
      activeCategory: null,   // 当前选中的分类ID
      currentProducts: []     // 当前显示的商品列表
    }
  },
  onLoad() {
    this.fetchData()
  },
  methods: {
	async fetchData() {
	  try {
		const res = await getProductList()
		
		this.categories = res.categories
		this.products = res.products
		
		// 默认选中第一个分类
		if (this.categories.length > 0) {
		  this.activeCategory = this.categories[0].id
		  this.currentProducts = this.products[this.activeCategory] || []
		}
	  } catch (err) {
		console.error('请求失败:', err)
		uni.showToast({
		  title: '数据加载失败',
		  icon: 'none'
		})
	  }
	},
    
    // 切换分类
    changeCategory(categoryId) {
      this.activeCategory = categoryId
      this.currentProducts = this.products[categoryId] || []
    }
  }
}
</script>

<style>
/* 全局样式 */
page {
  height: 100%;
  background-color: #f8f8f8;
}

.container {
  display: flex;
  height: 100%;
}

/* 分类列表样式 */
.category-list {
  width: 200rpx;
  height: 100%;
  background-color: #f5f5f5;
}

.category-item {
  padding: 30rpx 20rpx;
  font-size: 28rpx;
  color: #333;
  text-align: center;
  border-bottom: 1rpx solid #eee;
}

.category-item.active {
  background-color: #fff;
  color: #e93b3d;
  font-weight: bold;
  position: relative;
}

.category-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 6rpx;
  background-color: #e93b3d;
}

/* 商品列表样式 */
.product-list {
  flex: 1;
  padding: 20rpx;
  height: 100%;
}

.product-item {
  display: flex;
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #fff;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.product-image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 8rpx;
}

.product-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
}

.product-price {
  font-size: 32rpx;
  color: #e93b3d;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.product-unit {
  font-size: 24rpx;
  color: #999;
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}
</style>