const UserDetailPage = {
    template: `
        <div class="container">
            <div v-if="user">
                <div class="profile-header">
                    <div class="profile-avatar">
                        {{ user.nickname.charAt(0) }}
                    </div>
                    <div class="profile-name">{{ user.nickname }}</div>
                    <span :class="['gender-badge', user.gender === 1 ? 'gender-male' : 'gender-female']">
                        {{ user.gender_text }}
                    </span>
                    <div style="margin-top: 15px;">
                        <button class="btn-small btn-heart" @click="sendHeart" style="margin-right: 10px;">
                            ❤️ 发送心动
                        </button>
                        <button class="btn-small btn-secondary" @click="complain">
                            投诉
                        </button>
                    </div>
                </div>

                <div class="profile-info-grid">
                    <div class="profile-info-item">
                        <div class="info-label">年龄</div>
                        <div class="info-value">{{ user.age || '未设置' }}</div>
                    </div>
                    <div class="profile-info-item">
                        <div class="info-label">身高</div>
                        <div class="info-value">{{ user.height ? user.height + 'cm' : '未设置' }}</div>
                    </div>
                    <div class="profile-info-item">
                        <div class="info-label">体重</div>
                        <div class="info-value">{{ user.weight ? user.weight + 'kg' : '未设置' }}</div>
                    </div>
                    <div class="profile-info-item">
                        <div class="info-label">学历</div>
                        <div class="info-value">{{ user.education || '未设置' }}</div>
                    </div>
                    <div class="profile-info-item">
                        <div class="info-label">职业</div>
                        <div class="info-value">{{ user.occupation || '未设置' }}</div>
                    </div>
                    <div class="profile-info-item">
                        <div class="info-label">收入</div>
                        <div class="info-value">{{ user.income || '未设置' }}</div>
                    </div>
                    <div class="profile-info-item">
                        <div class="info-label">城市</div>
                        <div class="info-value">{{ user.city || '未设置' }}</div>
                    </div>
                    <div class="profile-info-item">
                        <div class="info-label">区域</div>
                        <div class="info-value">{{ user.district || '未设置' }}</div>
                    </div>
                </div>

                <div class="card" style="margin-top: 20px;">
                    <h3 style="margin-bottom: 15px;">自我介绍</h3>
                    <p>{{ user.introduction || '暂无' }}</p>
                </div>

                <div class="card">
                    <h3 style="margin-bottom: 15px;">兴趣爱好</h3>
                    <p>{{ user.interest || '暂无' }}</p>
                </div>
            </div>

            <div v-if="showComplaintModal" class="modal-overlay" @click.self="showComplaintModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">投诉用户</div>
                        <button class="modal-close" @click="showComplaintModal = false">&times;</button>
                    </div>
                    <div class="form-group">
                        <label>投诉原因</label>
                        <input type="text" v-model="complaintForm.reason" placeholder="请输入投诉原因">
                    </div>
                    <div class="form-group">
                        <label>详细描述</label>
                        <textarea v-model="complaintForm.description" rows="4" placeholder="请详细描述投诉内容"></textarea>
                    </div>
                    <button class="btn btn-primary" @click="submitComplaint" :disabled="submitting">
                        {{ submitting ? '提交中...' : '提交投诉' }}
                    </button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            user: null,
            showComplaintModal: false,
            complaintForm: {
                reason: '',
                description: ''
            },
            submitting: false
        };
    },
    mounted() {
        this.loadUser();
    },
    methods: {
        async loadUser() {
            const userId = this.$route.params.id;
            const result = await Api.get('/jaoyou/user/detail/get', { user_id: userId });
            if (result.code === 0) {
                this.user = result.data;
            }
        },
        async sendHeart() {
            const result = await Api.post('/jaoyou/heart/send', { to_user_id: this.user.id });
            if (result.code === 0) {
                alert('心动发送成功！');
            } else {
                alert(result.msg);
            }
        },
        complain() {
            this.showComplaintModal = true;
        },
        async submitComplaint() {
            if (!this.complaintForm.reason) {
                alert('请填写投诉原因');
                return;
            }

            this.submitting = true;
            const result = await Api.post('/jaoyou/complaint/create', {
                to_user_id: this.user.id,
                reason: this.complaintForm.reason,
                description: this.complaintForm.description
            });
            this.submitting = false;

            if (result.code === 0) {
                alert('投诉提交成功');
                this.showComplaintModal = false;
                this.complaintForm = { reason: '', description: '' };
            } else {
                alert(result.msg);
            }
        }
    }
};
