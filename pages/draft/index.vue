<template>
	<view class="container">
	<view class="header">
		<text class="subtitle">提交商品信息后请联系 李增春-13161621688 处理</text>
	</view>

		<!-- 清单商品 -->
		<view class="list-title" v-if="draftItems.length > 0">
			<text>清单商品</text>
		</view>
		
		<!-- 需求单列表 -->
		<view v-if="draftItems.length > 0">
			<view v-for="item in draftItems" :key="item.id" class="draft-item">
				<view class="item-left">
					<checkbox :checked="item.selected" @click="toggleSelect(item)" />
					<image class="product-image" :src="item.product_image" mode="aspectFill" />
				</view>
				<view class="item-right">
					<view class="product-name-wrapper">
						<text class="product-name">{{ item.product_name }}</text>
						<text v-if="item.product_specification" class="product-specification">{{ item.product_specification }}</text>
					</view>
					<view class="price-container">
						<text class="price-label">参考单价：</text>
						<text class="product-price">¥{{ item.product_reference_price }}</text>
						<text class="product-unit">/ {{ item.product_unit }}</text>
					</view>
					
					<view class="quantity-control">
						<button class="btn-minus" @click="changeQuantity(item, -1)">-</button>
						<input 
							class="quantity-input" 
							type="number" 
							:value="item.quantity" 
							@blur="onQuantityInputBlur(item, $event)"
							@input="onQuantityInput(item, $event)"
						/>
						<button class="btn-plus" @click="changeQuantity(item, 1)">+</button>
					</view>
					<button class="delete-btn" @click="deleteItem(item)">删除</button>
				</view>
			</view>

			<!-- 底部固定栏 -->
			<view class="submit-bar">
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
					@click="handleClick"
					@tap="handleClick"
					type="button"
				>
					提交商品，联系客服
				</button>
			</view>
		</view>

		<!-- 空需求单 -->
		<view v-else class="empty-draft">
			<image src="/static/images/empty-inquiry.png" mode="aspectFit"></image>
			<text class="tip">购物车还是空的</text>
			<button class="btn" @click="goToIndex">去逛逛</button>
		</view>
	</view>
</template>

