var _v = VueApi; var ref = _v.ref, reactive = _v.reactive, computed = _v.computed, onMounted = _v.onMounted, watch = _v.watch;

window.EmpQuizPage = {
    setup: function() {
        requireRole('employee');
        var loading = ref(true);
        var enrollments = ref([]);
        var selectedEnrollment = ref(null);
        var quizData = ref(null);
        var answers = ref({});
        var submitted = ref(false);
        var resultScore = ref(0);
        var resultPass = ref(false);
        var resultDetails = ref([]);
        var submitting = ref(false);

        async function loadEnrollments() {
            loading.value = true;
            try {
                var user = GlobalStore.currentUser;
                if (!user) {
                    GlobalStore.addToast('warning', '请先登录', '正在跳转登录页...');
                    GlobalStore.setRoute('login');
                    return;
                }
                var res = await Api.getEmployeeCourses(user.id);
                if (res.code === 0) {
                    var list = (res.data || []).filter(function(e) {
                        return e.status !== 'pending' && e.status !== 'leave_pending'
                            && e.status !== 'leave_rejected';
                    }).map(function(e) {
                        return Object.assign({}, e, {
                            _canQuiz: (e.status === 'checked_in' || e.status === 'completed'),
                            _hasQuiz: false,
                            _quizSubmitted: e.status === 'completed',
                            _checkInRequired: e.status !== 'checked_in' && e.status !== 'completed'
                        });
                    });
                    enrollments.value = list;
                    if (list.length > 0) {
                        var defaultPick = list.find(function(e) { return e.status === 'checked_in'; })
                            || list.find(function(e) { return e.status === 'completed'; })
                            || list[0];
                        if (defaultPick) await selectEnrollment(defaultPick);
                    }
                } else {
                    GlobalStore.addToast('error', '加载失败', res.message || '请稍后重试');
                }
            } catch(e) {
                console.error(e);
                GlobalStore.addToast('error', '网络异常', (e && e.message) || '请检查网络后刷新页面');
            } finally {
                loading.value = false;
            }
        }

        async function selectEnrollment(enroll) {
            selectedEnrollment.value = enroll;
            quizData.value = null;
            submitted.value = enroll._quizSubmitted;
            if (enroll.status === 'completed') {
                submitted.value = true;
            }
            if (!enroll._canQuiz) {
                return;
            }
            try {
                var res = await Api.getEmployeeQuiz(enroll.course_id, GlobalStore.currentUser.id);
                if (res.code === 0) {
                    if (res.data) {
                        if (res.data.already_submitted) {
                            submitted.value = true;
                            resultScore.value = res.data.score || 0;
                            resultPass.value = resultScore.value >= 60;
                            resultDetails.value = res.data.details || [];
                            enroll._quizSubmitted = true;
                            enroll._hasQuiz = true;
                            quizData.value = res.data;
                        } else if (res.data.questions && res.data.questions.length > 0) {
                            quizData.value = res.data;
                            enroll._hasQuiz = true;
                            var initAns = {};
                            res.data.questions.forEach(function(q, i) { initAns[i] = null; });
                            answers.value = initAns;
                            submitted.value = false;
                        } else {
                            enroll._hasQuiz = false;
                            quizData.value = { no_quiz: true };
                        }
                    } else {
                        enroll._hasQuiz = false;
                        quizData.value = { no_quiz: true };
                    }
                } else {
                    GlobalStore.addToast('warning', '加载测评失败', res.message || '请稍后重试');
                }
            } catch(e) {
                console.error(e);
                GlobalStore.addToast('error', '网络异常', (e && e.message) || '加载测评失败');
            }
        }

        var answeredCount = computed(function() {
            var c = 0;
            Object.values(answers.value).forEach(function(v) { if (v !== null && v !== undefined) c++; });
            return c;
        });

        var canSubmit = computed(function() {
            if (!quizData.value || !quizData.value.questions) return false;
            if (submitting.value) return false;
            return answeredCount.value === quizData.value.questions.length;
        });

        async function submitQuiz() {
            if (!canSubmit.value) return;
            if (!confirm('确认提交测评？提交后将无法修改答案。')) return;
            submitting.value = true;
            try {
                var ansList = quizData.value.questions.map(function(q, i) { return answers.value[i]; });
                var res = await Api.submitQuiz(selectedEnrollment.value.id, ansList);
                if (res.code === 0 && res.data) {
                    submitted.value = true;
                    resultScore.value = res.data.score || 0;
                    resultPass.value = resultScore.value >= 60;
                    resultDetails.value = res.data.details || [];
                    selectedEnrollment.value._quizSubmitted = true;
                    selectedEnrollment.value.status = 'completed';
                    selectedEnrollment.value._statusLabel = '已完成';
                    GlobalStore.addToast(
                        resultPass.value ? 'success' : 'warning',
                        '测评提交成功',
                        '得分: ' + resultScore.value + '分' + (resultPass.value ? '，恭喜通过！' : '，未通过及格线')
                    );
                } else {
                    GlobalStore.addToast('error', '提交失败', res.message || '请稍后重试');
                }
            } finally {
                submitting.value = false;
            }
        }

        function goCheckIn() {
            GlobalStore.setRoute('emp-checkin');
        }

        onMounted(loadEnrollments);

        return {
            loading: loading,
            enrollments: enrollments,
            selectedEnrollment: selectedEnrollment,
            quizData: quizData,
            answers: answers,
            submitted: submitted,
            resultScore: resultScore,
            resultPass: resultPass,
            resultDetails: resultDetails,
            submitting: submitting,
            answeredCount: answeredCount,
            canSubmit: canSubmit,
            selectEnrollment: selectEnrollment,
            submitQuiz: submitQuiz,
            goCheckIn: goCheckIn,
            toasts: GlobalStore.toasts,
            removeToast: GlobalStore.removeToast.bind(GlobalStore)
        };
    },
    template: '<LayoutWrapper title="课程测评" active-menu="emp-quiz" role="employee">\n        <div v-if="loading" class="page-loading"><LoadingSpinner text="加载中..." /></div>\n        <div v-else-if="enrollments.length === 0" class="page-empty">\n            <EmptyState text="暂无可参与测评的培训课程，请先确认参加并签到" icon="📋" />\n        </div>\n        <div v-else class="quiz-page">\n            <div class="sidebar-card">\n                <h4 class="card-title">选择课程</h4>\n                <div class="enroll-list">\n                    <div v-for="e in enrollments" :key="e.id"\n                         class="enroll-item"\n                         :class="{ active: selectedEnrollment && selectedEnrollment.id === e.id, disabled: !e._canQuiz }"\n                         @click="selectEnrollment(e)">\n                        <div class="enroll-title">{{ e.title }}</div>\n                        <div class="enroll-meta">\n                            <StatusBadge :status="e.status" />\n                            <span v-if="!e._canQuiz" class="meta-tag tag-lock">🔒 需先签到</span>\n                            <span v-else-if="e._quizSubmitted" class="meta-tag tag-done">✓ 已完成</span>\n                            <span v-else class="meta-tag tag-quiz">📝 可测评</span>\n                        </div>\n                        <div class="enroll-date">{{ formatDate(e.datetime) }}</div>\n                    </div>\n                </div>\n            </div>\n\n            <div class="main-card">\n                <div v-if="!selectedEnrollment" class="placeholder-hint">\n                    <div class="hint-icon">←</div>\n                    <div class="hint-text">请从左侧选择一门课程</div>\n                </div>\n\n                <div v-else-if="selectedEnrollment._checkInRequired" class="block-warning">\n                    <div class="block-icon">⏰</div>\n                    <h3>请先完成培训签到</h3>\n                    <p>根据培训管理规定，您必须先在培训现场完成签到后，才能参与本课程的课后测评。</p>\n                    <div class="block-actions">\n                        <button class="btn btn-primary" @click="goCheckIn">前往签到页 →</button>\n                    </div>\n                    <div class="block-tips">\n                        <p>💡 签到规则：</p>\n                        <ul>\n                            <li>仅在培训开始前后 30 分钟内可签到</li>\n                            <li>签到成功后刷新即可参与测评</li>\n                            <li>如有疑问请联系HR管理员</li>\n                        </ul>\n                    </div>\n                </div>\n\n                <div v-else-if="quizData && quizData.no_quiz" class="block-info">\n                    <div class="block-icon">📭</div>\n                    <h3>本课程暂无测评</h3>\n                    <p>讲师尚未发布该课程的测评问卷，请稍后再来查看，或联系HR确认。</p>\n                </div>\n\n                <div v-else-if="!quizData" class="placeholder-hint">\n                    <LoadingSpinner text="加载测评中..." />\n                </div>\n\n                <div v-else-if="submitted" class="result-panel">\n                    <div class="result-card" :class="{ pass: resultPass, fail: !resultPass }">\n                        <div class="result-icon">{{ resultPass ? \'🎉\' : \'📌\' }}</div>\n                        <div class="result-title">{{ resultPass ? \'测评通过\' : \'测评未通过\' }}</div>\n                        <div class="result-score-row">\n                            <span class="score-label">最终得分</span>\n                            <span class="score-value" :class="{ fail: !resultPass }">{{ resultScore }}</span>\n                            <span class="score-unit">分</span>\n                        </div>\n                        <div class="result-passline">及格线：60 分</div>\n                        <div v-if="!resultPass" class="result-tip">\n                            ⚠️ 未达到及格线，请联系HR安排补考或重新培训\n                        </div>\n                    </div>\n                    <div class="detail-panel">\n                        <h4>答题详情</h4>\n                        <div v-for="(d, idx) in resultDetails" :key="idx" class="detail-item" :class="d.is_correct ? \'correct\' : \'wrong\'">\n                            <div class="detail-head">\n                                <span class="q-num">{{ idx + 1 }}</span>\n                                <span class="q-icon">{{ d.is_correct ? \'✓\' : \'✗\' }}</span>\n                                <span class="q-text">{{ quizData.questions[idx] ? quizData.questions[idx].question : \'题目\' + (idx+1) }}</span>\n                            </div>\n                            <div class="detail-body">\n                                <div class="ans-row">\n                                    <span class="ans-label">您的答案：</span>\n                                    <span class="ans-value">{{ String.fromCharCode(65 + (d.user_answer != null ? d.user_answer : -1)) || \'未作答\' }}</span>\n                                    <span>{{ quizData.questions[idx] && d.user_answer != null ? quizData.questions[idx].options[d.user_answer] || \'\' : \'\' }}</span>\n                                </div>\n                                <div v-if="!d.is_correct" class="ans-row correct-ans">\n                                    <span class="ans-label">正确答案：</span>\n                                    <span class="ans-value">{{ String.fromCharCode(65 + (d.correct_answer != null ? d.correct_answer : 0)) }}</span>\n                                    <span>{{ quizData.questions[idx] && d.correct_answer != null ? quizData.questions[idx].options[d.correct_answer] || \'\' : \'\' }}</span>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n                <div v-else class="quiz-panel">\n                    <div class="quiz-header">\n                        <h3>{{ quizData.title || selectedEnrollment.title }}</h3>\n                        <div class="quiz-subheader">\n                            <div class="quiz-progress">\n                                <div class="progress-bar"><div class="progress-fill" :style="{width: (answeredCount / quizData.questions.length * 100) + \'%\'}"></div></div>\n                                <span class="progress-text">答题进度：{{ answeredCount }} / {{ quizData.questions.length }}</span>\n                            </div>\n                            <span class="quiz-tip">共 {{ quizData.questions.length }} 道单选题，满分 100 分，60 分及格</span>\n                        </div>\n                    </div>\n\n                    <div class="answer-sheet">\n                        <div class="sheet-title">答题卡</div>\n                        <div class="sheet-grid">\n                            <div v-for="(q, i) in quizData.questions" :key="i"\n                                 class="sheet-cell"\n                                 :class="{ done: answers[i] !== null && answers[i] !== undefined }">\n                                {{ i + 1 }}\n                            </div>\n                        </div>\n                    </div>\n\n                    <div class="questions-list">\n                        <div v-for="(q, i) in quizData.questions" :key="i" class="question-card">\n                            <div class="question-head">\n                                <span class="qno-badge">第 {{ i + 1 }} 题</span>\n                                <span class="q-score">（{{ Math.round(100 / quizData.questions.length) }}分）</span>\n                            </div>\n                            <div class="question-text">{{ q.question }}</div>\n                            <div class="options-list">\n                                <label v-for="(opt, oi) in q.options" :key="oi"\n                                       class="option-item"\n                                       :class="{ selected: answers[i] === oi }">\n                                    <input type="radio" :name="\'q_\'+i" :value="oi" v-model="answers[i]" />\n                                    <span class="option-letter">{{ String.fromCharCode(65 + oi) }}</span>\n                                    <span class="option-text">{{ opt }}</span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n\n                    <div class="submit-area">\n                        <div class="submit-tip" :class="{ warn: !canSubmit }">\n                            {{ canSubmit ? \'✓ 您已完成所有题目，可提交\' : \'还有 \' + (quizData.questions.length - answeredCount) + \' 题未作答\' }}\n                        </div>\n                        <button class="btn btn-primary btn-lg" :disabled="!canSubmit || submitting" @click="submitQuiz">\n                            <span v-if="submitting" class="btn-spinner"></span>\n                            {{ submitting ? \'提交中...\' : \'提交测评\' }}\n                        </button>\n                    </div>\n                </div>\n            </div>\n        </div>\n\n        <div class="toast-container">\n            <transition-group name="toast">\n                <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type" @click="removeToast(t.id)">\n                    <div class="toast-icon">\n                        <span v-if="t.type === \'success\'">✅</span>\n                        <span v-else-if="t.type === \'error\'">❌</span>\n                        <span v-else-if="t.type === \'warning\'">⚠️</span>\n                        <span v-else>ℹ️</span>\n                    </div>\n                    <div class="toast-content">\n                        <div class="toast-title">{{ t.title }}</div>\n                        <div v-if="t.message" class="toast-message">{{ t.message }}</div>\n                    </div>\n                    <div class="toast-close">×</div>\n                </div>\n            </transition-group>\n        </div>\n    </LayoutWrapper>'
};
