const HistoryPage = {
  name: 'HistoryPage',
  components: { ComicCard, ThemeSwitch },
  template: `
    <div class="history-page">
      <div class="page-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 class="section-title" style="margin-bottom: 0;">阅读历史</h2>
          <el-button
            v-if="historyList.length > 0"
            type="danger"
            size="small"
            @click="clearHistory"
          >清空历史</el-button>
        </div>

        <div v-if="!isLoggedIn" class="empty-state">
          <div class="empty-icon">📖</div>
          <div class="empty-text">请先登录查看阅读历史</div>
          <el-button type="primary" @click="Router.navigate('/login')">去登录</el-button>
        </div>

        <template v-else>
          <div v-if="loading" class="loading-spinner">
            <el-icon class="is-loading" :size="24"><loading /></el-icon>
            <span style="margin-left: 8px;">加载中...</span>
          </div>

          <div v-if="historyList.length > 0" class="comic-grid">
            <div
              v-for="comic in historyList"
              :key="comic.id"
              class="comic-card"
              @click="continueReading(comic)"
            >
              <div class="cover-wrapper">
                <img
                  v-if="comic.cover"
                  :src="comic.cover"
                  :alt="comic.title"
                  loading="lazy"
                  @error="handleImageError"
                />
                <div v-else class="comic-placeholder-img">
                  <span class="comic-placeholder-icon">📖</span>
                </div>
                <span class="status-badge">{{ comic.status_text }}</span>
              </div>
              <div class="card-info">
                <div class="card-title">{{ comic.title }}</div>
                <div class="card-author">看到第{{ comic.last_chapter_no || 0 }}话</div>
                <div class="card-meta">
                  <span>{{ formatTime(comic.last_read_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="historyList.length === 0 && !loading" class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-text">暂无阅读历史</div>
            <el-button type="primary" @click="Router.navigate('/home')">去阅读</el-button>
          </div>
        </template>
      </div>
    </div>
  `,
  data() {
    return {
      historyList: [],
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
      this.loadHistory();
    }
  },
  methods: {
    async loadHistory() {
      this.loading = true;
      const res = await ApiService.getHistoryList({ page: 1, page_size: 50 });
      if (res.code === 0 && res.data) {
        this.historyList = res.data.items || [];
      }
      this.loading = false;
    },
    async clearHistory() {
      try {
        await ElementPlus.ElMessageBox.confirm('确定要清空所有阅读历史吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        const res = await ApiService.deleteHistory();
        if (res.code === 0) {
          ElementPlus.ElMessage.success('已清空');
          this.historyList = [];
        }
      } catch (e) {}
    },
    continueReading(comic) {
      const chapterNo = comic.last_chapter_no || 1;
      Router.navigate(`/reader/${comic.id}/${chapterNo}`);
    },
    handleImageError(e) {
      e.target.style.display = 'none';
    },
    formatTime(time) {
      if (!time) return '';
      const date = new Date(time);
      const now = new Date();
      const diff = now - date;
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
      if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
      return date.toLocaleDateString();
    }
  }
};