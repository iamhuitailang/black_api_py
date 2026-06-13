var _v = VueApi; var ref = _v.ref, reactive = _v.reactive, computed = _v.computed, onMounted = _v.onMounted, watch = _v.watch;
window.HrQuizPage = {
    setup() {
        requireRole('hr');
        const courses = ref([]);
        const selectedCourse = ref(null);
        const loading = ref(false);
        const saving = ref(false);
        const questions = ref([]);

        const loadCourses = async () => {
            loading.value = true;
            try {
                const res = await Api.getCourses();
                if (res.code === 0) courses.value = res.data || [];
            } finally {
                loading.value = false;
            }
        };

        const selectCourse = async (course) => {
            selectedCourse.value = course;
            const res = await Api.getQuiz(course.id);
            if (res.code === 0 && res.data && res.data.questions) {
                questions.value = JSON.parse(JSON.stringify(res.data.questions));
            } else {
                questions.value = [];
                addQuestion();
            }
        };

        const addQuestion = () => {
            if (questions.value.length >= 10) {
                GlobalStore.addToast('warning', '提示', '最多10道题');
                return;
            }
            questions.value.push({
                id: Date.now(),
                question: '',
                options: ['', '', '', ''],
                correct_answer: 0
            });
        };

        const removeQuestion = (index) => {
            if (questions.value.length <= 1) {
                GlobalStore.addToast('warning', '提示', '至少保留1道题');
                return;
            }
            questions.value.splice(index, 1);
        };

        const addOption = (qIndex) => {
            if (questions.value[qIndex].options.length >= 6) {
                GlobalStore.addToast('warning', '提示', '最多6个选项');
                return;
            }
            questions.value[qIndex].options.push('');
        };

        const removeOption = (qIndex, oIndex) => {
            if (questions.value[qIndex].options.length <= 2) {
                GlobalStore.addToast('warning', '提示', '至少2个选项');
                return;
            }
            questions.value[qIndex].options.splice(oIndex, 1);
            if (questions.value[qIndex].correct_answer >= questions.value[qIndex].options.length) {
                questions.value[qIndex].correct_answer = 0;
            }
        };

        const saveQuiz = async () => {
            if (!selectedCourse.value) {
                GlobalStore.addToast('warning', '提示', '请先选择课程');
                return;
            }
            for (let i = 0; i < questions.value.length; i++) {
                const q = questions.value[i];
                if (!q.question.trim()) {
                    GlobalStore.addToast('warning', '提示', `第${i + 1}题题干不能为空`);
                    return;
                }
                const validOptions = q.options.filter(o => o.trim());
                if (validOptions < 2) {
                    GlobalStore.addToast('warning', '提示', `第${i + 1}题至少2个有效选项`);
                    return;
                }
            }
            saving.value = true;
            try {
                const res = await Api.saveQuiz(selectedCourse.value.id, questions.value);
                if (res.code === 0) {
                    GlobalStore.addToast('success', '保存成功', '测评保存成功');
                } else {
                    GlobalStore.addToast('error', '保存失败', res.message || '保存失败');
                }
            } finally {
                saving.value = false;
            }
        };

        const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

        onMounted(() => {
            loadCourses();
        });

        return {
            courses, selectedCourse, loading, saving, questions,
            selectCourse, addQuestion, removeQuestion, addOption, removeOption,
            saveQuiz, optionLabels,
            toasts: GlobalStore.toasts, removeToast: GlobalStore.removeToast.bind(GlobalStore), formatDate: formatDate, formatDateTime: formatDateTime
        };
    },
    template: `
        <LayoutWrapper title="测评管理" active-menu="hr-quiz" role="hr">
            <div style="display:grid;grid-template-columns:280px 1fr;gap:24px;">
                <div>
                    <div class="card" style="padding:16px;">
                        <div style="font-weight:600;margin-bottom:12px;color:#2d3748;">选择课程</div>
                        <div v-if="loading" style="color:#a0aec0;text-align:center;padding:20px;">加载中...</div>
                        <div v-else-if="courses.length === 0" style="color:#a0aec0;text-align:center;padding:20px;">暂无课程</div>
                        <div v-else style="display:flex;flex-direction:column;gap:8px;">
                            <button v-for="course in courses" :key="course.id"
                                    class="btn"
                                    :class="selectedCourse?.id === course.id ? 'btn-primary' : 'btn-secondary'"
                                    style="justify-content:flex-start;text-align:left;"
                                    @click="selectCourse(course)">
                                <div style="flex:1;overflow:hidden;">
                                    <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ course.title }}</div>
                                    <div style="font-size:12px;opacity:0.8;margin-top:2px;">{{ formatDate(course.datetime) }}</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <div v-if="!selectedCourse" class="empty-state" style="background:white;border-radius:8px;border:1px solid #e2e8f0;">
                        <div class="empty-icon">✍️</div>
                        <p>请先在左侧选择一个课程</p>
                    </div>

                    <div v-else>
                        <div class="card" style="padding:20px;margin-bottom:16px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <div>
                                    <div style="font-size:16px;font-weight:600;">{{ selectedCourse.title }}</div>
                                    <div style="color:#718096;font-size:13px;margin-top:4px;">{{ selectedCourse.instructor }} · {{ formatDate(selectedCourse.datetime) }}</div>
                                </div>
                                <div style="display:flex;gap:8px;">
                                    <button class="btn btn-secondary" @click="addQuestion">＋ 添加题目</button>
                                    <button class="btn btn-primary" :disabled="saving" @click="saveQuiz">
                                        {{ saving ? '保存中...' : '保存测评' }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div v-for="(q, qIndex) in questions" :key="q.id" class="question-editor">
                            <div class="question-editor-header">
                                <span class="question-number-badge">第 {{ qIndex + 1 }} 题</span>
                                <button class="btn btn-sm btn-danger" @click="removeQuestion(qIndex)">删除</button>
                            </div>
                            <div class="form-group" style="margin-top:12px;">
                                <label class="form-label">题目内容</label>
                                <input type="text" class="form-control" v-model="q.question" placeholder="请输入题目内容">
                            </div>
                            <div style="margin-top:12px;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                    <label class="form-label" style="margin-bottom:0;">选项</label>
                                    <button class="btn btn-sm btn-secondary" @click="addOption(qIndex)">＋ 添加选项</button>
                                </div>
                                <div v-for="(opt, oIndex) in q.options" :key="oIndex" class="option-editor">
                                    <input type="radio" class="correct-radio" 
                                           :value="oIndex" 
                                           v-model="q.correct_answer"
                                           :title="'设为正确答案'">
                                    <div class="option-label-input">{{ optionLabels[oIndex] }}</div>
                                    <input type="text" class="form-control option-input" v-model="q.options[oIndex]" :placeholder="'选项 ' + optionLabels[oIndex]">
                                    <button class="btn btn-sm btn-danger" @click="removeOption(qIndex, oIndex)">×</button>
                                </div>
                                <div style="color:#718096;font-size:12px;margin-top:8px;">
                                    💡 点击选项前的单选按钮标记正确答案
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="toast-container">
                <transition-group name="toast">
                    <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type" @click="removeToast(t.id)">
                        <div class="toast-icon"><span v-if="t.type==='success'">✅</span><span v-else-if="t.type==='error'">❌</span><span v-else-if="t.type==='warning'">⚠️</span><span v-else>ℹ️</span></div>
                        <div class="toast-content"><div class="toast-title">{{ t.title }}</div><div v-if="t.message" class="toast-message">{{ t.message }}</div></div>
                        <div class="toast-close">×</div>
                    </div>
                </transition-group>
            </div>
        </LayoutWrapper>
    `
};
