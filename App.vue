<script>
import { getCartList } from '@/api/cart.js'

export default {
  onLaunch: function() {
    console.log('App Launch')
    // 初始化购物车徽标
    this.initCartBadge()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    // 初始化购物车徽标
    async initCartBadge() {
      try {
        const res = await getCartList()
        if (res.data && res.data.code === 0) {
          const cartItems = res.data.data || []
          const uniqueItemCount = cartItems.length
          
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
        }
      } catch (err) {
        console.error('初始化购物车徽标失败:', err)
      }
    }
  }
}
</script>

<style>
/* 每个页面公共css */
page {
  height: 100%;
  box-sizing: border-box;
}
</style>