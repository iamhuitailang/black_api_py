const CheckinPage = {
    template: `
        <div class="page has-header">
            <header class="header">
                <div class="header-back" @click="$router.back()">←</div>
                <h1 class="header-title">签到记录</h1>
            </header>

            <div class="course-list">
                <div v-if="loading" class="empty-state">
                    <div class="empty-state-icon">⏳</div>
                    <div class="empty-state-text">加载中...</div>
                </div>
                <div v-else-if="checkins.length === 0" class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">暂无签到记录</div>
                </div>
                <div v-else>
                    <div class="course-item" v-for="item in checkins" :key="item.id">
                        <div class="course-item-header">
                            <span class="badge badge-success">{{ item.status_text }}</span>
                            <span class="course-item-title">{{ item.course_title || '课程' }}</span>
                        </div>
                        <div class="course-item-info">
                            <span class="course-info-tag">🏋️ {{ item.course_coach || '待定' }}</span>
                            <span class="course-info-tag">🕐 {{ formatTime(item.checkin_time) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            checkins: [],
            loading: false
        };
    },
    methods: {
        async loadCheckins() {
            this.loading = true;
            try {
                const result = await CheckinService.getMyList({ page: 1, page_size: 50 });
                if (result.code === 0) {
                    this.checkins = result.data.items;
                }
            } catch (e) {
                Toast.error('加载失败');
            } finally {
                this.loading = false;
            }
        },
        formatTime(time) {
            if (!time) return '';
            const d = new Date(time);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
    },
    mounted() {
        this.loadCheckins();
    }
};

window.CheckinPage = CheckinPage;
