const AdminImagesPage = {
    template: `
    <div class="page has-header">
        <div class="header">
            <span class="header-back" @click="goBack">←</span>
            <span class="header-title">🖼️ 图片管理</span>
            <span></span>
        </div>

        <div class="section-title">关卡图片预览</div>

        <div v-if="loading" class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">加载中...</div></div>
        <div v-else-if="levels.length === 0" class="empty-state"><div class="empty-state-icon">🖼️</div><div class="empty-state-text">暂无关卡图片</div></div>
        <div v-else class="image-grid">
            <div class="image-card" v-for="level in levels" :key="level.id">
                <div class="image-card-header">
                    <span class="image-card-name">{{ level.name }}</span>
                    <span class="badge" :class="level.status === 0 ? 'badge-success' : 'badge-danger'">
                        {{ level.status === 0 ? '启用' : '禁用' }}
                    </span>
                </div>
                <div class="image-pair">
                    <div class="image-panel">
                        <div class="image-label">原图</div>
                        <div class="image-preview" :style="{ background: getThemeGradient(level.theme) }">
                            <span>{{ getThemeIcon(level.theme) }}</span>
                        </div>
                    </div>
                    <div class="image-panel">
                        <div class="image-label">修改图</div>
                        <div class="image-preview" :style="{ background: getThemeGradient(level.theme), filter: 'hue-rotate(15deg)' }">
                            <span>{{ getThemeIcon(level.theme) }}*</span>
                        </div>
                    </div>
                </div>
                <div class="image-card-footer">
                    <span>{{ level.difference_count || 0 }}处不同</span>
                    <button class="btn btn-sm btn-outline" @click="editImages(level)">管理不同点</button>
                </div>
            </div>
        </div>

        <div v-if="editingLevel" class="modal-overlay" @click.self="editingLevel = null">
            <div class="modal-content modal-lg">
                <h3>管理 {{ editingLevel.name }} 的不同点</h3>
                <p class="text-secondary mb-1">点击下方区域添加不同点标记</p>

                <div class="image-editor" ref="imageEditor" @click="addDiffOnEditor">
                    <div class="image-preview-lg" :style="{ background: getThemeGradient(editingLevel.theme) }">
                        <span class="editor-icon">{{ getThemeIcon(editingLevel.theme) }}</span>
                    </div>
                    <div class="diff-marker" v-for="(d, idx) in editorDiffs" :key="idx"
                         :style="{ left: d.x + 'px', top: d.y + 'px' }"
                         @click.stop="removeEditorDiff(idx)">
                        {{ idx + 1 }}
                    </div>
                </div>

                <div class="diff-list mt-1">
                    <div class="diff-item" v-for="(d, idx) in editorDiffs" :key="'e-'+idx">
                        <span>{{ idx + 1 }}. x:{{ Math.round(d.x) }} y:{{ Math.round(d.y) }}</span>
                        <button class="btn btn-sm btn-danger" @click="removeEditorDiff(idx)">删除</button>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn btn-outline" @click="editingLevel = null">取消</button>
                    <button class="btn btn-primary" @click="saveDiffs" :disabled="saving">
                        {{ saving ? '保存中...' : '保存不同点' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            levels: [],
            loading: false,
            editingLevel: null,
            editorDiffs: [],
            saving: false
        };
    },
    mounted() { this.loadLevels(); },
    methods: {
        async loadLevels() {
            this.loading = true;
            try {
                const result = await ZbtApi.get('/zbt/level/list/get', { page: 1, page_size: 50 });
                if (result.code === 0) {
                    this.levels = result.data.items;
                }
            } catch (e) { console.error(e); }
            finally { this.loading = false; }
        },
        getThemeIcon(theme) {
            const map = { nature: '🌿', city: '🏙️', food: '🍰' };
            return map[theme] || '🎨';
        },
        getThemeGradient(theme) {
            const map = {
                nature: 'linear-gradient(135deg, #2d6a4f, #52b788)',
                city: 'linear-gradient(135deg, #343a40, #6c757d)',
                food: 'linear-gradient(135deg, #e76f51, #f4a261)'
            };
            return map[theme] || map.nature;
        },
        async editImages(level) {
            this.editingLevel = level;
            try {
                const result = await ZbtApi.get('/zbt/level/differences/get', { level_id: level.id });
                if (result.code === 0) {
                    this.editorDiffs = result.data.map(d => ({
                        x: d.x, y: d.y, radius: d.radius || 25, description: d.description || ''
                    }));
                }
            } catch (e) { console.error(e); }
        },
        addDiffOnEditor(event) {
            const editor = this.$refs.imageEditor;
            if (!editor) return;
            const rect = editor.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.editorDiffs.push({ x: Math.round(x), y: Math.round(y), radius: 25, description: '' });
        },
        removeEditorDiff(idx) {
            this.editorDiffs.splice(idx, 1);
        },
        async saveDiffs() {
            if (!this.editingLevel) return;
            this.saving = true;
            try {
                await ZbtApi.post('/zbt/level/difference/delete', { level_id: this.editingLevel.id });
                for (const diff of this.editorDiffs) {
                    await ZbtApi.post('/zbt/level/difference/add', {
                        level_id: this.editingLevel.id,
                        ...diff
                    });
                }
                this.editingLevel = null;
                this.loadLevels();
            } catch (e) { console.error(e); }
            finally { this.saving = false; }
        },
        goBack() { ZbtRouter.navigate('/admin/dashboard'); }
    }
};
