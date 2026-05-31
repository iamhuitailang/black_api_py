const ProfilePage = {
    template: `
    <div>
        <div class="page-header"><h1 class="page-title">👤 个人中心</h1></div>
        <div class="card" style="max-width:600px">
            <div style="padding:24px">
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--border)">
                    <div style="width:64px;height:64px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:600">{{ (user?.nickname||'U').charAt(0) }}</div>
                    <div>
                        <div style="font-size:18px;font-weight:600">{{ user?.nickname || '用户' }}</div>
                        <div style="font-size:13px;color:var(--text-secondary)">@{{ user?.username }}</div>
                        <span class="badge badge-primary" style="margin-top:4px">{{ user?.role_text }}</span>
                    </div>
                </div>
                <form @submit.prevent="handleUpdateProfile">
                    <div class="form-group">
                        <label class="form-label">昵称</label>
                        <input v-model="profileForm.nickname" placeholder="请输入昵称">
                    </div>
                    <div class="form-group">
                        <label class="form-label">手机号</label>
                        <input v-model="profileForm.phone" placeholder="请输入手机号">
                    </div>
                    <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存修改' }}</button>
                </form>
                <div style="margin-top:32px;padding-top:24px;border-top:1px solid var(--border)">
                    <h3 style="font-size:15px;font-weight:600;margin-bottom:16px">修改密码</h3>
                    <form @submit.prevent="handleChangePassword">
                        <div class="form-group">
                            <label class="form-label">原密码</label>
                            <input v-model="passwordForm.old_password" type="password" placeholder="请输入原密码" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">新密码</label>
                            <input v-model="passwordForm.new_password" type="password" placeholder="至少6位" required>
                        </div>
                        <button type="submit" class="btn btn-warning" :disabled="changingPwd">{{ changingPwd ? '修改中...' : '修改密码' }}</button>
                    </form>
                </div>
                <div style="margin-top:32px;padding-top:24px;border-top:1px solid var(--border)">
                    <button class="btn btn-danger" @click="handleLogout">退出登录</button>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            user: null,
            profileForm: { nickname: '', phone: '' },
            passwordForm: { old_password: '', new_password: '' },
            saving: false, changingPwd: false
        };
    },
    mounted() {
        this.user = AuthService.getCurrentUser();
        if (this.user) { this.profileForm.nickname = this.user.nickname || ''; this.profileForm.phone = this.user.phone || ''; }
    },
    methods: {
        async handleUpdateProfile() {
            this.saving = true;
            try {
                const result = await AuthService.updateProfile(this.profileForm);
                if (result.code === 0) { this.user = result.data; this.$root.showToast('更新成功', 'success'); }
                else this.$root.showToast(result.msg || '更新失败', 'error');
            } finally { this.saving = false; }
        },
        async handleChangePassword() {
            this.changingPwd = true;
            try {
                const result = await AuthService.changePassword(this.passwordForm.old_password, this.passwordForm.new_password);
                if (result.code === 0) { this.$root.showToast('密码修改成功，请重新登录', 'success'); AuthService.logout(); this.$root.navigate('login'); }
                else this.$root.showToast(result.msg || '修改失败', 'error');
            } finally { this.changingPwd = false; }
        },
        async handleLogout() {
            if (!confirm('确定退出登录？')) return;
            await AuthService.logout();
            this.$root.navigate('login');
        }
    }
};
