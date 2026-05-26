const ShelfPage = {
  name: 'ShelfPage',
  components: { ComicCard, ThemeSwitch },
  template: `
    <div class="shelf-page">
      <div class="page-container">
        <h2 class="section-title">我的书架</h2>

        <div v-if="!isLoggedIn" class="empty-state">
          <div class="empty-icon">📚</div>
          <div class="empty-text">请先登录查看收藏</div>
          <el-button type="primary" @click="Router.navigate('/login')">去登录</el-button>
        </div>

        <template v-else>
          <div v-if="loading" class="loading-spinner">
            <el-icon class="is-loading" :size="24"><loading /></el-icon>
            <span style="margin-left: 8px;">加载中...</span>
          </div>

          <div v-if="favoriteList.length > 0" class="comic-grid">
            <comic-card
              v-for="comic in favoriteList"
              :key="comic.id"
              :comic="comic"
              @click="goToDetail(comic)"
            />
          </div>

          <div v-if="favoriteList.length === 0 && !loading" class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-text">书架空空如也，快去收藏喜欢的漫画吧</div>
            <el-button type="primary" @click="Router.navigate('/home')">去发现</el-button>
          </div>
        </template>
      </div>
    </div>
  `,
  data() {
    return {
      favoriteList: [],
      loading: false,
      isLoggedIn: false
    };
  },
  computed: {
    Router() { return Router; },
    Storage() { return Storage; },
    ApiService() { return ApiService; }
  },
  created() {
    this.isLoggedIn = !!Storage.getToken();
    if (this.isLoggedIn) {
      this.loadFavorites();
    }
  },
  methods: {
    async loadFavorites() {
      this.loading = true;
      const res = await ApiService.getFavoriteList({ page: 1, page_size: 50 });
      if (res.code === 0 && res.data) {
        this.favoriteList = res.data.items || [];
      }
      this.loading = false;
    },
    goToDetail(comic) {
      Router.navigate(`/detail/${comic.id}`);
    }
  }
};