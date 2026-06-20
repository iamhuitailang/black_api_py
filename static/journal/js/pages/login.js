const LoginPage = {
    data() {
        return {
            form: {
                username: '',
                password: ''
            },
            loading: false,
            error: ''
        };
    },
    methods: {
        async handleLogin() {
            this.error = '';
            if (!this.form.username.trim()) {
                this.error = '请输入用户名';
                return;
            }
            if (!this.form.password.trim()) {
                this.error = '请输入密码';
                return;
            }

            this.loading = true;
            try {
                const res = await JournalService.login(this.form.username.trim(), this.form.password);
                if (res.code === 0) {
                    Toast.success('登录成功');
                    const roleRes = await JournalService.getRoleInfo();
                    if (roleRes.code === 0 && roleRes.data) {
                        Storage.setRoleInfo(roleRes.data);
                    }
                    setTimeout(() => {
                        this.$root.navigateTo('home');
                    }, 300);
                } else {
                    this.error = res.message;
                    Toast.error(res.message);
                }
            } catch (err) {
                this.error = '登录失败，请重试';
                Toast.error('登录失败');
            } finally {
                this.loading = false;
            }
        },
        quickLogin(username, password) {
            this.form.username = username;
            this.form.password = password;
            this.handleLogin();
        }
    },
    template: `
        <div class="login-bg">
            <div class="login-card">
                <div class="login-header">
                    <div class="login-logo">📚</div>
                    <h1 class="login-title">期刊投稿审稿系统</h1>
                    <p class="login-subtitle">Journal Submission & Review System</p>
                </div>

                <div v-if="error" style="background:var(--danger-bg);color:var(--danger-color);padding:10px 14px;border-radius:var(--radius);margin-bottom:16px;font-size:13px;">
                    {{ error }}
                </div>

                <form @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input type="text" v-model="form.username" class="form-control" placeholder="请输入用户名" autocomplete="username" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input type="password" v-model="form.password" class="form-control" placeholder="请输入密码" autocomplete="current-password" />
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading">
                        <span v-if="loading" class="spinner" style="margin-right:8px;"></span>
                        {{ loading ? '登录中...' : '登 录' }}
                    </button>
                </form>

                <div class="login-tips">
                    <div style="margin-bottom:6px;font-weight:600;">测试账号（点击快速登录）：</div>
                    <div @click="quickLogin('author1','author123')" style="cursor:pointer;padding:3px 0;">👤 作者: author1 / author123</div>
                    <div @click="quickLogin('reviewer1','reviewer123')" style="cursor:pointer;padding:3px 0;">🔬 审稿人: reviewer1 / reviewer123</div>
                    <div @click="quickLogin('reviewer2','reviewer123')" style="cursor:pointer;padding:3px 0;">🔬 审稿人: reviewer2 / reviewer123</div>
                    <div @click="quickLogin('editor','editor123')" style="cursor:pointer;padding:3px 0;">✏️ 编辑: editor / editor123</div>
                    <div @click="quickLogin('admin','admin123')" style="cursor:pointer;padding:3px 0;">⚙️ 管理员: admin / admin123</div>
                </div>
            </div>
        </div>
    `
};
