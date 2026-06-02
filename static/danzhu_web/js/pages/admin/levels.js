const AdminLevelsPage = {
    template: `
        <div class="admin-levels">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h1 style="font-size: 24px;">🎮 关卡管理</h1>
                <button class="btn btn-primary" @click="showCreateModal = true">
                    + 新建关卡
                </button>
            </div>

            <div class="card">
                <div class="data-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>名称</th>
                                <th>难度</th>
                                <th>球数</th>
                                <th>目标分数</th>
                                <th>游玩次数</th>
                                <th>状态</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="level in levels" :key="level.id">
                                <td>{{ level.id }}</td>
                                <td>{{ level.name }}</td>
                                <td>
                                    <span :class="['badge', getDifficultyBadge(level.difficulty)]">
                                        {{ level.difficulty_text || level.difficulty }}
                                    </span>
                                </td>
                                <td>{{ level.ball_count }}</td>
                                <td>{{ (level.target_score || 0).toLocaleString() }}</td>
                                <td>{{ level.play_count || 0 }}</td>
                                <td>
                                    <span :class="['badge', level.status === 1 ? 'badge-success' : 'badge-warning']">
                                        {{ level.status_text || (level.status === 1 ? '已发布' : '草稿') }}
                                    </span>
                                </td>
                                <td>{{ formatDate(level.created_at) }}</td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-sm btn-primary" @click="editLevel(level)">
                                            编辑
                                        </button>
                                        <button class="btn btn-sm" 
                                                :class="level.status === 1 ? 'btn-outline' : 'btn-success'"
                                                @click="toggleStatus(level)">
                                            {{ level.status === 1 ? '下架' : '发布' }}
                                        </button>
                                        <button class="btn btn-sm btn-danger" @click="deleteLevel(level)">
                                            删除
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="levels.length === 0">
                                <td colspan="9">
                                    <div class="empty-state" style="padding: 40px;">
                                        <div class="empty-icon">🎮</div>
                                        <div class="empty-text">暂无关卡数据</div>
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
                        <h3 class="modal-title">{{ showCreateModal ? '新建关卡' : '编辑关卡' }}</h3>
                        <button class="modal-close" @click="closeModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">关卡名称</label>
                            <input type="text" class="form-input" v-model="form.name" placeholder="请输入关卡名称">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">难度</label>
                                <select class="form-select" v-model="form.difficulty">
                                    <option value="easy">简单</option>
                                    <option value="normal">普通</option>
                                    <option value="hard">困难</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">状态</label>
                                <select class="form-select" v-model="form.status">
                                    <option :value="0">草稿</option>
                                    <option :value="1">已发布</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">球数</label>
                                <input type="number" class="form-input" v-model.number="form.ball_count" min="1">
                            </div>
                            <div class="form-group">
                                <label class="form-label">目标分数</label>
                                <input type="number" class="form-input" v-model.number="form.target_score" min="0">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">重力</label>
                                <input type="number" class="form-input" v-model.number="form.gravity" step="0.1">
                            </div>
                            <div class="form-group">
                                <label class="form-label">摩擦力</label>
                                <input type="number" class="form-input" v-model.number="form.friction" step="0.01">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">描述</label>
                            <textarea class="form-textarea" v-model="form.description" placeholder="请输入关卡描述"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" @click="closeModal">取消</button>
                        <button class="btn btn-primary" @click="saveLevel" :disabled="saving">
                            {{ saving ? '保存中...' : '保存' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            levels: [],
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
                difficulty: 'normal',
                ball_count: 3,
                target_score: 10000,
                gravity: 0.3,
                friction: 0.995,
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
        await this.loadLevels();
    },
    methods: {
        async loadLevels() {
            try {
                const result = await API.level.getList({
                    page: this.page,
                    page_size: this.pageSize
                });
                if (result.code === 0 && result.data) {
                    this.levels = result.data.items || [];
                    this.total = result.data.total || 0;
                }
            } catch (e) {
                console.error(e);
            }
        },
        editLevel(level) {
            this.editingId = level.id;
            this.form = {
                name: level.name,
                description: level.description || '',
                difficulty: level.difficulty,
                ball_count: level.ball_count,
                target_score: level.target_score,
                gravity: level.gravity,
                friction: level.friction,
                status: level.status
            };
            this.showEditModal = true;
        },
        async saveLevel() {
            if (!this.form.name) {
                Toast.warning('请输入关卡名称');
                return;
            }

            this.saving = true;
            try {
                let result;
                if (this.showCreateModal) {
                    result = await API.level.create(this.form);
                } else {
                    result = await API.level.update(this.editingId, this.form);
                }

                if (result.code === 0) {
                    Toast.success('保存成功');
                    this.closeModal();
                    this.loadLevels();
                } else {
                    Toast.error(result.msg || '保存失败');
                }
            } catch (e) {
                Toast.error('保存失败');
            } finally {
                this.saving = false;
            }
        },
        async toggleStatus(level) {
            const newStatus = level.status === 1 ? 0 : 1;
            try {
                const result = await API.level.update(level.id, { status: newStatus });
                if (result.code === 0) {
                    Toast.success('操作成功');
                    this.loadLevels();
                } else {
                    Toast.error(result.msg || '操作失败');
                }
            } catch (e) {
                Toast.error('操作失败');
            }
        },
        async deleteLevel(level) {
            if (!confirm(`确定要删除关卡「${level.name}」吗？`)) {
                return;
            }

            try {
                const result = await API.level.delete(level.id);
                if (result.code === 0) {
                    Toast.success('删除成功');
                    this.loadLevels();
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
                difficulty: 'normal',
                ball_count: 3,
                target_score: 10000,
                gravity: 0.3,
                friction: 0.995,
                status: 0
            };
        },
        getDifficultyBadge(difficulty) {
            const badges = {
                easy: 'badge-success',
                normal: 'badge-primary',
                hard: 'badge-danger'
            };
            return badges[difficulty] || 'badge-warning';
        },
        formatDate(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-CN');
        },
        prevPage() {
            if (this.page > 1) {
                this.page--;
                this.loadLevels();
            }
        },
        nextPage() {
            if (this.page < this.totalPages) {
                this.page++;
                this.loadLevels();
            }
        },
        goToPage(p) {
            this.page = p;
            this.loadLevels();
        }
    }
};
