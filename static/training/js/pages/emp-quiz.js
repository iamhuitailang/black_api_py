var _v = VueApi; var ref = _v.ref, reactive = _v.reactive, computed = _v.computed, onMounted = _v.onMounted, watch = _v.watch;
const EmpQuizPage = {
    setup() {
        const availableCourses = ref([]);
        const selectedCourse = ref(null);
        const quizData = ref(null);
        const answers = ref([]);
        const result = ref(null);
        const loading = ref(false);
        const submitting = ref(false);

        const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

        const loadAvailableCourses = async () => {
            loading.value = true;
            try {
                const user = GlobalStore.currentUser;
                if (user) {
                    const res = await Api.getEmployeeCourses(user.id);
                    if (res.code === 0) {
                        availableCourses.value = (res.data || []).filter(c => 
                            c.status === 'checked_in' || c.status === 'confirmed' || c.status === 'completed'
                        );
                    }
                }
            } finally {
                loading.value = false;
            }
        };

        const selectCourse = async (course) => {
            selectedCourse.value = course;
            quizData.value = null;
            answers.value = [];
            result.value = null;

            const user = GlobalStore.currentUser;
            const res = await Api.getEmployeeQuiz(course.course_id, user.id);
            if (res.code === 0) {
                if (res.data && res.data.already_submitted) {
                    result.value = { score: res.data.score, already_submitted: true };
                } else if (res.data && res.data.questions) {
                    quizData.value = res.data;
                    answers.value = new Array(res.data.questions.length).fill(null);
                } else {
                    quizData.value = null;
                }
            } else {
                Utils.showToast(res.message || '加载失败', 'error');
            }
        };

        const selectAnswer = (qIndex, oIndex) => {
            answers.value[qIndex] = oIndex;
        };

        const submitQuiz = async () => {
            const unanswered = answers.value.filter(a => a === null).length;
            if (unanswered > 0) {
                if (!confirm(`还有 ${unanswered} 道题未作答，确定提交吗？`)) return;
            } else {
                if (!confirm('确定提交测评吗？提交后不可修改。')) return;
            }

            submitting.value = true;
            try {
                const res = await Api.submitQuiz(quizData.value.enrollment_id, answers.value);
                if (res.code === 0) {
                    result.value = { score: res.data.score, already_submitted: false };
                    Utils.showToast(`测评提交成功，得分：${res.data.score}分`, 'success');
                } else {
                    Utils.showToast(res.message || '提交失败', 'error');
                }
            } finally {
                submitting.value = false;
            }
        };

        onMounted(() => {
            loadAvailableCourses();
        });

        return {
            availableCourses, selectedCourse, quizData, answers, result,
            loading, submitting, optionLabels,
            selectCourse, selectAnswer, submitQuiz, Utils
        };
    },
    template: `
        <div>
            <div class="page-header">
                <div>
                    <h1 class="page-title">课程测评</h1>
                    <p class="page-subtitle">完成课后测评，才算完成一次培训记录</p>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:280px 1fr;gap:24px;">
                <div>
                    <div class="card" style="padding:16px;">
                        <div style="font-weight:600;margin-bottom:12px;color:#2d3748;">选择课程</div>
                        <div v-if="loading" style="color:#a0aec0;text-align:center;padding:20px;">加载中...</div>
                        <div v-else-if="availableCourses.length === 0" style="color:#a0aec0;text-align:center;padding:20px;">暂无待测评课程</div>
                        <div v-else style="display:flex;flex-direction:column;gap:8px;">
                            <button v-for="c in availableCourses" :key="c.id"
                                    class="btn"
                                    :class="selectedCourse?.id === c.id ? 'btn-primary' : 'btn-secondary'"
                                    style="justify-content:flex-start;text-align:left;flex-direction:column;align-items:flex-start;"
                                    @click="selectCourse(c)">
                                <div style="font-weight:500;">{{ c.title }}</div>
                                <div style="font-size:12px;opacity:0.8;margin-top:2px;">{{ Utils.formatDate(c.datetime) }}</div>
                                <span v-if="c.quiz_result" class="status-badge mt-1" style="margin-top:4px;"
                                      :class="c.quiz_result.score >= 60 ? 'status-completed' : 'status-leave'">
                                    {{ c.quiz_result.score }}分
                                </span>
                                <span v-else-if="c.status === 'completed'" class="status-badge status-completed mt-1" style="margin-top:4px;">已完成</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <div v-if="!selectedCourse" class="empty-state" style="background:white;border-radius:8px;border:1px solid #e2e8f0;">
                        <div class="empty-icon">✍️</div>
                        <p>请在左侧选择一个课程开始测评</p>
                    </div>

                    <div v-else-if="result" class="card" style="padding:40px;text-align:center;">
                        <div :style="{ 
                            fontSize: '80px',
                            marginBottom: '20px',
                            color: result.score >= 60 ? '#38a169' : '#e53e3e'
                        }">
                            {{ result.score >= 60 ? '🎉' : '😢' }}
                        </div>
                        <div style="font-size:24px;font-weight:600;margin-bottom:8px;">
                            测评完成
                        </div>
                        <div style="font-size:48px;font-weight:700;margin:16px 0;"
                             :class="result.score < 60 ? 'score-low' : 'score-pass'">
                            {{ result.score }}分
                        </div>
                        <div style="color:#718096;">
                            <span v-if="result.score >= 60">恭喜您，已通过本次测评！</span>
                            <span v-else>很遗憾，未能通过本次测评（及格线60分）</span>
                        </div>
                        <div v-if="result.already_submitted" style="margin-top:12px;color:#a0aec0;font-size:13px;">
                            （您已提交过本次测评）
                        </div>
                    </div>

                    <div v-else-if="!quizData" class="empty-state" style="background:white;border-radius:8px;border:1px solid #e2e8f0;">
                        <div class="empty-icon">📋</div>
                        <p>该课程暂无测评问卷，请联系HR</p>
                    </div>

                    <div v-else class="quiz-container">
                        <div class="quiz-header">
                            <h2 class="quiz-title">{{ selectedCourse.title }} - 课后测评</h2>
                            <div class="quiz-progress">
                                共 {{ quizData.questions.length }} 道题，已答 {{ answers.filter(a => a !== null).length }} 道
                            </div>
                        </div>
                        <div class="answer-sheet">
                            <div v-for="(q, qIndex) in quizData.questions" :key="qIndex" class="question-card">
                                <span class="question-number">{{ qIndex + 1 }}</span>
                                <span class="question-text">{{ q.question }}</span>
                                <ul class="options-list" style="margin-top:12px;">
                                    <li v-for="(opt, oIndex) in q.options" :key="oIndex"
                                        class="option-item"
                                        :class="{ selected: answers[qIndex] === oIndex }"
                                        @click="selectAnswer(qIndex, oIndex)">
                                        <span class="option-label">{{ optionLabels[oIndex] }}</span>
                                        <span class="option-text">{{ opt }}</span>
                                    </li>
                                </ul>
                            </div>
                            <div style="text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid #e2e8f0;">
                                <button class="btn btn-primary" style="padding:12px 40px;font-size:16px;" 
                                        :disabled="submitting"
                                        @click="submitQuiz">
                                    {{ submitting ? '提交中...' : '提交测评' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

window.EmpQuizPage = EmpQuizPage;
