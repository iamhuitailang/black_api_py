const AdminCourseManage = {
    template: `
        <div class="admin-layout">
            <div class="admin-sidebar" :class="{ open: sidebarOpen }">
                <div class="admin-sidebar-header">
                    <div class="admin-sidebar-title">💪 FitLife</div>
                    <div class="admin-sidebar-subtitle">管理后台</div>
                </div>
                <router-link to="/admin/courses" class="admin-menu-item active">
                    <span class="admin-menu-icon">🏋️</span>课程管理
                </router-link>
                <router-link to="/admin/bookings" class="admin-menu-item">
                    <span class="admin-menu-icon">📋</span>预约管理
                </router-link>
                <router-link to="/admin/members" class="admin-menu-item">
                    <span class="admin-menu-icon">👥</span>会员管理
                </router-link>
                <router-link to="/admin/checkins" class="admin-menu-item">
                    <span class="admin-menu-icon">✅</span>签到管理
                </router-link>
                <router-link to="/admin/statistics" class="admin-menu-item">
                    <span class="admin-menu-icon">📊</span>数据统计
                </router-link>
                <div style="border-top: 1px solid var(--border-color); margin-top: 20px;"></div>
                <router-link to="/profile" class="admin-menu-item">
                    <span class="admin-menu-icon">👤</span>返回前端
                </router-link>
            </div>

            <div class="admin-main">
                <div class="admin-header">
                    <div class="flex-between" style="width: 100%;">
                        <div class="flex gap-1">
                            <button class="btn btn-outline btn-sm" @click="sidebarOpen = !sidebarOpen" style="display: none;">☰</button>
                            <h2 class="admin-page-title">课程管理</h2>
                        </div>
                        <button class="btn btn-primary btn-sm" @click="showCreateModal = true">+ 新建课程</button>
                    </div>
                </div>

                <div class="search-bar" style="margin: 0 0 16px; border-radius: var(--radius-md);">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input class="search-input" v-model="keyword" placeholder="搜索课程" @keyup.enter="loadCourses">
                    </div>
                    <select class="form-control" style="width: 120px; padding: 8px;" v-model="filterStatus" @change="loadCourses">
                        <option :value="null">全部状态</option>
                        <option :value="0">草稿</option>
                        <option :value="1">报名中</option>
                        <option :value="2">已取消</option>
                        <option :value="3">已完成</option>
                    </select>
                    <select class="form-control" style="width: 120px; padding: 8px; margin-left: 8px;" v-model="filterCategory" @change="loadCourses">
                        <option value="">全部分类</option>
                        <option v-for="cat in categories" :key="cat.code" :value="cat.code">{{ cat.name }}</option>
                    </select>
                </div>

                <div class="data-table">
                    <div class="data-table-header">
                        <div class="data-table-col" style="width: 30%;">课程名称</div>
                        <div class="data-table-col" style="width: 10%;">教练</div>
                        <div class="data-table-col" style="width: 10%;">分类</div>
                        <div class="data-table-col" style="width: 15%;">时间</div>
                        <div class="data-table-col" style="width: 10%;">名额</div>
                        <div class="data-table-col" style="width: 10%;">状态</div>
                        <div class="data-table-col" style="width: 15%;">操作</div>
                    </div>
                    <div class="data-table-row" v-for="course in courses" :key="course.id">
                        <div class="data-table-col" style="width: 30%;">{{ course.title }}</div>
                        <div class="data-table-col" style="width: 10%;">{{ course.coach || '-' }}</div>
                        <div class="data-table-col" style="width: 10%;"><span class="badge badge-primary">{{ course.category_name }}</span></div>
                        <div class="data-table-col" style="width: 15%; font-size: 12px;">{{ formatTime(course.start_time) }}</div>
                        <div class="data-table-col" style="width: 10%;">{{ course.current_booking }}/{{ course.max_capacity }}</div>
                        <div class="data-table-col" style="width: 10%;"><span class="badge" :class="getStatusClass(course.status)">{{ course.status_text }}</span></div>
                        <div class="data-table-col" style="width: 15%;">
                            <div class="flex gap-1">
                                <button class="btn btn-sm btn-outline" @click="editCourse(course)">编辑</button>
                                <button class="btn btn-sm btn-danger" @click="deleteCourse(course.id)">删除</button>
                            </div>
                        </div>
                    </div>
                    <div v-if="courses.length === 0" class="empty-state" style="padding: 30px;">
                        <div class="empty-state-text">暂无课程</div>
                    </div>
                </div>

                <div class="pagination" v-if="totalPages > 1">
                    <button class="pagination-btn" :disabled="page <= 1" @click="page--; loadCourses()">上一页</button>
                    <span style="font-size: 13px; color: var(--text-secondary);">{{ page }} / {{ totalPages }}</span>
                    <button class="pagination-btn" :disabled="page >= totalPages" @click="page++; loadCourses()">下一页</button>
                </div>
            </div>

            <div class="modal-overlay" v-if="showCreateModal" @click.self="showCreateModal = false">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">{{ editingCourse ? '编辑课程' : '新建课程' }}</span>
                        <span class="modal-close" @click="closeModal">✕</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">课程名称 *</label>
                            <input class="form-control" v-model="form.title">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">教练</label>
                                <input class="form-control" v-model="form.coach">
                            </div>
                            <div class="form-group">
                                <label class="form-label">分类</label>
                                <select class="form-control" v-model="form.category">
                                    <option value="">请选择</option>
                                    <option v-for="cat in categories" :key="cat.code" :value="cat.code">{{ cat.name }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">开始时间 *</label>
                                <input class="form-control" type="datetime-local" v-model="form.start_time">
                            </div>
                            <div class="form-group">
                                <label class="form-label">结束时间 *</label>
                                <input class="form-control" type="datetime-local" v-model="form.end_time">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">最大名额</label>
                                <input class="form-control" type="number" v-model.number="form.max_capacity">
                            </div>
                            <div class="form-group">
                                <label class="form-label">地点</label>
                                <input class="form-control" v-model="form.location">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">课程描述</label>
                            <textarea class="form-control" v-model="form.description" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">状态</label>
                            <select class="form-control" v-model="form.status">
                                <option :value="0">草稿</option>
                                <option :value="1">报名中</option>
                                <option :value="2">已取消</option>
                                <option :value="3">已完成</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" @click="closeModal">取消</button>
                        <button class="btn btn-primary" @click="handleSubmit" :disabled="submitLoading">
                            {{ submitLoading ? '提交中...' : '确认' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            courses: [],
            categories: [],
            keyword: '',
            filterStatus: null,
            filterCategory: '',
            page: 1,
            totalPages: 1,
            showCreateModal: false,
            editingCourse: null,
            submitLoading: false,
            sidebarOpen: false,
            form: {
                title: '',
                coach: '',
                category: '',
                start_time: '',
                end_time: '',
                max_capacity: 20,
                location: '',
                description: '',
                status: 1
            }
        };
    },
    methods: {
        async loadCategories() {
            try {
                const result = await CourseService.getCategories();
                if (result.code === 0) this.categories = result.data;
            } catch (e) {}
        },
        async loadCourses() {
            try {
                const params = { page: this.page, page_size: 10 };
                if (this.keyword) params.keyword = this.keyword;
                if (this.filterStatus !== null) params.status = this.filterStatus;
                if (this.filterCategory) params.category = this.filterCategory;
                const result = await CourseService.getList(params);
                if (result.code === 0) {
                    this.courses = result.data.items;
                    this.totalPages = result.data.total_pages;
                }
            } catch (e) {
                Toast.error('加载失败');
            }
        },
        editCourse(course) {
            this.editingCourse = course;
            this.form = {
                title: course.title,
                coach: course.coach,
                category: course.category,
                start_time: this.toLocalDateTime(course.start_time),
                end_time: this.toLocalDateTime(course.end_time),
                max_capacity: course.max_capacity,
                location: course.location,
                description: course.description,
                status: course.status
            };
            this.showCreateModal = true;
        },
        async deleteCourse(courseId) {
            if (!confirm('确定删除此课程？')) return;
            try {
                const result = await CourseService.delete(courseId);
                if (result.code === 0) {
                    Toast.success('删除成功');
                    this.loadCourses();
                } else {
                    Toast.error(result.msg || '删除失败');
                }
            } catch (e) {
                Toast.error('删除失败');
            }
        },
        async handleSubmit() {
            if (!this.form.title) { Toast.warning('请输入课程名称'); return; }
            if (!this.form.start_time) { Toast.warning('请选择开始时间'); return; }
            if (!this.form.end_time) { Toast.warning('请选择结束时间'); return; }

            this.submitLoading = true;
            try {
                const data = {
                    ...this.form,
                    start_time: new Date(this.form.start_time).toISOString(),
                    end_time: new Date(this.form.end_time).toISOString()
                };

                let result;
                if (this.editingCourse) {
                    result = await CourseService.update(this.editingCourse.id, data);
                } else {
                    result = await CourseService.create(data);
                }

                if (result.code === 0) {
                    Toast.success(this.editingCourse ? '更新成功' : '创建成功');
                    this.closeModal();
                    this.loadCourses();
                } else {
                    Toast.error(result.msg || '操作失败');
                }
            } catch (e) {
                Toast.error('操作失败');
            } finally {
                this.submitLoading = false;
            }
        },
        closeModal() {
            this.showCreateModal = false;
            this.editingCourse = null;
            this.form = { title: '', coach: '', category: '', start_time: '', end_time: '', max_capacity: 20, location: '', description: '', status: 1 };
        },
        toLocalDateTime(time) {
            if (!time) return '';
            const d = new Date(time);
            return d.toISOString().slice(0, 16);
        },
        formatTime(time) {
            if (!time) return '-';
            const d = new Date(time);
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
        },
        getStatusClass(status) {
            const map = { 0: 'badge-secondary', 1: 'badge-success', 2: 'badge-danger', 3: 'badge-info' };
            return map[status] || 'badge-secondary';
        }
    },
    async mounted() {
        await this.loadCategories();
        await this.loadCourses();
    }
};

window.AdminCourseManage = AdminCourseManage;
