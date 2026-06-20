(function() {
    const ref = Vue.ref;
    const onMounted = Vue.onMounted;
    const computed = Vue.computed;
    const watch = Vue.watch;

    const TalkDetail = {
        name: 'TalkDetail',
        props: {
            talkId: { type: Number, required: true },
            isLoggedIn: { type: Boolean, default: false },
            isAdmin: { type: Boolean, default: false },
            currentUser: { type: Object, default: null }
        },
        emits: ['back', 'go-login'],
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

            const submitting = ref(false);
            const submittingFeedback = ref(false);

            const fillUserInfo = () => {
                if (props.currentUser) {
                    registerForm.value.student_id = props.currentUser.student_id || props.currentUser.username || '';
                    registerForm.value.student_name = props.currentUser.real_name || props.currentUser.username || '';
                    registerForm.value.phone = props.currentUser.phone || '';
                    registerForm.value.major = props.currentUser.major || '';
                    
                    feedbackForm.value.student_id = props.currentUser.student_id || props.currentUser.username || '';
                    feedbackForm.value.student_name = props.currentUser.real_name || props.currentUser.username || '';
                }
            };

            watch(() => props.currentUser, fillUserInfo, { immediate: true });
            watch(() => props.talkId, () => {
                if (props.talkId) {
                    loadTalkDetail();
                }
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
                if (!props.isLoggedIn) return;
                fillUserInfo();
                const sid = registerForm.value.student_id;
                if (!sid) return;
                
                try {
                    const result = await CareerTalkApi.checkRegistrationStatus(props.talkId, sid);
                    if (result.code === 0) {
                        registrationStatus.value = result.data;
                    }
                } catch (error) {
                    console.error('检查报名状态失败:', error);
                }
            };

            const checkFeedbackStatus = async () => {
                if (!props.isLoggedIn) return;
                fillUserInfo();
                const sid = feedbackForm.value.student_id;
                if (!sid) return;
                
                try {
                    const result = await CareerTalkApi.getFeedbackStatus(props.talkId, sid);
                    if (result.code === 0) {
                        feedbackStatus.value = result.data;
                    }
                } catch (error) {
                    console.error('检查反馈状态失败:', error);
                }
            };

            const openRegisterModal = () => {
                if (!props.isLoggedIn) {
                    Toast.warning('请先登录再报名');
                    emit('go-login');
                    return;
                }
                fillUserInfo();
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

                submitting.value = true;
                try {
                    const result = await CareerTalkApi.registerTalk({
                        talk_id: props.talkId,
                        ...registerForm.value
                    });
                    if (result.code === 0) {
                        Toast.success('报名成功！');
                        showRegisterModal.value = false;
                        loadTalkDetail();
                        checkRegistrationStatus();
                    } else {
                        Toast.error(result.message || '报名失败');
                    }
                } finally {
                    submitting.value = false;
                }
            };

            const openFeedbackModal = () => {
                if (!props.isLoggedIn) {
                    Toast.warning('请先登录再提交反馈');
                    emit('go-login');
                    return;
                }
                if (!registrationStatus.value.is_checked_in) {
                    Toast.warning('请先签到后再提交反馈');
                    return;
                }
                if (feedbackStatus.value.has_submitted) {
                    Toast.info('您已提交过反馈');
                    return;
                }
                fillUserInfo();
                feedbackForm.value.rating = 5;
                feedbackForm.value.content = '';
                showFeedbackModal.value = true;
            };

            const handleFeedback = async () => {
                if (!feedbackForm.value.student_id) {
                    Toast.error('请输入学号');
                    return;
                }
                if (feedbackForm.value.rating < 1) {
                    Toast.error('请选择评分');
                    return;
                }

                submittingFeedback.value = true;
                try {
                    const result = await CareerTalkApi.submitFeedback({
                        talk_id: props.talkId,
                        ...feedbackForm.value
                    });
                    if (result.code === 0) {
                        Toast.success('反馈提交成功，感谢您的评价！');
                        showFeedbackModal.value = false;
                        loadTalkDetail();
                        checkFeedbackStatus();
                    } else {
                        Toast.error(result.message || '提交失败');
                    }
                } finally {
                    submittingFeedback.value = false;
                }
            };

            const starClass = (r) => {
                const active = (hoverRating.value || feedbackForm.value.rating) >= r;
                return 'star ' + (active ? 'active' : '');
            };

            const ratingDist = computed(() => {
                if (!talk.value || !talk.value.feedback_stats) return [];
                const dist = talk.value.feedback_stats.rating_distribution || {};
                const result = [];
                for (let i = 5; i >= 1; i--) {
                    result.push({ rating: i, count: dist[i] || 0 });
                }
                return result;
            });

            const maxCount = computed(() => {
                const counts = ratingDist.value.map(d => d.count);
                return Math.max(1, ...counts);
            });

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
                submitting,
                submittingFeedback,
                loadTalkDetail,
                openRegisterModal,
                handleRegister,
                openFeedbackModal,
                handleFeedback,
                starClass,
                ratingDist,
                maxCount
            };
        },
        template: `
            <div>
                <div class="page-header">
                    <button class="btn btn-ghost" @click="$emit('back')">← 返回列表</button>
                </div>

                <div v-if="loading" class="loading">加载中...</div>

                <template v-else-if="talk">
                    <div class="detail-card">
                        <div class="detail-header">
                            <div class="company-info">
                                <div class="company-logo">{{ talk.company_name.charAt(0) }}</div>
                                <div>
                                    <h2 class="company-name">{{ talk.company_name }}</h2>
                                    <div class="short-code-badge">短码: {{ talk.short_code }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="detail-body">
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-icon">🕒</span>
                                    <div>
                                        <div class="info-label">宣讲时间</div>
                                        <div class="info-value">{{ talk.talk_time }}</div>
                                    </div>
                                </div>
                                <div class="info-item">
                                    <span class="info-icon">📍</span>
                                    <div>
                                        <div class="info-label">宣讲地点</div>
                                        <div class="info-value">{{ talk.location }}</div>
                                    </div>
                                </div>
                            </div>

                            <div class="stats-row">
                                <div class="stat-item">
                                    <div class="stat-number">{{ talk.registration_count || 0 }}</div>
                                    <div class="stat-label">报名人数</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number">{{ talk.checkin_count || 0 }}</div>
                                    <div class="stat-label">签到人数</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number">{{ talk.feedback_count || 0 }}</div>
                                    <div class="stat-label">反馈数</div>
                                </div>
                                <div v-if="talk.feedback_stats" class="stat-item">
                                    <div class="stat-number star-number">
                                        ⭐ {{ talk.feedback_stats.avg_rating?.toFixed(1) || '-' }}
                                    </div>
                                    <div class="stat-label">平均评分</div>
                                </div>
                            </div>

                            <div v-if="talk.description" class="description">
                                <h4>宣讲会简介</h4>
                                <p>{{ talk.description }}</p>
                            </div>

                            <div class="action-buttons">
                                <button 
                                    class="btn btn-primary"
                                    @click="openRegisterModal"
                                    :disabled="registrationStatus.is_registered"
                                    :class="{ 'btn-disabled': registrationStatus.is_registered }"
                                >
                                    {{ registrationStatus.is_registered ? '✓ 已报名' : '� 立即报名' }}
                                </button>
                                <button 
                                    class="btn btn-success"
                                    @click="openFeedbackModal"
                                    :class="{ 'btn-outline': feedbackStatus.has_submitted }"
                                >
                                    {{ feedbackStatus.has_submitted ? '✓ 已反馈' : '💬 填写反馈' }}
                                </button>
                                <div v-if="registrationStatus.is_checked_in" class="badge-success" style="margin-left: 12px;">
                                    ✓ 已签到
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="talk.feedback_stats && talk.feedback_stats.total_count > 0" class="detail-card">
                        <div class="card-header">
                            <h3>📊 反馈统计</h3>
                        </div>
                        <div class="card-body">
                            <div class="stats-overview">
                                <div class="big-rating">
                                    <div class="avg-score">{{ talk.feedback_stats.avg_rating?.toFixed(1) }}</div>
                                    <div class="avg-stars">
                                        <span v-for="i in 5" :key="i" 
                                            :class="['small-star', { 'active': i <= Math.round(talk.feedback_stats.avg_rating) }]">★</span>
                                    </div>
                                    <div class="total-feedback">共 {{ talk.feedback_stats.total_count }} 条反馈</div>
                                </div>
                                <div class="rating-bars">
                                    <div v-for="item in ratingDist" :key="item.rating" class="bar-row">
                                        <span class="bar-label">{{ item.rating }}星</span>
                                        <div class="bar-track">
                                            <div 
                                                class="bar-fill" 
                                                :style="{ width: (item.count / maxCount * 100) + '%' }"
                                            ></div>
                                        </div>
                                        <span class="bar-count">{{ item.count }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        `
    };

    window.TalkDetail = TalkDetail;
})();
