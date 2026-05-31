const CourseListPage = {
    template: `
        <div class="page has-header">
            <header class="header">
                <h1 class="header-title">FitLife · 课程</h1>
                <div class="header-action" @click="$router.push('/profile')">
                    {{ user.nickname || '我' }}
                </div>
            </header>

            <div class="home-banner">
                <div class="home-banner-title">💪 发现你的课程</div>
                <div class="home-banner-subtitle">坚持锻炼，遇见更好的自己</div>
            </div>

            <div class="search-bar">
                <div class="search-input-wrapper">
                    <span class="search-icon">🔍</span>
                    <input class="search-input" v-model="keyword" placeholder="搜索课程" @keyup.enter="searchCourses">
                </div>
                <span class="search-btn" style="color: var(--primary-color); cursor: pointer;" @click="searchCourses">搜索</span>
            </div>

            <div class="course-tabs">
                <div class="course-tab" :class="{ active: currentCategory === '' }" @click="selectCategory('')">全部</div>
                <div class="course-tab" v-for="cat in categories" :key="cat.code"
                     :class="{ active: currentCategory === cat.code }"
                     @click="selectCategory(cat.code)">
                    {{ cat.icon }} {{ cat.name }}
                </div>
            </div>

            <div class="course-list">
                <div v-if="loading" class="empty-state">
                    <div class="empty-state-icon">⏳</div>
                    <div class="empty-state-text">加载中...</div>
                </div>
                <div v-else-if="courses.length === 0" class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">暂无课程</div>
                </div>
                <div v-else>
                    <div class="course-item" v-for="course in courses" :key="course.id" @click="goDetail(course.id)">
                        <div class="course-item-header">
                            <span class="course-item-category">{{ course.category_name }}</span>
                            <span class="course-item-title">{{ course.title }}</span>
                        </div>
                        <div class="course-item-info">
                            <span class="course-info-tag">🏋️ {{ course.coach || '待定' }}</span>
                            <span class="course-info-tag">📅 {{ formatTime(course.start_time) }}</span>
                            <span class="course-info-tag">📍 {{ course.location || '待定' }}</span>
                        </div>
                        <div class="course-item-footer">
                            <div class="course-capacity">
                                <span>{{ course.current_booking }}/{{ course.max_capacity }} 已报名</span>
                                <div class="course-capacity-bar">
                                    <div class="course-capacity-fill"
                                         :style="{ width: (course.current_booking / course.max_capacity * 100) + '%', backgroundColor: course.current_booking >= course.max_capacity ? 'var(--danger-color)' : 'var(--primary-color)' }">
                                    </div>
                                </div>
                            </div>
                            <span class="course-status" :class="getStatusClass(course.status)">
                                {{ course.status_text }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="tabbar">
                <router-link to="/courses" class="tabbar-item active">
                    <span class="tabbar-icon">🏋️</span>
                    <span class="tabbar-text">课程</span>
                </router-link>
                <router-link to="/my-courses" class="tabbar-item">
                    <span class="tabbar-icon">📋</span>
                    <span class="tabbar-text">我的</span>
                </router-link>
                <router-link to="/notifications" class="tabbar-item">
                    <span class="tabbar-icon">🔔</span>
                    <span class="tabbar-text">消息</span>
                </router-link>
                <router-link to="/profile" class="tabbar-item">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </router-link>
            </div>
        </div>
    `,
    data() {
        return {
            user: AuthService.getCurrentUser() || {},
            courses: [],
            categories: [],
            currentCategory: '',
            keyword: '',
            loading: false,
            page: 1,
            pageSize: 20
        };
    },
    methods: {
        async loadCategories() {
            try {
                const result = await CourseService.getCategories();
                if (result.code === 0) {
                    this.categories = result.data;
                }
            } catch (e) {
                console.error(e);
            }
        },
        async loadCourses() {
            this.loading = true;
            try {
                const params = {
                    page: this.page,
                    page_size: this.pageSize,
                    status: 1
                };
                if (this.currentCategory) {
                    params.category = this.currentCategory;
                }
                if (this.keyword) {
                    params.keyword = this.keyword;
                }
                const result = await CourseService.getList(params);
                if (result.code === 0) {
                    this.courses = result.data.items;
                }
            } catch (e) {
                Toast.error('加载课程失败');
            } finally {
                this.loading = false;
            }
        },
        selectCategory(code) {
            this.currentCategory = code;
            this.loadCourses();
        },
        searchCourses() {
            this.loadCourses();
        },
        goDetail(courseId) {
            this.$router.push('/course/' + courseId);
        },
        formatTime(time) {
            if (!time) return '';
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

window.CourseListPage = CourseListPage;
