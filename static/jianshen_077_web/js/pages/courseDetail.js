const CourseDetailPage = {
    template: `
        <div class="detail-page">
            <div class="header">
                <div class="header-back" @click="$router.back()">←</div>
                <h1 class="header-title">课程详情</h1>
            </div>

            <div v-if="loading" class="empty-state" style="padding-top: 100px;">
                <div class="empty-state-icon">⏳</div>
                <div class="empty-state-text">加载中...</div>
            </div>

            <template v-else-if="course">
                <div class="detail-header">
                    <div class="detail-title">{{ course.title }}</div>
                    <div class="detail-meta">
                        <span>{{ course.category_name }}</span>
                        <span>{{ course.status_text }}</span>
                    </div>
                </div>

                <div class="detail-body">
                    <div class="detail-section">
                        <div class="detail-section-title">课程信息</div>
                        <div class="detail-info-row">
                            <span class="detail-info-label">教练</span>
                            <span class="detail-info-value">{{ course.coach || '待定' }}</span>
                        </div>
                        <div class="detail-info-row">
                            <span class="detail-info-label">开始时间</span>
                            <span class="detail-info-value">{{ formatTime(course.start_time) }}</span>
                        </div>
                        <div class="detail-info-row">
                            <span class="detail-info-label">结束时间</span>
                            <span class="detail-info-value">{{ formatTime(course.end_time) }}</span>
                        </div>
                        <div class="detail-info-row">
                            <span class="detail-info-label">地点</span>
                            <span class="detail-info-value">{{ course.location || '待定' }}</span>
                        </div>
                        <div class="detail-info-row">
                            <span class="detail-info-label">名额</span>
                            <span class="detail-info-value">
                                {{ course.current_booking }}/{{ course.max_capacity }}
                                <span v-if="course.remaining > 0" style="color: var(--success-color)">（剩余{{ course.remaining }}）</span>
                                <span v-else style="color: var(--danger-color)">（已满）</span>
                            </span>
                        </div>
                    </div>

                    <div class="detail-section" v-if="course.description">
                        <div class="detail-section-title">课程介绍</div>
                        <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.8;">{{ course.description }}</p>
                    </div>
                </div>

                <div class="detail-footer">
                    <button v-if="course.status === 1 && !hasBooked" class="btn btn-primary btn-block"
                            @click="handleBooking" :disabled="bookingLoading || course.remaining <= 0">
                        {{ bookingLoading ? '预约中...' : (course.remaining <= 0 ? '名额已满' : '立即预约') }}
                    </button>
                    <button v-else-if="hasBooked" class="btn btn-success btn-block" disabled>
                        ✅ 已预约
                    </button>
                    <button v-else class="btn btn-outline btn-block" disabled>
                        {{ course.status_text }}
                    </button>
                </div>
            </template>
        </div>
    `,
    data() {
        return {
            course: null,
            loading: true,
            bookingLoading: false,
            hasBooked: false
        };
    },
    methods: {
        async loadCourse() {
            this.loading = true;
            try {
                const courseId = this.$route.params.id;
                const result = await CourseService.getDetail(courseId);
                if (result.code === 0) {
                    this.course = result.data;
                } else {
                    Toast.error(result.msg || '课程不存在');
                }
            } catch (e) {
                Toast.error('加载失败');
            } finally {
                this.loading = false;
            }
        },
        async checkBooking() {
            try {
                const result = await BookingService.getMyList({ status: 1 });
                if (result.code === 0) {
                    const courseId = parseInt(this.$route.params.id);
                    this.hasBooked = result.data.items.some(b => b.course_id === courseId);
                }
            } catch (e) {}
        },
        async handleBooking() {
            this.bookingLoading = true;
            try {
                const result = await BookingService.create(this.course.id);
                if (result.code === 0) {
                    Toast.success('预约成功！');
                    this.hasBooked = true;
                    this.course.current_booking += 1;
                    this.course.remaining -= 1;
                } else {
                    Toast.error(result.msg || '预约失败');
                }
            } catch (e) {
                Toast.error('预约失败，请重试');
            } finally {
                this.bookingLoading = false;
            }
        },
        formatTime(time) {
            if (!time) return '';
            const d = new Date(time);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
    },
    async mounted() {
        await this.loadCourse();
        if (AuthService.isLoggedIn()) {
            await this.checkBooking();
        }
    }
};

window.CourseDetailPage = CourseDetailPage;
