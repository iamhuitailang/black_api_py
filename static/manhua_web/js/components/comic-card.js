const ComicCard = {
  name: 'ComicCard',
  props: {
    comic: {
      type: Object,
      required: true
    }
  },
  template: `
    <div class="comic-card" @click="handleClick">
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
          <span>{{ comic.title }}</span>
        </div>
        <span v-if="comic.hot >= 3" class="hot-badge hot-3">🔥🔥🔥</span>
        <span v-else-if="comic.hot >= 2" class="hot-badge hot-2">🔥🔥</span>
        <span v-else-if="comic.hot >= 1" class="hot-badge hot-1">🔥</span>
        <span class="status-badge">{{ comic.status_text }}</span>
      </div>
      <div class="card-info">
        <div class="card-title">{{ comic.title }}</div>
        <div class="card-author">{{ comic.author }}</div>
        <div class="card-meta">
          <span>{{ comic.total_chapters }}话</span>
          <span v-if="comic.views">{{ formatViews(comic.views) }}阅</span>
        </div>
      </div>
    </div>
  `,
  computed: {
    Router() { return Router; }
  },
  methods: {
    handleClick() {
      this.$emit('click', this.comic);
      Router.navigate(`/detail/${this.comic.id}`);
    },
    handleImageError(e) {
      e.target.style.display = 'none';
    },
    formatViews(views) {
      if (views >= 10000) {
        return (views / 10000).toFixed(1) + '万';
      }
      return views;
    }
  }
};