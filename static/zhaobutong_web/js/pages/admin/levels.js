const AdminLevelsPage = {
    template: `
    <div class="page has-header">
        <div class="header">
            <span class="header-back" @click="goBack">←</span>
            <span class="header-title">🗺️ 关卡管理</span>
            <button class="header-action" @click="showCreate = true">+ 新建</button>
        </div>

        <div v-if="loading" class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">加载中...</div></div>
        <div v-else-if="levels.length === 0" class="empty-state"><div class="empty-state-icon">🗺️</div><div class="empty-state-text">暂无关卡</div></div>
        <div v-else class="admin-list">
            <div class="admin-level-item" v-for="level in levels" :key="level.id">
                <div class="admin-level-info">
                    <div class="admin-level-name">{{ level.name }}</div>
                    <div class="admin-level-meta">{{ level.theme_text }} · {{ level.difficulty_text }} · {{ level.difference_count }}处不同</div>
                    <div class="admin-level-status">
                        <span class="badge" :class="level.status === 0 ? 'badge-success' : 'badge-danger'">
                            {{ level.status === 0 ? '启用' : '禁用' }}
                        </span>
                    </div>
                </div>
                <div class="admin-level-actions">
                    <button class="btn btn-sm btn-outline" @click="toggleStatus(level)">
                        {{ level.status === 0 ? '禁用' : '启用' }}
                    </button>
                    <button class="btn btn-sm btn-primary" @click="editLevel(level)">编辑</button>
                    <button class="btn btn-sm btn-danger" @click="deleteLevel(level)">删除</button>
                </div>
            </div>
        </div>

        <div class="pagination" v-if="totalPages > 1">
            <button class="btn btn-sm btn-outline" :disabled="page <= 1" @click="page--">上一页</button>
            <span>{{ page }}/{{ totalPages }}</span>
            <button class="btn btn-sm btn-outline" :disabled="page >= totalPages" @click="page++">下一页</button>
        </div>

        <div v-if="showCreate || editLevelData" class="modal-overlay" @click.self="closeModal">
            <div class="modal-content modal-lg">
                <h3>{{ editLevelData ? '编辑关卡' : '新建关卡' }}</h3>
                <div class="form-group">
                    <label class="form-label">关卡名称</label>
                    <input type="text" class="form-control" v-model="levelForm.name" placeholder="如：自然风光-简单">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">主题</label>
                        <select class="form-control" v-model="levelForm.theme">
                            <option value="nature">自然风光</option>
                            <option value="city">城市建筑</option>
                            <option value="food">美食甜点</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">难度</label>
                        <select class="form-control" v-model="levelForm.difficulty">
                            <option :value="1">简单</option>
                            <option :value="2">中等</option>
                            <option :value="3">困难</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">时间限制(秒)</label>
                        <input type="number" class="form-control" v-model.number="levelForm.time_limit">
                    </div>
                    <div class="form-group">
                        <label class="form-label">提示次数</label>
                        <input type="number" class="form-control" v-model.number="levelForm.hint_count">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">不同点坐标 (点击添加)</label>
                    <div class="diff-list">
                        <div class="diff-item" v-for="(d, idx) in levelForm.differences" :key="idx">
                            <span>{{ idx + 1 }}. x:{{ d.x }} y:{{ d.y }} r:{{ d.radius }}</span>
                            <button class="btn btn-sm btn-danger" @click="removeDiff(idx)">删除</button>
                        </div>
                        <div class="diff-add">
                            <input type="number" v-model.number="newDiff.x" placeholder="X" class="form-control" style="width:60px;display:inline-block">
                            <input type="number" v-model.number="newDiff.y" placeholder="Y" class="form-control" style="width:60px;display:inline-block">
                            <input type="number" v-model.number="newDiff.radius" placeholder="R" class="form-control" style="width:60px;display:inline-block">
                            <button class="btn btn-sm btn-primary" @click="addDiff">添加</button>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
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
            loading: false,
            showCreate: false,
            editLevelData: null,
            saving: false,
            levelForm: {
                name: '', theme: 'nature', difficulty: 1, time_limit: 120,
                hint_count: 3, sort_order: 0, differences: []
            },
            newDiff: { x: 200, y: 150, radius: 25 }
        };
    },
    computed: {
        totalPages() { return Math.ceil(this.total / this.pageSize) || 1; }
    },
    mounted() { this.loadLevels(); },
    methods: {
        async loadLevels() {
            this.loading = true;
            try {
                const result = await ZbtApi.get('/zbt/level/list/get', { page: this.page, page_size: this.pageSize });
                if (result.code === 0) {
                    this.levels = result.data.items;
                    this.total = result.data.total;
                }
            } catch (e) { console.error(e); }
            finally { this.loading = false; }
        },
        async toggleStatus(level) {
            try {
                const newStatus = level.status === 0 ? 1 : 0;
                await ZbtApi.post('/zbt/level/status/update', { level_id: level.id, status: newStatus });
                this.loadLevels();
            } catch (e) { console.error(e); }
        },
        editLevel(level) {
            this.editLevelData = level;
            this.levelForm = {
                name: level.name,
                theme: level.theme,
                difficulty: level.difficulty,
                time_limit: level.time_limit,
                hint_count: level.hint_count,
                sort_order: level.sort_order,
                differences: []
            };
            this.loadLevelDiffs(level.id);
        },
        async loadLevelDiffs(levelId) {
            try {
                const result = await ZbtApi.get('/zbt/level/differences/get', { level_id: levelId });
                if (result.code === 0) {
                    this.levelForm.differences = result.data.map(d => ({
                        x: d.x, y: d.y, radius: d.radius, description: d.description || ''
                    }));
                }
            } catch (e) { console.error(e); }
        },
        async deleteLevel(level) {
            if (!confirm(`确定删除关卡 ${level.name}?`)) return;
            try {
                await ZbtApi.post('/zbt/level/delete', { level_id: level.id });
                this.loadLevels();
            } catch (e) { console.error(e); }
        },
        addDiff() {
            this.levelForm.differences.push({ ...this.newDiff });
        },
        removeDiff(idx) {
            this.levelForm.differences.splice(idx, 1);
        },
        async saveLevel() {
            if (!this.levelForm.name) { alert('请输入关卡名称'); return; }
            this.saving = true;
            try {
                if (this.editLevelData) {
                    await ZbtApi.post('/zbt/level/update', { ...this.levelForm, level_id: this.editLevelData.id });
                } else {
                    await ZbtApi.post('/zbt/level/create', this.levelForm);
                }
                this.closeModal();
                this.loadLevels();
            } catch (e) { console.error(e); }
            finally { this.saving = false; }
        },
        closeModal() {
            this.showCreate = false;
            this.editLevelData = null;
            this.levelForm = {
                name: '', theme: 'nature', difficulty: 1, time_limit: 120,
                hint_count: 3, sort_order: 0, differences: []
            };
        },
        goBack() { ZbtRouter.navigate('/admin/dashboard'); }
    },
    watch: {
        page() { this.loadLevels(); }
    }
};
