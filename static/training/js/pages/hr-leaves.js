var _v = VueApi; var ref = _v.ref, reactive = _v.reactive, computed = _v.computed, onMounted = _v.onMounted, watch = _v.watch;
window.HrLeavesPage = {
    setup() {
        requireRole('hr');
        const requests = ref([]);
        const loading = ref(false);
        const filterStatus = ref('pending');

        const loadData = async () => {
            loading.value = true;
            try {
                const res = await Api.getLeaveRequests(filterStatus.value);
                if (res.code === 0) {
                    requests.value = res.data || [];
                }
            } finally {
                loading.value = false;
            }
        };

        const approve = async (req) => {
            if (!confirm(`确定批准 ${req.employee_name} 的请假申请吗？`)) return;
            const res = await Api.approveLeave(req.id);
            if (res.code === 0) {
                GlobalStore.addToast('success', '操作成功', '已批准请假');
                loadData();
            } else {
                GlobalStore.addToast('error', '操作失败', res.message || '操作失败');
            }
        };

        const reject = async (req) => {
            if (!confirm(`确定拒绝 ${req.employee_name} 的请假申请吗？`)) return;
            const res = await Api.rejectLeave(req.id);
            if (res.code === 0) {
                GlobalStore.addToast('success', '操作成功', '已拒绝请假');
                loadData();
            } else {
                GlobalStore.addToast('error', '操作失败', res.message || '操作失败');
            }
        };

        watch(filterStatus, () => {
            loadData();
        });

        onMounted(() => {
            loadData();
        });

        return {
            requests, loading, filterStatus, approve, reject, Utils,
            toasts: GlobalStore.toasts, removeToast: GlobalStore.removeToast.bind(GlobalStore), formatDate: formatDate, formatDateTime: formatDateTime
        };
    },
    template: `
        <LayoutWrapper title="请假审批" active-menu="hr-leaves" role="hr">
            <div style="display:flex;gap:8px;margin-bottom:20px;">
                <button class="btn" :class="filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'" @click="filterStatus = 'pending'">待审批</button>
                <button class="btn" :class="filterStatus === 'approved' ? 'btn-primary' : 'btn-secondary'" @click="filterStatus = 'approved'">已批准</button>
                <button class="btn" :class="filterStatus === 'rejected' ? 'btn-primary' : 'btn-secondary'" @click="filterStatus = 'rejected'">已拒绝</button>
                <button class="btn" :class="!filterStatus ? 'btn-primary' : 'btn-secondary'" @click="filterStatus = ''">全部</button>
            </div>

            <div v-if="loading" class="empty-state">
                <div class="empty-icon">⏳</div>
                <p>加载中...</p>
            </div>

            <div v-else-if="requests.length === 0" class="empty-state">
                <div class="empty-icon">📋</div>
                <p>暂无{{ filterStatus === 'pending' ? '待审批的' : filterStatus === 'approved' ? '已批准的' : filterStatus === 'rejected' ? '已拒绝的' : '' }}请假申请</p>
            </div>

            <div v-else style="display:flex;flex-direction:column;gap:16px;">
                <div v-for="req in requests" :key="req.id" class="card" style="padding:20px;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                                <div class="user-avatar" style="width:48px;height:48px;font-size:18px;">{{ req.employee_name?.charAt(0) }}</div>
                                <div>
                                    <div style="font-size:16px;font-weight:600;">{{ req.employee_name }}</div>
                                    <div style="color:#718096;font-size:13px;">{{ req.emp_no }} · {{ req.department }}</div>
                                </div>
                                <span class="status-badge" :class="'status-' + (req.status === 'pending' ? 'pending' : req.status === 'approved' ? 'completed' : 'leave')">
                                    {{ Utils.getLeaveStatusText(req.status) }}
                                </span>
                            </div>
                            <div style="margin-bottom:12px;">
                                <div style="color:#4a5568;margin-bottom:4px;"><strong>请假课程：</strong>{{ req.course_title }}</div>
                                <div style="color:#4a5568;"><strong>培训时间：</strong>{{ Utils.formatDate(req.course_datetime) }}</div>
                            </div>
                            <div class="leave-reason">
                                <strong>请假理由：</strong>{{ req.reason }}
                            </div>
                            <div style="color:#a0aec0;font-size:12px;margin-top:8px;">
                                申请时间：{{ Utils.formatDate(req.created_at) }}
                            </div>
                        </div>
                        <div v-if="req.status === 'pending'" style="display:flex;gap:8px;flex-shrink:0;">
                            <button class="btn btn-success" @click="approve(req)">批准</button>
                            <button class="btn btn-danger" @click="reject(req)">拒绝</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="toast-container">
                <transition-group name="toast">
                    <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type" @click="removeToast(t.id)">
                        <div class="toast-icon"><span v-if="t.type==='success'">✅</span><span v-else-if="t.type==='error'">❌</span><span v-else-if="t.type==='warning'">⚠️</span><span v-else>ℹ️</span></div>
                        <div class="toast-content"><div class="toast-title">{{ t.title }}</div><div v-if="t.message" class="toast-message">{{ t.message }}</div></div>
                        <div class="toast-close">×</div>
                    </div>
                </transition-group>
            </div>
        </LayoutWrapper>
    `
};
