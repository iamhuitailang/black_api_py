var _v = VueApi; var ref = _v.ref, reactive = _v.reactive, computed = _v.computed, onMounted = _v.onMounted, watch = _v.watch;
window.HrStatisticsPage = {
    setup() {
        requireRole('hr');
        const data = reactive({
            overview: {},
            by_department: [],
            by_quarter: [],
            by_course: []
        });
        const loading = ref(false);

        const loadData = async () => {
            loading.value = true;
            try {
                const res = await Api.getStatistics();
                if (res.code === 0 && res.data) {
                    Object.assign(data, res.data);
                }
            } finally {
                loading.value = false;
            }
        };

        const maxDeptAttendance = computed(() => {
            return Math.max(...(data.by_department.map(d => d.attendance_rate || 0)), 1);
        });

        const maxQuarterCourses = computed(() => {
            return Math.max(...(data.by_quarter.map(q => q.total_courses || 0)), 1);
        });

        onMounted(() => {
            loadData();
        });

        return {
            data, loading, maxDeptAttendance, maxQuarterCourses, Utils,
            toasts: GlobalStore.toasts, removeToast: GlobalStore.removeToast.bind(GlobalStore)
        };
    },
    template: `
        <LayoutWrapper title="统计报表" active-menu="hr-statistics" role="hr">
            <div v-if="loading" class="empty-state">
                <div class="empty-icon">⏳</div>
                <p>加载中...</p>
            </div>

            <template v-else>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">{{ data.overview.total_employees || 0 }}</div>
                        <div class="stat-label">员工总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ data.overview.total_courses || 0 }}</div>
                        <div class="stat-label">课程总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value warning">{{ data.overview.total_enrollments || 0 }}</div>
                        <div class="stat-label">报名总次数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value success">{{ data.overview.total_quizzes_taken || 0 }}</div>
                        <div class="stat-label">测评完成次数</div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
                    <div class="chart-container">
                        <h3 class="chart-title">📊 各部门到课率</h3>
                        <div v-if="data.by_department.length === 0" style="color:#a0aec0;text-align:center;padding:20px;">暂无数据</div>
                        <div v-else class="bar-chart">
                            <div v-for="dept in data.by_department" :key="dept.department" class="bar-item">
                                <div class="bar-label">{{ dept.department }}</div>
                                <div class="bar-track">
                                    <div class="bar-fill" :style="{ width: (dept.attendance_rate / maxDeptAttendance * 100) + '%' }">
                                        {{ dept.attendance_rate || 0 }}%
                                    </div>
                                </div>
                                <div class="bar-value">{{ dept.checked_in }}/{{ dept.total_enrollments }}</div>
                            </div>
                        </div>
                    </div>

                    <div class="chart-container">
                        <h3 class="chart-title">📈 季度培训统计</h3>
                        <div v-if="data.by_quarter.length === 0" style="color:#a0aec0;text-align:center;padding:20px;">暂无数据</div>
                        <div v-else class="bar-chart">
                            <div v-for="q in data.by_quarter" :key="q.quarter" class="bar-item">
                                <div class="bar-label">{{ q.quarter }}</div>
                                <div class="bar-track">
                                    <div class="bar-fill" :style="{ width: (q.total_courses / maxQuarterCourses * 100) + '%', background: 'linear-gradient(90deg, #38a169 0%, #68d391 100%)' }">
                                        {{ q.total_courses }}门
                                    </div>
                                </div>
                                <div class="bar-value">{{ q.attendance_rate || 0 }}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="chart-container">
                    <h3 class="chart-title">🏢 部门详细统计</h3>
                    <table v-if="data.by_department.length > 0" class="data-table">
                        <thead>
                            <tr>
                                <th>部门</th>
                                <th>员工数</th>
                                <th>报名次数</th>
                                <th>已签到</th>
                                <th>已完成</th>
                                <th>到课率</th>
                                <th>平均分</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="dept in data.by_department" :key="dept.department">
                                <td><strong>{{ dept.department }}</strong></td>
                                <td>{{ dept.total_employees }}</td>
                                <td>{{ dept.total_enrollments }}</td>
                                <td>{{ dept.checked_in }}</td>
                                <td>{{ dept.completed }}</td>
                                <td>
                                    <span :class="dept.attendance_rate >= 80 ? 'score-pass' : 'score-low'">{{ dept.attendance_rate || 0 }}%</span>
                                </td>
                                <td>
                                    <span :class="(dept.avg_score || 0) >= 60 ? 'score-pass' : 'score-low'">{{ dept.avg_score || '-' }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else style="color:#a0aec0;text-align:center;padding:20px;">暂无数据</div>
                </div>

                <div class="chart-container" style="margin-top:24px;">
                    <h3 class="chart-title">📚 课程统计</h3>
                    <table v-if="data.by_course.length > 0" class="data-table">
                        <thead>
                            <tr>
                                <th>课程名称</th>
                                <th>讲师</th>
                                <th>时间</th>
                                <th>报名人数</th>
                                <th>已签到</th>
                                <th>已完成</th>
                                <th>到课率</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="course in data.by_course" :key="course.course_id">
                                <td><strong>{{ course.title }}</strong></td>
                                <td>{{ course.instructor || '-' }}</td>
                                <td>{{ Utils.formatDate(course.datetime) }}</td>
                                <td>{{ course.total_enrollments }}</td>
                                <td>{{ course.checked_in }}</td>
                                <td>{{ course.completed }}</td>
                                <td>
                                    <span :class="course.attendance_rate >= 80 ? 'score-pass' : 'score-low'">{{ course.attendance_rate || 0 }}%</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else style="color:#a0aec0;text-align:center;padding:20px;">暂无数据</div>
                </div>
            </template>

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
