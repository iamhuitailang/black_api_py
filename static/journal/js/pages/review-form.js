const ReviewForm = {
    props: {
        assignmentId: { type: Number, required: true }
    },
    data() {
        return {
            loading: false,
            submitting: false,
            assignment: null,
            manuscript: null,
            form: {
                recommendation: '',
                originality_score: 7,
                scientific_score: 7,
                language_score: 7,
                overall_score: 7,
                comment_to_author: '',
                comment_to_editor: ''
            },
            recommendations: [
                { value: 'accept', label: '录用', desc: '无需修改可直接录用发表', class: 'badge-success' },
                { value: 'minor_revision', label: '小修', desc: '需做较小修改后可录用', class: 'badge-warning' },
                { value: 'major_revision', label: '大修', desc: '需做重大修改后再审', class: 'badge-warning' },
                { value: 'reject', label: '退稿', desc: '不适合本刊发表', class: 'badge-danger' }
            ]
        };
    },
    methods: {
        async loadData() {
            this.loading = true;
            try {
                const tasksRes = await JournalService.getReviewTasks(null, 1, 100);
                if (tasksRes.code === 0 && tasksRes.data && tasksRes.data.items) {
                    const task = tasksRes.data.items.find(t => t.assignment && t.assignment.id === this.assignmentId);
                    if (task) {
                        this.assignment = task.assignment;
                        this.manuscript = task.manuscript;
                        if (task.review) {
                            this.form = {
                                recommendation: task.review.recommendation || '',
                                originality_score: task.review.originality_score || 7,
                                scientific_score: task.review.scientific_score || 7,
                                language_score: task.review.language_score || 7,
                                overall_score: task.review.overall_score || 7,
                                comment_to_author: task.review.comment_to_author || '',
                                comment_to_editor: task.review.comment_to_editor || ''
                            };
                        }
                    }
                }
            } finally {
                this.loading = false;
            }
        },
        updateSliderBackground(key) {
            this.$nextTick(() => {
                const el = this.$refs[key];
                if (el) {
                    const val = parseInt(this.form[key]) || 1;
                    const percent = ((val - 1) / 9) * 100;
                    el.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${percent}%, var(--border-color) ${percent}%, var(--border-color) 100%)`;
                }
            });
        },
        validate() {
            if (!this.form.recommendation) {
                Toast.warning('请选择审稿建议');
                return false;
            }
            if (!this.form.comment_to_author.trim()) {
                Toast.warning('请填写给作者的审稿意见');
                return false;
            }
            return true;
        },
        async handleSubmit() {
            if (!this.validate()) return;
            this.submitting = true;
            try {
                const res = await JournalService.submitReview({
                    assignment_id: this.assignmentId,
                    ...this.form
                });
                if (res.code === 0) {
                    Toast.success('审稿意见提交成功');
                    this.$emit('submitted');
                } else {
                    Toast.error(res.message || '提交失败');
                }
            } finally {
                this.submitting = false;
            }
        }
    },
    mounted() {
        this.loadData();
    },
    watch: {
        'form.originality_score'() { this.updateSliderBackground('originalitySlider'); },
        'form.scientific_score'() { this.updateSliderBackground('scientificSlider'); },
        'form.language_score'() { this.updateSliderBackground('languageSlider'); },
        'form.overall_score'() { this.updateSliderBackground('overallSlider'); }
    },
    template: `
        <div style="display:flex;flex-direction:column;max-height:90vh;">
            <div class="modal-header">
                <div>
                    <div class="modal-title">🔬 填写审稿意见</div>
                    <div class="card-subtitle" style="margin-top:4px;" v-if="manuscript">{{ manuscript.title }}</div>
                </div>
                <button class="modal-close" @click="$emit('close')">×</button>
            </div>

            <div class="modal-body">
                <div v-if="loading" class="loading-page">
                    <div class="spinner"></div>
                </div>

                <div v-else-if="!manuscript" class="text-center py-6 text-muted">
                    无法加载稿件信息
                </div>

                <div v-else>
                    <div class="card mb-4" style="border:1px solid var(--border-color);">
                        <div class="card-body" style="padding:16px;">
                            <div class="flex justify-between items-start gap-4">
                                <div style="flex:1;">
                                    <div class="form-label" style="margin-bottom:4px;">📄 稿件</div>
                                    <div style="font-weight:500;margin-bottom:8px;">{{ manuscript.title }}</div>
                                    <div class="text-muted" style="font-size:13px;">
                                        作者: {{ manuscript.author_name || '—' }} · 提交时间: {{ $helpers.formatDate(manuscript.submitted_at) }}
                                    </div>
                                </div>
                                <a v-if="manuscript.file_path" :href="manuscript.file_path" target="_blank" class="btn btn-sm btn-outline">
                                    📎 下载正文
                                </a>
                            </div>
                            <div v-if="manuscript.abstract" style="margin-top:12px;">
                                <div class="form-label" style="margin-bottom:4px;">摘要</div>
                                <div class="detail-block" style="max-height:120px;overflow:auto;">{{ manuscript.abstract }}</div>
                            </div>
                            <div v-if="manuscript.keywords" style="margin-top:8px;" class="text-muted text-sm">
                                关键词: {{ manuscript.keywords }}
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <div class="detail-section-title">📊 评分项 (1-10分)</div>
                    </div>

                    <div class="form-group">
                        <div class="flex-between mb-1">
                            <label class="form-label" style="margin:0;">原创性评分</label>
                            <span style="font-weight:600;color:var(--primary-color);font-size:16px;">{{ form.originality_score }}</span>
                        </div>
                        <input
                            ref="originalitySlider"
                            type="range" min="1" max="10" step="1"
                            v-model="form.originality_score"
                            class="range-slider" />
                        <div class="flex justify-between text-xs text-muted" style="margin-top:4px;">
                            <span>1 很低</span><span>5 一般</span><span>10 极高</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="flex-between mb-1">
                            <label class="form-label" style="margin:0;">科学性评分</label>
                            <span style="font-weight:600;color:var(--primary-color);font-size:16px;">{{ form.scientific_score }}</span>
                        </div>
                        <input
                            ref="scientificSlider"
                            type="range" min="1" max="10" step="1"
                            v-model="form.scientific_score"
                            class="range-slider" />
                    </div>

                    <div class="form-group">
                        <div class="flex-between mb-1">
                            <label class="form-label" style="margin:0;">语言质量评分</label>
                            <span style="font-weight:600;color:var(--primary-color);font-size:16px;">{{ form.language_score }}</span>
                        </div>
                        <input
                            ref="languageSlider"
                            type="range" min="1" max="10" step="1"
                            v-model="form.language_score"
                            class="range-slider" />
                    </div>

                    <div class="form-group">
                        <div class="flex-between mb-1">
                            <label class="form-label" style="margin:0;">综合评分</label>
                            <span style="font-weight:600;color:var(--primary-color);font-size:16px;">{{ form.overall_score }}</span>
                        </div>
                        <input
                            ref="overallSlider"
                            type="range" min="1" max="10" step="1"
                            v-model="form.overall_score"
                            class="range-slider" />
                    </div>

                    <div class="detail-section mt-6">
                        <div class="detail-section-title">🎯 审稿建议 <span class="text-danger" style="font-size:12px;">* 必填</span></div>
                    </div>

                    <div class="form-group">
                        <div class="flex gap-3 flex-wrap">
                            <div
                                v-for="r in recommendations"
                                :key="r.value"
                                @click="form.recommendation = r.value"
                                style="flex:1;min-width:140px;padding:14px 16px;border:2px solid;border-radius:var(--radius);cursor:pointer;transition:var(--transition);"
                                :style="form.recommendation === r.value
                                    ? 'border-color:var(--primary-color);background:var(--primary-light);'
                                    : 'border-color:var(--border-color);'">
                                <div class="flex justify-between items-center mb-2">
                                    <span style="font-weight:600;">{{ r.label }}</span>
                                    <span class="badge" :class="r.class" style="font-size:11px;">{{ r.label }}</span>
                                </div>
                                <div class="text-xs" style="color:var(--text-muted);">{{ r.desc }}</div>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">给作者的审稿意见 <span class="required">*</span></label>
                        <textarea v-model="form.comment_to_author" class="form-control textarea-lg" rows="6"
                            placeholder="请详细描述审稿意见，包括创新点、不足之处、修改建议等..."></textarea>
                        <div class="form-hint text-right">{{ form.comment_to_author.length }} 字</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">给编辑的私密意见 <span class="text-muted" style="font-weight:400;">（仅编辑可见）</span></label>
                        <textarea v-model="form.comment_to_editor" class="form-control" rows="3"
                            placeholder="如需向编辑说明一些不适合让作者看到的内容，请在此填写..."></textarea>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" @click="$emit('close')">取消</button>
                <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting || loading">
                    <span v-if="submitting" class="spinner" style="margin-right:6px;"></span>
                    {{ submitting ? '提交中...' : '提交审稿意见' }}
                </button>
            </div>
        </div>
    `
};
