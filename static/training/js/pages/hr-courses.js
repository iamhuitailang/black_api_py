var _v = VueApi; var ref = _v.ref, reactive = _v.reactive, computed = _v.computed, onMounted = _v.onMounted, watch = _v.watch;
window.HrCoursesPage = {
    setup() {
        requireRole('hr');
        const courses = ref([]);
        const departments = ref([]);
        const loading = ref(false);
        const showModal = ref(false);
        const editingCourse = ref(null);
        const form = reactive({
            title: '',
            description: '',
            instructor: '',
            datetime: '',
            location: '',
            link: '',
            capacity: 50,
            departments: []
        });

        const loadData = async () => {
            loading.value = true;
            try {
                const [coursesRes, deptsRes] = await Promise.all([
                    Api.getCourses(),
                    Api.getDepartments()
                ]);
                if (coursesRes.code === 0) courses.value = coursesRes.data || [];
                if (deptsRes.code === 0) departments.value = deptsRes.data || [];
            } finally {
                loading.value = false;
            }
        };

        const openCreateModal = () => {
            editingCourse.value = null;
            Object.assign(form, {
                title: '',
                description: '',
                instructor: '',
                datetime: '',
                location: '',
                link: '',
                capacity: 50,
                departments: []
            });
            showModal.value = true;
        };

        const openEditModal = async (course) => {
            editingCourse.value = course;
            Object.assign(form, {
                title: course.title,
                description: course.description || '',
                instructor: course.instructor || '',
                datetime: course.datetime,
                location: course.location || '',
                link: course.link || '',
                capacity: course.capacity,
                departments: [...(course.departments || [])]
            });
            showModal.value = true;
        };

        const closeModal = () => {
            showModal.value = false;
        };

        const saveCourse = async () => {
            if (!form.title || !form.datetime) {
                GlobalStore.addToast('warning', '提示', '请填写课程名称和时间');
                return;
            }
            if (form.departments.length === 0) {
                GlobalStore.addToast('warning', '提示', '请至少选择一个适用部门');
                return;
            }

            if (editingCourse.value) {
                const res = await Api.updateCourse({
                    id: editingCourse.value.id,
                    ...form,
                    datetime: form.datetime
                });
                if (res.code === 0) {
                    GlobalStore.addToast('success', '更新成功', '课程已更新');
                    closeModal();
                    loadData();
                } else {
                    GlobalStore.addToast('error', '更新失败', res.message || '更新失败');
                }
            } else {
                const res = await Api.createCourse({
                    ...form,
                    datetime: form.datetime
                });
                if (res.code === 0) {
                    GlobalStore.addToast('success', '创建成功', '课程已创建并通知相关员工');
                    closeModal();
                    loadData();
                } else {
                    GlobalStore.addToast('error', '创建失败', res.message || '创建失败');
                }
            }
        };

        const deleteCourse = async (course) => {
            if (!confirm(`确定要删除课程"${course.title}"吗？`)) return;
            const res = await Api.deleteCourse(course.id);
            if (res.code === 0) {
                GlobalStore.addToast('success', '删除成功', '课程已删除');
                loadData();
            } else {
                GlobalStore.addToast('error', '删除失败', res.message || '删除失败');
            }
        };

        const viewCourse = async (course) => {
            const res = await Api.getCourse(course.id);
            if (res.code === 0 && res.data) {
                const enrollments = res.data.enrollments || [];
                let html = `<h3 style="margin-bottom:16px;">${course.title} - 报名详情</h3>`;
                html += `<p style="margin-bottom:12px;">总人数：${enrollments.length}，到课率：${res.data.attendance_rate || 0}%</p>`;
                if (enrollments.length > 0) {
                    html += '<table class="data-table"><thead><tr><th>姓名</th><th>工号</th><th>部门</th><th>状态</th><th>签到时间</th></tr></thead><tbody>';
                    enrollments.forEach(e => {
                        html += `<tr><td>${e.name}</td><td>${e.emp_no}</td><td>${e.department}</td><td><span class="status-badge ${Utils.getStatusClass(e.status)}">${Utils.getStatusText(e.status)}</span></td><td>${e.check_in_time ? Utils.formatDate(e.check_in_time) : '-'}</td></tr>`;
                    });
                    html += '</tbody></table>';
                } else {
                    html += '<p style="color:#999;">暂无报名记录</p>';
                }
                alertModal(html);
            }
        };

        const alertModal = (html) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay show';
            overlay.innerHTML = `
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">详情</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">${html}</div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                    </div>
                </div>
            `;
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });
            document.body.appendChild(overlay);
        };

        onMounted(() => {
            loadData();
        });

        return {
            courses, departments, loading, showModal, editingCourse, form,
            openCreateModal, openEditModal, closeModal, saveCourse,
            deleteCourse, viewCourse, Utils,
            toasts: GlobalStore.toasts, removeToast: GlobalStore.removeToast.bind(GlobalStore), formatDate: formatDate, formatDateTime: formatDateTime
        };
    },
    template: `
        <LayoutWrapper title="课程管理" active-menu="hr-courses" role="hr">
            <div v-if="loading" class="empty-state">
                <div class="empty-icon">⏳</div>
                <p>加载中...</p>
            </div>

            <div v-else-if="courses.length === 0" class="empty-state">
                <div class="empty-icon">📚</div>
                <p>暂无培训课程，点击右上角创建第一个课程</p>
            </div>

            <div v-else class="courses-grid">
                <div v-for="course in courses" :key="course.id" class="calendar-card">
                    <div class="calendar-header">
                        <div class="calendar-date">
                            <div class="day">{{ Utils.getDay(course.datetime) }}</div>
                            <div class="month">{{ Utils.getMonth(course.datetime) }}</div>
                        </div>
                        <span class="calendar-badge">{{ course.enrolled_count || 0 }}人报名</span>
                    </div>
                    <div class="calendar-body">
                        <h3 class="course-title">{{ course.title }}</h3>
                        <div class="course-meta">
                            <div class="meta-item">
                                <span class="meta-icon">👨‍🏫</span>
                                {{ course.instructor || '待定' }}
                            </div>
                            <div class="meta-item">
                                <span class="meta-icon">🕐</span>
                                {{ Utils.formatDate(course.datetime) }}
                            </div>
                            <div class="meta-item" v-if="course.location">
                                <span class="meta-icon">📍</span>
                                {{ course.location }}
                            </div>
                            <div class="meta-item" v-if="course.link">
                                <span class="meta-icon">🔗</span>
                                <a :href="course.link" target="_blank" style="color:#3182ce;">线上链接</a>
                            </div>
                            <div class="meta-item">
                                <span class="meta-icon">🏢</span>
                                {{ (course.departments || []).join('、') }}
                            </div>
                        </div>
                        <div class="course-footer">
                            <div class="attendance-info">
                                到课率：<span class="attendance-rate">{{ course.attendance_rate || 0 }}%</span>
                            </div>
                            <div class="action-buttons">
                                <button class="btn btn-sm btn-secondary" @click="viewCourse(course)">详情</button>
                                <button class="btn btn-sm btn-primary" @click="openEditModal(course)">编辑</button>
                                <button class="btn btn-sm btn-danger" @click="deleteCourse(course)">删除</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="showModal" class="modal-overlay show" @click.self="closeModal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">{{ editingCourse ? '编辑课程' : '新建课程' }}</h3>
                        <button class="modal-close" @click="closeModal">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-grid">
                            <div class="form-group full-width">
                                <label class="form-label">课程名称 <span style="color:#e53e3e;">*</span></label>
                                <input type="text" class="form-control" v-model="form.title" placeholder="请输入课程名称">
                            </div>
                            <div class="form-group">
                                <label class="form-label">授课讲师</label>
                                <input type="text" class="form-control" v-model="form.instructor" placeholder="请输入讲师姓名">
                            </div>
                            <div class="form-group">
                                <label class="form-label">培训时间 <span style="color:#e53e3e;">*</span></label>
                                <input type="datetime-local" class="form-control" v-model="form.datetime">
                            </div>
                            <div class="form-group">
                                <label class="form-label">培训地点（线下）</label>
                                <input type="text" class="form-control" v-model="form.location" placeholder="线下培训地点">
                            </div>
                            <div class="form-group">
                                <label class="form-label">培训链接（线上）</label>
                                <input type="url" class="form-control" v-model="form.link" placeholder="https://...">
                            </div>
                            <div class="form-group">
                                <label class="form-label">人数上限</label>
                                <input type="number" class="form-control" v-model.number="form.capacity" min="1">
                            </div>
                            <div class="form-group full-width">
                                <label class="form-label">适用部门 <span style="color:#e53e3e;">*</span></label>
                                <div class="checkbox-group">
                                    <label v-for="dept in departments" :key="dept" class="checkbox-item">
                                        <input type="checkbox" :value="dept" v-model="form.departments">
                                        <span>{{ dept }}</span>
                                    </label>
                                </div>
                            </div>
                            <div class="form-group full-width">
                                <label class="form-label">课程描述</label>
                                <textarea class="form-control" v-model="form.description" placeholder="请输入课程描述..."></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="closeModal">取消</button>
                        <button class="btn btn-primary" @click="saveCourse">{{ editingCourse ? '保存修改' : '创建课程' }}</button>
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
