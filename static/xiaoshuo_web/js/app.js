const { createApp, ref, computed } = Vue;

const AppLayout = {
  template: `
    <div class="app-layout">
      <router-view v-slot="{ Component, route }">
        <transition name="slide-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <div class="tab-bar" v-if="showTabBar">
        <div class="tab-item" :class="{ active: activeTab === 'shelf' }" @click="goTo('/shelf')">
          <span class="tab-emoji">📚</span>
          <span>书架</span>
        </div>
        <div class="tab-item" :class="{ active: activeTab === 'discover' }" @click="goTo('/discover')">
          <span class="tab-emoji">🧭</span>
          <span>书城</span>
        </div>
        <div class="tab-item" :class="{ active: activeTab === 'category' }" @click="goTo('/category')">
          <span class="tab-emoji">📂</span>
          <span>分类</span>
        </div>
      </div>
    </div>
  `,
  setup() {
    const route = VueRouter.useRoute();
    const router = VueRouter.useRouter();

    const showTabBar = computed(() => {
      return route.path !== "/reader" && !route.path.startsWith("/detail/");
    });

    const activeTab = computed(() => {
      if (route.path === "/shelf") return "shelf";
      if (route.path === "/discover" || route.path === "/") return "discover";
      if (route.path === "/category") return "category";
      return "";
    });

    const goTo = (path) => {
      if (route.path !== path) router.push(path);
    };

    return { route, showTabBar, activeTab, goTo };
  },
};

const app = createApp(AppLayout);

app.use(ElementPlus);

if (typeof ElementPlusIconsVue !== "undefined") {
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    if (component && component.name) {
      app.component(component.name, component);
    }
  }
}

app.use(window.router);
app.mount("#app");
