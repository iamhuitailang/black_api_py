const StorageUtil = {
  KEY_PREFIX: "xiaoshuo_",
  get(key, defaultValue = null) {
    try {
      const val = localStorage.getItem(this.KEY_PREFIX + key);
      return val ? JSON.parse(val) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(this.KEY_PREFIX + key, JSON.stringify(value));
    } catch (e) {}
  },
  remove(key) {
    try {
      localStorage.removeItem(this.KEY_PREFIX + key);
    } catch (e) {}
  },
  getReadingSettings() {
    return this.get("reading_settings", {
      fontSize: 18,
      fontFamily: "system",
      lineHeight: 1.8,
      bgColor: "#ffffff",
      textColor: "#333333",
      nightMode: false,
      pageMode: "scroll",
    });
  },
  setReadingSettings(settings) {
    this.set("reading_settings", settings);
  },
  getReadingProgress(novelId) {
    return this.get("progress_" + novelId, null);
  },
  setReadingProgress(novelId, progress) {
    this.set("progress_" + novelId, progress);
  },
  getCachedChapters(novelId) {
    return this.get("cached_" + novelId, []);
  },
  setCachedChapters(novelId, chapters) {
    this.set("cached_" + novelId, chapters);
  },
  getCachedContent(chapterId) {
    return this.get("chapter_content_" + chapterId, null);
  },
  setCachedContent(chapterId, content) {
    this.set("chapter_content_" + chapterId, content);
  },
};
