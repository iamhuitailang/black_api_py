const AdminCheckinManage = {
    template: `
        <div class="admin-layout">
            <div class="admin-sidebar">
                <div class="admin-sidebar-header">
                    <div class="admin-sidebar-title">💪 FitLife</div>
                    <div class="admin-sidebar-subtitle">管理后台</div>
                </div>
                <router-link to="/admin/courses" class="admin-menu-item"><span class="admin-menu-icon">🏋️</span>课程管理</router-link>
                <router-link to="/admin/bookings" class="admin-menu-item"><span class="admin-menu-icon">📋</span>预约管理</router-link>
                <router-link to="/admin/members" class="admin-menu-item"><span class="admin-menu-icon">👥</span>会员管理</router-link>
                <router-link to="/admin/checkins" class="admin-menu-item active"><span class="admin-menu-icon">✅</span>签到管理</router-link>
                <router-link to="/admin/statistics" class="admin-menu-item"><span class="admin-menu-icon">📊</span>数据统计</router-link>
                <div style="border-top: 1px solid var(--border-color); margin-top: 20px;"></div>
                <router-link to="/profile" class="admin-menu-item"><span class="admin-menu-icon">👤</span>返回前端</router-link>
            </div>

            <div class="admin-main">
                <div class="admin-header">
                    <div class="flex-between" style="width: 100%;">
                        <h2 class="admin-page-title">签到管理</h2>
                        <button class="btn btn-primary btn-sm" @click="showCheckinModal = true">代签到</button>
                    </div>
                </div>

                <div class="search-bar" style="margin: 0 0 16px; border-radius: var(--radius-md);">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input class="search-input" v-model="keyword" placeholder="搜索" @keyup.enter="loadCheckins">
                    </div>
                </div>

                <div class="data-table">
                    <div class="data-table-header">
                        <div class="data-table-col" style="width: 8%;">ID</div>
                        <div class="data-table-col" style="width: 15%;">用户</div>
                        <div class="data-table-col" style="width: 25%;">课程</div>
                        <div class="data-table-col" style="width: 15%;">签到时间</div>
                        <div class="data-table-col" style="width: 10%;">状态</div>
                        <div class="data-table-col" style="width: 12%;">操作</div>
                    </div>
                    <div class="data-table-row" v-for="item in checkins" :key="item.id">
                        <div class="data-table-col" style="width: 8%;">{{ item.id }}</div>
                        <div class="data-table-col" style="width: 15%;">{{ item.user_nickname || item.user_username || '-' }}</div>
                        <div class="data-table-col" style="width: 25%;">{{ item.course_title || '-' }}</div>
                        <div class="data-table-col" style="width: 15%; font-size: 12px;">{{ formatTime(item.checkin_time) }}</div>
                        <div class="data-table-col" style="width: 10%;"><span class="badge" :class="item.status === 0 ? 'badge-success' : 'badge-info'">{{ item.status_text }}</span></div>
                        <div class="data-table-col" style="width: 12%;">
                            <button v-if="item.status === 0" class="btn btn-sm btn-primary" @click="completeCheckin(item.id)">完成</button>
                        </div>
                    </div>
                    <div v-if="checkins.length === 0" class="empty-state" style="padding: 30px;">
                        <div class="empty-state-text">暂无签到记录</div>
                    </div>
                </div>

                <div class="pagination" v-if="totalPages > 1">
                    <button class="pagination-btn" :disabled="page <= 1" @click="page--; loadCheckins()">上一页</button>
                    <span style="font-size: 13px; color: var(--text-secondary);">{{ page }} / {{ totalPages }}</span>
                    <button class="pagination-btn" :disabled="page >= totalPages" @click="page++; loadCheckins()">下一页</button>
                </div>
            </div>

            <div class="modal-overlay" v-if="showCheckinModal" @click.self="showCheckinModal = false">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">代签到</span>
                        <span class="modal-close" @click="showCheckinModal = false">✕</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">用户ID</label>
                            <input class="form-control" type="number" v-model.number="checkinForm.user_id">
                        </div>
                        <div class="form-group">
                            <label class="form-label">课程ID</label>
                            <input class="form-control" type="number" v-model.number="checkinForm.course_id">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" @click="showCheckinModal = false">取消</button>
                        <button class="btn btn-primary" @click="handleAdminCheckin" :disabled="checkinLoading">
                            {{ checkinLoading ? '提交中...' : '签到' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            checkins: [],
            keyword: '',
            page: 1,
            totalPages: 1,
            showCheckinModal: false,
            checkinLoading: false,
            checkinForm: { user_id: '', course_id: '' }
        };
    },
    methods: {
        async loadCheckins() {
            try {
                const params = { page: this.page, page_size: 10 };
                if (this.keyword) params.keyword = this.keyword;
                const result = await CheckinService.getAllList(params);
                if (result.code === 0) {
                    this.checkins = result.data.items;
                    this.totalPages = result.data.total_pages;
                }
            } catch (e) {
                Toast.error('加载失败');
            }
        },
        async completeCheckin(checkinId) {
            try {
                const result = await CheckinService.updateStatus(checkinId, 1);
                if (result.code === 0) {
                    Toast.success('操作成功');
                    this.loadCheckins();
                } else {
                    Toast.error(result.msg || '操作失败');
                }
            } catch (e) {
                Toast.error('操作失败');
            }
        },
        async handleAdminCheckin() {
            if (!this.checkinForm.user_id || !this.checkinForm.course_id) {
                Toast.warning('请填写用户ID和课程ID');
                return;
            }
            this.checkinLoading = true;
            try {
                const result = await CheckinService.adminCheckin(this.checkinForm.user_id, this.checkinForm.course_id);
                if (result.code === 0) {
                    Toast.success('签到成功');
                    this.showCheckinModal = false;
                    this.checkinForm = { user_id: '', course_id: '' };
                    this.loadCheckins();
                } else {
                    Toast.error(result.msg || '签到失败');
                }
            } catch (e) {
                Toast.error('签到失败');
            } finally {
                this.checkinLoading = false;
            }
        },
        formatTime(time) {
            if (!time) return '-';
            const d = new Date(time);
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
    },
    mounted() {
        this.loadCheckins();
    }
};

window.AdminCheckinManage = AdminCheckinManage;
