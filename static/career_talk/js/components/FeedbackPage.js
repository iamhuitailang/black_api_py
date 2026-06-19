(function() {
    const ref = Vue.ref;
    const onMounted = Vue.onMounted;

    const FeedbackPage = {
        name: 'FeedbackPage',
        props: {
        talkId: {
            type: Number,
            default: null
        }
    },
    emits: ['back'],
    setup(props, { emit }) {
        const talkList = ref([]);
        const selectedTalkId = ref(null);
        const feedbackForm = ref({
            student_id: '',
            student_name: '',
            rating: 0,
            content: ''
        });
        const hoverRating = ref(0);
        const submitted = ref(false);
        const loading = ref(false);
        const submittedFeedback = ref(null);

        const loadTalkList = async () => {
            try {
                const result = await CareerTalkApi.getTalkList(1, 100);
                if (result.code === 0) {
                    talkList.value = result.data.items || [];
                }
            } catch (error) {
                console.error('加载宣讲会列表失败:', error);
            }
        };

        const setRating = (rating) => {
            feedbackForm.value.rating = rating;
        };

        const handleSubmit = async () => {
            const tid = props.talkId || selectedTalkId.value;
            
            if (!tid) {
                Toast.error('请选择宣讲会');
                return;
            }
            if (!feedbackForm.value.student_id.trim()) {
                Toast.error('请输入学号');
                return;
            }
            if (!feedbackForm.value.rating) {
                Toast.error('请选择评分');
                return;
            }

            loading.value = true;
            try {
                const result = await CareerTalkApi.submitFeedback({
                    talk_id: tid,
                    student_id: feedbackForm.value.student_id.trim(),
                    student_name: feedbackForm.value.student_name.trim(),
                    rating: feedbackForm.value.rating,
                    content: feedbackForm.value.content
                });
                if (result.code === 0) {
                    submitted.value = true;
                    submittedFeedback.value = result.data;
                    localStorage.setItem('student_id', feedbackForm.value.student_id.trim());
                    if (feedbackForm.value.student_name.trim()) {
                        localStorage.setItem('student_name', feedbackForm.value.student_name.trim());
                    }
                    Toast.success('反馈提交成功！');
                } else {
                    Toast.error(result.message || '提交失败');
                }
            } catch (error) {
                Toast.error('网络错误，请稍后重试');
            } finally {
                loading.value = false;
            }
        };

        const loadSavedInfo = () => {
            const savedStudentId = localStorage.getItem('student_id');
            const savedStudentName = localStorage.getItem('student_name');
            if (savedStudentId) feedbackForm.value.student_id = savedStudentId;
            if (savedStudentName) feedbackForm.value.student_name = savedStudentName;
        };

        const resetForm = () => {
            submitted.value = false;
            submittedFeedback.value = null;
            feedbackForm.value = {
                student_id: localStorage.getItem('student_id') || '',
                student_name: localStorage.getItem('student_name') || '',
                rating: 0,
                content: ''
            };
        };

        const goBack = () => {
            emit('back');
        };

        const ratingLabels = ['很差', '较差', '一般', '满意', '非常满意'];

        onMounted(() => {
            loadSavedInfo();
            if (!props.talkId) {
                loadTalkList();
            } else {
                selectedTalkId.value = props.talkId;
            }
        });

        return {
            talkList,
            selectedTalkId,
            feedbackForm,
            hoverRating,
            submitted,
            loading,
            submittedFeedback,
            setRating,
            handleSubmit,
            resetForm,
            goBack,
            ratingLabels
        };
    },
    template: `
        <div>
            <button 
                v-if="talkId"
                class="btn btn-secondary btn-sm" 
                @click="goBack" 
                style="margin-bottom: 16px;"
            >
                ← 返回
            </button>

            <div class="page-header">
                <h2>💬 反馈评价</h2>
            </div>

            <div class="card" style="max-width: 600px; margin: 0 auto;">
                <div class="card-body">
                    <div v-if="!submitted">
                        <div v-if="!talkId" class="form-group">
                            <label class="form-label">
                                选择宣讲会<span class="required">*</span>
                            </label>
                            <select 
                                class="form-control"
                                v-model="selectedTalkId"
                            >
                                <option value="">请选择宣讲会</option>
                                <option 
                                    v-for="talk in talkList" 
                                    :key="talk.id" 
                                    :value="talk.id"
                                >
                                    {{ talk.company_name }} - {{ talk.talk_time }}
                                </option>
                            </select>
                        </div>

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
                                placeholder="请输入姓名（选填）"
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label">
                                总体评分<span class="required">*</span>
                            </label>
                            <div class="rating-stars" style="margin-bottom: 8px;">
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
                            <p v-if="feedbackForm.rating" style="color: var(--text-secondary); font-size: 13px;">
                                {{ ratingLabels[feedbackForm.rating - 1] }}
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">反馈内容</label>
                            <textarea 
                                class="form-control" 
                                v-model="feedbackForm.content"
                                placeholder="请输入您的反馈意见和建议..."
                                rows="6"
                            ></textarea>
                        </div>

                        <button 
                            class="btn btn-primary btn-lg" 
                            style="width: 100%;"
                            @click="handleSubmit"
                            :disabled="loading"
                        >
                            {{ loading ? '提交中...' : '提交反馈' }}
                        </button>
                    </div>

                    <div v-else class="checkin-success">
                        <div class="checkin-success-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h3>反馈提交成功！</h3>
                        <p style="margin-bottom: 20px;">
                            感谢您的宝贵意见，我们会持续改进！<br>
                            您的评分：
                            <span style="color: var(--warning-color); font-size: 20px; font-weight: 600;">
                                {{ submittedFeedback?.rating }} 星
                            </span>
                        </p>
                        <button class="btn btn-secondary" @click="resetForm">
                            再提交一份
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
    };

    window.FeedbackPage = FeedbackPage;
})();
