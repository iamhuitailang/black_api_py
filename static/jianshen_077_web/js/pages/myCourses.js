const MyCoursesPage = {
    template: `
        <div class="page has-header">
            <header class="header">
                <h1 class="header-title">我的课程</h1>
            </header>

            <div class="course-tabs">
                <div class="course-tab" :class="{ active: currentStatus === null }" @click="selectStatus(null)">全部</div>
                <div class="course-tab" :class="{ active: currentStatus === 1 }" @click="selectStatus(1)">已确认</div>
                <div class="course-tab" :class="{ active: currentStatus === 3 }" @click="selectStatus(3)">已完成</div>
                <div class="course-tab" :class="{ active: currentStatus === 2 }" @click="selectStatus(2)">已取消</div>
            </div>

            <div class="course-list">
                <div v-if="loading" class="empty-state">
                    <div class="empty-state-icon">⏳</div>
                    <div class="empty-state-text">加载中...</div>
                </div>
                <div v-else-if="bookings.length === 0" class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">暂无预约记录</div>
                </div>
                <div v-else>
                    <div class="course-item" v-for="booking in bookings" :key="booking.id" @click="goCourse(booking.course_id)">
                        <div class="course-item-header">
                            <span class="badge" :class="getBookingStatusClass(booking.status)">{{ booking.status_text }}</span>
                            <span class="course-item-title">{{ booking.course_title || '课程' }}</span>
                        </div>
                        <div class="course-item-info">
                            <span class="course-info-tag">🏋️ {{ booking.course_coach || '待定' }}</span>
                            <span class="course-info-tag">📅 {{ formatTime(booking.course_start_time) }}</span>
                        </div>
                        <div class="course-item-footer" v-if="booking.status === 1">
                            <span></span>
                            <div class="flex gap-1">
                                <button class="btn btn-sm btn-outline" @click.stop="handleCancel(booking.id)">取消预约</button>
                                <button class="btn btn-sm btn-primary" @click.stop="handleCheckin(booking.id)">签到</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="tabbar">
                <router-link to="/courses" class="tabbar-item">
                    <span class="tabbar-icon">🏋️</span>
                    <span class="tabbar-text">课程</span>
                </router-link>
                <router-link to="/my-courses" class="tabbar-item active">
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
            bookings: [],
            currentStatus: null,
            loading: false,
            page: 1,
            pageSize: 20
        };
    },
    methods: {
        async loadBookings() {
            this.loading = true;
            try {
                const params = { page: this.page, page_size: this.pageSize };
                if (this.currentStatus !== null) {
                    params.status = this.currentStatus;
                }
                const result = await BookingService.getMyList(params);
                if (result.code === 0) {
                    this.bookings = result.data.items;
                }
            } catch (e) {
                Toast.error('加载失败');
            } finally {
                this.loading = false;
            }
        },
        selectStatus(status) {
            this.currentStatus = status;
            this.loadBookings();
        },
        goCourse(courseId) {
            if (courseId) {
                this.$router.push('/course/' + courseId);
            }
        },
        async handleCancel(bookingId) {
            if (!confirm('确定取消预约？')) return;
            try {
                const result = await BookingService.cancel(bookingId);
                if (result.code === 0) {
                    Toast.success('取消成功');
                    this.loadBookings();
                } else {
                    Toast.error(result.msg || '取消失败');
                }
            } catch (e) {
                Toast.error('操作失败');
            }
        },
        async handleCheckin(bookingId) {
            try {
                const result = await CheckinService.checkin(bookingId);
                if (result.code === 0) {
                    Toast.success('签到成功！');
                    this.loadBookings();
                } else {
                    Toast.error(result.msg || '签到失败');
                }
            } catch (e) {
                Toast.error('签到失败');
            }
        },
        formatTime(time) {
            if (!time) return '';
            const d = new Date(time);
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
        },
        getBookingStatusClass(status) {
            const map = { 0: 'badge-warning', 1: 'badge-success', 2: 'badge-danger', 3: 'badge-info' };
            return map[status] || 'badge-secondary';
        }
    },
    mounted() {
        this.loadBookings();
    }
};

window.MyCoursesPage = MyCoursesPage;
