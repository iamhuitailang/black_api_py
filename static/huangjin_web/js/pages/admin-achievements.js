const AdminAchievementsPage = {
    props: ['user', 'isAdmin'],
    template: `
    <div>
        <div class="page-header">
            <h2 class="page-title">🎖️ 成就管理</h2>
            <button class="btn btn-primary" @click="showCreateModal">+ 新增成就</button>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead><tr><th>ID</th><th>名称</th><th>描述</th><th>类型</th><th>条件值</th><th>颜色</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr v-for="ach in achievements" :key="ach.id">
                            <td>{{ ach.id }}</td>
                            <td>{{ ach.name }}</td>
                            <td class="text-secondary" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ ach.description }}</td>
                            <td><span class="badge badge-info">{{ ach.condition_type_text }}</span></td>
                            <td>{{ ach.condition_value }}</td>
                            <td><span class="ore-sample" :style="{backgroundColor: ach.badge_color}"></span></td>
                            <td>{{ ach.sort_order }}</td>
                            <td><span :class="ach.status === 0 ? 'badge badge-success' : 'badge badge-danger'">{{ ach.status === 0 ? '启用' : '禁用' }}</span></td>
                            <td>
                                <div style="display:flex;gap:4px;">
                                    <button class="btn btn-secondary btn-sm" @click="editAchievement(ach)">编辑</button>
                                    <button class="btn btn-sm" :class="ach.status === 0 ? 'btn-warning' : 'btn-success'" @click="toggleStatus(ach.id)">{{ ach.status === 0 ? '禁用' : '启用' }}</button>
                                    <button class="btn btn-danger btn-sm" @click="deleteAchievement(ach.id)">删除</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination">
                <button :disabled="page <= 1" @click="loadData(page - 1)">上一页</button>
                <span class="page-info">{{ page }} / {{ totalPages || 1 }}</span>
                <button :disabled="page >= totalPages" @click="loadData(page + 1)">下一页</button>
            </div>
        </div>

        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="modal">
                <h3 class="modal-title">{{ editingAch ? '编辑成就' : '新增成就' }}</h3>
                <div class="form-group">
                    <label>名称</label>
                    <input v-model="form.name" placeholder="成就名称">
                </div>
                <div class="form-group">
                    <label>描述</label>
                    <textarea v-model="form.description" rows="2" placeholder="成就描述"></textarea>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="form-group">
                        <label>条件类型</label>
                        <select v-model="form.condition_type">
                            <option value="score">分数</option>
                            <option value="games">局数</option>
                            <option value="ore">矿石</option>
                            <option value="special">特殊</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>条件值</label>
                        <input v-model.number="form.condition_value" type="number" min="1">
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="form-group">
                        <label>徽章颜色</label>
                        <input v-model="form.badge_color" type="color">
                    </div>
                    <div class="form-group">
                        <label>排序</label>
                        <input v-model.number="form.sort_order" type="number">
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" @click="showModal = false">取消</button>
                    <button class="btn btn-primary" @click="saveAchievement" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            achievements: [],
            page: 1,
            totalPages: 1,
            showModal: false,
            editingAch: null,
            saving: false,
            form: { name: '', description: '', condition_type: 'score', condition_value: 100, badge_color: '#FFD700', sort_order: 0 }
        };
    },
    async mounted() {
        await this.loadData(1);
    },
    methods: {
        async loadData(p) {
            this.page = p;
            const result = await Api.achievement.getList(p, 10);
            if (result.code === 0 && result.data) {
                this.achievements = result.data.items || [];
                this.totalPages = result.data.total_pages || 1;
            }
        },
        showCreateModal() {
            this.editingAch = null;
            this.form = { name: '', description: '', condition_type: 'score', condition_value: 100, badge_color: '#FFD700', sort_order: 0 };
            this.showModal = true;
        },
        editAchievement(ach) {
            this.editingAch = ach;
            this.form = { name: ach.name, description: ach.description, condition_type: ach.condition_type, condition_value: ach.condition_value, badge_color: ach.badge_color, sort_order: ach.sort_order };
            this.showModal = true;
        },
        async saveAchievement() {
            this.saving = true;
            let result;
            if (this.editingAch) {
                result = await Api.achievement.update(this.editingAch.id, this.form);
            } else {
                result = await Api.achievement.create(this.form);
            }
            if (result.code === 0) {
                this.showModal = false;
                await this.loadData(this.page);
            } else {
                alert(result.msg || '操作失败');
            }
            this.saving = false;
        },
        async toggleStatus(achId) {
            const result = await Api.achievement.toggleStatus(achId);
            if (result.code === 0) await this.loadData(this.page);
            else alert(result.msg || '操作失败');
        },
        async deleteAchievement(achId) {
            if (!confirm('确定删除该成就？')) return;
            const result = await Api.achievement.delete(achId);
            if (result.code === 0) await this.loadData(this.page);
            else alert(result.msg || '操作失败');
        }
    }
};
