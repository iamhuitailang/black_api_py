var _v = VueApi; var ref = _v.ref, reactive = _v.reactive, computed = _v.computed, onMounted = _v.onMounted, watch = _v.watch;
const EmpCoursesPage = {
    setup() {
        const courses = ref([]);
        const loading = ref(false);
        const showLeaveModal = ref(false);
        const selectedEnrollment = ref(null);
        const leaveReason = ref('');

        const loadData = async () => {
            loading.value = true;
            try {
                const user = GlobalStore.currentUser;
                if (user) {
                    const res = await Api.getEmployeeCourses(user.id);
                    if (res.code === 0) courses.value = res.data || [];
                }
            } finally {
                loading.value = false;
            }
        };

        const confirmAttendance = async (enrollment) => {
            const res = await Api.confirmEnrollment(enrollment.id);
            if (res.code === 0) {
                Utils.showToast('已确认参加', 'success');
                loadData();
            } else {
                Utils.showToast(res.message || '操作失败', 'error');
            }
        };

        const openLeaveModal = (enrollment) => {
            selectedEnrollment.value = enrollment;
            leaveReason.value = '';
            showLeaveModal.value = true;
        };

        const submitLeave = async () => {
            if (!leaveReason.value.trim()) {
                Utils.showToast('请填写请假理由', 'warning');
                return;
            }
            const res = await Api.requestLeave(selectedEnrollment.value.id, leaveReason.value);
            if (res.code === 0) {
                Utils.showToast('请假申请已提交', 'success');
                showLeaveModal.value = false;
                loadData();
            } else {
                Utils.showToast(res.message || '提交失败', 'error');
            }
        };

        onMounted(() => {
            loadData();
        });

        return {
            courses, loading, showLeaveModal, selectedEnrollment, leaveReason,
            confirmAttendance, openLeaveModal, submitLeave, Utils
        };
    },
    template: `
        <div>
            <div class="page-header">
                <div>
                    <h1 class="page-title">我的培训</h1>
                    <p class="page-subtitle">查看被安排的培训课程，确认参加或申请请假</p>
                </div>
            </div>

            <div v-if="loading" class="empty-state">
                <div class="empty-icon">⏳</div>
                <p>加载中...</p>
            </div>

            <div v-else-if="courses.length === 0" class="empty-state">
                <div class="empty-icon">📭</div>
                <p>暂无被安排的培训课程</p>
            </div>

            <div v-else class="courses-grid">
                <div v-for="c in courses" :key="c.id" class="calendar-card">
                    <div class="calendar-header">
                        <div class="calendar-date">
                            <div class="day">{{ Utils.getDay(c.datetime) }}</div>
                            <div class="month">{{ Utils.getMonth(c.datetime) }}</div>
                        </div>
                        <span class="calendar-badge">
                            <span class="status-badge" :class="Utils.getStatusClass(c.status)">{{ Utils.getStatusText(c.status) }}</span>
                        </span>
                    </div>
                    <div class="calendar-body">
                        <h3 class="course-title">{{ c.title }}</h3>
                        <div class="course-meta">
                            <div class="meta-item">
                                <span class="meta-icon">👨‍🏫</span>
                                {{ c.instructor || '待定' }}
                            </div>
                            <div class="meta-item">
                                <span class="meta-icon">🕐</span>
                                {{ Utils.formatDate(c.datetime) }}
                            </div>
                            <div class="meta-item" v-if="c.location">
                                <span class="meta-icon">📍</span>
                                {{ c.location }}
                            </div>
                            <div class="meta-item" v-if="c.link">
                                <span class="meta-icon">🔗</span>
                                <a :href="c.link" target="_blank" style="color:#3182ce;">点击进入线上培训</a>
                            </div>
                            <div class="meta-item" v-if="c.description">
                                <span class="meta-icon">📝</span>
                                {{ c.description }}
                            </div>
                        </div>
                        <div v-if="c.quiz_result" style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;">
                            <div style="font-size:13px;color:#4a5568;">
                                测评成绩：
                                <span :class="c.quiz_result.score >= 60 ? 'score-pass' : 'score-low'" style="font-weight:600;font-size:16px;">
                                    {{ c.quiz_result.score }}分
                                </span>
                            </div>
                        </div>
                        <div class="course-footer" style="margin-top:16px;">
                            <template v-if="c.status === 'pending'">
                                <button class="btn btn-success" @click="confirmAttendance(c)">确认参加</button>
                                <button class="btn btn-danger" @click="openLeaveModal(c)">申请请假</button>
                            </template>
                            <template v-else-if="c.status === 'confirmed'">
                                <span style="color:#38a169;font-size:13px;">✅ 您已确认参加，请准时签到</span>
                            </template>
                            <template v-else-if="c.status === 'leave'">
                                <span style="color:#e53e3e;font-size:13px;">📋 请假申请审批中</span>
                            </template>
                            <template v-else-if="c.status === 'checked_in'">
                                <span style="color:#38a169;font-size:13px;">✅ 已签到，请完成课后测评</span>
                            </template>
                            <template v-else-if="c.status === 'completed'">
                                <span style="color:#3182ce;font-size:13px;">🎉 培训已完成</span>
                            </template>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="showLeaveModal" class="modal-overlay show" @click.self="showLeaveModal = false">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">申请请假 - {{ selectedEnrollment?.title }}</h3>
                        <button class="modal-close" @click="showLeaveModal = false">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">请假理由 <span style="color:#e53e3e;">*</span></label>
                            <textarea class="form-control" v-model="leaveReason" placeholder="请详细说明请假原因..." style="min-height:120px;"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="showLeaveModal = false">取消</button>
                        <button class="btn btn-danger" @click="submitLeave">提交请假</button>
                    </div>
                </div>
            </div>
        </div>
    `
};

window.EmpCoursesPage = EmpCoursesPage;
