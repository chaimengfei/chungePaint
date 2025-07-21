import App from './App'

// #ifndef VUE3
import uView from 'uview-ui'
import Vue from 'vue'

Vue.use(uView)
Vue.prototype.$u = uView // 挂载全局 $u

Vue.config.productionTip = false
App.mpType = 'app'

const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif