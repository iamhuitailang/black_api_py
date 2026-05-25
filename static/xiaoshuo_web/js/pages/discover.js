const DiscoverPage = {
  template: `
    <div class="discover-page">
      <div class="page-header">
        <h2>书城</h2>
        <el-input v-model="searchKeyword" placeholder="搜索书名/作者" size="small" clearable style="width:180px;" @clear="doSearch" @keyup.enter="doSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <div class="banner-carousel">
        <el-carousel :interval="4000" height="160px" arrow="never">
          <el-carousel-item v-for="b in banners" :key="b.id" @click="goDetail(b.novel_id)">
            <img :src="b.image" class="banner-img" />
            <div class="banner-title">{{ b.title }}</div>
          </el-carousel-item>
        </el-carousel>
      </div>

      <div class="category-nav">
        <div v-for="cat in categories" :key="cat.id" class="cat-item" @click="goCategory(cat.id)">
          <div class="cat-icon">{{ cat.icon }}</div>
          <div class="cat-name">{{ cat.name }}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>热门推荐</h3>
          <span class="more" @click="goCategory(null)">更多 ></span>
        </div>
        <div class="horizontal-scroll">
          <div v-for="n in hotList" :key="n.id" class="h-novel-card" @click="goDetail(n.id)">
            <img :src="n.cover" class="h-cover" />
            <div class="h-title">{{ n.title }}</div>
            <div class="h-author">{{ n.author }}</div>
          </div>
        </div>
      </div>

      <div class="section rank-section">
        <div class="section-header"><h3>排行榜</h3></div>
        <el-tabs v-model="rankTab">
          <el-tab-pane label="点击榜" name="click">
            <div v-for="(n, i) in clickRank" :key="n.id" class="rank-item" @click="goDetail(n.id)">
              <span class="rank-no" :class="{ top: i < 3 }">{{ i + 1 }}</span>
              <img :src="n.cover" class="rank-cover" />
              <div class="rank-info">
                <div class="rank-title">{{ n.title }}</div>
                <div class="rank-author">{{ n.author }}</div>
                <div class="rank-count">{{ n.click_count }} 点击</div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="推荐榜" name="recommend">
            <div v-for="(n, i) in recommendRank" :key="n.id" class="rank-item" @click="goDetail(n.id)">
              <span class="rank-no" :class="{ top: i < 3 }">{{ i + 1 }}</span>
              <img :src="n.cover" class="rank-cover" />
              <div class="rank-info">
                <div class="rank-title">{{ n.title }}</div>
                <div class="rank-author">{{ n.author }}</div>
                <div class="rank-count">{{ n.rating }} 分</div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="新书榜" name="new">
            <div v-for="(n, i) in newRank" :key="n.id" class="rank-item" @click="goDetail(n.id)">
              <span class="rank-no" :class="{ top: i < 3 }">{{ i + 1 }}</span>
              <img :src="n.cover" class="rank-cover" />
              <div class="rank-info">
                <div class="rank-title">{{ n.title }}</div>
                <div class="rank-author">{{ n.author }}</div>
                <div class="rank-count">{{ n.status }}</div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="section">
        <div class="section-header"><h3>最新更新</h3></div>
        <div class="update-list">
          <div v-for="n in latestList" :key="n.id" class="update-item" @click="goDetail(n.id)">
            <img :src="n.cover" class="update-cover" />
            <div class="update-info">
              <div class="update-title">{{ n.title }}</div>
              <div class="update-author">{{ n.author }}</div>
              <div class="update-meta">
                <el-tag size="small">{{ n.category_name }}</el-tag>
                <span class="update-time">{{ n.updated_at }}</span>
              </div>
            </div>
            <el-button size="small" type="primary" @click.stop="addToShelf(n.id)">加入书架</el-button>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header"><h3>完本推荐</h3></div>
        <div class="finished-grid">
          <div v-for="n in finishedList" :key="n.id" class="finished-card" @click="goDetail(n.id)">
            <img :src="n.cover" class="f-cover" />
            <div class="f-title">{{ n.title }}</div>
            <div class="f-author">{{ n.author }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      banners: [],
      categories: [],
      hotList: [],
      recommendList: [],
      finishedList: [],
      latestList: [],
      clickRank: [],
      recommendRank: [],
      newRank: [],
      rankTab: "click",
      searchKeyword: "",
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      const reqs = [
        { key: 'banner', fn: () => Api.bannerList() },
        { key: 'category', fn: () => Api.categoryList() },
        { key: 'hot', fn: () => Api.novelHot(8) },
        { key: 'recommend', fn: () => Api.novelRecommend(8) },
        { key: 'finished', fn: () => Api.novelFinished(8) },
        { key: 'latest', fn: () => Api.novelLatest(8) },
        { key: 'clickRank', fn: () => Api.novelRankClick(10) },
        { key: 'recommendRank', fn: () => Api.novelRankRecommend(10) },
        { key: 'newRank', fn: () => Api.novelRankNew(10) },
      ];
      const results = {};
      for (const req of reqs) {
        try {
          results[req.key] = await req.fn();
        } catch (e) {
          results[req.key] = { code: 0, data: null };
        }
      }
      if (results.banner?.code === 200) this.banners = results.banner.data || [];
      if (results.category?.code === 200) this.categories = results.category.data || [];
      if (results.hot?.code === 200) this.hotList = results.hot.data || [];
      if (results.recommend?.code === 200) this.recommendList = results.recommend.data || [];
      if (results.finished?.code === 200) this.finishedList = results.finished.data || [];
      if (results.latest?.code === 200) this.latestList = results.latest.data || [];
      if (results.clickRank?.code === 200) this.clickRank = results.clickRank.data || [];
      if (results.recommendRank?.code === 200) this.recommendRank = results.recommendRank.data || [];
      if (results.newRank?.code === 200) this.newRank = results.newRank.data || [];
    },
    goDetail(id) { this.$router.push("/detail/" + id); },
    goCategory(id) { this.$router.push({ path: "/category", query: id ? { category_id: id } : {} }); },
    doSearch() { if (this.searchKeyword) this.$router.push({ path: "/category", query: { keyword: this.searchKeyword } }); },
    async addToShelf(id) {
      const res = await Api.shelfAdd(id);
      if (res.code === 200) this.$message.success("已加入书架");
      else this.$message.warning(res.message || "已在书架中");
    },
  },
};
