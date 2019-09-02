import Vue from 'vue';
import App from '@/App.vue';
import store from '@/store';
import '@/icons';

// @ts-ignore
import Chartkick from 'vue-chartkick';
// @ts-ignore
import Chart from 'chart.js';
Vue.use(Chartkick.use(Chart));

// @ts-ignore
import SweetModal from 'sweet-modal-vue/src/plugin.js'
Vue.use(SweetModal);

Vue.config.productionTip = false;

new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');
