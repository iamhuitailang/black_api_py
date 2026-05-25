var App = {
  template: `
    <div>
      <div class="app-header">
        <h1>🛒 拼团商城</h1>
        <div class="subtitle">多人拼团 · 省钱购物</div>
      </div>

      <div class="nav-tabs" v-if="!isDetailPage">
        <div
          v-for="tab in tabs"
          :key="tab.path"
          :class="['tab-item', { active: currentPath === tab.path }]"
          @click="navigate(tab.path)"
        >
          {{ tab.icon }} {{ tab.label }}
        </div>
      </div>

      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </div>
  `,
  data: function() {
    return {
      currentPath: '/',
      tabs: [
        { path: '/', label: '首页', icon: '🏠' },
        { path: '/my-groups', label: '我的拼团', icon: '📦' },
        { path: '/admin', label: '管理', icon: '⚙️' }
      ]
    };
  },
  computed: {
    isDetailPage: function() {
      return this.$route.path === '/detail';
    }
  },
  methods: {
    navigate: function(path) {
      this.$router.push(path);
    }
  },
  watch: {
    '$route.path': function(newPath) {
      this.currentPath = newPath;
    }
  }
};

var router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/detail', component: DetailPage },
    { path: '/my-groups', component: MyGroupsPage },
    { path: '/admin', component: AdminPage }
  ]
});

var app = Vue.createApp(App);
app.use(router);
app.use(ElementPlus);

for (var key in ElementPlusIconsVue) {
  app.component(key, ElementPlusIconsVue[key]);
}

app.mount('#app');

var urlGroupId = PinTuanUtils.getUrlParam('group');
if (urlGroupId) {
  var group = PinTuanData.getGroupById(urlGroupId);
  if (group) {
    router.push({ path: '/detail', query: { id: group.productId, group: urlGroupId } });
  }
}

setInterval(function() {
  PinTuanData.updateGroupStatus();
}, 1000);
