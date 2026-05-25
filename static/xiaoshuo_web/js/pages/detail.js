const DetailPage = {
  template: `
    <div class="detail-page">
      <div class="detail-header" v-if="novel">
        <div class="header-bg" :style="{ backgroundImage: 'url(' + novel.cover + ')' }"></div>
        <div class="header-content">
          <img :src="novel.cover" class="detail-cover" />
          <div class="detail-info">
            <h1 class="detail-title">{{ novel.title }}</h1>
            <div class="detail-author">作者：{{ novel.author }}</div>
            <div class="detail-tags">
              <el-tag size="small">{{ novel.category_name }}</el-tag>
              <el-tag size="small" type="success" v-if="novel.status === '已完结'">{{ novel.status }}</el-tag>
              <el-tag size="small" type="warning" v-else>{{ novel.status }}</el-tag>
              <span>{{ formatWord(novel.word_count) }}</span>
            </div>
            <div class="detail-rating">
              <el-rate :model-value="novel.rating / 2" disabled size="small" />
              <span class="rating-num">{{ novel.rating }} 分</span>
              <span class="click-count">{{ novel.click_count }} 点击</span>
            </div>
          </div>
        </div>
      </div>

      <div class="action-bar">
        <el-button type="primary" size="large" @click="startRead" :loading="loadingRead">
          <el-icon><Reading /></el-icon> 立即阅读
        </el-button>
        <el-button size="large" @click="addToShelf" :loading="loadingShelf">
          <el-icon><Star /></el-icon> 加入书架
        </el-button>
        <el-button size="large" @click="shareNovel">
          <el-icon><Share /></el-icon> 分享
        </el-button>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>简介</h3>
          <span class="toggle" @click="showDesc = !showDesc">{{ showDesc ? '收起' : '展开' }}</span>
        </div>
        <div class="description" :class="{ expanded: showDesc }">
          <p>{{ novel ? novel.description : '' }}</p>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>章节目录</h3>
          <span class="more" @click="showAllChapters = true">共 {{ novel ? novel.chapter_count : 0 }} 章</span>
        </div>
        <div class="chapter-list">
          <div v-for="ch in recentChapters" :key="ch.id" class="chapter-item" @click="readChapter(ch)">
            <span class="ch-no">{{ ch.chapter_no }}</span>
            <span class="ch-title">{{ ch.title }}</span>
          </div>
        </div>
        <div v-if="showAllChapters" class="chapter-dialog" @click.self="showAllChapters = false">
          <div class="chapter-dialog-content">
            <div class="dialog-header">
              <h3>全部章节</h3>
              <el-button text @click="showAllChapters = false">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="dialog-body">
              <div v-for="ch in allChapters" :key="ch.id" class="chapter-item" @click="readChapter(ch); showAllChapters = false;">
                <span class="ch-no">{{ ch.chapter_no }}</span>
                <span class="ch-title">{{ ch.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>读者评论 ({{ commentTotal }})</h3>
        </div>
        <div class="comment-form">
          <el-input v-model="commentContent" type="textarea" :rows="2" placeholder="发表你的评论..." maxlength="200" show-word-limit />
          <div class="comment-actions">
            <el-rate v-model="commentRating" />
            <el-button type="primary" size="small" @click="submitComment">发表</el-button>
          </div>
        </div>
        <div class="comment-list">
          <div v-for="c in comments" :key="c.id" class="comment-item">
            <el-avatar :size="36" :src="c.user_avatar" />
            <div class="comment-body">
              <div class="comment-head">
                <span class="comment-user">{{ c.user_name }}</span>
                <el-rate :model-value="c.rating" disabled size="small" />
                <span class="comment-time">{{ c.created_at }}</span>
              </div>
              <div class="comment-content">{{ c.content }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section" v-if="similarList.length > 0">
        <div class="section-header"><h3>同类推荐</h3></div>
        <div class="similar-grid">
          <div v-for="n in similarList" :key="n.id" class="similar-card" @click="goDetail(n.id)">
            <img :src="n.cover" class="similar-cover" />
            <div class="similar-title">{{ n.title }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      novelId: null,
      novel: null,
      recentChapters: [],
      allChapters: [],
      comments: [],
      commentTotal: 0,
      commentPage: 1,
      similarList: [],
      showDesc: false,
      showAllChapters: false,
      commentContent: "",
      commentRating: 5,
      loadingRead: false,
      loadingShelf: false,
    };
  },
  mounted() {
    this.novelId = parseInt(this.$route.params.id);
    this.loadDetail();
  },
  methods: {
    async loadDetail() {
      const res = await Api.novelDetail(this.novelId);
      if (res.code === 200 && res.data) {
        this.novel = res.data;
      }
      const chRes = await Api.chapterList(this.novelId, true);
      if (chRes.code === 200 && chRes.data) {
        this.allChapters = chRes.data;
        this.recentChapters = chRes.data.slice(-10).reverse();
      }
      this.loadComments();
      this.loadSimilar();
    },
    async loadComments() {
      const res = await Api.commentList(this.novelId, this.commentPage, 20);
      if (res.code === 200 && res.data) {
        this.comments = res.data.items || [];
        this.commentTotal = res.data.total || 0;
      }
    },
    async loadSimilar() {
      if (!this.novel) return;
      const res = await Api.novelSimilar(this.novelId, 6);
      if (res.code === 200) this.similarList = res.data || [];
    },
    async submitComment() {
      if (!this.commentContent.trim()) {
        this.$message.warning("请输入评论内容");
        return;
      }
      const res = await Api.commentAdd({
        novel_id: this.novelId,
        content: this.commentContent,
        rating: this.commentRating,
      });
      if (res.code === 200) {
        this.$message.success("评论成功");
        this.commentContent = "";
        this.commentRating = 5;
        this.loadComments();
      }
    },
    startRead() {
      if (!this.novel) return;
      this.loadingRead = true;
      Api.readingLast(this.novelId).then((res) => {
        this.loadingRead = false;
        let chapterId = "";
        if (res.code === 200 && res.data && res.data.chapter_id) chapterId = res.data.chapter_id;
        this.$router.push({ path: "/reader", query: { novel_id: this.novelId, chapter_id: chapterId } });
      });
    },
    readChapter(ch) {
      this.$router.push({ path: "/reader", query: { novel_id: this.novelId, chapter_id: ch.id } });
    },
    async addToShelf() {
      this.loadingShelf = true;
      const res = await Api.shelfAdd(this.novelId);
      this.loadingShelf = false;
      if (res.code === 200) this.$message.success("已加入书架");
      else this.$message.warning(res.message || "已在书架中");
    },
    async shareNovel() {
      const res = await Api.share(this.novelId);
      if (res.code === 200 && res.data) {
        this.$message.success("分享链接已生成: " + res.data.share_text);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(res.data.share_text + " " + location.origin + "/#" + res.data.share_url);
          this.$message.success("已复制到剪贴板");
        }
      }
    },
    goDetail(id) {
      this.$router.push("/detail/" + id);
    },
    formatWord(w) {
      if (!w) return "0字";
      if (w >= 10000) return (w / 10000).toFixed(1) + "万字";
      return w + "字";
    },
  },
};
