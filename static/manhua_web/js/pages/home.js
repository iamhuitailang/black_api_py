const HomePage = {
  name: 'HomePage',
  components: { ComicCard, ThemeSwitch },
  template: `
    <div class="home-page">
      <div class="banner-section">
        <div class="banner-slide" :class="'slide-' + (currentBanner + 1)">
          {{ banners[currentBanner].title }}
        </div>
        <div class="banner-indicators">
          <span
            v-for="(b, i) in banners"
            :key="i"
            class="banner-indicator"
            :class="{ active: i === currentBanner }"
            @click="currentBanner = i"
          ></span>
        </div>
      </div>

      <div class="page-container">
        <div class="category-tabs">
          <span
            class="category-tab"
            :class="{ active: activeCategory === '' }"
            @click="activeCategory = ''; loadComics()"
          >全部</span>
          <span
            v-for="cat in categories"
            :key="cat"
            class="category-tab"
            :class="{ active: activeCategory === cat }"
            @click="activeCategory = cat; loadComics()"
          >{{ cat }}</span>
        </div>

        <h2 class="section-title">推荐漫画</h2>
        <div class="comic-grid" v-if="recommendList.length > 0">
          <comic-card
            v-for="comic in recommendList"
            :key="'rec-' + comic.id"
            :comic="comic"
            @click="goToDetail(comic)"
          />
        </div>

        <h2 class="section-title" style="margin-top: 32px;">热门漫画</h2>
        <div class="comic-grid" v-if="comicList.length > 0">
          <comic-card
            v-for="comic in comicList"
            :key="comic.id"
            :comic="comic"
            @click="goToDetail(comic)"
          />
        </div>

        <div class="loading-spinner" v-if="loading">
          <el-icon class="is-loading" :size="24"><loading /></el-icon>
          <span style="margin-left: 8px;">加载中...</span>
        </div>

        <div v-if="comicList.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">📚</div>
          <div class="empty-text">暂无漫画</div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      banners: [
        { title: '🎬 精选漫画 每日更新' },
        { title: '🔥 热门榜单 精彩不断' },
        { title: '✨ 新番上线 抢先观看' }
      ],
      currentBanner: 0,
      bannerTimer: null,
      categories: [],
      activeCategory: '',
      recommendList: [],
      comicList: [],
      loading: false,
      page: 1,
      pageSize: 20
    };
  },
  created() {
    this.loadCategories();
    this.loadRecommend();
    this.loadComics();
    this.startBannerAutoPlay();
  },
  beforeUnmount() {
    if (this.bannerTimer) {
      clearInterval(this.bannerTimer);
    }
  },
  methods: {
    startBannerAutoPlay() {
      this.bannerTimer = setInterval(() => {
        this.currentBanner = (this.currentBanner + 1) % this.banners.length;
      }, 4000);
    },
    async loadCategories() {
      const res = await ApiService.getCategories();
      if (res.code === 0 && res.data) {
        this.categories = res.data.categories || [];
      }
    },
    async loadRecommend() {
      const res = await ApiService.getRecommendList({ page: 1, page_size: 8 });
      if (res.code === 0 && res.data) {
        this.recommendList = res.data.items || [];
      }
    },
    async loadComics() {
      this.loading = true;
      const params = { page: this.page, page_size: this.pageSize };
      if (this.activeCategory) {
        params.category = this.activeCategory;
      }
      const res = await ApiService.getHotList(params);
      if (res.code === 0 && res.data) {
        this.comicList = res.data.items || [];
      }
      this.loading = false;
    },
    goToDetail(comic) {
      Router.navigate(`/detail/${comic.id}`);
    }
  }
};