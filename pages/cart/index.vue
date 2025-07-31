<template>
	<view class="container">
		<view class="header">
			<text class="title">购物车</text>
		</view>

		<!-- 购物车列表 -->
		<view v-if="cartItems.length > 0">
			<view v-for="item in cartItems" :key="item.id" class="cart-item">
				<view class="item-left">
					<checkbox :checked="item.selected" @click="toggleSelect(item)" />
					<image class="product-image" :src="item.product_image" mode="aspectFill" />
				</view>
				<view class="item-right">
					<text class="product-name">{{ item.product_name }}</text>
					<text class="product-price">¥{{ item.product_seller_price }}</text>
					<text class="product-unit">{{ item.product_unit }}</text>
					<view class="quantity-control">
						<button class="btn-minus" @click="changeQuantity(item, -1)">-</button>
						<text class="quantity">{{ item.quantity }}</text>
						<button class="btn-plus" @click="changeQuantity(item, 1)">+</button>
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

	export default {
		data() {
			return {
				cartItems: [] // 购物车商品列表
			}
		},
		onShow() {
			this.loadCartData()
		},
		computed: {
			// 是否全选
			isAllSelected() {
				return this.cartItems.length > 0 && this.cartItems.every(item => item.selected)
			},
			// 选中商品总价
			totalPrice() {
				return this.cartItems
					.filter(item => item.selected)
					.reduce((total, item) => total + item.product_seller_price * item.quantity, 0)
					.toFixed(2)
			},
			// 选中商品数量
			selectedCount() {
				return this.cartItems.filter(item => item.selected).length
			},
			// 选中的购物车ID数组
			selectedCartIds() {
				return this.cartItems
					.filter(item => item.selected)
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
					console.error('获取购物车失败:', err)
					uni.showToast({
						title: '获取购物车失败',
						icon: 'none'
					})
				}
			},

			// 更新购物车徽标
			updateCartBadge() {
				const totalCount = this.cartItems.reduce((total, item) => total + item.quantity, 0)
				if (totalCount > 0) {
					uni.setTabBarBadge({
						index: 1,
						text: totalCount.toString()
					})
				} else {
					uni.removeTabBarBadge({
						index: 1
					})
				}
			},

			// 跳转到首页
			goToIndex() {
				uni.switchTab({
					url: '/pages/index/index'
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
				item.selected = !item.selected
			},

			// 全选/取消全选
			toggleSelectAll() {
				const newSelectStatus = !this.isAllSelected
				this.cartItems.forEach(item => {
					item.selected = newSelectStatus
				})
			},

			// 修改商品数量
			async changeQuantity(item, change) {
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
					}
				} catch (err) {
					console.error('修改数量失败:', err)
					uni.showToast({
						title: '修改数量失败',
						icon: 'none'
					})
				}
			},

			// 删除商品
			async deleteItem(item) {
				try {
					const res = await deleteCartItem({
						cart_id: item.id
					})
					if (res.data.code === 0) {
						this.cartItems = this.cartItems.filter(cartItem => cartItem.id !== item.id)
						this.updateCartBadge()
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						})
					}
				} catch (err) {
					console.error('删除失败:', err)
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

	.cart-item {
		display: flex;
		padding: 20rpx;
		margin: 20rpx;
		background-color: #fff;
		border-radius: 10rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
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