<script>
	import {
		getDraftList,
		updateDraftItem,
		deleteDraftItem
	} from '@/api/draft.js'
	import { submitInquiry } from '@/api/inquiry.js'



	export default {
		data() {
			return {
				draftItems: [] // 需求单商品列表
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
							// 用户取消，停留在当前页面（需求单页面，只是需求单里啥都没有）
							// 不进行任何跳转，只清空需求单数据
							this.draftItems = []
						}
					}
				})
				return
			}
			this.loadDraftData()
		},
		computed: {
			// 是否全选
			isAllSelected() {
				return this.draftItems.length > 0 && this.draftItems.every(item => item.selected)
			},
			// 选中商品总价
			totalPrice() {
				return this.draftItems
					.filter(item => item.selected)
					.reduce((total, item) => total + (item.product_reference_price || 0) * item.quantity, 0)
					.toFixed(2)
			},
			// 选中商品数量
			selectedCount() {
				const count = this.draftItems.filter(item => item.selected).length
				return count
			},
			// 选中的需求单ID数组
			selectedDraftIds() {
				return this.draftItems
					.filter(item => item.selected)
					.map(item => item.id)
			}
		},
		methods: {
			// 加载需求单数据
			async loadDraftData() {
				try {
					const res = await getDraftList()
					if (res.data.code === 0) {
						if (res.data.data === null) {
							this.draftItems = [] // 设置为空数组
						} else {
							this.draftItems = res.data.data.map(item => {
								// 尝试多种可能的规格字段名
								const spec = item.product_specification || item.specification || item.spec || null
								return {
									...item,
									product_specification: spec, // 确保规格字段存在
									selected: item.selected === true || item.selected === 1
								}
							})
						}

					// 更新底部需求单徽标
					this.updateDraftBadge()
					}
				} catch (err) {
					uni.showToast({
						title: '获取需求单失败',
						icon: 'none'
					})
				}
			},

			// 更新需求单徽标
			updateDraftBadge() {
				try {
					// 显示需求单中不同商品的数量（商品种类数）
					const uniqueItemCount = this.draftItems.length
					if (uniqueItemCount > 0) {
						uni.setTabBarBadge({
							index: 2, // 需求单tab的索引是2
							text: uniqueItemCount.toString()
						})
					} else {
						uni.removeTabBarBadge({
							index: 2 // 需求单tab的索引是2
						})
					}
				} catch (error) {
				}
			},

			// 跳转到首页
			goToIndex() {
				uni.switchTab({
					url: '/pages/index/index'
				})
			},

		// 处理按钮点击
		handleClick(e) {
			if (e) {
				e.stopPropagation && e.stopPropagation()
				e.preventDefault && e.preventDefault()
			}
			this.submitRequirement()
		},
		
		submitRequirement() {
			// 获取选中的需求单ID
			const selectedIds = this.selectedDraftIds
			
			if (!selectedIds || selectedIds.length === 0) {
				uni.showToast({
					title: '请至少选择一件商品',
					icon: 'none'
				})
				return
			}
			
			// 直接调用接口
			uni.showLoading({ title: '提交中...', mask: true })
			
			submitInquiry({ draft_ids: selectedIds }).then(res => {
				uni.hideLoading()
				
				if (res.data && res.data.code === 0) {
					const inquiryNo = res.data.data?.inquiry_no
					
					// 跳转到成功页面
					uni.redirectTo({
						url: `/pages/inquiry/success?inquiry_no=${inquiryNo}&inquiry_info=商品信息已提交，客服将尽快联系您`
					})
				} else {
					uni.showToast({
						title: res.data?.message || '提交失败',
						icon: 'none'
					})
				}
			}).catch(err => {
				uni.hideLoading()
				uni.showToast({
					title: err.message || '提交失败，请重试',
					icon: 'none'
				})
			})
		},
		

			// 切换商品选中状态
			toggleSelect(item) {
				item.selected = !item.selected
			},

			// 全选/取消全选
			toggleSelectAll() {
				const newSelectStatus = !this.isAllSelected
				this.draftItems.forEach(item => {
					item.selected = newSelectStatus
				})
			},

			// 修改商品数量（通过按钮）
			async changeQuantity(item, change) {
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
				let newQuantity = parseFloat(event.detail.value) || 1
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
				try {
					const res = await updateDraftItem({
						draft_id: item.id,
						quantity: newQuantity
					})
					if (res.data.code === 0) {
						item.quantity = newQuantity
						this.updateDraftBadge()
					} else if (res.data.code === -1) {
						// 显示业务错误信息，并恢复原值
						uni.showToast({
							title: res.data.message || '修改数量失败',
							icon: 'none'
						})
						// 重新加载需求单数据以恢复正确的数量
						this.loadDraftData()
					} else {
						// 其他错误情况
						uni.showToast({
							title: res.data.message || '修改数量失败',
							icon: 'none'
						})
						// 重新加载需求单数据以恢复正确的数量
						this.loadDraftData()
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
					// 重新加载需求单数据以恢复正确的数量
					this.loadDraftData()
				}
			},

			// 删除商品
			async deleteItem(item) {
				try {
					const res = await deleteDraftItem(item.id)
					if (res.data.code === 0) {
						this.draftItems = this.draftItems.filter(draftItem => draftItem.id !== item.id)
						this.updateDraftBadge()
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						})
						this.loadDraftData()
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
		background-color: #fff;
	}

	.title {
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 8rpx;
	}

	.subtitle {
		font-size: 24rpx;
		color: #333;
		line-height: 1.5;
		background-color: #fff3cd;
		padding: 20rpx;
		border-radius: 8rpx;
		border-left: 4rpx solid #ffc107;
		display: block;
	}

	.list-title {
		padding: 20rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #eee;
		font-size: 28rpx;
		font-weight: bold;
	}


	.draft-item {
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
		width: 200rpx;
		height: 200rpx;
		margin-left: 30rpx;
		border-radius: 8rpx;
	}

	.item-right {
		flex: 1;
		margin-left: 30rpx;
		display: flex;
		flex-direction: column;
	}

	.product-name-wrapper {
		display: flex;
		align-items: baseline;
		margin-bottom: 10rpx;
		line-height: 1.4;
	}

	.product-name {
		font-size: 28rpx;
	}

.product-specification {
  font-size: 22rpx;
  color: #666;
  margin-left: 8rpx;
  font-weight: normal;
}

	.price-container {
		display: flex;
		align-items: baseline;
		margin-bottom: 20rpx;
	}

	.product-price {
		font-size: 32rpx;
		color: #e93b3d;
		font-weight: bold;
	}

	.product-unit {
		font-size: 22rpx;
		color: #333;
		margin-left: 0;
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
  color: #666;
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
  color: #666;
}

	.delete-btn {
		background-color: #f5f5f5;
		color: #666;
		height: 50rpx;
		line-height: 50rpx;
		font-size: 24rpx;
		border-radius: 25rpx;
	}

	.price-label {
		color: #666;
		font-size: 24rpx;
		margin-right: 4rpx;
	}

	.submit-bar {
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
  color: #666;
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
		position: relative;
		z-index: 999;
		pointer-events: auto !important;
		overflow: hidden;
	}
	
	.submit-requirement-btn::before,
	.submit-requirement-btn::after {
		display: none !important;
		content: '' !important;
	}
	
	/* 确保按钮内没有额外的数字显示 */
	.submit-requirement-btn text,
	.submit-requirement-btn view {
		position: relative;
		z-index: 1;
	}

.submit-requirement-btn.disabled {
  background-color: #cccccc;
  color: #555555;
  opacity: 0.6;
  cursor: not-allowed;
  /* 即使有 disabled 类，也允许点击 */
  pointer-events: auto !important;
}

	.empty-draft {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 100rpx;
	}

	.empty-draft image {
		width: 300rpx;
		height: 300rpx;
		margin-bottom: 40rpx;
	}

.tip {
  font-size: 28rpx;
  color: #666;
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
