import { BASE_URL } from './common'

/* TODO 待修复
 发现的问题：

  1. 购物车地址管理逻辑问题

  - 购物车页面在onLoad时会检查selected_address缓存，但在onShow时会调用loadDefa
  ultAddress()，这可能导致冲突
  - 购物车的地址信息显示不够完整（缺少收货人姓名和电话）

  2. 地址管理流程问题

  - 
  地址列表页面的chooseAddress只在从结算页跳转时才有效，从购物车跳转时没有处理
  - 地址编辑页面中，编辑时手机号被禁用，但这可能不符合用户需求

  3. 结算页面逻辑问题

  - 结算页面的地址选择逻辑有冗余，既有缓存机制又有API调用
  - selectAddress方法中的逻辑判断可能有问题

  4. API接口不一致问题

  - 地址删除接口路径不一致：deleteAddress使用/api/addresses/delete/${id}，但其
  他地址接口使用/api/address/

  5. 支付流程问题

  - 支付成功后直接跳转，没有错误处理机制
  - 支付金额转换为分的逻辑简单，可能有精度问题

  我将制定一个全面的优化方案，确保系统的稳定性和用户体验。重点是统一地址管理流
  程，优化支付逻辑，并消除代码中的潜在冲突。

✻ Thinking…

  现在我需要整理我的分析结果并向用户提供详细的反馈。

⏺ 我已经完成了对你的微信小程序的全面检查。这是一个基于uni-app +
  uview-ui的电商小程序，整体架构清晰，但确实存在一些逻辑问题，特别是在购物车
  地址管理和支付流程方面。

  主要发现的问题：

  1. 购物车地址管理逻辑冲突

  问题位置： pages/draft/index.vue:110-116
  - onLoad时检查缓存地址，onShow时又调用loadDefaultAddress()，可能导致地址信
  息覆盖
  - 购物车顶部地址信息缺少收货人姓名和电话，用户体验不够友好

  2. 地址选择流程不完整

  问题位置： pages/address/list.vue:73-81
  - chooseAddress方法只处理从结算页跳转的情况，从购物车跳转没有回调逻辑
  - 导致用户从购物车点击地址 → 地址列表 → 选择地址后，购物车页面不会更新

  3. API接口路径不一致

  问题位置： api/address.js:21
  - 删除地址接口使用 /api/addresses/delete/${id}
  - 其他地址接口使用 /api/address/
  - 路径不统一可能导致404错误

  4. 支付流程风险

  问题位置： pages/order/checkout.vue:225-230
  - 金额转换 Math.round(this.orderData.payment_amount * 100) 可能有精度问题
  - 支付成功后立即跳转，缺少支付状态确认机制

  5. 地址编辑限制问题

  问题位置： pages/address/edit.vue:9
  - 编辑地址时手机号被禁用，但用户可能需要修改手机号

  建议的修复方案：

  1. 修复购物车地址管理

  在pages/draft/index.vue中统一地址加载逻辑：
  onShow() {
      this.loadDraftData()
      // 只有没有缓存地址时才调用API
      const selectedAddress = uni.getStorageSync('selected_address')
      if (selectedAddress) {
          this.defaultAddress = selectedAddress
          uni.removeStorageSync('selected_address')
      } else if (!this.defaultAddress) {
          this.loadDefaultAddress()
      }
  }

  2. 完善地址选择回调

  在pages/address/list.vue中添加购物车返回处理：
  chooseAddress(item) {
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage.route === 'pages/order/checkout' || prevPage.route ===
  'pages/draft/index') {
          uni.setStorageSync('selected_address', item);
          uni.navigateBack();
      }
  }

  3. 统一API接口路径

  将api/address.js中的删除接口改为：
  url: `${BASE_URL}/api/address/delete/${id}`,

  4. 改进支付金额处理

  使用更精确的金额转换：
  total: Math.round(parseFloat(this.orderData.payment_amount) * 100)

  整体流程评估：

  ✅ 正常工作的流程：
  - 商品加入购物车
  - 购物车商品管理（增删改）
  - 结算页面基本功能
  - 地址增删改

  ⚠️ 需要改进的流程：
  - 购物车 → 地址选择 → 返回购物车
  - 支付成功状态确认
  - 错误处理机制

  整体而言，你的小程序基础功能完整，主要问题集中在用户交互流程的细节处理上，
  建议优先修复地址管理相关的问题，这直接影响用户体验。
  */
import { get, post, del } from './request'

export const getAddressList = () => {
  return get('/api/address/list').then(res => res.data)
}

export const deleteAddress = (id) => {
  return del(`/api/addresses/delete/${id}`)
}

// 创建地址
export const createAddress = (data) => {
  return post('/api/address/create', { data })
}

// 更新地址
export const updateAddress = (data) => {
  return post('/api/address/update', { data })
}
