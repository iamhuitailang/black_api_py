const DetailPage = {
  name: 'DetailPage',
  components: { ThemeSwitch },
  template: `
    <div class="detail-page">
      <div class="page-container">
        <div v-if="loading" class="loading-spinner">
          <el-icon class="is-loading" :size="24"><loading /></el-icon>
          <span style="margin-left: 8px;">加载中...</span>
        </div>

        <div v-else-if="comic">
          <div class="detail-header">
            <div class="detail-cover">
              <img
                v-if="comic.cover"
                :src="comic.cover"
                :alt="comic.title"
                @error="handleImageError"
              />
              <div v-else class="comic-placeholder-img">
                <span class="comic-placeholder-icon">📖</span>
              </div>
            </div>
            <div class="detail-info">
              <h1 class="detail-title">{{ comic.title }}</h1>
              <div class="detail-meta">
                <span class="meta-item">
                  <el-icon><user /></el-icon>
                  {{ comic.author }}
                </span>
                <span class="meta-item">
                  <el-tag :type="comic.status === 'ongoing' ? 'success' : 'info'" size="small">
                    {{ comic.status_text }}
                  </el-tag>
                </span>
                <span class="meta-item">
                  <el-icon><document /></el-icon>
                  {{ comic.total_chapters }}话
                </span>
                <span class="meta-item">
                  <el-icon><star /></el-icon>
                  {{ comic.rating }}分
                </span>
                <span class="meta-item">
                  <el-icon><view /></el-icon>
                  {{ formatViews(comic.views) }}
                </span>
              </div>
              <div class="detail-tags">
                <span
                  v-for="tag in comicTags"
                  :key="tag"
                  class="tag"
                >{{ tag }}</span>
              </div>
              <div
                class="detail-description"
                :class="{ expanded: descriptionExpanded }"
                @click="descriptionExpanded = !descriptionExpanded"
              >
                {{ comic.description }}
                <span v-if="comic.description && comic.description.length > 100" style="color: var(--primary-color);">
                  {{ descriptionExpanded ? '收起' : '展开' }}
                </span>
              </div>
              <div class="detail-actions">
                <el-button
                  type="primary"
                  :icon="isFavorite ? 'StarFilled' : 'Star'"
                  @click="toggleFavorite"
                  :loading="favoriteLoading"
                >
                  {{ isFavorite ? '已收藏' : '收藏' }}
                </el-button>
                <el-button
                  type="success"
                  icon="VideoPlay"
                  @click="startReading"
                >开始阅读</el-button>
                <el-button
                  icon="Share"
                  @click="showShare = true"
                >分享</el-button>
              </div>
            </div>
          </div>

          <div class="chapter-list">
            <h2 class="section-title">章节列表 ({{ chapters.length }}话)</h2>
            <div class="chapter-grid">
              <div
                v-for="chapter in chapters"
                :key="chapter.id"
                class="chapter-item"
                :class="{ read: isChapterRead(chapter.chapter_no) }"
                @click="goToReader(chapter.chapter_no)"
              >
                {{ chapter.title }}
              </div>
            </div>
          </div>

          <div class="comment-section">
            <h2 class="section-title">评论 ({{ commentTotal }})</h2>
            <div class="comment-input-wrapper" v-if="isLoggedIn">
              <el-input
                v-model="newComment"
                type="textarea"
                :rows="2"
                placeholder="发表你的评论..."
                maxlength="500"
                show-word-limit
              />
              <el-button
                type="primary"
                :icon="'ChatDotRound'"
                @click="submitComment"
                :loading="commentSubmitting"
              >发表</el-button>
            </div>
            <div class="comment-input-wrapper" v-else>
              <el-input
                placeholder="登录后发表评论"
                disabled
              />
              <el-button type="primary" @click="Router.navigate('/login')">登录</el-button>
            </div>

            <div class="comment-list" v-if="comments.length > 0">
              <div
                v-for="comment in comments"
                :key="comment.id"
                class="comment-item"
              >
                <div class="comment-header">
                  <div class="comment-avatar">
                    {{ comment.user ? (comment.user.nickname || comment.user.username || '?')[0] : '?' }}
                  </div>
                  <div class="comment-user-info">
                    <div class="comment-nickname">
                      {{ comment.user ? (comment.user.nickname || comment.user.username) : '匿名用户' }}
                    </div>
                    <div class="comment-time">{{ formatTime(comment.created_at) }}</div>
                  </div>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
                <div class="comment-actions">
                  <span class="comment-action" @click="likeComment(comment.id)">
                    <el-icon><star /></el-icon>
                    {{ comment.like_count }}
                  </span>
                  <span class="comment-action" @click="replyToComment(comment)">
                    <el-icon><chat-dot-round /></el-icon>
                    回复
                  </span>
                  <span
                    v-if="isMyComment(comment)"
                    class="comment-action"
                    @click="deleteComment(comment.id)"
                  >
                    <el-icon><delete /></el-icon>
                    删除
                  </span>
                </div>
              </div>
            </div>

            <div v-if="comments.length === 0 && !commentsLoading" class="empty-state">
              <div class="empty-icon">💬</div>
              <div class="empty-text">暂无评论，快来发表第一条评论吧</div>
            </div>

            <div v-if="commentsLoading" class="loading-spinner">
              <el-icon class="is-loading" :size="20"><loading /></el-icon>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">😢</div>
          <div class="empty-text">漫画不存在</div>
        </div>
      </div>

      <el-dialog v-model="showShare" title="分享" width="90%">
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <el-button type="primary" @click="shareLink">
            <el-icon><link /></el-icon>
            复制链接
          </el-button>
          <el-button type="success" @click="shareWeChat">
            <el-icon><chat-dot-round /></el-icon>
            分享到微信
          </el-button>
        </div>
      </el-dialog>
    </div>
  `,
  data() {
    return {
      comic: null,
      chapters: [],
      loading: true,
      descriptionExpanded: false,
      isFavorite: false,
      favoriteLoading: false,
      isLoggedIn: false,
      newComment: '',
      comments: [],
      commentTotal: 0,
      commentSubmitting: false,
      commentsLoading: false,
      showShare: false,
      comicId: null
    };
  },
  computed: {
    comicTags() {
      if (!this.comic) return [];
      return (this.comic.tags || this.comic.category || '').split(',').filter(Boolean);
    },
    Router() { return Router; },
    Storage() { return Storage; },
    ApiService() { return ApiService; },
    ShareService() { return ShareService; }
  },
  created() {
    this.comicId = Router.params.id;
    this.isLoggedIn = !!Storage.getToken();
    this.loadDetail();
  },
  methods: {
    async loadDetail() {
      this.loading = true;
      const res = await ApiService.getComicDetail(this.comicId);
      if (res.code === 0 && res.data) {
        this.comic = res.data.comic;
        this.chapters = res.data.chapters || [];
        this.loadFavoriteStatus();
        this.loadComments();
      }
      this.loading = false;
    },
    async loadFavoriteStatus() {
      if (!this.isLoggedIn) return;
      const res = await ApiService.checkFavorite(this.comicId);
      if (res.code === 0 && res.data) {
        this.isFavorite = res.data.is_favorite;
      }
    },
    async toggleFavorite() {
      if (!this.isLoggedIn) {
        ElementPlus.ElMessage.warning('请先登录');
        Router.navigate('/login');
        return;
      }
      this.favoriteLoading = true;
      const res = this.isFavorite
        ? await ApiService.removeFavorite(this.comicId)
        : await ApiService.addFavorite(this.comicId);
      if (res.code === 0) {
        this.isFavorite = !this.isFavorite;
        ElementPlus.ElMessage.success(res.msg);
      } else {
        ElementPlus.ElMessage.error(res.msg);
      }
      this.favoriteLoading = false;
    },
    startReading() {
      const readChapters = Storage.getReaderProgress(this.comicId);
      const chapterNo = readChapters ? readChapters.chapter_no : 1;
      Router.navigate(`/reader/${this.comicId}/${chapterNo}`);
    },
    goToReader(chapterNo) {
      Router.navigate(`/reader/${this.comicId}/${chapterNo}`);
    },
    isChapterRead(chapterNo) {
      const readChapters = Storage.getReaderProgress(this.comicId);
      return readChapters && readChapters.chapter_no >= chapterNo;
    },
    async loadComments() {
      this.commentsLoading = true;
      const res = await ApiService.getComments(this.comicId, { page: 1, page_size: 20 });
      if (res.code === 0 && res.data) {
        this.comments = res.data.items || [];
        this.commentTotal = res.data.total || 0;
      }
      this.commentsLoading = false;
    },
    async submitComment() {
      if (!this.newComment.trim()) {
        ElementPlus.ElMessage.warning('请输入评论内容');
        return;
      }
      this.commentSubmitting = true;
      const res = await ApiService.createComment(this.comicId, this.newComment.trim());
      if (res.code === 0) {
        this.newComment = '';
        ElementPlus.ElMessage.success('评论成功');
        this.loadComments();
      } else {
        ElementPlus.ElMessage.error(res.msg);
      }
      this.commentSubmitting = false;
    },
    async likeComment(commentId) {
      const res = await ApiService.likeComment(commentId);
      if (res.code === 0) {
        const comment = this.comments.find(c => c.id === commentId);
        if (comment) {
          comment.like_count = (comment.like_count || 0) + 1;
        }
      }
    },
    replyToComment(comment) {
      this.replyingTo = comment;
    },
    async deleteComment(commentId) {
      const res = await ApiService.deleteComment(commentId);
      if (res.code === 0) {
        ElementPlus.ElMessage.success('删除成功');
        this.loadComments();
      } else {
        ElementPlus.ElMessage.error(res.msg);
      }
    },
    isMyComment(comment) {
      const user = Storage.getUser();
      return user && comment.user && comment.user.id === user.id;
    },
    handleImageError(e) {
      e.target.style.display = 'none';
    },
    formatViews(views) {
      if (views >= 10000) {
        return (views / 10000).toFixed(1) + '万';
      }
      return views || 0;
    },
    formatTime(time) {
      if (!time) return '';
      const date = new Date(time);
      const now = new Date();
      const diff = now - date;
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
      return date.toLocaleDateString();
    },
    async shareLink() {
      const url = ShareService.getComicShareUrl(this.comicId);
      const result = await ShareService.copyToClipboard(url);
      if (result.success) {
        ElementPlus.ElMessage.success('链接已复制');
      } else {
        ElementPlus.ElMessage.error('复制失败');
      }
      this.showShare = false;
    },
    shareWeChat() {
      ElementPlus.ElMessage.info('请截图分享到微信');
      this.showShare = false;
    }
  }
};