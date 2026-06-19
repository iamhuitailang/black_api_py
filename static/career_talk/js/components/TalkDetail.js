(function() {
    const ref = Vue.ref;
    const onMounted = Vue.onMounted;
    const computed = Vue.computed;

    const TalkDetail = {
        name: 'TalkDetail',
        props: {
            talkId: {
                type: Number,
                required: true
            }
        },
    emits: ['back'],
    setup(props, { emit }) {
        const talk = ref(null);
        const loading = ref(false);
        const showRegisterModal = ref(false);
        const showFeedbackModal = ref(false);

        const registerForm = ref({
            student_id: '',
            student_name: '',
            phone: '',
            major: ''
        });

        const feedbackForm = ref({
            student_id: '',
            student_name: '',
            rating: 0,
            content: ''
        });

        const hoverRating = ref(0);
        const registrationStatus = ref({
            is_registered: false,
            is_checked_in: false
        });

        const feedbackStatus = ref({
            has_submitted: false,
            feedback: null
        });

        const loadTalkDetail = async () => {
            loading.value = true;
            try {
                const result = await CareerTalkApi.getTalkDetail(props.talkId);
                if (result.code === 0) {
                    talk.value = result.data;
                } else {
                    Toast.error(result.message || '加载失败');
                }
            } catch (error) {
                Toast.error('网络错误，请稍后重试');
            } finally {
                loading.value = false;
            }
        };

        const checkRegistrationStatus = async () => {
            const studentId = localStorage.getItem('student_id');
            if (!studentId) return;
            
            try {
                const result = await CareerTalkApi.checkRegistrationStatus(props.talkId, studentId);
                if (result.code === 0) {
                    registrationStatus.value = result.data;
                }
            } catch (error) {
                console.error('检查报名状态失败:', error);
            }
        };

        const checkFeedbackStatus = async () => {
            const studentId = localStorage.getItem('student_id');
            if (!studentId) return;
            
            try {
                const result = await CareerTalkApi.getFeedbackStatus(props.talkId, studentId);
                if (result.code === 0) {
                    feedbackStatus.value = result.data;
                }
            } catch (error) {
                console.error('检查反馈状态失败:', error);
            }
        };

        const openRegisterModal = () => {
            const studentId = localStorage.getItem('student_id');
            const studentName = localStorage.getItem('student_name');
            if (studentId) registerForm.value.student_id = studentId;
            if (studentName) registerForm.value.student_name = studentName;
            showRegisterModal.value = true;
        };

        const handleRegister = async () => {
            if (!registerForm.value.student_id) {
                Toast.error('请输入学号');
                return;
            }
            if (!registerForm.value.student_name) {
                Toast.error('请输入姓名');
                return;
            }

            try {
                const result = await CareerTalkApi.register({
                    talk_id: props.talkId,
                    ...registerForm.value
                });
                if (result.code === 0) {
                    Toast.success('报名成功！');
                    localStorage.setItem('student_id', registerForm.value.student_id);
                    localStorage.setItem('student_name', registerForm.value.student_name);
                    showRegisterModal.value = false;
                    loadTalkDetail();
                    checkRegistrationStatus();
                } else {
                    Toast.error(result.message || '报名失败');
                }
            } catch (error) {
                Toast.error('网络错误，请稍后重试');
            }
        };

        const openFeedbackModal = () => {
            const studentId = localStorage.getItem('student_id');
            const studentName = localStorage.getItem('student_name');
            if (studentId) feedbackForm.value.student_id = studentId;
            if (studentName) feedbackForm.value.student_name = studentName;
            feedbackForm.value.rating = 0;
            feedbackForm.value.content = '';
            showFeedbackModal.value = true;
        };

        const handleSubmitFeedback = async () => {
            if (!feedbackForm.value.student_id) {
                Toast.error('请输入学号');
                return;
            }
            if (!feedbackForm.value.rating) {
                Toast.error('请选择评分');
                return;
            }

            try {
                const result = await CareerTalkApi.submitFeedback({
                    talk_id: props.talkId,
                    ...feedbackForm.value
                });
                if (result.code === 0) {
                    Toast.success('反馈提交成功！');
                    localStorage.setItem('student_id', feedbackForm.value.student_id);
                    if (feedbackForm.value.student_name) {
                        localStorage.setItem('student_name', feedbackForm.value.student_name);
                    }
                    showFeedbackModal.value = false;
                    loadTalkDetail();
                    checkFeedbackStatus();
                } else {
                    Toast.error(result.message || '提交失败');
                }
            } catch (error) {
                Toast.error('网络错误，请稍后重试');
            }
        };

        const setRating = (rating) => {
            feedbackForm.value.rating = rating;
        };

        const barChartData = computed(() => {
            if (!talk.value?.feedback_stats?.rating_distribution) {
                return [];
            }
            const dist = talk.value.feedback_stats.rating_distribution;
            const maxCount = Math.max(...Object.values(dist), 1);
            return [5, 4, 3, 2, 1].map(rating => ({
                rating,
                count: dist[rating] || 0,
                height: Math.max((dist[rating] || 0) / maxCount * 100, 2) + '%'
            }));
        });

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const goBack = () => {
            emit('back');
        };

        onMounted(() => {
            loadTalkDetail();
            checkRegistrationStatus();
            checkFeedbackStatus();
        });

        return {
            talk,
            loading,
            showRegisterModal,
            showFeedbackModal,
            registerForm,
            feedbackForm,
            hoverRating,
            registrationStatus,
            feedbackStatus,
            barChartData,
            loadTalkDetail,
            openRegisterModal,
            handleRegister,
            openFeedbackModal,
            handleSubmitFeedback,
            setRating,
            formatDate,
            goBack
        };
    },
    template: `
        <div>
            <button class="btn btn-secondary btn-sm" @click="goBack" style="margin-bottom: 16px;">
                ← 返回列表
            </button>

            <div v-if="loading" class="empty-state">
                <p>加载中...</p>
            </div>

            <template v-else-if="talk">
                <div class="detail-header">
                    <h2 class="detail-title">{{ talk.company_name }}</h2>
                    
                    <div class="detail-info">
                        <div class="detail-info-item">
                            <div class="detail-info-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            </div>
                            <div class="detail-info-content">
                                <div class="detail-info-label">宣讲时间</div>
                                <div class="detail-info-value">{{ formatDate(talk.talk_time) }}</div>
                            </div>
                        </div>

                        <div class="detail-info-item">
                            <div class="detail-info-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </div>
                            <div class="detail-info-content">
                                <div class="detail-info-label">宣讲地点</div>
                                <div class="detail-info-value">{{ talk.location }}</div>
                            </div>
                        </div>

                        <div class="detail-info-item">
                            <div class="detail-info-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                </svg>
                            </div>
                            <div class="detail-info-content">
                                <div class="detail-info-label">签到短码</div>
                                <div class="short-code-badge">{{ talk.short_code }}</div>
                            </div>
                        </div>

                        <div class="detail-info-item">
                            <div class="detail-info-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <div class="detail-info-content">
                                <div class="detail-info-label">活动状态</div>
                                <div class="detail-info-value">
                                    <span class="badge" :class="talk.status === 1 ? 'badge-success' : 'badge-danger'">
                                        {{ talk.status === 1 ? '进行中' : '已结束' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card primary">
                            <div class="stat-value">{{ talk.registration_count }}</div>
                            <div class="stat-label">报名人数</div>
                        </div>
                        <div class="stat-card success">
                            <div class="stat-value">{{ talk.checkin_count }}</div>
                            <div class="stat-label">签到人数</div>
                        </div>
                        <div class="stat-card warning">
                            <div class="stat-value">{{ talk.feedback_count }}</div>
                            <div class="stat-label">反馈数量</div>
                        </div>
                        <div class="stat-card info">
                            <div class="stat-value">{{ talk.feedback_stats?.avg_rating || 0 }}</div>
                            <div class="stat-label">平均评分</div>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">📝 宣讲简介</h3>
                        <p style="color: var(--text-secondary); line-height: 1.8;">
                            {{ talk.description || '暂无简介' }}
                        </p>
                    </div>

                    <div class="detail-actions">
                        <button 
                            class="btn btn-primary btn-lg" 
                            @click="openRegisterModal"
                            :disabled="registrationStatus.is_registered"
                        >
                            {{ registrationStatus.is_registered ? '✓ 已报名' : '📝 立即报名' }}
                        </button>
                        <button 
                            class="btn btn-success btn-lg" 
                            @click="openFeedbackModal"
                            :disabled="feedbackStatus.has_submitted"
                        >
                            {{ feedbackStatus.has_submitted ? '✓ 已反馈' : '💬 提交反馈' }}
                        </button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">📊 反馈统计</h3>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <h4 class="chart-title">评分分布</h4>
                            <div class="bar-chart">
                                <div 
                                    v-for="item in barChartData" 
                                    :key="item.rating"
                                    class="bar-item"
                                >
                                    <div class="bar" :style="{ height: item.height }">
                                        <span class="bar-value">{{ item.count }}</span>
                                    </div>
                                    <div class="bar-label">{{ item.rating }} 星</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <div v-if="showRegisterModal" class="modal-overlay show" @click.self="showRegisterModal = false">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">📝 宣讲会报名</h3>
                        <button class="modal-close" @click="showRegisterModal = false">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">
                                学号<span class="required">*</span>
                            </label>
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="registerForm.student_id"
                                placeholder="请输入学号"
                            >
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                姓名<span class="required">*</span>
                            </label>
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="registerForm.student_name"
                                placeholder="请输入姓名"
                            >
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">手机号</label>
                                <input 
                                    type="tel" 
                                    class="form-control" 
                                    v-model="registerForm.phone"
                                    placeholder="请输入手机号"
                                >
                            </div>
                            <div class="form-group">
                                <label class="form-label">专业</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="registerForm.major"
                                    placeholder="请输入专业"
                                >
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="showRegisterModal = false">取消</button>
                        <button class="btn btn-primary" @click="handleRegister">确认报名</button>
                    </div>
                </div>
            </div>

            <div v-if="showFeedbackModal" class="modal-overlay show" @click.self="showFeedbackModal = false">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">💬 提交反馈</h3>
                        <button class="modal-close" @click="showFeedbackModal = false">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">
                                学号<span class="required">*</span>
                            </label>
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="feedbackForm.student_id"
                                placeholder="请输入学号"
                            >
                        </div>
                        <div class="form-group">
                            <label class="form-label">姓名</label>
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="feedbackForm.student_name"
                                placeholder="请输入姓名"
                            >
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                评分<span class="required">*</span>
                            </label>
                            <div class="rating-stars">
                                <span 
                                    v-for="star in 5" 
                                    :key="star"
                                    class="star"
                                    :class="{ filled: star <= feedbackForm.rating }"
                                    @click="setRating(star)"
                                    @mouseenter="hoverRating = star"
                                    @mouseleave="hoverRating = 0"
                                >
                                    {{ star <= (hoverRating || feedbackForm.rating) ? '★' : '☆' }}
                                </span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">反馈内容</label>
                            <textarea 
                                class="form-control" 
                                v-model="feedbackForm.content"
                                placeholder="请输入您的反馈意见..."
                                rows="4"
                            ></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="showFeedbackModal = false">取消</button>
                        <button class="btn btn-primary" @click="handleSubmitFeedback">提交反馈</button>
                    </div>
                </div>
            </div>
        </div>
    `
    };

    window.TalkDetail = TalkDetail;
})();
