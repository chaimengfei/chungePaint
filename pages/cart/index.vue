<template>
	<view class="container">
		<!-- 默认地址信息 -->
		<view v-if="defaultAddress" class="address-section" @click="goToAddressList">
			<view class="address-tags">
				<text v-if="defaultAddress.is_default" class="tag default-tag">默认</text>
				<!-- <text class="tag home-tag">家</text> -->
			</view>
			<view class="address-info">
				<view class="address-detail">
					<text class="location">
						<text v-if="defaultAddress.is_default" class="default-text">默认</text>
						{{ defaultAddress.province }}{{ defaultAddress.city }}{{ defaultAddress.district }} {{ defaultAddress.detail }}
					</text>
				</view>
			</view>
			<view class="address-arrow">
				<text>></text>
			</view>
		</view>

		<!-- 无地址提示 -->
		<view v-else class="no-address" @click="goToAddressList">
			<view class="no-address-content">
				<text class="no-address-text">请选择收货地址</text>
				<text class="no-address-arrow">></text>
			</view>
		</view>

		<view class="header">
			<text class="title">购物车</text>
		</view>

		<!-- 购物车列表 -->
		<view v-if="cartItems.length > 0">
			<view v-for="item in cartItems" :key="item.id" class="cart-item" :class="{ 'disabled-item': !item.can_purchase }">
				<view class="item-left">
					<checkbox :checked="item.selected" @click="toggleSelect(item)" :disabled="!item.can_purchase" />
					<image class="product-image" :src="item.product_image" mode="aspectFill" />
				</view>
				<view class="item-right">
					<text class="product-name">{{ item.product_name }}</text>
					<text class="product-price">¥{{ item.product_seller_price }}</text>
					<text class="product-unit">{{ item.product_unit }}</text>
					
					<!-- 不可购买商品的提示信息 -->
					<view v-if="!item.can_purchase && item.message" class="product-message">
						<text class="message-text">{{ item.message }}</text>
					</view>
					
					<view class="quantity-control">
						<button class="btn-minus" @click="changeQuantity(item, -1)" :disabled="!item.can_purchase">-</button>
						<text class="quantity">{{ item.quantity }}</text>
						<button class="btn-plus" @click="changeQuantity(item, 1)" :disabled="!item.can_purchase">+</button>
					</view>
					<button class="delete-btn" @click="deleteItem(item)">删除</button>
				</view>
			</view>

			<!-- 结算栏 -->
			<view class="checkout-bar">
				<view class="select-all">
					<checkbox :checked="isAllSelected" @click="toggleSelectAll" />
					<text>全选</text>
				</view>
				<view class="total">
					<text>合计: ¥{{ totalPrice }}</text>
					<button class="checkout-btn" @click="goToCheckout">结算({{ selectedCount }})</button>
				</view>
			</view>
		</view>

		<!-- 空购物车 -->
		<view v-else class="empty-cart">
			<image src="/static/images/empty-cart.png" mode="aspectFit"></image>
			<text class="tip">购物车还是空的</text>
			<button class="btn" @click="goToIndex">去逛逛</button>
		</view>
	</view>
</template>

