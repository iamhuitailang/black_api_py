const CategoryPage = {
  template: `
    <div class="category-page">
      <div class="page-header">
        <h2>分类</h2>
      </div>

      <div class="category-tabs">
        <div class="tab-item" :class="{ active: currentCategory === null }" @click="selectCategory(null)">全部</div>
        <div v-for="cat in categories" :key="cat.id"
             class="tab-item"
             :class="{ active: currentCategory === cat.id }"
             @click="selectCategory(cat.id)">
          {{ cat.icon }} {{ cat.name }}
        </div>
      </div>

      <div class="filter-bar">
        <el-radio-group v-model="sortBy" size="small" @change="loadList">
          <el-radio-button label="updated_at">最新</el-radio-button>
          <el-radio-button label="click_count">最热</el-radio-button>
          <el-radio-button label="rating">评分最高</el-radio-button>
        </el-radio-group>
        <div class="status-filter">
          <el-select v-model="statusFilter" size="small" placeholder="状态" @change="loadList">
            <el-option label="全部状态" value="" />
            <el-option label="连载中" value="连载中" />
            <el-option label="已完结" value="已完结" />
          </el-select>
        </div>
      </div>

      <div class="word-filter">
        <span>字数:</span>
        <el-radio-group v-model="wordFilter" size="small" @change="loadList">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="0-500000">50万以下</el-radio-button>
          <el-radio-button label="500000-1000000">50-100万</el-radio-button>
          <el-radio-button label="1000000-">100万以上</el-radio-button>
        </el-radio-group>
      </div>

      <div class="novel-grid">
        <div v-for="n in novelList" :key="n.id" class="novel-card" @click="goDetail(n.id)">
          <img :src="n.cover" class="cover" />
          <div class="novel-info">
            <div class="novel-title">{{ n.title }}</div>
            <div class="novel-author">{{ n.author }}</div>
            <div class="novel-meta">
              <el-tag size="small">{{ n.category_name }}</el-tag>
              <span class="novel-status">{{ n.status }}</span>
              <span class="novel-word">{{ formatWord(n.word_count) }}</span>
            </div>
            <div class="novel-rating">
              <el-rate :model-value="n.rating / 2" disabled size="small" />
              <span class="rating-num">{{ n.rating }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="load-more" v-if="hasMore" @click="loadMore">
        <el-button :loading="loading">加载更多</el-button>
      </div>
      <el-empty v-if="novelList.length === 0 && !loading" description="暂无小说" />
    </div>
  `,
  data() {
    return {
      categories: [],
      currentCategory: null,
      sortBy: "updated_at",
      statusFilter: "",
      wordFilter: "",
      novelList: [],
      page: 1,
      pageSize: 20,
      total: 0,
      loading: false,
    };
  },
  computed: {
    hasMore() { return this.novelList.length < this.total; },
  },
  mounted() {
    this.loadCategories();
    if (this.$route.query.category_id) {
      this.currentCategory = parseInt(this.$route.query.category_id);
    }
    if (this.$route.query.keyword) {
      this.searchKeyword = this.$route.query.keyword;
    }
    this.loadList(true);
  },
  methods: {
    async loadCategories() {
      const res = await Api.categoryList();
      if (res.code === 200) this.categories = res.data || [];
    },
    selectCategory(id) {
      this.currentCategory = id;
      this.page = 1;
      this.novelList = [];
      this.loadList(true);
    },
    async loadList(reset = false) {
      if (this.loading) return;
      this.loading = true;
      if (reset) this.page = 1;
      let params = {
        page: this.page,
        page_size: this.pageSize,
        sort_by: this.sortBy,
      };
      if (this.currentCategory) params.category_id = this.currentCategory;
      if (this.statusFilter) params.status = this.statusFilter;
      if (this.searchKeyword) params.keyword = this.searchKeyword;
      const res = await Api.novelList(params);
      if (res.code === 200 && res.data) {
        if (reset) this.novelList = res.data.items || [];
        else this.novelList = [...this.novelList, ...(res.data.items || [])];
        this.total = res.data.total || 0;
      }
      this.loading = false;
    },
    loadMore() {
      this.page++;
      this.loadList(false);
    },
    goDetail(id) { this.$router.push("/detail/" + id); },
    formatWord(w) {
      if (!w) return "0字";
      if (w >= 10000) return (w / 10000).toFixed(1) + "万字";
      return w + "字";
    },
  },
};
