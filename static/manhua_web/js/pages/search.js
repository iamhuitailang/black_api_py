const SearchPage = {
  name: 'SearchPage',
  components: { ComicCard, ThemeSwitch },
  template: `
    <div class="search-page">
      <div class="page-container">
        <h2 class="section-title">搜索漫画</h2>

        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <el-input
            v-model="keyword"
            placeholder="输入漫画名称、作者..."
            :prefix-icon="'Search'"
            size="large"
            @keyup.enter="doSearch"
            clearable
          />
          <el-button type="primary" size="large" @click="doSearch" :loading="loading">
            搜索
          </el-button>
        </div>

        <div v-if="!hasSearched" class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-text">输入关键词搜索漫画</div>
        </div>

        <div v-else-if="loading" class="loading-spinner">
          <el-icon class="is-loading" :size="24"><loading /></el-icon>
          <span style="margin-left: 8px;">搜索中...</span>
        </div>

        <div v-else-if="searchResults.length > 0">
          <div style="margin-bottom: 16px; font-size: 14px;">
            共找到 <strong>{{ searchTotal }}</strong> 部与 "{{ keyword }}" 相关的漫画
          </div>
          <div class="comic-grid">
            <comic-card
              v-for="comic in searchResults"
              :key="comic.id"
              :comic="comic"
              @click="goToDetail(comic)"
            />
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">😕</div>
          <div class="empty-text">没有找到相关漫画</div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      keyword: '',
      searchResults: [],
      searchTotal: 0,
      loading: false,
      hasSearched: false
    };
  },
  computed: {
    Router() { return Router; },
    Storage() { return Storage; },
    ApiService() { return ApiService; }
  },
  created() {
    if (Router.params.q) {
      this.keyword = decodeURIComponent(Router.params.q);
      this.doSearch();
    }
  },
  methods: {
    async doSearch() {
      if (!this.keyword.trim()) {
        ElementPlus.ElMessage.warning('请输入搜索关键词');
        return;
      }
      this.loading = true;
      this.hasSearched = true;
      const res = await ApiService.searchComics(this.keyword.trim(), { page: 1, page_size: 50 });
      if (res.code === 0 && res.data) {
        this.searchResults = res.data.items || [];
        this.searchTotal = res.data.total || 0;
      }
      this.loading = false;
    },
    goToDetail(comic) {
      Router.navigate(`/detail/${comic.id}`);
    }
  }
};