<script>
	import {
		getCartList,
		updateCartItem,
		deleteCartItem
	} from '@/api/cart.js'

	import {
		checkoutOrder
	} from '@/api/order.js'

	import {
		getAddressList
	} from '@/api/address.js'

	export default {
		data() {
			return {
				cartItems: [], // 购物车商品列表
				defaultAddress: null // 默认地址信息
			}
		},
		onShow() {
			this.loadCartData()
			this.loadDefaultAddress()
		},
		onLoad() {
			// 检查是否有选中的地址（从地址列表页面返回时）
			const selectedAddress = uni.getStorageSync('selected_address')
			if (selectedAddress) {
				this.defaultAddress = selectedAddress
				uni.removeStorageSync('selected_address')
			}
		},
		computed: {
			// 可购买的商品列表
			purchasableItems() {
				return this.cartItems.filter(item => item.can_purchase)
			},
			// 是否全选（只考虑可购买的商品）
			isAllSelected() {
				return this.purchasableItems.length > 0 && this.purchasableItems.every(item => item.selected)
			},
			// 选中商品总价
			totalPrice() {
				return this.cartItems
					.filter(item => item.selected && item.can_purchase)
					.reduce((total, item) => total + item.product_seller_price * item.quantity, 0)
					.toFixed(2)
			},
			// 选中商品数量
			selectedCount() {
				return this.cartItems.filter(item => item.selected && item.can_purchase).length
			},
			// 选中的购物车ID数组
			selectedCartIds() {
				return this.cartItems
					.filter(item => item.selected && item.can_purchase)
					.map(item => item.id)
			}
		},
		methods: {
			// 加载购物车数据
			async loadCartData() {
				try {
					const res = await getCartList()
					if (res.data.code === 0) {
						if (res.data.data === null) {
							this.cartItems = [] // 设置为空数组
						} else {
							this.cartItems = res.data.data.map(item => ({
								...item,
								selected: item.selected === 1
							}))
						}

						// 更新底部购物车徽标
						this.updateCartBadge()
					}
				} catch (err) {
					uni.showToast({
						title: '获取购物车失败',
						icon: 'none'
					})
				}
			},

			// 更新购物车徽标
			updateCartBadge() {
				try {
					// 显示购物车中不同商品的数量（商品种类数）
					const uniqueItemCount = this.cartItems.length
					if (uniqueItemCount > 0) {
						uni.setTabBarBadge({
							index: 1,
							text: uniqueItemCount.toString()
						})
					} else {
						uni.removeTabBarBadge({
							index: 1
						})
					}
				} catch (error) {
					console.error('更新购物车徽标失败:', error)
				}
			},

			// 跳转到首页
			goToIndex() {
				uni.switchTab({
					url: '/pages/index/index'
				})
			},

			// 加载默认地址
			async loadDefaultAddress() {
				try {
					const res = await getAddressList()
					if (res.data && res.data.length > 0) {
						// 查找默认地址，如果没有默认地址则使用第一个地址
						this.defaultAddress = res.data.find(addr => addr.is_default) || res.data[0]
					}
				} catch (err) {
					console.error('获取地址列表失败:', err)
				}
			},

			// 跳转到地址列表
			goToAddressList() {
				uni.navigateTo({
					url: '/pages/address/list'
				})
			},

			// 跳转到结算页面
			async goToCheckout() {
				if (this.selectedCount === 0) {
					uni.showToast({
						title: '请至少选择一件商品',
						icon: 'none'
					})
					return
				}
				// 跳转到结算页面，传递结算数据
				uni.navigateTo({
					url: `/pages/order/checkout?cart_ids=${JSON.stringify(this.selectedCartIds)}`
				})
			},

			// 切换商品选中状态
			toggleSelect(item) {
				// 如果商品不可购买，禁止选中
				if (!item.can_purchase) {
					uni.showToast({
						title: item.message || '该商品暂时不可购买',
						icon: 'none'
					})
					return
				}
				item.selected = !item.selected
			},

			// 全选/取消全选
			toggleSelectAll() {
				const newSelectStatus = !this.isAllSelected
				this.cartItems.forEach(item => {
					// 只对可购买的商品进行选中操作
					if (item.can_purchase) {
						item.selected = newSelectStatus
					}
				})
			},

			// 修改商品数量
			async changeQuantity(item, change) {
				// 如果商品不可购买，禁止修改数量
				if (!item.can_purchase) {
					uni.showToast({
						title: item.message || '该商品暂时不可购买',
						icon: 'none'
					})
					return
				}
				
				const newQuantity = item.quantity + change
				if (newQuantity < 1) return

				try {
					const res = await updateCartItem({
						cart_id: item.id,
						quantity: newQuantity
					})
					if (res.data.code === 0) {
						item.quantity = newQuantity
						this.updateCartBadge()
					} else if (res.data.code === -1) {
						// 显示业务错误信息
						uni.showToast({
							title: res.data.message || '修改数量失败',
							icon: 'none'
						})
					} else {
						// 其他错误情况
						uni.showToast({
							title: res.data.message || '修改数量失败',
							icon: 'none'
						})
					}
				} catch (err) {
					// 处理HTTP错误，尝试解析响应体中的业务错误信息
					if (err.data && err.data.message) {
						uni.showToast({
							title: err.data.message,
							icon: 'none'
						})
					} else {
						uni.showToast({
							title: '修改数量失败',
							icon: 'none'
						})
					}
				}
			},

			// 删除商品
			async deleteItem(item) {
				try {
					const res = await deleteCartItem(item.id)
					if (res.data.code === 0) {
						this.cartItems = this.cartItems.filter(cartItem => cartItem.id !== item.id)
						this.updateCartBadge()
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						})
						this.loadCartData()
					}
				} catch (err) {
					uni.showToast({
						title: '删除失败',
						icon: 'none'
					})
				}
			}
		}
	}
</script>

