<template>
	<view class="container">
		<!-- 默认地址信息（用于运费估算） -->
		<view v-if="defaultAddress" class="address-section" @click="goToAddressList">
			<view class="address-label">**默认地址** (用于运费估算)</view>
			<view class="address-info">
				<view class="address-detail">
					<text class="location">
						{{ defaultAddress.province }}{{ defaultAddress.city }}{{ defaultAddress.district }} {{ defaultAddress.detail }}
					</text>
				</view>
			</view>
			<view class="address-arrow">
				<text>[修改]</text>
			</view>
		</view>

		<!-- 无地址提示 -->
		<view v-else class="no-address" @click="goToAddressList">
			<view class="no-address-content">
				<text class="no-address-label">**默认地址** (用于运费估算)</text>
				<text class="no-address-text">（仅作为信息记录，非必填）</text>
				<text class="no-address-arrow">[修改]</text>
			</view>
		</view>

		<view class="header">
			<text class="title">我的需求单</text>
			<text class="subtitle">（您可以在此整理意向商品，提交后客服将为您统一报价）</text>
		</view>

		<!-- 清单商品 -->
		<view class="list-title" v-if="cartItems.length > 0">
			<text>**清单商品**</text>
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
					<view class="spec-info">
						<text class="spec-label">规格：</text>
						<text class="spec-value">{{ item.product_unit }}</text>
					</view>
					<view class="price-container">
						<text class="price-label">参考单价：</text>
						<text class="product-price">¥{{ item.product_seller_price }}</text>
					</view>
					
					<!-- 不可购买商品的提示信息 -->
					<view v-if="!item.can_purchase && item.message" class="product-message">
						<text class="message-text">{{ item.message }}</text>
					</view>
					
					<view class="quantity-control">
						<button class="btn-minus" @click="changeQuantity(item, -1)" :disabled="!item.can_purchase">-</button>
						<input 
							class="quantity-input" 
							type="number" 
							:value="item.quantity" 
							@blur="onQuantityInputBlur(item, $event)"
							@input="onQuantityInput(item, $event)"
							:disabled="!item.can_purchase"
						/>
						<button class="btn-plus" @click="changeQuantity(item, 1)" :disabled="!item.can_purchase">+</button>
					</view>
					<button class="delete-btn" @click="deleteItem(item)">删除</button>
				</view>
			</view>

			<!-- 底部固定栏 -->
			<view class="checkout-bar">
				<view class="select-all">
					<checkbox :checked="isAllSelected" @click="toggleSelectAll" />
					<text>全选</text>
				</view>
				<view class="total-info">
					<view class="total-row">
						<text class="total-label">合计：</text>
						<text class="total-price">¥{{ totalPrice }}</text>
					</view>
					<text class="total-tip">（此金额仅为参考，以最终报价为准）</text>
				</view>
				<button 
					class="submit-requirement-btn" 
					:class="{ 'disabled': selectedCount === 0 }"
					:disabled="selectedCount === 0"
					@click="submitRequirement"
				>
					提交需求，联系客服
				</button>
			</view>
		</view>

		<!-- 空需求单 -->
		<view v-else class="empty-cart">
			<image src="/static/images/empty-cart.png" mode="aspectFit"></image>
			<text class="tip">需求单还是空的</text>
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
			// 检查是否首次登录（没有token）
			const token = uni.getStorageSync('token')
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
							// 用户取消，停留在当前页面（购物车页面，只是购物车里啥都没有）
							// 不进行任何跳转，只清空购物车数据
							this.cartItems = []
						}
					}
				})
				return
			}
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
			// 提交需求，联系客服
		async submitRequirement() {
			if (this.selectedCount === 0) {
				uni.showToast({
					title: '请选择要询价的商品',
					icon: 'none'
				})
				return
			}
			
			// 跳转到确认需求页面（使用原来的结算页面，但改为确认需求）
			// 这里先跳转到结算页面，后续可以改为专门的确认需求页面
			uni.navigateTo({
				url: '/pages/order/checkout'
			})
		},
		
		async goToCheckout() {
				if (this.selectedCount === 0) {
					uni.showToast({
						title: '请至少选择一件商品',
						icon: 'none'
					})
					return
				}
				
				// 先保存当前选中的购物车ID，避免重新加载后丢失选中状态
				const selectedIds = this.selectedCartIds
				console.log('跳转结算页面 - 保存的选中购物车ID:', selectedIds)
				
				if (selectedIds.length === 0) {
					uni.showToast({
						title: '请至少选择一件商品',
						icon: 'none'
					})
					return
				}
				
				// 跳转前，先重新加载购物车数据，确保数量是最新的
				await this.loadCartData()
				
				// 恢复选中状态（因为重新加载后可能丢失）
				this.cartItems.forEach(item => {
					if (selectedIds.includes(item.id) && item.can_purchase) {
						item.selected = true
					}
				})
				
				// 打印选中的购物车项信息，用于调试
				const selectedItems = this.cartItems.filter(item => item.selected && item.can_purchase)
				console.log('跳转结算页面 - 选中的购物车项:', selectedItems.map(item => ({
					cart_id: item.id,
					product_name: item.product_name,
					quantity: item.quantity
				})))
				
				// 使用保存的ID，确保传递正确的购物车ID
				const finalSelectedIds = this.selectedCartIds
				console.log('跳转结算页面 - 最终传递的购物车ID:', finalSelectedIds)
				
				// 跳转到结算页面，传递结算数据
				uni.navigateTo({
					url: `/pages/order/checkout?cart_ids=${JSON.stringify(finalSelectedIds)}`
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

			// 修改商品数量（通过按钮）
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

				await this.updateQuantity(item, newQuantity)
			},

			// 输入框输入事件（实时更新显示，但不立即提交）
			onQuantityInput(item, event) {
				const value = event.detail.value
				// 只允许输入数字，实时更新显示（仅用于UI显示，不保存原始值）
				// 注意：这里更新 item.quantity 只是为了显示，实际保存会在 blur 时进行
				if (value === '' || /^\d+$/.test(value)) {
					item.quantity = value === '' ? 1 : parseInt(value) || 1
				}
			},

			// 输入框失去焦点事件（提交到后端）
			async onQuantityInputBlur(item, event) {
				// 如果商品不可购买，禁止修改数量
				if (!item.can_purchase) {
					// 重新加载购物车数据以恢复正确的数量
					this.loadCartData()
					return
				}

				let newQuantity = parseInt(event.detail.value) || 1
				// 确保数量至少为1
				if (newQuantity < 1) {
					newQuantity = 1
					item.quantity = 1
				}

				// 获取原始数量（从后端重新加载，确保获取最新值）
				// 由于 onQuantityInput 已经更新了 item.quantity，我们需要重新加载数据来获取原始值
				// 或者直接保存，让后端验证
				await this.updateQuantity(item, newQuantity)
			},

			// 更新商品数量到后端
			async updateQuantity(item, newQuantity) {
				console.log('更新购物车数量 - cart_id:', item.id, '新数量:', newQuantity, '当前数量:', item.quantity)
				try {
					const res = await updateCartItem({
						cart_id: item.id,
						quantity: newQuantity
					})
					console.log('更新购物车数量响应:', res.data)
					if (res.data.code === 0) {
						item.quantity = newQuantity
						this.updateCartBadge()
						console.log('购物车数量更新成功，当前数量:', item.quantity)
					} else if (res.data.code === -1) {
						// 显示业务错误信息，并恢复原值
						uni.showToast({
							title: res.data.message || '修改数量失败',
							icon: 'none'
						})
						// 重新加载购物车数据以恢复正确的数量
						this.loadCartData()
					} else {
						// 其他错误情况
						uni.showToast({
							title: res.data.message || '修改数量失败',
							icon: 'none'
						})
						// 重新加载购物车数据以恢复正确的数量
						this.loadCartData()
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
					// 重新加载购物车数据以恢复正确的数量
					this.loadCartData()
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
		background-color: #fff;
	}

	.title {
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 8rpx;
	}

	.subtitle {
		font-size: 24rpx;
		color: #999;
		line-height: 1.5;
	}

	.list-title {
		padding: 20rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #eee;
		font-size: 28rpx;
		font-weight: bold;
	}

	/* 地址信息样式 */
	.address-section {
		display: flex;
		flex-direction: column;
		padding: 20rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #eee;
		margin-bottom: 10rpx;
	}

	.address-label {
		font-size: 26rpx;
		font-weight: bold;
		margin-bottom: 8rpx;
		color: #333;
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
		background-color: #4169E1;
		color: white;
	}

	.home-tag {
		background-color: #f0f0f0;
		color: #666;
	}

	.address-info {
		flex: 1;
		width: 100%;
		margin-bottom: 8rpx;
	}

	.address-detail {
		margin-bottom: 8rpx;
	}

	.location {
		font-size: 28rpx;
		color: #333;
	}

	.default-text {
		color: #4169E1;
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
		color: #4169E1;
		font-size: 24rpx;
		align-self: flex-end;
	}

	.no-address-label {
		font-size: 26rpx;
		font-weight: bold;
		margin-bottom: 4rpx;
		color: #333;
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

	.price-container {
		display: flex;
		align-items: baseline;
		margin-bottom: 20rpx;
	}

	.product-price {
		font-size: 32rpx;
		color: #4169E1;
		font-weight: bold;
	}

	.product-unit {
		font-size: 24rpx;
		color: #333;
		margin-left: 0;
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

	.quantity-input {
		margin: 0 20rpx;
		width: 80rpx;
		height: 50rpx;
		text-align: center;
		font-size: 28rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 4rpx;
		background-color: #fff;
	}

	.quantity-input:disabled {
		background-color: #f5f5f5;
		color: #999;
	}

	.delete-btn {
		background-color: #f5f5f5;
		color: #666;
		height: 50rpx;
		line-height: 50rpx;
		font-size: 24rpx;
		border-radius: 25rpx;
	}

	.spec-info {
		display: flex;
		align-items: center;
		margin-bottom: 8rpx;
		font-size: 24rpx;
	}

	.spec-label {
		color: #666;
		margin-right: 4rpx;
	}

	.spec-value {
		color: #333;
	}

	.price-label {
		color: #666;
		font-size: 24rpx;
		margin-right: 4rpx;
	}

	.checkout-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #fff;
		display: flex;
		flex-direction: column;
		padding: 20rpx;
		border-top: 1rpx solid #eee;
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	.select-all {
		display: flex;
		align-items: center;
	}

	.select-all text {
		margin-left: 10rpx;
		font-size: 28rpx;
	}

	.total-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		margin-bottom: 10rpx;
	}

	.total-row {
		display: flex;
		align-items: baseline;
		margin-bottom: 4rpx;
	}

	.total-label {
		font-size: 26rpx;
		color: #333;
		margin-right: 4rpx;
	}

	.total-price {
		font-size: 32rpx;
		font-weight: bold;
		color: #e93b3d;
	}

	.total-tip {
		font-size: 22rpx;
		color: #999;
		line-height: 1.4;
	}

	.submit-requirement-btn {
		background-color: #4169E1;
		color: white;
		height: 80rpx;
		line-height: 80rpx;
		padding: 0 30rpx;
		border-radius: 8rpx;
		font-size: 28rpx;
		font-weight: bold;
		width: 100%;
		border: none;
	}

	.submit-requirement-btn.disabled,
	.submit-requirement-btn:disabled {
		background-color: #cccccc;
		color: #999999;
		opacity: 0.6;
		cursor: not-allowed;
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
		background-color: #4169E1;
		color: white;
		width: 200rpx;
		height: 70rpx;
		line-height: 70rpx;
		font-size: 28rpx;
		border-radius: 35rpx;
	}
</style>