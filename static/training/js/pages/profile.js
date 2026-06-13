var _v = VueApi; var ref = _v.ref, reactive = _v.reactive, computed = _v.computed, onMounted = _v.onMounted, watch = _v.watch;
window.ProfilePage = {
    setup() {
        requireRole('employee');
        const profile = ref(null);
        const loading = ref(false);
        const hrViewMode = ref(false);
        const allEmployees = ref([]);
        const selectedEmployeeId = ref(null);

        const loadData = async () => {
            loading.value = true;
            try {
                const user = GlobalStore.currentUser;
                if (user) {
                    hrViewMode.value = user.role === 'hr';
                    if (hrViewMode.value) {
                        const empRes = await Api.getEmployees();
                        if (empRes.code === 0) allEmployees.value = (empRes.data || []).filter(e => e.role === 'employee');
                    }
                    const targetId = hrViewMode.value ? (selectedEmployeeId.value || user.id) : user.id;
                    if (targetId) {
                        const res = await Api.getEmployeeProfile(targetId);
                        if (res.code === 0) profile.value = res.data;
                    }
                }
            } finally {
                loading.value = false;
            }
        };

        const exportCertificate = (courseId) => {
            const empId = profile.value.employee.id;
            window.open(Api.getCertificateUrl(empId, courseId), '_blank');
        };

        const viewCertificate = (courseId) => {
            const empId = profile.value.employee.id;
            window.open(Api.getCertificateHtmlUrl(empId, courseId), '_blank');
        };

        watch(selectedEmployeeId, () => {
            if (selectedEmployeeId.value) {
                loadData();
            }
        });

        onMounted(() => {
            loadData();
        });

        return { profile, loading, hrViewMode, allEmployees, selectedEmployeeId, exportCertificate, viewCertificate, toasts: GlobalStore.toasts, removeToast: GlobalStore.removeToast.bind(GlobalStore), formatDate: formatDate };
    },
    template: `
        <LayoutWrapper title="培训档案" active-menu="profile" role="employee">
            <div v-if="hrViewMode && allEmployees.length > 0" class="card" style="padding:16px;margin-bottom:24px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <label style="font-weight:500;white-space:nowrap;">选择员工：</label>
                    <select class="select-control" v-model="selectedEmployeeId" style="max-width:320px;">
                        <option :value="null" disabled>请选择员工查看档案</option>
                        <option v-for="emp in allEmployees" :key="emp.id" :value="emp.id">
                            {{ emp.name }} - {{ emp.department }} ({{ emp.employee_id }})
                        </option>
                    </select>
                </div>
            </div>

            <div v-if="loading" class="empty-state">
                <div class="empty-icon">⏳</div>
                <p>加载中...</p>
            </div>

            <div v-else-if="!profile" class="empty-state">
                <div class="empty-icon">📁</div>
                <p>{{ hrViewMode ? '请选择员工查看档案' : '暂无档案数据' }}</p>
            </div>

            <template v-else>
                <div class="profile-header">
                    <div class="profile-avatar">{{ profile.employee.name?.charAt(0) || 'U' }}</div>
                    <div class="profile-info">
                        <h2>{{ profile.employee.name }}</h2>
                        <p>工号：{{ profile.employee.employee_id }}</p>
                        <p>部门：{{ profile.employee.department }}</p>
                        <p>职位：{{ profile.employee.role === 'hr' ? 'HR管理员' : '员工' }}</p>
                    </div>
                </div>

                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">{{ profile.statistics.total_courses }}</div>
                        <div class="stat-label">累计培训次数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value success">{{ profile.statistics.completed_courses }}</div>
                        <div class="stat-label">已完成培训</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value warning">{{ profile.statistics.attendance_rate }}%</div>
                        <div class="stat-label">出勤率</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" 
                             :class="(profile.statistics.average_score || 0) < 60 ? 'danger' : 'success'">
                            {{ profile.statistics.average_score || 0 }}
                        </div>
                        <div class="stat-label">测评平均分</div>
                    </div>
                </div>

                <div class="chart-container" style="margin-bottom:24px;">
                    <h3 class="chart-title">📊 出勤率与完成率</h3>
                    <div class="bar-chart">
                        <div class="bar-item">
                            <div class="bar-label">出勤率</div>
                            <div class="bar-track">
                                <div class="bar-fill" :style="{ width: profile.statistics.attendance_rate + '%' }">
                                    {{ profile.statistics.attendance_rate }}%
                                </div>
                            </div>
                            <div class="bar-value">{{ profile.statistics.checked_in_courses }}/{{ profile.statistics.total_courses }}</div>
                        </div>
                        <div class="bar-item">
                            <div class="bar-label">完成率</div>
                            <div class="bar-track">
                                <div class="bar-fill" :style="{ 
                                    width: (profile.statistics.total_courses ? profile.statistics.completed_courses / profile.statistics.total_courses * 100 : 0) + '%',
                                    background: 'linear-gradient(90deg, #38a169 0%, #68d391 100%)'
                                }">
                                    {{ profile.statistics.total_courses ? Math.round(profile.statistics.completed_courses / profile.statistics.total_courses * 100) : 0 }}%
                                </div>
                            </div>
                            <div class="bar-value">{{ profile.statistics.completed_courses }}/{{ profile.statistics.total_courses }}</div>
                        </div>
                    </div>
                </div>

                <div class="chart-container">
                    <h3 class="chart-title">📋 培训记录明细</h3>
                    <div v-if="profile.quiz_results.length === 0" style="color:#a0aec0;text-align:center;padding:20px;">
                        暂无培训完成记录
                    </div>
                    <table v-else class="data-table">
                        <thead>
                            <tr>
                                <th>课程名称</th>
                                <th>测评成绩</th>
                                <th>完成时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="r in profile.quiz_results" :key="r.id">
                                <td><strong>{{ r.title }}</strong></td>
                                <td>
                                    <span :class="r.score >= 60 ? 'score-pass' : 'score-low'">{{ r.score }}分</span>
                                </td>
                                <td>{{ formatDate(r.created_at) }}</td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" @click="viewCertificate(r.course_id)">查看证书</button>
                                    <button class="btn btn-sm btn-primary" style="margin-left:8px;" @click="exportCertificate(r.course_id)">导出PDF</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </template>

            <div class="toast-container">
                <transition-group name="toast">
                    <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type" @click="removeToast(t.id)">
                        <div class="toast-icon">
                            <span v-if="t.type === 'success'">✅</span>
                            <span v-else-if="t.type === 'error'">❌</span>
                            <span v-else-if="t.type === 'warning'">⚠️</span>
                            <span v-else>ℹ️</span>
                        </div>
                        <div class="toast-content">
                            <div class="toast-title">{{ t.title }}</div>
                            <div v-if="t.message" class="toast-message">{{ t.message }}</div>
                        </div>
                        <div class="toast-close">×</div>
                    </div>
                </transition-group>
            </div>
        </LayoutWrapper>
    `
};