<style>
	.container {
		padding-bottom: 120rpx;
	}

	.header {
		padding: 20rpx;
		border-bottom: 1rpx solid #eee;
	}

	.title {
		font-size: 36rpx;
		font-weight: bold;
	}

	/* 地址信息样式 */
	.address-section {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #eee;
		margin-bottom: 10rpx;
	}

	.address-tags {
		display: flex;
		flex-direction: column;
		margin-right: 20rpx;
	}

	.tag {
		font-size: 20rpx;
		padding: 4rpx 8rpx;
		border-radius: 4rpx;
		margin-bottom: 4rpx;
		text-align: center;
	}

	.default-tag {
		background-color: #e93b3d;
		color: white;
	}

	.home-tag {
		background-color: #f0f0f0;
		color: #666;
	}

	.address-info {
		flex: 1;
	}

	.address-detail {
		margin-bottom: 8rpx;
	}

	.location {
		font-size: 28rpx;
		color: #333;
	}

	.default-text {
		color: #e93b3d;
		font-weight: bold;
		margin-right: 8rpx;
	}

	.recipient-info {
		display: flex;
		align-items: center;
	}

	.name {
		font-size: 26rpx;
		color: #333;
		margin-right: 20rpx;
	}

	.phone {
		font-size: 26rpx;
		color: #666;
	}

	.address-arrow {
		color: #999;
		font-size: 32rpx;
	}

	/* 无地址提示样式 */
	.no-address {
		padding: 20rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #eee;
		margin-bottom: 10rpx;
	}

	.no-address-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.no-address-text {
		font-size: 28rpx;
		color: #999;
	}

	.no-address-arrow {
		color: #999;
		font-size: 32rpx;
	}

	.cart-item {
		display: flex;
		padding: 20rpx;
		margin: 20rpx;
		background-color: #fff;
		border-radius: 10rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	/* 不可购买商品的置灰样式 */
	.disabled-item {
		opacity: 0.6;
		background-color: #f5f5f5;
	}

	.disabled-item .product-name,
	.disabled-item .product-price,
	.disabled-item .product-unit {
		color: #999;
	}

	.disabled-item .product-image {
		filter: grayscale(100%);
	}

	.item-left {
		display: flex;
		align-items: center;
	}

	.product-image {
		width: 150rpx;
		height: 150rpx;
		margin-left: 20rpx;
		border-radius: 8rpx;
	}

	.item-right {
		flex: 1;
		margin-left: 20rpx;
		display: flex;
		flex-direction: column;
	}

	.product-name {
		font-size: 28rpx;
		margin-bottom: 10rpx;
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
		margin-bottom: 20rpx;
	}

	/* 商品提示信息样式 */
	.product-message {
		margin-bottom: 15rpx;
		padding: 8rpx 12rpx;
		background-color: #fff2e8;
		border-radius: 6rpx;
		border-left: 4rpx solid #ff6b35;
	}

	.message-text {
		font-size: 24rpx;
		color: #ff6b35;
		line-height: 1.4;
	}

	.quantity-control {
		display: flex;
		align-items: center;
		margin-bottom: 15rpx;
	}

	.quantity-control button {
		width: 50rpx;
		height: 50rpx;
		line-height: 50rpx;
		text-align: center;
		padding: 0;
		font-size: 30rpx;
		background-color: #f5f5f5;
		border-radius: 4rpx;
	}

	.quantity-control button:disabled {
		background-color: #e0e0e0;
		color: #999;
		opacity: 0.6;
	}

	.quantity {
		margin: 0 20rpx;
		font-size: 28rpx;
	}

	.delete-btn {
		background-color: #f5f5f5;
		color: #666;
		height: 50rpx;
		line-height: 50rpx;
		font-size: 24rpx;
		border-radius: 25rpx;
	}

	.checkout-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 100rpx;
		background-color: #fff;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 20rpx;
		border-top: 1rpx solid #eee;
	}

	.select-all {
		display: flex;
		align-items: center;
	}

	.select-all text {
		margin-left: 10rpx;
		font-size: 28rpx;
	}

	.total {
		display: flex;
		align-items: center;
	}

	.total text {
		margin-right: 20rpx;
		font-size: 28rpx;
		color: #e93b3d;
		font-weight: bold;
	}

	.checkout-btn {
		background-color: #e93b3d;
		color: white;
		height: 70rpx;
		line-height: 70rpx;
		padding: 0 30rpx;
		border-radius: 35rpx;
		font-size: 28rpx;
	}

	.empty-cart {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 100rpx;
	}

	.empty-cart image {
		width: 300rpx;
		height: 300rpx;
		margin-bottom: 40rpx;
	}

	.tip {
		font-size: 28rpx;
		color: #999;
		margin-bottom: 40rpx;
	}

	.btn {
		background-color: #e93b3d;
		color: white;
		width: 200rpx;
		height: 70rpx;
		line-height: 70rpx;
		font-size: 28rpx;
		border-radius: 35rpx;
	}
</style>