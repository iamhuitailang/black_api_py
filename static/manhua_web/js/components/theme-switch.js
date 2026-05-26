const ThemeSwitch = {
  name: 'ThemeSwitch',
  template: `
    <el-icon
      :size="20"
      style="cursor: pointer;"
      @click="toggleTheme"
      :title="isDark ? '切换浅色主题' : '切换深色主题'"
    >
      <sunny v-if="isDark" />
      <moon v-else />
    </el-icon>
  `,
  data() {
    return {
      isDark: true
    };
  },
  created() {
    this.isDark = Storage.getTheme() === 'dark';
  },
  methods: {
    toggleTheme() {
      this.isDark = !this.isDark;
      const theme = this.isDark ? 'dark' : 'light';
      Storage.setTheme(theme);
      document.body.className = `theme-${theme}`;
      document.querySelector('meta[name="theme-color"]').content = this.isDark ? '#1a1a2e' : '#ffffff';
    }
  }
};