const ShelfPage = {
  template: `
    <div class="shelf-page">
      <div class="page-header">
        <h2>我的书架</h2>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_count }}</div>
            <div class="stat-label">书架总数</div>
          </div>
        </div>
        <div class="stat-card" v-if="recentNovel">
          <div class="stat-icon">📖</div>
          <div class="stat-info">
            <div class="stat-value" style="font-size:14px;">{{ recentNovel.novel_title || '暂无' }}</div>
            <div class="stat-label">最近阅读</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatTime(stats.total_read_seconds) }}</div>
            <div class="stat-label">总阅读时长</div>
          </div>
        </div>
      </div>

      <div class="filter-bar">
        <el-radio-group v-model="filterType" size="small" @change="loadList">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="recent">最近更新</el-radio-button>
          <el-radio-button label="frequent">最常阅读</el-radio-button>
        </el-radio-group>
        <div class="view-toggle">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="grid">
              <el-icon><Grid /></el-icon>
            </el-radio-button>
            <el-radio-button label="list">
              <el-icon><List /></el-icon>
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div v-if="viewMode === 'grid'" class="novel-grid">
        <div v-for="item in shelfItems" :key="item.id" class="novel-card" @click="goDetail(item.novel_id)">
          <div class="cover-wrap">
            <img :src="item.novel_cover" class="cover" />
            <div class="progress-bar">
              <div class="progress" :style="{ width: (item.last_read_position * 100) + '%' }"></div>
            </div>
            <div class="quick-actions" @click.stop>
              <el-button size="small" type="primary" @click="goReader(item)">继续阅读</el-button>
            </div>
          </div>
          <div class="novel-info">
            <div class="novel-title">{{ item.novel_title }}</div>
            <div class="novel-author">{{ item.novel_author }}</div>
            <div class="novel-progress">已读 {{ Math.round(item.last_read_position * 100) }}%</div>
          </div>
          <div class="card-menu" @click.stop>
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, item)">
              <el-icon class="more-icon"><MoreFilled /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="delete">删除</el-dropdown-item>
                  <el-dropdown-item command="group">移入分类</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <div v-else class="novel-list">
        <div v-for="item in shelfItems" :key="item.id" class="list-item" @click="goDetail(item.novel_id)">
          <img :src="item.novel_cover" class="list-cover" />
          <div class="list-info">
            <div class="list-title">{{ item.novel_title }}</div>
            <div class="list-author">{{ item.novel_author }}</div>
            <div class="list-progress">
              <el-progress :percentage="Math.round(item.last_read_position * 100)" :stroke-width="4" />
            </div>
            <div class="list-group">{{ item.group_name }}</div>
          </div>
          <div class="list-actions" @click.stop>
            <el-button size="small" type="primary" @click="goReader(item)">阅读</el-button>
            <el-button size="small" @click="removeItem(item)">移除</el-button>
          </div>
        </div>
      </div>

      <el-empty v-if="shelfItems.length === 0 && !loading" description="书架空空如也，去书城逛逛吧~" />
    </div>
  `,
  data() {
    return {
      shelfItems: [],
      stats: { total_count: 0, total_read_seconds: 0 },
      recentNovel: null,
      viewMode: "grid",
      filterType: "all",
      loading: false,
    };
  },
  mounted() {
    this.loadStats();
    this.loadList();
  },
  methods: {
    async loadStats() {
      const res = await Api.shelfStats();
      if (res.code === 200 && res.data) {
        this.stats = res.data;
        if (res.data.recent_read_novel_id) {
          const listRes = await Api.shelfList({ page_size: 1 });
          if (listRes.code === 200 && listRes.data && listRes.data.items.length > 0) {
            this.recentNovel = listRes.data.items[0];
          }
        }
      }
    },
    async loadList() {
      this.loading = true;
      let params = { page_size: 50 };
      if (this.filterType === "recent") {
        params.sort_by = "updated_at";
      } else if (this.filterType === "frequent") {
        params.sort_by = "total_read_seconds";
      }
      const res = await Api.shelfList(params);
      if (res.code === 200 && res.data) {
        this.shelfItems = res.data.items || [];
      }
      this.loading = false;
    },
    async removeItem(item) {
      const confirmed = await this.$confirm("确定要从书架移除吗？", "提示", { type: "warning" }).catch(() => false);
      if (!confirmed) return;
      const res = await Api.shelfDelete(item.id);
      if (res.code === 200) {
        this.$message.success("移除成功");
        this.loadStats();
        this.loadList();
      }
    },
    goDetail(novelId) {
      this.$router.push("/detail/" + novelId);
    },
    goReader(item) {
      this.$router.push({ path: "/reader", query: { novel_id: item.novel_id, chapter_id: item.last_read_chapter_id || "" } });
    },
    handleCommand(cmd, item) {
      if (cmd === "delete") this.removeItem(item);
      if (cmd === "group") this.$message.info("分类功能开发中");
    },
    formatTime(seconds) {
      if (!seconds) return "0分钟";
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      if (h > 0) return h + "小时" + m + "分钟";
      return m + "分钟";
    },
  },
};
