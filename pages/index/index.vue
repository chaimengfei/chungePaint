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
            <view class="action-buttons">
              <button class="add-btn" @click="addToCart(product.id)">加入购物车</button>
              <button class="buy-btn" @click="buyNow(product)">立即购买</button>
            </view>
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
import { addToCart } from '@/api/cart.js'

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
        uni.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    },
    
    changeCategory(categoryId) {
      this.activeCategory = categoryId
      this.currentProducts = this.products[categoryId] || []
    },
    
    // 添加商品到购物车
    async addToCart(productId) {
      try {
        const res = await addToCart({ product_id: productId })
        if (res.data.code === 0) {
          uni.showToast({
            title: '已加入购物车',
            icon: 'success'
          })
          
          // 更新底部购物车徽标
          uni.setTabBarBadge({
            index: 1,
            text: '1' // 实际应该获取购物车总数
          })
        } else {
          uni.showToast({
            title: res.data.message || '添加购物车失败',
            icon: 'none'
          })
        }
      } catch (err) {
        uni.showToast({
          title: '添加购物车失败',
          icon: 'none'
        })
      }
    },
    
    // 立即购买
    buyNow(product) {
      // 构造订单数据
      const orderItems = [{
        product_id: product.id,
        product_name: product.name,
        product_image: product.image,
        product_price: product.seller_price,
        quantity: 1,
        unit: product.unit
      }]
      
      // 计算总金额
      const totalAmount = product.seller_price
      
      // 跳转到订单确认页
      uni.navigateTo({
        url: `/pages/order/confirm?items=${encodeURIComponent(JSON.stringify(orderItems))}&total=${totalAmount}`
      })
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  height: 100%;
}

.category-list {
  width: 25%;
  background-color: #f5f5f5;
}

.category-item {
  padding: 20rpx;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.category-item.active {
  background-color: #fff;
  color: #e93b3d;
  font-weight: bold;
}

.product-list {
  width: 75%;
  padding: 10rpx;
}

.product-item {
  display: flex;
  padding: 20rpx;
  border-bottom: 1px solid #eee;
}

.product-image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 8rpx;
}

.product-info {
  flex: 1;
  padding-left: 20rpx;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 28rpx;
  margin-bottom: 10rpx;
}

.product-price {
  color: #e93b3d;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.product-unit {
  color: #999;
  font-size: 24rpx;
  margin-bottom: 15rpx;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
}

.add-btn, .buy-btn {
  height: 50rpx;
  line-height: 50rpx;
  font-size: 24rpx;
  padding: 0 20rpx;
}

.add-btn {
  background-color: #f5f5f5;
  color: #333;
}

.buy-btn {
  background-color: #e93b3d;
  color: #fff;
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
}
</style>