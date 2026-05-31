const AdminBookingManage = {
    template: `
        <div class="admin-layout">
            <div class="admin-sidebar">
                <div class="admin-sidebar-header">
                    <div class="admin-sidebar-title">💪 FitLife</div>
                    <div class="admin-sidebar-subtitle">管理后台</div>
                </div>
                <router-link to="/admin/courses" class="admin-menu-item"><span class="admin-menu-icon">🏋️</span>课程管理</router-link>
                <router-link to="/admin/bookings" class="admin-menu-item active"><span class="admin-menu-icon">📋</span>预约管理</router-link>
                <router-link to="/admin/members" class="admin-menu-item"><span class="admin-menu-icon">👥</span>会员管理</router-link>
                <router-link to="/admin/checkins" class="admin-menu-item"><span class="admin-menu-icon">✅</span>签到管理</router-link>
                <router-link to="/admin/statistics" class="admin-menu-item"><span class="admin-menu-icon">📊</span>数据统计</router-link>
                <div style="border-top: 1px solid var(--border-color); margin-top: 20px;"></div>
                <router-link to="/profile" class="admin-menu-item"><span class="admin-menu-icon">👤</span>返回前端</router-link>
            </div>

            <div class="admin-main">
                <div class="admin-header">
                    <h2 class="admin-page-title">预约管理</h2>
                </div>

                <div class="search-bar" style="margin: 0 0 16px; border-radius: var(--radius-md);">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input class="search-input" v-model="keyword" placeholder="搜索用户或课程" @keyup.enter="loadBookings">
                    </div>
                    <select class="form-control" style="width: 120px; padding: 8px;" v-model="filterStatus" @change="loadBookings">
                        <option :value="null">全部状态</option>
                        <option :value="0">待确认</option>
                        <option :value="1">已确认</option>
                        <option :value="2">已取消</option>
                        <option :value="3">已完成</option>
                    </select>
                </div>

                <div class="data-table">
                    <div class="data-table-header">
                        <div class="data-table-col" style="width: 10%;">ID</div>
                        <div class="data-table-col" style="width: 15%;">用户</div>
                        <div class="data-table-col" style="width: 25%;">课程</div>
                        <div class="data-table-col" style="width: 15%;">课程时间</div>
                        <div class="data-table-col" style="width: 10%;">状态</div>
                        <div class="data-table-col" style="width: 15%;">预约时间</div>
                        <div class="data-table-col" style="width: 10%;">操作</div>
                    </div>
                    <div class="data-table-row" v-for="booking in bookings" :key="booking.id">
                        <div class="data-table-col" style="width: 10%;">{{ booking.id }}</div>
                        <div class="data-table-col" style="width: 15%;">{{ booking.user_nickname || booking.user_username || '-' }}</div>
                        <div class="data-table-col" style="width: 25%;">{{ booking.course_title || '-' }}</div>
                        <div class="data-table-col" style="width: 15%; font-size: 12px;">{{ formatTime(booking.course_start_time) }}</div>
                        <div class="data-table-col" style="width: 10%;"><span class="badge" :class="getBookingStatusClass(booking.status)">{{ booking.status_text }}</span></div>
                        <div class="data-table-col" style="width: 15%; font-size: 12px;">{{ formatTime(booking.created_at) }}</div>
                        <div class="data-table-col" style="width: 10%;">
                            <select class="form-control" style="padding: 4px 8px; font-size: 12px;" @change="updateStatus(booking.id, $event.target.value)" :value="booking.status">
                                <option :value="0">待确认</option>
                                <option :value="1">已确认</option>
                                <option :value="2">已取消</option>
                                <option :value="3">已完成</option>
                            </select>
                        </div>
                    </div>
                    <div v-if="bookings.length === 0" class="empty-state" style="padding: 30px;">
                        <div class="empty-state-text">暂无预约记录</div>
                    </div>
                </div>

                <div class="pagination" v-if="totalPages > 1">
                    <button class="pagination-btn" :disabled="page <= 1" @click="page--; loadBookings()">上一页</button>
                    <span style="font-size: 13px; color: var(--text-secondary);">{{ page }} / {{ totalPages }}</span>
                    <button class="pagination-btn" :disabled="page >= totalPages" @click="page++; loadBookings()">下一页</button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            bookings: [],
            keyword: '',
            filterStatus: null,
            page: 1,
            totalPages: 1
        };
    },
    methods: {
        async loadBookings() {
            try {
                const params = { page: this.page, page_size: 10 };
                if (this.keyword) params.keyword = this.keyword;
                if (this.filterStatus !== null) params.status = this.filterStatus;
                const result = await BookingService.getAllList(params);
                if (result.code === 0) {
                    this.bookings = result.data.items;
                    this.totalPages = result.data.total_pages;
                }
            } catch (e) {
                Toast.error('加载失败');
            }
        },
        async updateStatus(bookingId, status) {
            try {
                const result = await BookingService.updateStatus(bookingId, parseInt(status));
                if (result.code === 0) {
                    Toast.success('状态更新成功');
                    this.loadBookings();
                } else {
                    Toast.error(result.msg || '更新失败');
                }
            } catch (e) {
                Toast.error('更新失败');
            }
        },
        formatTime(time) {
            if (!time) return '-';
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

window.AdminBookingManage = AdminBookingManage;
