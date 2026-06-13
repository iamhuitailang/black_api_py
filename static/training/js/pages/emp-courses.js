var _v = VueApi; var ref = _v.ref, reactive = _v.reactive, computed = _v.computed, onMounted = _v.onMounted, watch = _v.watch;

window.EmpCoursesPage = {
    setup: function() {
        requireRole('employee');
        var courses = ref([]);
        var loading = ref(false);
        var showLeaveModal = ref(false);
        var selectedEnrollment = ref(null);
        var leaveReason = ref('');
        var filterStatus = ref('all');

        var pendingCourses = computed(function() {
            return (courses.value || []).filter(function(e) {
                return e.status === 'pending' || e.status === 'notified';
            });
        });

        var displayCourses = computed(function() {
            if (filterStatus.value === 'all') return courses.value || [];
            if (filterStatus.value === 'pending') return pendingCourses.value;
            return (courses.value || []).filter(function(e) { return e.status === filterStatus.value; });
        });

        var filterOptions = [
            { key: 'all', label: '全部课程' },
            { key: 'pending', label: '待参加（' + 0 + '）' }
        ];

        var filters = computed(function() {
            var pendingN = pendingCourses.value.length;
            var confirmedN = (courses.value || []).filter(function(e) {
                return e.status === 'confirmed' || e.status === 'checked_in' || e.status === 'completed';
            }).length;
            var leaveN = (courses.value || []).filter(function(e) {
                return e.status === 'leave_pending' || e.status === 'leave_approved' || e.status === 'leave_rejected';
            }).length;
            return [
                { key: 'all', label: '全部（' + (courses.value || []).length + '）' },
                { key: 'pending', label: '待参加（' + pendingN + '）' },
                { key: 'confirmed', label: '已确认（' + confirmedN + '）' },
                { key: 'leave_pending', label: '请假（' + leaveN + '）' }
            ];
        });

        async function loadData() {
            loading.value = true;
            try {
                var user = GlobalStore.currentUser;
                if (user) {
                    var res = await Api.getEmployeeCourses(user.id);
                    if (res.code === 0) {
                        courses.value = res.data || [];
                        GlobalStore.notificationCount = pendingCourses.value.length;
                    }
                }
            } finally {
                loading.value = false;
            }
        }

        async function confirmAttendance(enrollment) {
            var res = await Api.confirmEnrollment(enrollment.id);
            if (res.code === 0) {
                GlobalStore.addToast('success', '已确认参加', '《' + enrollment.title + '》期待您的到来！');
                await loadData();
            } else {
                GlobalStore.addToast('error', '操作失败', res.message || '请稍后重试');
            }
        }

        function openLeaveModal(enrollment) {
            selectedEnrollment.value = enrollment;
            leaveReason.value = '';
            showLeaveModal.value = true;
        }

        async function submitLeave() {
            if (!leaveReason.value.trim()) {
                GlobalStore.addToast('warning', '请填写请假理由', '需要至少5个字的说明');
                return;
            }
            if (leaveReason.value.trim().length < 5) {
                GlobalStore.addToast('warning', '请假理由过短', '请填写更详细的请假原因');
                return;
            }
            var res = await Api.requestLeave(selectedEnrollment.value.id, leaveReason.value.trim());
            if (res.code === 0) {
                GlobalStore.addToast('success', '请假申请已提交', '等待HR审批，如有疑问请直接联系');
                showLeaveModal.value = false;
                await loadData();
            } else {
                GlobalStore.addToast('error', '提交失败', res.message || '请稍后重试');
            }
        }

        function dismissNotice(course) {
            try {
                var obj = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFIED) || '{}');
                obj['c_' + course.course_id] = Date.now();
                localStorage.setItem(STORAGE_KEYS.NOTIFIED, JSON.stringify(obj));
            } catch(e) {}
            loadData();
        }

        onMounted(loadData);

        return {
            courses: courses,
            loading: loading,
            showLeaveModal: showLeaveModal,
            selectedEnrollment: selectedEnrollment,
            leaveReason: leaveReason,
            filterStatus: filterStatus,
            filters: filters,
            pendingCourses: pendingCourses,
            displayCourses: displayCourses,
            loadData: loadData,
            confirmAttendance: confirmAttendance,
            openLeaveModal: openLeaveModal,
            submitLeave: submitLeave,
            dismissNotice: dismissNotice,
            toasts: GlobalStore.toasts,
            removeToast: GlobalStore.removeToast.bind(GlobalStore),
            formatDate: formatDate,
            formatDateTime: formatDateTime,
            isUpcoming: isUpcoming
        };
    },
    template: '<LayoutWrapper title="我的培训" active-menu="emp-courses" role="employee">\n        <div v-if="pendingCourses.length > 0" class="notice-banner">\n            <div class="notice-icon">📢</div>\n            <div class="notice-content">\n                <div class="notice-title">\n                    您有 <b>{{ pendingCourses.length }}</b> 门培训课程待确认参加\n                </div>\n                <div class="notice-courses">\n                    <span v-for="c in pendingCourses.slice(0,3)" :key="c.id" class="notice-tag">\n                        《{{ c.title }}》 · {{ formatDate(c.datetime) }}\n                    </span>\n                    <span v-if="pendingCourses.length > 3" class="notice-more">...共{{ pendingCourses.length }}门</span>\n                </div>\n            </div>\n            <button class="notice-action" @click="filterStatus = \'pending\'">查看待参加 →</button>\n        </div>\n\n        <div class="filter-bar">\n            <div class="filter-groups">\n                <div v-for="f in filters" :key="f.key"\n                     class="filter-tab"\n                     :class="{ active: filterStatus === f.key }"\n                     @click="filterStatus = f.key">\n                    {{ f.label }}\n                </div>\n            </div>\n            <div class="filter-right">\n                <button class="btn btn-sm btn-default" @click="loadData">🔄 刷新</button>\n            </div>\n        </div>\n\n        <div v-if="loading" class="page-loading"><LoadingSpinner text="加载中..." /></div>\n        <div v-else-if="displayCourses.length === 0" class="page-empty">\n            <EmptyState text="当前筛选条件下暂无培训课程" icon="📭" />\n        </div>\n        <div v-else class="course-grid">\n            <div v-for="c in displayCourses" :key="c.id"\n                 class="course-card cal-card"\n                 :class="{ \n                    \'is-pending\': c.status === \'pending\' || c.status === \'notified\',\n                    \'is-upcoming\': isUpcoming(c.datetime)\n                 }">\n                <div class="cal-side">\n                    <div class="cal-month">{{ formatMonth(c.datetime) }}</div>\n                    <div class="cal-day">{{ formatDay(c.datetime) }}</div>\n                    <div class="cal-week">{{ formatWeekday(c.datetime) }}</div>\n                    <div v-if="c.status === \'pending\' || c.status === \'notified\'" class="cal-ribbon">NEW</div>\n                </div>\n                <div class="cal-body">\n                    <div class="card-head">\n                        <h3 class="course-title">{{ c.title }}</h3>\n                        <StatusBadge :status="c.status" />\n                    </div>\n                    <div class="course-meta">\n                        <div class="meta-row"><span class="meta-label">�‍🏫</span><span>{{ c.instructor || \'待安排\' }}</span></div>\n                        <div class="meta-row"><span class="meta-label">⏰</span><span>{{ formatDateTime(c.datetime) }}</span></div>\n                        <div class="meta-row" v-if="c.location"><span class="meta-label">📍</span><span>{{ c.location }}</span></div>\n                        <div class="meta-row" v-if="c.link"><span class="meta-label">�</span><a :href="c.link" target="_blank" class="link">线上链接</a></div>\n                        <div class="meta-row" v-if="c.departments"><span class="meta-label">🏢</span><span>{{ (c.departments||[]).join(\'、\') }}</span></div>\n                    </div>\n                    <div v-if="c.description" class="course-desc">{{ c.description }}</div>\n\n                    <div v-if="c.status === \'pending\' || c.status === \'notified\'" class="card-actions double">\n                        <button class="btn btn-primary" @click="confirmAttendance(c)">\n                            ✓ 确认参加\n                        </button>\n                        <button class="btn btn-default" @click="openLeaveModal(c)">\n                            📝 申请请假\n                        </button>\n                    </div>\n                    <div v-else-if="c.status === \'confirmed\'" class="card-actions double">\n                        <div class="status-tip ok">✓ 已确认参加，记得准时出席</div>\n                        <button class="btn btn-sm btn-default" @click="openLeaveModal(c)">请假调整</button>\n                    </div>\n                    <div v-else-if="c.status === \'checked_in\'" class="card-actions double">\n                        <div class="status-tip ok">✅ 已完成签到，等待课后测评</div>\n                        <button class="btn btn-sm btn-primary" @click="GlobalStore.setRoute(\'emp-quiz\')">前往测评 →</button>\n                    </div>\n                    <div v-else-if="c.status === \'completed\'" class="card-actions">\n                        <div class="status-tip done">🏆 培训已完成</div>\n                    </div>\n                    <div v-else-if="c.status === \'leave_pending\'" class="card-actions">\n                        <div class="status-tip warn">⏳ 请假审批中，请等待HR回复</div>\n                    </div>\n                    <div v-else-if="c.status === \'leave_approved\'" class="card-actions">\n                        <div class="status-tip info">✔️ 请假已批准</div>\n                    </div>\n                    <div v-else-if="c.status === \'leave_rejected\'" class="card-actions double">\n                        <div class="status-tip err">❌ 请假被驳回，请确认参加</div>\n                        <button class="btn btn-sm btn-primary" @click="confirmAttendance(c)">确认参加</button>\n                    </div>\n                </div>\n            </div>\n        </div>\n\n        <ModalWrap :show="showLeaveModal" title="申请请假" width="520" @close="showLeaveModal = false">\n            <div v-if="selectedEnrollment" class="leave-form">\n                <div class="leave-courseinfo">\n                    <div class="ci-title">{{ selectedEnrollment.title }}</div>\n                    <div class="ci-meta">{{ formatDateTime(selectedEnrollment.datetime) }} · {{ selectedEnrollment.instructor }}</div>\n                </div>\n                <div class="form-group">\n                    <label class="form-label">请假理由 <span class="req">*</span></label>\n                    <textarea v-model="leaveReason" class="form-textarea" rows="5"\n                              placeholder="请详细描述请假原因（不少于5个字）"></textarea>\n                </div>\n            </div>\n            <template #footer>\n                <button class="btn btn-default" @click="showLeaveModal = false">取消</button>\n                <button class="btn btn-primary" :disabled="!leaveReason.trim() || leaveReason.trim().length < 5" @click="submitLeave">提交申请</button>\n            </template>\n        </ModalWrap>\n\n        <div class="toast-container">\n            <transition-group name="toast">\n                <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type" @click="removeToast(t.id)">\n                    <div class="toast-icon">\n                        <span v-if="t.type === \'success\'">✅</span>\n                        <span v-else-if="t.type === \'error\'">❌</span>\n                        <span v-else-if="t.type === \'warning\'">⚠️</span>\n                        <span v-else>ℹ️</span>\n                    </div>\n                    <div class="toast-content">\n                        <div class="toast-title">{{ t.title }}</div>\n                        <div v-if="t.message" class="toast-message">{{ t.message }}</div>\n                    </div>\n                    <div class="toast-close">×</div>\n                </div>\n            </transition-group>\n        </div>\n    </LayoutWrapper>'
};
