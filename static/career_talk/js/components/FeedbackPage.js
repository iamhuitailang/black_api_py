(function() {
    const ref = Vue.ref;
    const computed = Vue.computed;
    const watch = Vue.watch;

    const FeedbackPage = {
        name: 'FeedbackPage',
        props: {
            talkId: { type: Number, default: null },
            isLoggedIn: { type: Boolean, default: false },
            currentUser: { type: Object, default: null }
        },
        emits: ['go-login', 'back'],
        setup(props, { emit }) {
            const talkList = ref([]);
            const selectedTalkId = ref(props.talkId || null);
            const rating = ref(5);
            const content = ref('');
            const studentId = ref('');
            const studentName = ref('');
            const submitted = ref(false);
            const loading = ref(false);
            const submitting = ref(false);

            const hoverRating = ref(0);

            const setRating = (r) => {
                rating.value = r;
            };

            const fillUserInfo = () => {
                if (props.currentUser) {
                    if (!studentId.value) {
                        studentId.value = props.currentUser.student_id || props.currentUser.username || '';
                    }
                    if (!studentName.value) {
                        studentName.value = props.currentUser.real_name || props.currentUser.username || '';
                    }
                }
            };

            watch(() => props.currentUser, fillUserInfo, { immediate: true });
            watch(() => props.talkId, (val) => {
                if (val) selectedTalkId.value = val;
            });

            const loadTalks = async () => {
                loading.value = true;
                try {
                    const res = await CareerTalkApi.getTalkList(1, 100);
                    if (res.code === 0) {
                        talkList.value = res.data.items || [];
                    }
                } catch (e) {}
                finally { loading.value = false; }
            };

            loadTalks();

            const handleSubmit = async () => {
                if (!props.isLoggedIn) {
                    emit('go-login');
                    return;
                }
                fillUserInfo();
                if (!selectedTalkId.value) {
                    Toast.error('请选择宣讲会');
                    return;
                }
                if (!studentId.value.trim()) {
                    Toast.error('请输入学号');
                    return;
                }

                submitting.value = true;
                try {
                    const res = await CareerTalkApi.submitFeedback({
                        talk_id: parseInt(selectedTalkId.value),
                        student_id: studentId.value.trim(),
                        student_name: studentName.value.trim(),
                        rating: rating.value,
                        content: content.value.trim()
                    });
                    if (res.code === 0) {
                        submitted.value = true;
                        Toast.success('反馈提交成功，感谢您的评价！');
                    } else {
                        Toast.error(res.message || '提交失败');
                    }
                } catch (e) {
                    Toast.error('网络错误，请稍后重试');
                } finally {
                    submitting.value = false;
                }
            };

            const resetForm = () => {
                submitted.value = false;
                rating.value = 5;
                content.value = '';
            };

            const starClass = (r) => {
                const active = (hoverRating.value || rating.value) >= r;
                return active ? 'star active' : 'star';
            };

            return {
                talkList,
                selectedTalkId,
                rating,
                content,
                studentId,
                studentName,
                submitted,
                loading,
                submitting,
                hoverRating,
                setRating,
                handleSubmit,
                resetForm,
                starClass
            };
        },
        template: `
            <div>
                <div class="page-header">
                    <button class="btn btn-ghost" @click="$emit('back')" style="margin-right: 12px;">← 返回</button>
                    <h2>💬 宣讲会反馈</h2>
                </div>

                <div v-if="!isLoggedIn" class="card" style="max-width: 600px; margin: 40px auto; text-align: center;">
                    <div class="card-body">
                        <div style="font-size: 60px; margin-bottom: 16px;">🔐</div>
                        <h3>请先登录</h3>
                        <p style="color: #666; margin: 12px 0 24px;">反馈功能需要登录后使用</p>
                        <button class="btn btn-primary" @click="$emit('go-login')">前往登录</button>
                    </div>
                </div>

                <div v-else class="card" style="max-width: 600px; margin: 0 auto;">
                    <div class="card-body">
                        <div v-if="submitted" style="text-align: center; padding: 24px 0;">
                            <div class="success-icon" style="margin: 0 auto 16px;">🎉</div>
                            <h3 style="color: #10b981;">感谢您的反馈！</h3>
                            <p style="color: #666; margin: 12px 0 24px;">您的反馈将帮助我们改进</p>
                            <button class="btn btn-outline" @click="resetForm">继续提交其他反馈</button>
                        </div>

                        <form v-else @submit.prevent="handleSubmit" class="feedback-form">
                            <div class="form-group">
                                <label class="form-label">选择宣讲会<span class="required">*</span></label>
                                <select 
                                    v-model="selectedTalkId" 
                                    class="form-control"
                                    :disabled="!!talkId"
                                    style="appearance: none; background-image: url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22%3E%3Cpath fill=%22%23666%22 d=%22M6 9L1 4h10z%22/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px;"
                                >
                                    <option value="" disabled>请选择宣讲会</option>
                                    <option v-for="t in talkList" :key="t.id" :value="t.id">
                                        {{ t.company_name }} - {{ t.location }}
                                    </option>
                                </select>
                            </div>

                            <div class="form-row">
                                <div class="form-group half">
                                    <label class="form-label">学号<span class="required">*</span></label>
                                    <input v-model="studentId" type="text" class="form-control" placeholder="请输入学号" />
                                </div>
                                <div class="form-group half">
                                    <label class="form-label">姓名</label>
                                    <input v-model="studentName" type="text" class="form-control" placeholder="请输入姓名" />
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">评分<span class="required">*</span></label>
                                <div class="rating-stars" @mouseleave="hoverRating = 0">
                                    <span 
                                        v-for="r in 5" 
                                        :key="r"
                                        :class="starClass(r)"
                                        @mouseenter="hoverRating = r"
                                        @click="setRating(r)"
                                    >★</span>
                                    <span class="rating-text" style="margin-left: 12px; color: #666;">
                                        {{ rating === 5 ? '非常满意' : rating === 4 ? '满意' : rating === 3 ? '一般' : rating === 2 ? '不满意' : '非常不满意' }}
                                    </span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">反馈内容</label>
                                <textarea 
                                    v-model="content" 
                                    class="form-control" 
                                    rows="4"
                                    placeholder="请分享您的参会感受和建议..."
                                    style="resize: vertical;"
                                ></textarea>
                            </div>

                            <button 
                                type="submit" 
                                class="btn btn-primary btn-block"
                                :disabled="submitting"
                            >
                                {{ submitting ? '提交中...' : '提交反馈' }}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `
    };

    window.FeedbackPage = FeedbackPage;
})();
