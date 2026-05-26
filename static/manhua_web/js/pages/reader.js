const ReaderPage = {
  name: 'ReaderPage',
  template: `
    <div class="reader-page" :class="'mode-' + readerTheme" :style="brightnessStyle">
      <div class="reader-header" v-show="showToolbar">
        <el-icon :size="20" style="cursor: pointer;" @click="goBack">
          <arrow-left />
        </el-icon>
        <div class="reader-title">{{ comic ? comic.title : '加载中...' }}</div>
        <div class="reader-chapter">第{{ currentChapterNo }}话</div>
        <el-icon :size="20" style="cursor: pointer;" @click="showChapterList = true">
          <menu />
        </el-icon>
      </div>

      <div
        class="reader-content"
        :class="{ 'scroll-mode': readMode === 'scroll' }"
        @click="toggleToolbar"
      >
        <template v-if="readMode === 'single'">
          <div
            class="reader-nav-area prev"
            @click.stop="prevPage"
            v-show="showToolbar"
          >
            <span class="reader-nav-btn">‹</span>
          </div>
          <img
            v-if="currentPageUrl"
            :src="currentPageUrl"
            class="reader-page-image"
            @error="handleImageError"
          />
          <div v-else class="comic-placeholder-img" style="height: 100%;">
            <span class="comic-placeholder-icon">📖</span>
            <span>第{{ currentPage }}页</span>
          </div>
          <div
            class="reader-nav-area next"
            @click.stop="nextPage"
            v-show="showToolbar"
          >
            <span class="reader-nav-btn">›</span>
          </div>
        </template>

        <template v-else-if="readMode === 'double'">
          <div class="reader-nav-area prev" @click.stop="prevPage" v-show="showToolbar">
            <span class="reader-nav-btn">‹</span>
          </div>
          <div style="display: flex; width: 100%; height: 100%;">
            <img
              v-if="currentPageUrl"
              :src="currentPageUrl"
              class="reader-page-image"
              style="flex: 1;"
              @error="handleImageError"
            />
            <img
              v-if="nextPageUrl && pageDirection === 'ltr'"
              :src="nextPageUrl"
              class="reader-page-image"
              style="flex: 1;"
              @error="handleImageError"
            />
          </div>
          <div class="reader-nav-area next" @click.stop="nextPage" v-show="showToolbar">
            <span class="reader-nav-btn">›</span>
          </div>
        </template>

        <template v-else-if="readMode === 'scroll'">
          <div v-if="chapter" style="padding: 20px; max-width: 800px; margin: 0 auto;">
            <div
              v-for="p in totalPages"
              :key="p"
              style="margin-bottom: 20px; text-align: center;"
            >
              <img
                :src="getPageUrl(p)"
                class="reader-page-image"
                style="max-width: 100%;"
                @error="handleImageError"
              />
            </div>
          </div>
        </template>
      </div>

      <div class="reader-toolbar" :class="{ visible: showToolbar }">
        <div class="toolbar-row">
          <div class="toolbar-group">
            <el-radio-group v-model="readMode" size="small" @change="saveSettingsDebounced">
              <el-radio-button value="single">单页</el-radio-button>
              <el-radio-button value="double">双页</el-radio-button>
              <el-radio-button value="scroll">卷轴</el-radio-button>
            </el-radio-group>
          </div>
          <div class="toolbar-group">
            <el-radio-group v-model="readerTheme" size="small" @change="saveSettingsDebounced">
              <el-radio-button value="dark">深色</el-radio-button>
              <el-radio-button value="light">浅色</el-radio-button>
            </el-radio-group>
          </div>
          <div class="toolbar-group">
            <span style="font-size: 12px;">亮度</span>
            <el-slider
              v-model="brightness"
              :min="20"
              :max="100"
              style="width: 100px;"
              @change="saveSettingsDebounced"
            />
          </div>
        </div>
        <div class="toolbar-row" style="justify-content: space-between;">
          <div class="toolbar-group">
            <el-button
              size="small"
              :icon="autoPlay ? 'VideoPause' : 'VideoPlay'"
              @click="toggleAutoPlay"
              :type="autoPlay ? 'primary' : ''"
            >{{ autoPlay ? '暂停' : '自动播放' }}</el-button>
            <el-slider
              v-if="autoPlay"
              v-model="autoPlaySpeed"
              :min="1"
              :max="5"
              style="width: 80px; margin-left: 8px;"
              @change="onAutoPlaySpeedChange"
            />
          </div>
          <div class="toolbar-group">
            <span style="font-size: 12px;">第{{ currentPage }}/{{ totalPages }}页</span>
            <el-button size="small" @click="prevPage" :disabled="currentPage <= 1">上一页</el-button>
            <el-button size="small" @click="nextPage" :disabled="currentPage >= totalPages">下一页</el-button>
          </div>
        </div>
        <div class="toolbar-row">
          <el-slider
            v-model="currentPage"
            :min="1"
            :max="totalPages"
            style="flex: 1;"
            @change="onPageSliderChange"
          />
        </div>
      </div>

      <el-drawer v-model="showChapterList" direction="rtl" size="60%">
        <template #header>
          <span>章节列表</span>
        </template>
        <div class="chapter-grid">
          <div
            v-for="ch in allChapters"
            :key="ch.id"
            class="chapter-item"
            :class="{ active: ch.chapter_no === currentChapterNo }"
            @click="goToChapter(ch.chapter_no)"
          >
            {{ ch.title }}
          </div>
        </div>
      </el-drawer>
    </div>
  `,
  data() {
    return {
      comic: null,
      chapter: null,
      prevChapter: null,
      nextChapter: null,
      comicId: null,
      currentChapterNo: 1,
      currentPage: 1,
      totalPages: 10,
      readMode: 'single',
      readerTheme: 'dark',
      brightness: 80,
      autoPlay: false,
      autoPlaySpeed: 3,
      autoPlayTimer: null,
      showToolbar: true,
      toolbarTimer: null,
      showChapterList: false,
      allChapters: [],
      pageDirection: 'ltr',
      showPageNum: true,
      showTimestamp: false,
      saveDebounceTimer: null,
      settingsDebounceTimer: null,
      progressSaved: false
    };
  },
  computed: {
    currentPageUrl() {
      return this.getPageUrl(this.currentPage);
    },
    nextPageUrl() {
      if (this.currentPage < this.totalPages) {
        return this.getPageUrl(this.currentPage + 1);
      }
      return null;
    },
    brightnessStyle() {
      return {
        filter: `brightness(${this.brightness}%)`
      };
    },
    Router() { return Router; },
    Storage() { return Storage; },
    ApiService() { return ApiService; }
  },
  created() {
    this.comicId = Router.params.comicId;
    this.currentChapterNo = parseInt(Router.params.chapterNo) || 1;
    this.loadSettings();
    this.loadChapter();
  },
  beforeUnmount() {
    this.clearAutoPlay();
    this.saveProgressImmediate();
    if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
    if (this.settingsDebounceTimer) clearTimeout(this.settingsDebounceTimer);
    if (this.toolbarTimer) clearTimeout(this.toolbarTimer);
  },
  methods: {
    loadSettings() {
      const settings = Storage.getReadingSettings();
      this.readMode = settings.read_mode || 'single';
      this.readerTheme = settings.theme || 'dark';
      this.brightness = settings.brightness || 80;
      this.autoPlaySpeed = settings.auto_play_speed || 3;
      this.pageDirection = settings.page_direction || 'ltr';
      this.showPageNum = settings.show_page_num === 1;
      this.showTimestamp = settings.show_timestamp === 1;
    },
    async loadChapter() {
      const res = await ApiService.getChapter(this.comicId, this.currentChapterNo);
      if (res.code === 0 && res.data) {
        this.comic = res.data.comic;
        this.chapter = res.data.chapter;
        this.prevChapter = res.data.prev_chapter;
        this.nextChapter = res.data.next_chapter;
        this.totalPages = this.chapter ? (this.chapter.page_count || 10) : 10;

        const savedProgress = Storage.getReaderProgress(this.comicId);
        if (savedProgress && savedProgress.chapter_no === this.currentChapterNo) {
          this.currentPage = savedProgress.page_no || 1;
        } else {
          this.currentPage = 1;
        }
        this.progressSaved = false;
        this.loadAllChapters();
      }
    },
    async loadAllChapters() {
      const res = await ApiService.getComicDetail(this.comicId);
      if (res.code === 0 && res.data) {
        this.allChapters = res.data.chapters || [];
      }
    },
    getPageUrl(page) {
      return `https://picsum.photos/seed/mh${this.comicId}c${this.currentChapterNo}p${page}/800/1200`;
    },
    goBack() {
      this.saveProgressImmediate();
      window.history.length > 1 ? window.history.back() : Router.navigate('/home');
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.saveProgressDebounced();
      } else if (this.prevChapter) {
        this.saveProgressImmediate();
        this.currentChapterNo = this.prevChapter.chapter_no;
        this.currentPage = 1;
        this.loadChapter();
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.saveProgressDebounced();
      } else if (this.nextChapter) {
        this.saveProgressImmediate();
        this.currentChapterNo = this.nextChapter.chapter_no;
        this.currentPage = 1;
        this.loadChapter();
      }
    },
    onPageSliderChange() {
      this.saveProgressDebounced();
    },
    goToChapter(chapterNo) {
      this.saveProgressImmediate();
      this.currentChapterNo = chapterNo;
      this.currentPage = 1;
      this.showChapterList = false;
      this.loadChapter();
    },
    toggleToolbar() {
      if (this.readMode === 'scroll') return;
      this.showToolbar = !this.showToolbar;
      if (this.showToolbar) {
        this.resetToolbarTimer();
      }
    },
    resetToolbarTimer() {
      if (this.toolbarTimer) clearTimeout(this.toolbarTimer);
      this.toolbarTimer = setTimeout(() => {
        this.showToolbar = false;
      }, 5000);
    },
    toggleAutoPlay() {
      this.autoPlay = !this.autoPlay;
      if (this.autoPlay) {
        this.startAutoPlay();
      } else {
        this.clearAutoPlay();
      }
    },
    startAutoPlay() {
      this.clearAutoPlay();
      const interval = (6 - this.autoPlaySpeed) * 1000;
      this.autoPlayTimer = setInterval(() => {
        this.nextPage();
      }, interval);
    },
    clearAutoPlay() {
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
      }
    },
    onAutoPlaySpeedChange() {
      if (this.autoPlay) {
        this.startAutoPlay();
      }
      this.saveSettingsDebounced();
    },
    saveProgressDebounced() {
      if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
      }
      this.progressSaved = false;
      this.saveDebounceTimer = setTimeout(() => {
        this.saveProgressImmediate();
      }, 2000);
    },
    saveProgressImmediate() {
      if (this.progressSaved) return;
      Storage.setReaderProgress(this.comicId, {
        chapter_no: this.currentChapterNo,
        page_no: this.currentPage
      });
      this.progressSaved = true;
      if (Storage.getToken()) {
        ApiService.recordProgress(
          this.comicId,
          this.chapter ? this.chapter.id : null,
          this.currentChapterNo,
          this.currentPage
        ).catch(() => {});
      }
    },
    saveSettingsDebounced() {
      if (this.settingsDebounceTimer) {
        clearTimeout(this.settingsDebounceTimer);
      }
      this.settingsDebounceTimer = setTimeout(() => {
        this.saveSettingsImmediate();
      }, 1500);
    },
    saveSettingsImmediate() {
      const settings = Storage.getReadingSettings();
      settings.read_mode = this.readMode;
      settings.theme = this.readerTheme;
      settings.brightness = this.brightness;
      settings.auto_play_speed = this.autoPlaySpeed;
      settings.page_direction = this.pageDirection;
      settings.show_page_num = this.showPageNum ? 1 : 0;
      settings.show_timestamp = this.showTimestamp ? 1 : 0;
      Storage.setReadingSettings(settings);
      document.body.className = `theme-${this.readerTheme}`;
    },
    handleImageError(e) {
      e.target.style.display = 'none';
    }
  }
};