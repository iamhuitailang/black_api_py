const SettingsPage = {
  name: 'SettingsPage',
  components: { ThemeSwitch },
  template: `
    <div class="settings-page">
      <div class="page-container">
        <h2 class="section-title">阅读设置</h2>

        <div style="max-width: 600px;">
          <el-card style="margin-bottom: 20px;">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>阅读模式</strong>
              </div>
            </template>
            <el-radio-group v-model="settings.read_mode" @change="saveSettings">
              <el-radio-button value="single">单页模式</el-radio-button>
              <el-radio-button value="double">双页模式</el-radio-button>
              <el-radio-button value="scroll">卷轴模式</el-radio-button>
            </el-radio-group>
          </el-card>

          <el-card style="margin-bottom: 20px;">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>主题设置</strong>
              </div>
            </template>
            <el-radio-group v-model="settings.theme" @change="saveSettings">
              <el-radio-button value="dark">深色主题</el-radio-button>
              <el-radio-button value="light">浅色主题</el-radio-button>
            </el-radio-group>
          </el-card>

          <el-card style="margin-bottom: 20px;">
            <template #header>
              <strong>亮度调节</strong>
            </template>
            <div style="display: flex; align-items: center; gap: 16px;">
              <el-icon><sunny /></el-icon>
              <el-slider
                v-model="settings.brightness"
                :min="20"
                :max="100"
                @change="saveSettings"
              />
              <span>{{ settings.brightness }}%</span>
            </div>
          </el-card>

          <el-card style="margin-bottom: 20px;">
            <template #header>
              <strong>自动播放</strong>
            </template>
            <div style="display: flex; align-items: center; gap: 16px;">
              <el-switch v-model="autoPlayEnabled" @change="saveSettings" />
              <span>自动播放速度</span>
              <el-slider
                v-model="settings.auto_play_speed"
                :min="1"
                :max="5"
                :disabled="!autoPlayEnabled"
                @change="saveSettings"
              />
              <span>{{ settings.auto_play_speed }}</span>
            </div>
          </el-card>

          <el-card style="margin-bottom: 20px;">
            <template #header>
              <strong>翻页方向</strong>
            </template>
            <el-radio-group v-model="settings.page_direction" @change="saveSettings">
              <el-radio-button value="ltr">从左到右</el-radio-button>
              <el-radio-button value="rtl">从右到左</el-radio-button>
            </el-radio-group>
          </el-card>

          <el-card style="margin-bottom: 20px;">
            <template #header>
              <strong>显示设置</strong>
            </template>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>显示页码</span>
                <el-switch v-model="showPageNumEnabled" @change="saveSettings" />
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>显示时间戳</span>
                <el-switch v-model="showTimestampEnabled" @change="saveSettings" />
              </div>
            </div>
          </el-card>

          <el-card v-if="isLoggedIn" style="margin-bottom: 20px;">
            <template #header>
              <strong>账号设置</strong>
            </template>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <el-button type="primary" @click="Router.navigate('/profile')">
                个人资料
              </el-button>
              <el-button type="danger" @click="logout">
                退出登录
              </el-button>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      settings: {
        read_mode: 'single',
        theme: 'dark',
        brightness: 80,
        auto_play: 0,
        auto_play_speed: 3,
        font_size: 16,
        page_direction: 'ltr',
        show_page_num: 1,
        show_timestamp: 0
      },
      isLoggedIn: false
    };
  },
  computed: {
    autoPlayEnabled: {
      get() { return this.settings.auto_play === 1; },
      set(val) { this.settings.auto_play = val ? 1 : 0; }
    },
    showPageNumEnabled: {
      get() { return this.settings.show_page_num === 1; },
      set(val) { this.settings.show_page_num = val ? 1 : 0; }
    },
    showTimestampEnabled: {
      get() { return this.settings.show_timestamp === 1; },
      set(val) { this.settings.show_timestamp = val ? 1 : 0; }
    },
    Router() { return Router; },
    Storage() { return Storage; },
    ApiService() { return ApiService; }
  },
  created() {
    this.isLoggedIn = !!Storage.getToken();
    this.settings = { ...this.settings, ...Storage.getReadingSettings() };
  },
  methods: {
    saveSettings() {
      Storage.setReadingSettings(this.settings);
      document.body.className = `theme-${this.settings.theme}`;
      if (this.isLoggedIn) {
        ApiService.updateSettings(this.settings);
      }
    },
    async logout() {
      try {
        await ElementPlus.ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        await ApiService.logout();
        Storage.removeToken();
        Storage.removeUser();
        ElementPlus.ElMessage.success('已退出登录');
        Router.navigate('/login');
      } catch (e) {}
    }
  }
};