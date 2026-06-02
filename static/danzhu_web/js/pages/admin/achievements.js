const AdminAchievementsPage = {
    template: `
        <div class="admin-achievements">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h1 style="font-size: 24px;">🏆 成就管理</h1>
                <button class="btn btn-primary" @click="showCreateModal = true">
                    + 新建成就
                </button>
            </div>

            <div class="card">
                <div class="data-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>名称</th>
                                <th>类型</th>
                                <th>条件类型</th>
                                <th>条件值</th>
                                <th>奖励积分</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="achievement in achievements" :key="achievement.id">
                                <td>{{ achievement.id }}</td>
                                <td>{{ achievement.name }}</td>
                                <td>
                                    <span class="badge badge-primary">{{ achievement.type_text || achievement.type }}</span>
                                </td>
                                <td>{{ achievement.condition_type }}</td>
                                <td>{{ achievement.condition_value }}</td>
                                <td>{{ achievement.reward_points }}</td>
                                <td>
                                    <span :class="['badge', achievement.status === 0 ? 'badge-success' : 'badge-danger']">
                                        {{ achievement.status_text || (achievement.status === 0 ? '启用' : '禁用') }}
                                    </span>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-sm btn-primary" @click="editAchievement(achievement)">
                                            编辑
                                        </button>
                                        <button class="btn btn-sm btn-danger" @click="deleteAchievement(achievement)">
                                            删除
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="achievements.length === 0">
                                <td colspan="8">
                                    <div class="empty-state" style="padding: 40px;">
                                        <div class="empty-icon">🏆</div>
                                        <div class="empty-text">暂无成就数据</div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination" v-if="totalPages > 1">
                    <button class="pagination-btn" :disabled="page === 1" @click="prevPage">
                        上一页
                    </button>
                    <span v-for="p in totalPages" :key="p"
                          :class="['pagination-btn', {active: p === page}]"
                          @click="goToPage(p)">
                        {{ p }}
                    </span>
                    <button class="pagination-btn" :disabled="page === totalPages" @click="nextPage">
                        下一页
                    </button>
                </div>
            </div>

            <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">{{ showCreateModal ? '新建成就' : '编辑成就' }}</h3>
                        <button class="modal-close" @click="closeModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">成就名称</label>
                            <input type="text" class="form-input" v-model="form.name" placeholder="请输入成就名称">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">类型</label>
                                <select class="form-select" v-model="form.type">
                                    <option value="score">得分</option>
                                    <option value="combo">连击</option>
                                    <option value="games">游戏次数</option>
                                    <option value="special">特殊</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">状态</label>
                                <select class="form-select" v-model="form.status">
                                    <option :value="0">启用</option>
                                    <option :value="1">禁用</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">条件类型</label>
                                <select class="form-select" v-model="form.condition_type">
                                    <option value="games_played">游戏次数</option>
                                    <option value="single_score">单局得分</option>
                                    <option value="total_score">总得分</option>
                                    <option value="max_combo">最大连击</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">条件值</label>
                                <input type="number" class="form-input" v-model.number="form.condition_value" min="0">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">奖励积分</label>
                            <input type="number" class="form-input" v-model.number="form.reward_points" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">描述</label>
                            <textarea class="form-textarea" v-model="form.description" placeholder="请输入成就描述"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" @click="closeModal">取消</button>
                        <button class="btn btn-primary" @click="saveAchievement" :disabled="saving">
                            {{ saving ? '保存中...' : '保存' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            achievements: [],
            page: 1,
            pageSize: 10,
            total: 0,
            showCreateModal: false,
            showEditModal: false,
            editingId: null,
            saving: false,
            form: {
                name: '',
                description: '',
                type: 'score',
                condition_type: 'single_score',
                condition_value: 1000,
                reward_points: 10,
                status: 0
            }
        };
    },
    computed: {
        totalPages() {
            return Math.ceil(this.total / this.pageSize);
        }
    },
    async mounted() {
        const admin = Auth.getAdmin();
        if (!admin) {
            Router.navigate('/login');
            return;
        }
        await this.loadAchievements();
    },
    methods: {
        async loadAchievements() {
            try {
                const result = await API.achievement.getList({
                    page: this.page,
                    page_size: this.pageSize
                });
                if (result.code === 0 && result.data) {
                    this.achievements = result.data.items || [];
                    this.total = result.data.total || 0;
                }
            } catch (e) {
                console.error(e);
            }
        },
        editAchievement(achievement) {
            this.editingId = achievement.id;
            this.form = {
                name: achievement.name,
                description: achievement.description || '',
                type: achievement.type,
                condition_type: achievement.condition_type,
                condition_value: achievement.condition_value,
                reward_points: achievement.reward_points,
                status: achievement.status
            };
            this.showEditModal = true;
        },
        async saveAchievement() {
            if (!this.form.name) {
                Toast.warning('请输入成就名称');
                return;
            }

            this.saving = true;
            try {
                let result;
                if (this.showCreateModal) {
                    result = await API.achievement.create(this.form);
                } else {
                    result = await API.achievement.update(this.editingId, this.form);
                }

                if (result.code === 0) {
                    Toast.success('保存成功');
                    this.closeModal();
                    this.loadAchievements();
                } else {
                    Toast.error(result.msg || '保存失败');
                }
            } catch (e) {
                Toast.error('保存失败');
            } finally {
                this.saving = false;
            }
        },
        async deleteAchievement(achievement) {
            if (!confirm(`确定要删除成就「${achievement.name}」吗？`)) {
                return;
            }

            try {
                const result = await API.achievement.delete(achievement.id);
                if (result.code === 0) {
                    Toast.success('删除成功');
                    this.loadAchievements();
                } else {
                    Toast.error(result.msg || '删除失败');
                }
            } catch (e) {
                Toast.error('删除失败');
            }
        },
        closeModal() {
            this.showCreateModal = false;
            this.showEditModal = false;
            this.editingId = null;
            this.resetForm();
        },
        resetForm() {
            this.form = {
                name: '',
                description: '',
                type: 'score',
                condition_type: 'single_score',
                condition_value: 1000,
                reward_points: 10,
                status: 0
            };
        },
        prevPage() {
            if (this.page > 1) {
                this.page--;
                this.loadAchievements();
            }
        },
        nextPage() {
            if (this.page < this.totalPages) {
                this.page++;
                this.loadAchievements();
            }
        },
        goToPage(p) {
            this.page = p;
            this.loadAchievements();
        }
    }
};
