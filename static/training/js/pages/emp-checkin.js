var _v = VueApi; var ref = _v.ref, reactive = _v.reactive, computed = _v.computed, onMounted = _v.onMounted, watch = _v.watch;
const EmpCheckinPage = {
    setup() {
        const courses = ref([]);
        const loading = ref(false);
        const checkingIn = ref(false);

        const loadData = async () => {
            loading.value = true;
            try {
                const user = GlobalStore.currentUser;
                if (user) {
                    const res = await Api.getEmployeeCourses(user.id);
                    if (res.code === 0) {
                        const all = res.data || [];
                        courses.value = all.filter(c => 
                            c.status === 'confirmed' || c.status === 'checked_in' || c.status === 'pending'
                        );
                    }
                }
            } finally {
                loading.value = false;
            }
        };

        const canCheckIn = (course) => {
            if (!course.datetime) return false;
            const courseTime = new Date(course.datetime).getTime();
            const now = Date.now();
            return Math.abs(now - courseTime) <= 30 * 60 * 1000;
        };

        const getCheckInStatus = (course) => {
            if (course.status === 'checked_in') return 'done';
            if (canCheckIn(course)) return 'available';
            if (new Date(course.datetime).getTime() > Date.now()) return 'future';
            return 'expired';
        };

        const doCheckIn = async (course) => {
            if (!confirm(`确定签到参加"${course.title}"吗？`)) return;
            checkingIn.value = true;
            try {
                const res = await Api.checkIn(course.id);
                if (res.code === 0) {
                    Utils.showToast('🎉 签到成功！', 'success');
                    loadData();
                } else {
                    Utils.showToast(res.message || '签到失败', 'error');
                }
            } finally {
                checkingIn.value = false;
            }
        };

        onMounted(() => {
            loadData();
        });

        return { courses, loading, checkingIn, canCheckIn, getCheckInStatus, doCheckIn, Utils };
    },
    template: `
        <div>
            <div class="page-header">
                <div>
                    <h1 class="page-title">培训签到</h1>
                    <p class="page-subtitle">在课程开始前后30分钟内点击签到</p>
                </div>
            </div>

            <div v-if="loading" class="empty-state">
                <div class="empty-icon">⏳</div>
                <p>加载中...</p>
            </div>

            <div v-else-if="courses.length === 0" class="empty-state">
                <div class="empty-icon">🏫</div>
                <p>暂无待签到的培训课程</p>
            </div>

            <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:24px;">
                <div v-for="c in courses" :key="c.id" class="card" style="overflow:hidden;">
                    <div style="background:linear-gradient(135deg,#2c5282 0%,#3182ce 100%);color:white;padding:20px;text-align:center;"
                         :class="{ 'opacity-50': getCheckInStatus(c) === 'expired' }">
                        <div style="font-size:14px;opacity:0.9;">{{ Utils.formatDate(c.datetime) }}</div>
                        <div style="font-size:20px;font-weight:600;margin-top:8px;">{{ c.title }}</div>
                    </div>
                    <div class="checkin-section" style="padding:32px 20px;">
                        <template v-if="getCheckInStatus(c) === 'done'">
                            <div class="checkin-icon">✓</div>
                            <div style="font-size:18px;font-weight:600;color:#38a169;">已成功签到</div>
                            <div style="color:#718096;margin-top:8px;font-size:13px;">签到时间：{{ c.check_in_time ? Utils.formatDate(c.check_in_time) : '-' }}</div>
                        </template>
                        <template v-else-if="getCheckInStatus(c) === 'available'">
                            <div class="checkin-icon" style="background:#3182ce;animation:none;box-shadow:0 10px 40px rgba(49,130,206,0.3);">📍</div>
                            <div style="font-size:16px;color:#4a5568;margin-bottom:24px;">签到窗口已开放，点击下方按钮签到</div>
                            <button class="checkin-btn" :disabled="checkingIn" @click="doCheckIn(c)">
                                {{ checkingIn ? '签到中...' : '立即签到' }}
                            </button>
                        </template>
                        <template v-else-if="getCheckInStatus(c) === 'future'">
                            <div class="checkin-icon" style="background:#d69e2e;animation:none;box-shadow:0 10px 40px rgba(214,158,46,0.3);">⏰</div>
                            <div style="font-size:16px;color:#4a5568;margin-top:16px;">尚未到签到时间</div>
                            <div style="color:#718096;margin-top:8px;font-size:13px;">请在课程开始前后30分钟内签到</div>
                        </template>
                        <template v-else>
                            <div class="checkin-icon" style="background:#a0aec0;animation:none;box-shadow:none;">✕</div>
                            <div style="font-size:16px;color:#e53e3e;margin-top:16px;">签到时间已过</div>
                            <div style="color:#718096;margin-top:8px;font-size:13px;">如有疑问请联系HR</div>
                        </template>
                    </div>
                    <div style="padding:16px 20px;background:#f7fafc;border-top:1px solid #e2e8f0;font-size:13px;color:#4a5568;">
                        <div style="display:flex;gap:8px;margin-bottom:4px;">
                            <span>👨‍🏫</span>
                            <span>{{ c.instructor || '待定' }}</span>
                        </div>
                        <div v-if="c.location" style="display:flex;gap:8px;">
                            <span>📍</span>
                            <span>{{ c.location }}</span>
                        </div>
                        <div v-if="c.link" style="display:flex;gap:8px;">
                            <span>🔗</span>
                            <a :href="c.link" target="_blank" style="color:#3182ce;">线上培训链接</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

window.EmpCheckinPage = EmpCheckinPage;
