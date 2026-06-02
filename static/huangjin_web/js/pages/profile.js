const ProfilePage = {
    props: ['user', 'isAdmin'],
    template: `
    <div>
        <div class="page-header">
            <h2 class="page-title">👤 个人中心</h2>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div class="card">
                <h3 class="card-title">个人信息</h3>
                <div class="form-group">
                    <label>用户名</label>
                    <input :value="user?.username" disabled style="opacity:0.6;">
                </div>
                <div class="form-group">
                    <label>昵称</label>
                    <input v-model="profileForm.nickname" placeholder="修改昵称">
                </div>
                <div class="form-group">
                    <label>角色</label>
                    <input :value="user?.role_text || '玩家'" disabled style="opacity:0.6;">
                </div>
                <button class="btn btn-primary" @click="updateProfile" :disabled="saving">保存修改</button>
            </div>
            <div class="card">
                <h3 class="card-title">游戏数据</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">{{ user?.total_score || 0 }}</div>
                        <div class="stat-label">累计得分</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ user?.best_score || 0 }}</div>
                        <div class="stat-label">最高分</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ user?.total_games || 0 }}</div>
                        <div class="stat-label">游戏局数</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card mt-24">
            <h3 class="card-title">修改密码</h3>
            <div style="max-width:400px;">
                <div class="form-group">
                    <label>原密码</label>
                    <input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码">
                </div>
                <div class="form-group">
                    <label>新密码</label>
                    <input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码(至少6位)">
                </div>
                <button class="btn btn-warning" @click="changePassword" :disabled="saving">修改密码</button>
            </div>
        </div>
        <div class="card mt-24">
            <h3 class="card-title">游戏记录</h3>
            <div v-if="records.length === 0" class="empty-state">
                <p>暂无游戏记录</p>
            </div>
            <div v-else class="table-container">
                <table>
                    <thead><tr><th>时间</th><th>得分</th><th>时长</th><th>矿石数</th></tr></thead>
                    <tbody>
                        <tr v-for="r in records" :key="r.id">
                            <td>{{ formatDate(r.created_at) }}</td>
                            <td class="text-gold">{{ r.score }}</td>
                            <td>{{ r.duration }}s</td>
                            <td>{{ r.ore_count }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" v-if="totalPages > 1">
                <button :disabled="page <= 1" @click="loadRecords(page - 1)">上一页</button>
                <span class="page-info">{{ page }} / {{ totalPages }}</span>
                <button :disabled="page >= totalPages" @click="loadRecords(page + 1)">下一页</button>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            profileForm: { nickname: '' },
            passwordForm: { oldPassword: '', newPassword: '' },
            records: [],
            page: 1,
            totalPages: 1,
            saving: false
        };
    },
    mounted() {
        if (this.user) {
            this.profileForm.nickname = this.user.nickname || '';
        }
        this.loadRecords(1);
    },
    methods: {
        async updateProfile() {
            this.saving = true;
            const result = await Api.auth.updateProfile({ nickname: this.profileForm.nickname });
            if (result.code === 0) {
                const updatedUser = await Auth.refreshUser();
                if (updatedUser) this.$emit('score-updated');
                alert('保存成功');
            } else {
                alert(result.msg || '保存失败');
            }
            this.saving = false;
        },
        async changePassword() {
            if (!this.passwordForm.oldPassword || !this.passwordForm.newPassword) {
                alert('请填写完整');
                return;
            }
            this.saving = true;
            const result = await Api.auth.changePassword(this.passwordForm.oldPassword, this.passwordForm.newPassword);
            if (result.code === 0) {
                alert('密码修改成功，请重新登录');
                this.$emit('logout');
            } else {
                alert(result.msg || '修改失败');
            }
            this.saving = false;
        },
        async loadRecords(p) {
            const result = await Api.game.getRecords(p, 10);
            if (result.code === 0 && result.data) {
                this.records = result.data.items || [];
                this.page = result.data.page || 1;
                this.totalPages = result.data.total_pages || 1;
            }
        },
        formatDate(d) {
            if (!d) return '';
            return d.substring(0, 19).replace('T', ' ');
        }
    }
};
