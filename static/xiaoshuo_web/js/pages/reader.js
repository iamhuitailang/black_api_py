const ReaderPage = {
  template: `
    <div class="reader-page" :class="{ 'night-mode': settings.nightMode }" :style="readerStyle">
      <div class="reader-container" ref="readerContainer">
        <div class="reader-content" ref="readerContent" @click="toggleToolbar" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
          <div class="chapter-title">{{ currentChapter ? currentChapter.title : '' }}</div>
          <div class="chapter-body" v-html="chapterContentHtml"></div>
          <div class="chapter-end" v-if="currentChapter">
            <p>— 本章完 —</p>
            <div class="nav-buttons">
              <el-button :disabled="!hasPrev" @click="goPrev">上一章</el-button>
              <el-button type="primary" :disabled="!hasNext" @click="goNext">下一章</el-button>
            </div>
          </div>
        </div>
      </div>

      <transition name="fade">
        <div class="reader-toolbar top" v-if="showToolbar">
          <el-button text @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <span class="toolbar-title">{{ novelTitle }}</span>
          <div class="toolbar-actions">
            <el-button text @click="showCatalog = true">
              <el-icon><List /></el-icon>
            </el-button>
            <el-button text @click="showSettings = true">
              <el-icon><Setting /></el-icon>
            </el-button>
            <el-button text @click="toggleNightMode">
              <el-icon><Moon v-if="!settings.nightMode" /><Sunny v-else /></el-icon>
            </el-button>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div class="reader-toolbar bottom" v-if="showToolbar">
          <el-button text @click="goPrev" :disabled="!hasPrev">
            <el-icon><DArrowLeft /></el-icon> 上一章
          </el-button>
          <div class="progress-section">
            <el-slider v-model="chapterProgress" :max="100" :show-tooltip="false" @change="onProgressChange" height="4px" />
            <span class="progress-text">{{ currentChapterNo }}/{{ totalChapters }}</span>
          </div>
          <el-button text @click="goNext" :disabled="!hasNext">
            下一章 <el-icon><DArrowRight /></el-icon>
          </el-button>
        </div>
      </transition>

      <transition name="slide">
        <div class="catalog-panel" v-if="showCatalog" @click.self="showCatalog = false">
          <div class="catalog-content">
            <div class="catalog-header">
              <h3>目录</h3>
              <el-button text @click="showCatalog = false">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="catalog-tabs">
              <div class="tab-item" :class="{ active: catalogTab === 'chapters' }" @click="catalogTab = 'chapters'">章节</div>
              <div class="tab-item" :class="{ active: catalogTab === 'bookmarks' }" @click="catalogTab = 'bookmarks'">书签</div>
            </div>
            <div class="catalog-body" v-if="catalogTab === 'chapters'">
              <div v-for="ch in chapters" :key="ch.id"
                   class="catalog-item"
                   :class="{ active: currentChapter && currentChapter.id === ch.id }"
                   @click="goToChapter(ch)">
                <span>{{ ch.chapter_no }}. {{ ch.title }}</span>
                <el-icon v-if="currentChapter && currentChapter.id === ch.id"><Check /></el-icon>
              </div>
            </div>
            <div class="catalog-body" v-else>
              <div v-for="bm in bookmarks" :key="bm.id" class="catalog-item" @click="goToBookmark(bm)">
                <div>
                  <div class="bm-title">{{ bm.title }}</div>
                  <div class="bm-time">{{ bm.created_at }}</div>
                </div>
                <el-button size="small" text type="danger" @click.stop="deleteBookmark(bm.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-empty v-if="bookmarks.length === 0" description="暂无书签" />
            </div>
          </div>
        </div>
      </transition>

      <transition name="slide">
        <div class="settings-panel" v-if="showSettings" @click.self="showSettings = false">
          <div class="settings-content">
            <div class="settings-header">
              <h3>阅读设置</h3>
              <el-button text @click="showSettings = false">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="setting-group">
              <label>字号</label>
              <el-slider v-model="settings.fontSize" :min="14" :max="28" :step="2" @input="saveSettings" />
              <span class="setting-value">{{ settings.fontSize }}px</span>
            </div>
            <div class="setting-group">
              <label>字体</label>
              <el-select v-model="settings.fontFamily" size="small" @change="saveSettings">
                <el-option label="系统默认" value="system" />
                <el-option label="宋体" value="SimSun" />
                <el-option label="楷体" value="KaiTi" />
                <el-option label="黑体" value="SimHei" />
              </el-select>
            </div>
            <div class="setting-group">
              <label>行间距</label>
              <el-slider v-model="settings.lineHeight" :min="1.2" :max="3" :step="0.2" @input="saveSettings" />
              <span class="setting-value">{{ settings.lineHeight }}</span>
            </div>
            <div class="setting-group">
              <label>背景色</label>
              <div class="color-options">
                <div v-for="color in bgColors" :key="color.value"
                     class="color-item"
                     :class="{ active: settings.bgColor === color.value }"
                     :style="{ backgroundColor: color.value, color: color.text }"
                     @click="settings.bgColor = color.value; settings.textColor = color.text; saveSettings()">
                  {{ color.name }}
                </div>
              </div>
            </div>
            <div class="setting-group">
              <label>翻页方式</label>
              <el-radio-group v-model="settings.pageMode" @change="saveSettings">
                <el-radio-button label="scroll">上下滚动</el-radio-button>
                <el-radio-button label="page">左右翻页</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </div>
      </transition>
    </div>
  `,
  data() {
    return {
      novelId: null,
      novelTitle: "",
      chapters: [],
      currentChapter: null,
      currentChapterNo: 1,
      totalChapters: 0,
      chapterContent: "",
      bookmarks: [],
      showToolbar: true,
      showCatalog: false,
      showSettings: false,
      catalogTab: "chapters",
      chapterProgress: 0,
      settings: { fontSize: 18, fontFamily: "system", lineHeight: 1.8, bgColor: "#ffffff", textColor: "#333333", nightMode: false, pageMode: "scroll" },
      bgColors: [
        { name: "默认", value: "#ffffff", text: "#333333" },
        { name: "护眼", value: "#C7E9C0", text: "#333333" },
        { name: "羊皮纸", value: "#F5E6CA", text: "#5B4636" },
        { name: "夜间", value: "#1A1A1A", text: "#8A8A8A" },
        { name: "粉色", value: "#FCE4EC", text: "#5D4037" },
      ],
      autoSaveTimer: null,
      touchStartX: 0,
      touchStartY: 0,
      touchStartTime: 0,
      readingStartTime: 0,
      lastScrollPosition: 0,
    };
  },
  computed: {
    readerStyle() {
      const fontMap = { system: "-apple-system, BlinkMacSystemFont, sans-serif" };
      return {
        fontSize: this.settings.fontSize + "px",
        fontFamily: fontMap[this.settings.fontFamily] || this.settings.fontFamily,
        lineHeight: this.settings.lineHeight,
        backgroundColor: this.settings.bgColor,
        color: this.settings.textColor,
      };
    },
    hasPrev() { return this.currentChapterNo > 1; },
    hasNext() { return this.currentChapterNo < this.totalChapters; },
    chapterContentHtml() {
      if (!this.chapterContent) return "";
      return this.chapterContent
        .replace(/^/gm, "<p>")
        .replace(/$/gm, "</p>")
        .replace(/<p><\/p>/g, "");
    },
  },
  mounted() {
    this.settings = StorageUtil.getReadingSettings();
    this.novelId = parseInt(this.$route.query.novel_id) || 1;
    const chapterId = parseInt(this.$route.query.chapter_id) || null;
    this.initReader(chapterId);
    this.loadBookmarks();
    this.bindKeyboard();
    this.readingStartTime = Date.now();
    this.autoSaveTimer = setInterval(() => this.autoSaveProgress(), 10000);
    window.addEventListener("beforeunload", this.saveProgress);
    window.addEventListener("keydown", this.handleKeydown);
  },
  beforeUnmount() {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    this.saveProgress();
    window.removeEventListener("beforeunload", this.saveProgress);
    window.removeEventListener("keydown", this.handleKeydown);
  },
  methods: {
    async initReader(chapterId) {
      const novelRes = await Api.novelDetail(this.novelId);
      if (novelRes.code === 200 && novelRes.data) {
        this.novelTitle = novelRes.data.title;
      }
      const chRes = await Api.chapterList(this.novelId, true);
      if (chRes.code === 200 && chRes.data) {
        this.chapters = chRes.data;
        this.totalChapters = this.chapters.length;
      }
      if (chapterId) {
        await this.loadChapter(chapterId);
      } else {
        const lastRes = await Api.readingLast(this.novelId);
        if (lastRes.code === 200 && lastRes.data && lastRes.data.chapter_id) {
          await this.loadChapter(lastRes.data.chapter_id);
        } else if (this.chapters.length > 0) {
          await this.loadChapter(this.chapters[0].id);
        }
      }
    },
    async loadChapter(chapterId) {
      const ch = this.chapters.find((c) => c.id === chapterId);
      if (ch) {
        this.currentChapter = ch;
        this.currentChapterNo = ch.chapter_no;
        this.chapterProgress = Math.round((ch.chapter_no / this.totalChapters) * 100);
      }
      let content = StorageUtil.getCachedContent(chapterId);
      if (!content) {
        const res = await Api.chapterDetail(chapterId);
        if (res.code === 200 && res.data) {
          content = res.data.content;
          StorageUtil.setCachedContent(chapterId, content);
        }
      }
      this.chapterContent = content || "章节内容加载中...";
      this.$nextTick(() => {
        const container = this.$refs.readerContainer;
        if (container) container.scrollTop = 0;
      });
      this.saveProgress();
    },
    goPrev() {
      if (this.hasPrev) {
        const prev = this.chapters.find((c) => c.chapter_no === this.currentChapterNo - 1);
        if (prev) this.loadChapter(prev.id);
      }
    },
    goNext() {
      if (this.hasNext) {
        const next = this.chapters.find((c) => c.chapter_no === this.currentChapterNo + 1);
        if (next) this.loadChapter(next.id);
      }
    },
    goToChapter(ch) {
      this.loadChapter(ch.id);
      this.showCatalog = false;
    },
    goToBookmark(bm) {
      this.loadChapter(bm.chapter_id);
      this.showCatalog = false;
    },
    async loadBookmarks() {
      const res = await Api.bookmarkList(this.novelId);
      if (res.code === 200 && res.data) this.bookmarks = res.data;
    },
    async addBookmark() {
      if (!this.currentChapter) return;
      const res = await Api.bookmarkAdd({
        novel_id: this.novelId,
        chapter_id: this.currentChapter.id,
        title: this.currentChapter.title,
        position: this.chapterProgress / 100,
      });
      if (res.code === 200) {
        this.$message.success("书签已添加");
        this.loadBookmarks();
      }
    },
    async deleteBookmark(id) {
      const res = await Api.bookmarkDelete(id);
      if (res.code === 200) {
        this.$message.success("已删除");
        this.loadBookmarks();
      }
    },
    onProgressChange(val) {
      const targetNo = Math.max(1, Math.min(this.totalChapters, Math.ceil((val / 100) * this.totalChapters)));
      const ch = this.chapters.find((c) => c.chapter_no === targetNo);
      if (ch && ch.id !== this.currentChapter?.id) this.loadChapter(ch.id);
    },
    saveProgress() {
      if (!this.currentChapter) return;
      const now = Date.now();
      const readSeconds = Math.floor((now - this.readingStartTime) / 1000);
      this.readingStartTime = now;
      if (readSeconds > 0) {
        Api.readingSave({
          novel_id: this.novelId,
          chapter_id: this.currentChapter.id,
          position: this.chapterProgress / 100,
          read_seconds: readSeconds,
        });
      }
      StorageUtil.setReadingProgress(this.novelId, {
        chapter_id: this.currentChapter.id,
        position: this.chapterProgress / 100,
      });
    },
    autoSaveProgress() { this.saveProgress(); },
    saveSettings() { StorageUtil.setReadingSettings(this.settings); },
    toggleToolbar() { this.showToolbar = !this.showToolbar; },
    toggleNightMode() {
      this.settings.nightMode = !this.settings.nightMode;
      if (this.settings.nightMode) {
        this.settings.bgColor = "#1A1A1A";
        this.settings.textColor = "#8A8A8A";
      } else {
        this.settings.bgColor = "#ffffff";
        this.settings.textColor = "#333333";
      }
      this.saveSettings();
    },
    goBack() {
      this.saveProgress();
      this.$router.back();
    },
    handleKeydown(e) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.goPrev();
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.goNext();
      else if (e.key === "s" || e.key === "S") { this.showSettings = !this.showSettings; this.showCatalog = false; }
      else if (e.key === "n" || e.key === "N") this.toggleNightMode();
      else if (e.key === "Home") {
        const c = this.$refs.readerContainer;
        if (c) c.scrollTop = 0;
      } else if (e.key === "b" || e.key === "B") this.addBookmark();
    },
    bindKeyboard() {},
    onTouchStart(e) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
    },
    onTouchMove(e) {},
    onTouchEnd(e) {
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;
      const dt = Date.now() - this.touchStartTime;
      if (dt < 500 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) this.goNext();
        else this.goPrev();
      }
    },
  },
};
