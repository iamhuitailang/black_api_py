const AdminOresPage = {
    props: ['user', 'isAdmin'],
    template: `
    <div>
        <div class="page-header">
            <h2 class="page-title">💎 矿石管理</h2>
            <button class="btn btn-primary" @click="showCreateModal">+ 新增矿石</button>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead><tr><th>ID</th><th>颜色</th><th>名称</th><th>价值</th><th>重量</th><th>稀有度</th><th>描述</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr v-for="ore in ores" :key="ore.id">
                            <td>{{ ore.id }}</td>
                            <td><span class="ore-sample" :style="{backgroundColor: ore.color}"></span></td>
                            <td>{{ ore.name }}</td>
                            <td class="text-gold">{{ ore.value }}</td>
                            <td>{{ ore.weight }}</td>
                            <td><span :class="'badge badge-' + ['common','uncommon','rare','epic','legendary'][ore.rarity]">{{ ore.rarity_text }}</span></td>
                            <td class="text-secondary" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ ore.description }}</td>
                            <td>{{ ore.sort_order }}</td>
                            <td><span :class="ore.status === 0 ? 'badge badge-success' : 'badge badge-danger'">{{ ore.status === 0 ? '启用' : '禁用' }}</span></td>
                            <td>
                                <div style="display:flex;gap:4px;">
                                    <button class="btn btn-secondary btn-sm" @click="editOre(ore)">编辑</button>
                                    <button class="btn btn-sm" :class="ore.status === 0 ? 'btn-warning' : 'btn-success'" @click="toggleStatus(ore.id)">{{ ore.status === 0 ? '禁用' : '启用' }}</button>
                                    <button class="btn btn-danger btn-sm" @click="deleteOre(ore.id)">删除</button>
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
                <h3 class="modal-title">{{ editingOre ? '编辑矿石' : '新增矿石' }}</h3>
                <div class="form-group">
                    <label>名称</label>
                    <input v-model="form.name" placeholder="矿石名称">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="form-group">
                        <label>价值(分)</label>
                        <input v-model.number="form.value" type="number" min="0">
                    </div>
                    <div class="form-group">
                        <label>重量</label>
                        <input v-model.number="form.weight" type="number" min="0.1" step="0.1">
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="form-group">
                        <label>颜色</label>
                        <input v-model="form.color" type="color">
                    </div>
                    <div class="form-group">
                        <label>稀有度</label>
                        <select v-model.number="form.rarity">
                            <option :value="0">普通</option>
                            <option :value="1">优秀</option>
                            <option :value="2">稀有</option>
                            <option :value="3">史诗</option>
                            <option :value="4">传说</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>描述</label>
                    <textarea v-model="form.description" rows="2" placeholder="矿石描述"></textarea>
                </div>
                <div class="form-group">
                    <label>排序</label>
                    <input v-model.number="form.sort_order" type="number">
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" @click="showModal = false">取消</button>
                    <button class="btn btn-primary" @click="saveOre" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            ores: [],
            page: 1,
            totalPages: 1,
            showModal: false,
            editingOre: null,
            saving: false,
            form: { name: '', value: 10, weight: 1.0, color: '#FFD700', rarity: 0, description: '', sort_order: 0 }
        };
    },
    async mounted() {
        await this.loadData(1);
    },
    methods: {
        async loadData(p) {
            this.page = p;
            const result = await Api.ore.getList(p, 10);
            if (result.code === 0 && result.data) {
                this.ores = result.data.items || [];
                this.totalPages = result.data.total_pages || 1;
            }
        },
        showCreateModal() {
            this.editingOre = null;
            this.form = { name: '', value: 10, weight: 1.0, color: '#FFD700', rarity: 0, description: '', sort_order: 0 };
            this.showModal = true;
        },
        editOre(ore) {
            this.editingOre = ore;
            this.form = { name: ore.name, value: ore.value, weight: ore.weight, color: ore.color, rarity: ore.rarity, description: ore.description, sort_order: ore.sort_order };
            this.showModal = true;
        },
        async saveOre() {
            this.saving = true;
            let result;
            if (this.editingOre) {
                result = await Api.ore.update(this.editingOre.id, this.form);
            } else {
                result = await Api.ore.create(this.form);
            }
            if (result.code === 0) {
                this.showModal = false;
                await this.loadData(this.page);
            } else {
                alert(result.msg || '操作失败');
            }
            this.saving = false;
        },
        async toggleStatus(oreId) {
            const result = await Api.ore.toggleStatus(oreId);
            if (result.code === 0) await this.loadData(this.page);
            else alert(result.msg || '操作失败');
        },
        async deleteOre(oreId) {
            if (!confirm('确定删除该矿石？')) return;
            const result = await Api.ore.delete(oreId);
            if (result.code === 0) await this.loadData(this.page);
            else alert(result.msg || '操作失败');
        }
    }
};
