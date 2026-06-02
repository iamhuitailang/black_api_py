const AdminItemsPage = {
    template: `
        <div class="admin-items">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h1 style="font-size: 24px;">⚡ 道具管理</h1>
                <button class="btn btn-primary" @click="showCreateModal = true">
                    + 新建道具
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
                                <th>颜色</th>
                                <th>半径</th>
                                <th>分数</th>
                                <th>连击加成</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in items" :key="item.id">
                                <td>{{ item.id }}</td>
                                <td>{{ item.name }}</td>
                                <td>
                                    <span class="badge badge-primary">{{ item.type_text || item.type }}</span>
                                </td>
                                <td>
                                    <span class="color-dot" :style="{ backgroundColor: item.color }"></span>
                                    {{ item.color }}
                                </td>
                                <td>{{ item.radius }}</td>
                                <td>{{ item.score_value }}</td>
                                <td>{{ item.combo_bonus }}</td>
                                <td>
                                    <span :class="['badge', item.status === 0 ? 'badge-success' : 'badge-danger']">
                                        {{ item.status_text || (item.status === 0 ? '启用' : '禁用') }}
                                    </span>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-sm btn-primary" @click="editItem(item)">
                                            编辑
                                        </button>
                                        <button class="btn btn-sm btn-danger" @click="deleteItem(item)">
                                            删除
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="items.length === 0">
                                <td colspan="9">
                                    <div class="empty-state" style="padding: 40px;">
                                        <div class="empty-icon">⚡</div>
                                        <div class="empty-text">暂无道具数据</div>
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
                        <h3 class="modal-title">{{ showCreateModal ? '新建道具' : '编辑道具' }}</h3>
                        <button class="modal-close" @click="closeModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">道具名称</label>
                            <input type="text" class="form-input" v-model="form.name" placeholder="请输入道具名称">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">类型</label>
                                <select class="form-select" v-model="form.type">
                                    <option value="bumper">弹射器</option>
                                    <option value="target">靶心</option>
                                    <option value="spinner">旋转器</option>
                                    <option value="ramp">坡道</option>
                                    <option value="hole">黑洞</option>
                                    <option value="multiball">多球奖励</option>
                                    <option value="bonus">双倍奖励</option>
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
                                <label class="form-label">颜色</label>
                                <input type="color" class="form-input" v-model="form.color" style="height: 42px; padding: 4px;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">半径</label>
                                <input type="number" class="form-input" v-model.number="form.radius" min="5" max="100">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">基础分数</label>
                                <input type="number" class="form-input" v-model.number="form.score_value" min="0">
                            </div>
                            <div class="form-group">
                                <label class="form-label">连击加成</label>
                                <input type="number" class="form-input" v-model.number="form.combo_bonus" min="0">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">描述</label>
                            <textarea class="form-textarea" v-model="form.description" placeholder="请输入道具描述"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" @click="closeModal">取消</button>
                        <button class="btn btn-primary" @click="saveItem" :disabled="saving">
                            {{ saving ? '保存中...' : '保存' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            items: [],
            page: 1,
            pageSize: 10,
            total: 0,
            showCreateModal: false,
            showEditModal: false,
            editingId: null,
            saving: false,
            form: {
                name: '',
                type: 'bumper',
                description: '',
                color: '#ff6b6b',
                radius: 25,
                score_value: 100,
                combo_bonus: 10,
                special_effect: '',
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
        await this.loadItems();
    },
    methods: {
        async loadItems() {
            try {
                const result = await API.item.getList({
                    page: this.page,
                    page_size: this.pageSize
                });
                if (result.code === 0 && result.data) {
                    this.items = result.data.items || [];
                    this.total = result.data.total || 0;
                }
            } catch (e) {
                console.error(e);
            }
        },
        editItem(item) {
            this.editingId = item.id;
            this.form = {
                name: item.name,
                type: item.type,
                description: item.description || '',
                color: item.color,
                radius: item.radius,
                score_value: item.score_value,
                combo_bonus: item.combo_bonus,
                special_effect: item.special_effect || '',
                status: item.status
            };
            this.showEditModal = true;
        },
        async saveItem() {
            if (!this.form.name) {
                Toast.warning('请输入道具名称');
                return;
            }

            this.saving = true;
            try {
                let result;
                if (this.showCreateModal) {
                    result = await API.item.create(this.form);
                } else {
                    result = await API.item.update(this.editingId, this.form);
                }

                if (result.code === 0) {
                    Toast.success('保存成功');
                    this.closeModal();
                    this.loadItems();
                } else {
                    Toast.error(result.msg || '保存失败');
                }
            } catch (e) {
                Toast.error('保存失败');
            } finally {
                this.saving = false;
            }
        },
        async deleteItem(item) {
            if (!confirm(`确定要删除道具「${item.name}」吗？`)) {
                return;
            }

            try {
                const result = await API.item.delete(item.id);
                if (result.code === 0) {
                    Toast.success('删除成功');
                    this.loadItems();
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
                type: 'bumper',
                description: '',
                color: '#ff6b6b',
                radius: 25,
                score_value: 100,
                combo_bonus: 10,
                special_effect: '',
                status: 0
            };
        },
        prevPage() {
            if (this.page > 1) {
                this.page--;
                this.loadItems();
            }
        },
        nextPage() {
            if (this.page < this.totalPages) {
                this.page++;
                this.loadItems();
            }
        },
        goToPage(p) {
            this.page = p;
            this.loadItems();
        }
    }
};
