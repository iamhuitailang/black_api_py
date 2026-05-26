const ProfilePage = {
  name: 'ProfilePage',
  components: { ThemeSwitch },
  template: `
    <div class="profile-page">
      <div class="page-container">
        <div v-if="!isLoggedIn" class="empty-state">
          <div class="empty-icon">👤</div>
          <div class="empty-text">请先登录</div>
          <el-button type="primary" @click="Router.navigate('/login')">去登录</el-button>
        </div>

        <template v-else>
          <div class="detail-header" style="align-items: center;">
            <div class="user-avatar" style="width: 80px; height: 80px; font-size: 36px; background: var(--primary-color); color: white;">
              {{ user.nickname ? user.nickname[0] : '?' }}
            </div>
            <div class="detail-info" style="margin-left: 20px;">
              <h2 class="detail-title" style="margin-bottom: 8px;">
                {{ user.nickname || user.username }}
              </h2>
              <div class="detail-meta">
                <span class="meta-item">
                  <el-icon><user /></el-icon>
                  {{ user.username }}
                </span>
                <span v-if="user.email" class="meta-item">
                  <el-icon><message /></el-icon>
                  {{ user.email }}
                </span>
              </div>
            </div>
          </div>

          <el-card style="margin-top: 20px;">
            <template #header>
              <strong>个人资料</strong>
            </template>
            <el-form :model="form" label-position="top">
              <el-form-item label="昵称">
                <el-input v-model="form.nickname" placeholder="请输入昵称" />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="form.email" placeholder="请输入邮箱" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="updateProfile" :loading="updating">
                  保存修改
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <el-card style="margin-top: 20px;">
            <template #header>
              <strong>修改密码</strong>
            </template>
            <el-form :model="passwordForm" label-position="top">
              <el-form-item label="原密码">
                <el-input v-model="passwordForm.old_password" type="password" show-password />
              </el-form-item>
              <el-form-item label="新密码">
                <el-input v-model="passwordForm.new_password" type="password" show-password />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="changePassword" :loading="changingPassword">
                  修改密码
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <el-card style="margin-top: 20px;">
            <template #header>
              <strong>我的评论</strong>
            </template>
            <div v-if="commentsLoading" class="loading-spinner">
              <el-icon class="is-loading" :size="20"><loading /></el-icon>
            </div>
            <div v-else-if="myComments.length > 0">
              <div
                v-for="comment in myComments"
                :key="comment.id"
                class="comment-item"
                style="margin-bottom: 12px;"
              >
                <div class="comment-content" style="margin-bottom: 4px;">{{ comment.content }}</div>
                <div class="comment-meta" style="font-size: 12px; color: var(--text-dark-tertiary);">
                  {{ formatTime(comment.created_at) }}
                </div>
              </div>
            </div>
            <div v-else class="empty-state" style="padding: 20px;">
              <div class="empty-text">暂无评论</div>
            </div>
          </el-card>

          <div style="margin-top: 20px; text-align: center;">
            <el-button type="danger" @click="logout">退出登录</el-button>
          </div>
        </template>
      </div>
    </div>
  `,
  data() {
    return {
      user: null,
      isLoggedIn: false,
      form: {
        nickname: '',
        email: ''
      },
      updating: false,
      passwordForm: {
        old_password: '',
        new_password: ''
      },
      changingPassword: false,
      myComments: [],
      commentsLoading: false
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
      this.user = Storage.getUser();
      this.form.nickname = this.user ? this.user.nickname : '';
      this.form.email = this.user ? (this.user.email || '') : '';
      this.loadMyComments();
    }
  },
  methods: {
    async loadMyComments() {
      this.commentsLoading = true;
      const res = await ApiService.getMyComments({ page: 1, page_size: 20 });
      if (res.code === 0 && res.data) {
        this.myComments = res.data.items || [];
      }
      this.commentsLoading = false;
    },
    async updateProfile() {
      this.updating = true;
      const res = await ApiService.updateProfile({
        nickname: this.form.nickname,
        email: this.form.email
      });
      if (res.code === 0 && res.data) {
        Storage.setUser(res.data);
        this.user = res.data;
        ElementPlus.ElMessage.success('修改成功');
      } else {
        ElementPlus.ElMessage.error(res.msg || '修改失败');
      }
      this.updating = false;
    },
    async changePassword() {
      if (!this.passwordForm.old_password || !this.passwordForm.new_password) {
        ElementPlus.ElMessage.warning('请填写完整');
        return;
      }
      if (this.passwordForm.new_password.length < 6) {
        ElementPlus.ElMessage.warning('新密码至少6位');
        return;
      }
      this.changingPassword = true;
      const res = await ApiService.changePassword(
        this.passwordForm.old_password,
        this.passwordForm.new_password
      );
      if (res.code === 0) {
        ElementPlus.ElMessage.success('密码修改成功，请重新登录');
        this.passwordForm = { old_password: '', new_password: '' };
        setTimeout(() => {
          Storage.removeToken();
          Storage.removeUser();
          Router.navigate('/login');
        }, 1500);
      } else {
        ElementPlus.ElMessage.error(res.msg || '修改失败');
      }
      this.changingPassword = false;
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
    },
    formatTime(time) {
      if (!time) return '';
      const date = new Date(time);
      return date.toLocaleString();
    }
  }
};