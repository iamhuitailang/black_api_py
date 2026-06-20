const ManuscriptDetailPage = {
    data() {
        return {
            loading: true,
            manuscript: null,
            roleInfo: Storage.getRoleInfo() || {},
            showAssignModal: false,
            showDecisionModal: false,
            showReviewModal: false,
            reviewers: [],
            formAssign: { reviewer_user_id: null },
            formDecision: { decision: '', comment: '' },
            selectedReviewAssignmentId: null,
            assignments: [],
            avgScore: null
        };
    },
    computed: {
        isEditor() {
            return this.roleInfo.is_editor || this.roleInfo.is_admin;
        },
        isReviewer() {
            return this.roleInfo.is_reviewer;
        },
        isAuthor() {
            const user = Storage.getUser();
            return this.manuscript && user && this.manuscript.author_user_id === user.id;
        },
        statusMap() {
            return {
                draft: { label: '草稿', class: 'badge-default' },
                submitted: { label: '待分配', class: 'badge-info' },
                under_review: { label: '审稿中', class: 'badge-warning' },
                review_completed: { label: '审稿完成', class: 'badge-primary' },
                accepted: { label: '已录用', class: 'badge-success' },
                revision_required: { label: '需修改', class: 'badge-warning' },
                rejected: { label: '已退稿', class: 'badge-danger' },
                published: { label: '已发表', class: 'badge-success' }
            };
        },
        recommendationMap() {
            return {
                accept: { label: '录用', class: 'badge-success' },
                minor_revision: { label: '小修', class: 'badge-warning' },
                major_revision: { label: '大修', class: 'badge-warning' },
                reject: { label: '退稿', class: 'badge-danger' }
            };
        },
        assignmentStatusMap() {
            return {
                pending: { label: '待接受', class: 'badge-warning' },
                accepted: { label: '审稿中', class: 'badge-info' },
                declined: { label: '已拒绝', class: 'badge-default' },
                completed: { label: '已完成', class: 'badge-success' }
            };
        },
        visibleReviews() {
            if (!this.manuscript || !this.manuscript.reviews) return [];
            if (this.isEditor) return this.manuscript.reviews;
            return this.manuscript.reviews.map(r => {
                const { comment_to_editor, ...rest } = r;
                return rest;
            });
        },
        canMakeDecision() {
            return this.isEditor && this.manuscript &&
                   this.manuscript.status === 'review_completed';
        },
        canAssignReviewer() {
            return this.isEditor && this.manuscript &&
                   ['submitted', 'under_review'].includes(this.manuscript.status);
        },
        myAssignment() {
            if (!this.isReviewer || !this.assignments.length) return null;
            const user = Storage.getUser();
            return this.assignments.find(a => a.reviewer_user_id === user.id);
        },
        canSubmitReview() {
            if (!this.myAssignment) return false;
            return ['pending', 'accepted'].includes(this.myAssignment.status);
        }
    },
    methods: {
        async loadData() {
            this.loading = true;
            try {
                const id = this.$route.params.id;
                const res = await JournalService.getManuscriptDetail(id);
                if (res.code === 0 && res.data) {
                    this.manuscript = res.data;
                    this.avgScore = res.data.avg_score;
                    this.assignments = res.data.assignments || [];
                } else {
                    Toast.error(res.message || '加载失败');
                    setTimeout(() => this.$root.navigateTo('submissions'), 1000);
                }
            } finally {
                this.loading = false;
            }
        },
        async loadReviewers() {
            const res = await JournalService.getReviewerList();
            if (res.code === 0 && res.data) {
                const user = Storage.getUser();
                this.reviewers = res.data.filter(r => r.user_id !== user.id);
            }
        },
        openAssignModal() {
            this.loadReviewers();
            this.formAssign.reviewer_user_id = null;
            this.showAssignModal = true;
        },
        async handleAssign() {
            if (!this.formAssign.reviewer_user_id) {
                Toast.warning('请选择审稿人');
                return;
            }
            const res = await JournalService.assignReviewer(
                this.manuscript.id,
                parseInt(this.formAssign.reviewer_user_id)
            );
            if (res.code === 0) {
                Toast.success('分配成功');
                this.showAssignModal = false;
                this.loadData();
            } else {
                Toast.error(res.message || '分配失败');
            }
        },
        async handleRemoveAssignment(id) {
            if (!confirm('确定撤销该审稿分配？')) return;
            const res = await JournalService.removeAssignment(id);
            if (res.code === 0) {
                Toast.success('已撤销');
                this.loadData();
            } else {
                Toast.error(res.message || '操作失败');
            }
        },
        openDecisionModal() {
            this.formDecision = { decision: '', comment: this.manuscript.editor_comment || '' };
            this.showDecisionModal = true;
        },
        async handleDecision() {
            if (!this.formDecision.decision) {
                Toast.warning('请选择决定');
                return;
            }
            if (this.formDecision.decision !== 'rejected' && !this.formDecision.comment.trim()) {
                Toast.warning('请填写编辑意见');
                return;
            }
            const res = await JournalService.makeEditorDecision(
                this.manuscript.id,
                this.formDecision.decision,
                this.formDecision.comment
            );
            if (res.code === 0) {
                Toast.success('决定已发布');
                this.showDecisionModal = false;
                this.loadData();
            } else {
                Toast.error(res.message || '操作失败');
            }
        },
        async handleMarkPublished() {
            if (!confirm('确定将该稿件标记为已发表？')) return;
            const res = await JournalService.markAsPublished(this.manuscript.id);
            if (res.code === 0) {
                Toast.success('已标记为发表');
                this.loadData();
            } else {
                Toast.error(res.message || '操作失败');
            }
        },
        async handleBackRevision() {
            if (!confirm('确定将此需修改稿件退回给作者重新编辑？')) return;
            const res = await JournalService.sendBackRevision(this.manuscript.id);
            if (res.code === 0) {
                Toast.success('已退回作者修改');
                this.loadData();
            } else {
                Toast.error(res.message || '操作失败');
            }
        },
        openReviewModal(assignmentId) {
            this.selectedReviewAssignmentId = assignmentId;
            this.showReviewModal = true;
        },
        async handleAcceptAssignment() {
            if (!this.myAssignment) return;
            const res = await JournalService.acceptAssignment(this.myAssignment.id);
            if (res.code === 0) {
                Toast.success('已接受审稿任务');
                this.loadData();
            } else {
                Toast.error(res.message || '操作失败');
            }
        },
        async handleDeclineAssignment() {
            if (!confirm('确定拒绝此审稿任务？')) return;
            if (!this.myAssignment) return;
            const res = await JournalService.declineAssignment(this.myAssignment.id);
            if (res.code === 0) {
                Toast.success('已拒绝');
                this.loadData();
            } else {
                Toast.error(res.message || '操作失败');
            }
        },
        goBack() {
            this.$root.navigateTo(this.isEditor ? 'all-manuscripts' : 'submissions');
        }
    },
    mounted() {
        this.loadData();
    },
    template: `
        <div class="page-container">
            <div v-if="loading" class="loading-page">
                <div class="spinner"></div>
            </div>

            <div v-if="manuscript && !loading">
                <div class="page-header flex justify-between items-center">
                    <div>
                        <button class="btn btn-secondary btn-sm mr-2" @click="goBack" style="margin-bottom:8px;">
                            ← 返回
                        </button>
                        <h1 class="page-title">📄 {{ manuscript.title }}</h1>
                        <p class="page-subtitle">
                            稿件编号: #{{ manuscript.id }} ·
                            <span class="badge" :class="statusMap[manuscript.status] ? statusMap[manuscript.status].class : 'badge-default'">
                                {{ statusMap[manuscript.status] ? statusMap[manuscript.status].label : manuscript.status }}
                            </span>
                        </p>
                    </div>
                    <div class="flex gap-2">
                        <template v-if="canAssignReviewer">
                            <button class="btn btn-primary" @click="openAssignModal">分配审稿人</button>
                        </template>
                        <template v-if="canMakeDecision">
                            <button class="btn btn-success" @click="openDecisionModal">编辑决定</button>
                        </template>
                        <template v-if="isEditor && manuscript.status === 'accepted'">
                            <button class="btn btn-info" @click="handleMarkPublished">标记发表</button>
                        </template>
                        <template v-if="isEditor && manuscript.status === 'revision_required'">
                            <button class="btn btn-warning" @click="handleBackRevision">退回修改</button>
                        </template>
                        <template v-if="canSubmitReview">
                            <button class="btn btn-primary" @click="myAssignment && openReviewModal(myAssignment.id)">填写审稿意见</button>
                        </template>
                        <template v-if="myAssignment && myAssignment.status === 'pending'">
                            <button class="btn btn-success" @click="handleAcceptAssignment">接受审稿</button>
                            <button class="btn btn-secondary" @click="handleDeclineAssignment">拒绝</button>
                        </template>
                    </div>
                </div>

                <progress-bar
                    :current-step="manuscript.current_step || 1"
                    :total-steps="manuscript.total_steps || 6"
                    :step-names="manuscript.step_names || []">
                </progress-bar>

                <div class="card mb-4">
                    <div class="card-body">
                        <div class="detail-section">
                            <div class="detail-section-title">基本信息</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-label">论文标题</div>
                                    <div class="detail-value">{{ manuscript.title }}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">栏目</div>
                                    <div class="detail-value">栏目 {{ manuscript.section_id }}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">关键词</div>
                                    <div class="detail-value">{{ manuscript.keywords || '—' }}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">提交时间</div>
                                    <div class="detail-value">{{ $helpers.formatDate(manuscript.submitted_at) }}</div>
                                </div>
                                <div class="detail-item" v-if="manuscript.decided_at">
                                    <div class="detail-label">决定时间</div>
                                    <div class="detail-value">{{ $helpers.formatDate(manuscript.decided_at) }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <div class="detail-section-title">摘要</div>
                            <div class="detail-block">{{ manuscript.abstract || '暂无摘要' }}</div>
                        </div>

                        <div class="detail-section">
                            <div class="detail-section-title">正文文件</div>
                            <div v-if="manuscript.file_path" class="file-item" style="max-width:500px;">
                                <div class="file-info">
                                    <div class="file-icon">{{ $helpers.getFileIcon(manuscript.file_name) }}</div>
                                    <div>
                                        <div class="file-name">{{ manuscript.file_name }}</div>
                                        <div class="text-muted" style="font-size:12px;margin-top:2px;">
                                            <a :href="manuscript.file_path" target="_blank" class="text-primary">📎 点击下载/预览</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-muted">未上传文件</div>
                        </div>

                        <div class="detail-section">
                            <div class="detail-section-title">作者信息</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-label">姓名</div>
                                    <div class="detail-value">{{ manuscript.author_name || '—' }}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">邮箱</div>
                                    <div class="detail-value">{{ manuscript.author_email || '—' }}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">电话</div>
                                    <div class="detail-value">{{ manuscript.author_phone || '—' }}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">单位</div>
                                    <div class="detail-value">{{ manuscript.author_affiliation || '—' }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="isEditor && assignments.length > 0" class="card mb-4">
                    <div class="card-header">
                        <div class="card-title">👥 审稿分配</div>
                        <button v-if="canAssignReviewer" class="btn btn-primary btn-sm" @click="openAssignModal">+ 添加审稿人</button>
                    </div>
                    <div class="card-body">
                        <div v-for="a in assignments" :key="a.id" class="assignment-item">
                            <div class="assignment-info">
                                <div class="assignment-avatar">{{ $helpers.getAvatar(a.reviewer_name) }}</div>
                                <div class="assignment-detail">
                                    <div class="assignment-name">{{ a.reviewer_name || ('用户#' + a.reviewer_user_id) }}</div>
                                    <div class="assignment-meta">
                                        分配时间: {{ $helpers.formatDate(a.assigned_at) }} ·
                                        <span class="badge" :class="assignmentStatusMap[a.status] ? assignmentStatusMap[a.status].class : 'badge-default'">
                                            {{ assignmentStatusMap[a.status] ? assignmentStatusMap[a.status].label : a.status }}
                                        </span>
                                        <template v-if="a.completed_at"> · 完成时间: {{ $helpers.formatDate(a.completed_at) }}</template>
                                    </div>
                                </div>
                            </div>
                            <div class="assignment-actions">
                                <button
                                    v-if="a.status !== 'completed' && a.status !== 'declined'"
                                    class="btn btn-sm btn-danger"
                                    @click="handleRemoveAssignment(a.id)">
                                    撤销
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="isEditor && avgScore" class="card mb-4">
                    <div class="card-header">
                        <div class="card-title">📊 综合评分</div>
                    </div>
                    <div class="card-body">
                        <div class="review-scores">
                            <div class="review-score-item">
                                <div class="review-score-label">原创性 (平均)</div>
                                <div class="review-score-value">{{ avgScore.avg_originality ? avgScore.avg_originality.toFixed(1) : '—' }}</div>
                            </div>
                            <div class="review-score-item">
                                <div class="review-score-label">科学性 (平均)</div>
                                <div class="review-score-value">{{ avgScore.avg_scientific ? avgScore.avg_scientific.toFixed(1) : '—' }}</div>
                            </div>
                            <div class="review-score-item">
                                <div class="review-score-label">语言质量 (平均)</div>
                                <div class="review-score-value">{{ avgScore.avg_language ? avgScore.avg_language.toFixed(1) : '—' }}</div>
                            </div>
                            <div class="review-score-item">
                                <div class="review-score-label">综合评分 (平均)</div>
                                <div class="review-score-value">{{ avgScore.avg_overall ? avgScore.avg_overall.toFixed(1) : '—' }}</div>
                            </div>
                        </div>
                        <div class="text-muted text-center mt-2" style="font-size:13px;">基于 {{ avgScore.review_count || 0 }} 份审稿意见</div>
                    </div>
                </div>

                <div v-if="visibleReviews && visibleReviews.length > 0" class="card mb-4">
                    <div class="card-header">
                        <div class="card-title">📝 审稿意见 ({{ visibleReviews.length }})</div>
                    </div>
                    <div class="card-body">
                        <div v-for="r in visibleReviews" :key="r.id" class="review-card">
                            <div class="review-header">
                                <div class="reviewer-info">
                                    <div class="reviewer-avatar">{{ $helpers.getAvatar(r.reviewer_name) }}</div>
                                    <div>
                                        <div class="reviewer-name">{{ isEditor ? (r.reviewer_name || '审稿人') : '审稿人意见' }}</div>
                                        <div class="reviewer-date">{{ $helpers.formatDate(r.created_at) }}</div>
                                    </div>
                                </div>
                                <span v-if="r.recommendation" class="badge" :class="recommendationMap[r.recommendation] ? recommendationMap[r.recommendation].class : 'badge-default'">
                                    {{ recommendationMap[r.recommendation] ? recommendationMap[r.recommendation].label : r.recommendation }}
                                </span>
                            </div>
                            <div class="review-scores">
                                <div class="review-score-item">
                                    <div class="review-score-label">原创性</div>
                                    <div class="review-score-value">{{ r.originality_score }}</div>
                                </div>
                                <div class="review-score-item">
                                    <div class="review-score-label">科学性</div>
                                    <div class="review-score-value">{{ r.scientific_score }}</div>
                                </div>
                                <div class="review-score-item">
                                    <div class="review-score-label">语言质量</div>
                                    <div class="review-score-value">{{ r.language_score }}</div>
                                </div>
                                <div class="review-score-item">
                                    <div class="review-score-label">综合评分</div>
                                    <div class="review-score-value">{{ r.overall_score }}</div>
                                </div>
                            </div>
                            <div class="review-comment-section">
                                <div class="review-comment-label">📄 给作者的意见</div>
                                <div class="review-comment-text">{{ r.comment_to_author }}</div>
                            </div>
                            <div v-if="r.comment_to_editor && isEditor" class="review-comment-section" style="margin-top:12px;">
                                <div class="review-comment-label">🔒 给编辑的私密意见</div>
                                <div class="review-comment-text" style="background:#fff7ed;">{{ r.comment_to_editor }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="manuscript.editor_decision" class="card">
                    <div class="card-header">
                        <div class="card-title">🎯 编辑决定</div>
                    </div>
                    <div class="card-body">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                            <span class="badge" :class="statusMap[manuscript.editor_decision] ? statusMap[manuscript.editor_decision].class : 'badge-default'" style="font-size:14px;padding:6px 14px;">
                                {{ manuscript.editor_decision_label || manuscript.editor_decision }}
                            </span>
                            <span class="text-muted" style="font-size:13px;">决定时间: {{ $helpers.formatDate(manuscript.decided_at) }}</span>
                        </div>
                        <div v-if="manuscript.editor_comment" class="detail-block">{{ manuscript.editor_comment }}</div>
                    </div>
                </div>
            </div>

            <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
                <div class="modal">
                    <div class="modal-header">
                        <div class="modal-title">分配审稿人</div>
                        <button class="modal-close" @click="showAssignModal = false">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">选择审稿人 <span class="required">*</span></label>
                            <select v-model="formAssign.reviewer_user_id" class="form-control">
                                <option value="">请选择审稿人</option>
                                <option v-for="r in reviewers" :key="r.user_id" :value="r.user_id">
                                    {{ r.real_name }} - {{ r.affiliation }} ({{ r.email || '' }})
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="showAssignModal = false">取消</button>
                        <button class="btn btn-primary" @click="handleAssign">确认分配</button>
                    </div>
                </div>
            </div>

            <div v-if="showDecisionModal" class="modal-overlay" @click.self="showDecisionModal = false">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <div class="modal-title">编辑最终决定</div>
                        <button class="modal-close" @click="showDecisionModal = false">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">决定 <span class="required">*</span></label>
                            <div class="flex gap-3" style="flex-wrap:wrap;">
                                <label class="flex items-center gap-2" style="cursor:pointer;">
                                    <input type="radio" v-model="formDecision.decision" value="accepted" /> 录用
                                </label>
                                <label class="flex items-center gap-2" style="cursor:pointer;">
                                    <input type="radio" v-model="formDecision.decision" value="revision_required" /> 需要修改
                                </label>
                                <label class="flex items-center gap-2" style="cursor:pointer;">
                                    <input type="radio" v-model="formDecision.decision" value="rejected" /> 退稿
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">编辑意见 <span v-if="formDecision.decision !== 'rejected'" class="required">*</span></label>
                            <textarea v-model="formDecision.comment" class="form-control textarea-lg" rows="5" placeholder="请详细说明编辑决定理由..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="showDecisionModal = false">取消</button>
                        <button class="btn btn-primary" @click="handleDecision">确认发布</button>
                    </div>
                </div>
            </div>

            <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false">
                <div class="modal modal-xl">
                    <review-form
                        :assignment-id="selectedReviewAssignmentId"
                        @close="showReviewModal = false"
                        @submitted="showReviewModal = false; loadData();">
                    </review-form>
                </div>
            </div>
        </div>
    `
};
