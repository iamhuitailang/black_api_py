(function() {
    const ref = Vue.ref;

    const CheckinPage = {
        name: 'CheckinPage',
        setup() {
        const activeTab = ref('shortCode');
        const shortCode = ref('');
        const studentId = ref('');
        const studentName = ref('');
        const talkId = ref('');
        const checkinSuccess = ref(false);
        const checkinInfo = ref(null);
        const loading = ref(false);

        const handleCheckinByShortCode = async () => {
            if (!shortCode.value.trim()) {
                Toast.error('请输入宣讲会短码');
                return;
            }
            if (!studentId.value.trim()) {
                Toast.error('请输入学号');
                return;
            }

            loading.value = true;
            try {
                const result = await CareerTalkApi.checkinByShortCode({
                    short_code: shortCode.value.trim(),
                    student_id: studentId.value.trim(),
                    student_name: studentName.value.trim()
                });
                if (result.code === 0) {
                    checkinSuccess.value = true;
                    checkinInfo.value = result.data;
                    localStorage.setItem('student_id', studentId.value.trim());
                    if (studentName.value.trim()) {
                        localStorage.setItem('student_name', studentName.value.trim());
                    }
                    Toast.success(result.message || '签到成功');
                } else {
                    Toast.error(result.message || '签到失败');
                }
            } catch (error) {
                Toast.error('网络错误，请稍后重试');
            } finally {
                loading.value = false;
            }
        };

        const handleCheckinByTalkId = async () => {
            if (!talkId.value) {
                Toast.error('请输入宣讲会ID');
                return;
            }
            if (!studentId.value.trim()) {
                Toast.error('请输入学号');
                return;
            }

            loading.value = true;
            try {
                const result = await CareerTalkApi.checkinByStudentId({
                    talk_id: parseInt(talkId.value),
                    student_id: studentId.value.trim(),
                    student_name: studentName.value.trim()
                });
                if (result.code === 0) {
                    checkinSuccess.value = true;
                    checkinInfo.value = result.data;
                    localStorage.setItem('student_id', studentId.value.trim());
                    if (studentName.value.trim()) {
                        localStorage.setItem('student_name', studentName.value.trim());
                    }
                    Toast.success(result.message || '签到成功');
                } else {
                    Toast.error(result.message || '签到失败');
                }
            } catch (error) {
                Toast.error('网络错误，请稍后重试');
            } finally {
                loading.value = false;
            }
        };

        const resetCheckin = () => {
            checkinSuccess.value = false;
            checkinInfo.value = null;
            shortCode.value = '';
            studentId.value = '';
            studentName.value = '';
            talkId.value = '';
        };

        const loadStudentInfo = () => {
            const savedStudentId = localStorage.getItem('student_id');
            const savedStudentName = localStorage.getItem('student_name');
            if (savedStudentId) studentId.value = savedStudentId;
            if (savedStudentName) studentName.value = savedStudentName;
        };

        loadStudentInfo();

        return {
            activeTab,
            shortCode,
            studentId,
            studentName,
            talkId,
            checkinSuccess,
            checkinInfo,
            loading,
            handleCheckinByShortCode,
            handleCheckinByTalkId,
            resetCheckin
        };
    },
    template: `
        <div>
            <div class="page-header">
                <h2>✅ 签到</h2>
            </div>

            <div class="card" style="max-width: 500px; margin: 0 auto;">
                <div class="card-body">
                    <div v-if="!checkinSuccess" class="checkin-form">
                        <div class="tabs" style="margin-bottom: 24px;">
                            <div 
                                class="tab-item"
                                :class="{ active: activeTab === 'shortCode' }"
                                @click="activeTab = 'shortCode'"
                            >
                                短码签到
                            </div>
                            <div 
                                class="tab-item"
                                :class="{ active: activeTab === 'talkId' }"
                                @click="activeTab = 'talkId'"
                            >
                                宣讲会ID签到
                            </div>
                        </div>

                        <template v-if="activeTab === 'shortCode'">
                            <div class="form-group">
                                <label class="form-label">
                                    宣讲会短码<span class="required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="shortCode"
                                    placeholder="请输入6位短码，如：ABC123"
                                    maxlength="10"
                                    style="text-transform: uppercase; letter-spacing: 2px; font-size: 18px; font-weight: 600; text-align: center;"
                                >
                            </div>
                        </template>

                        <template v-else>
                            <div class="form-group">
                                <label class="form-label">
                                    宣讲会ID<span class="required">*</span>
                                </label>
                                <input 
                                    type="number" 
                                    class="form-control" 
                                    v-model="talkId"
                                    placeholder="请输入宣讲会ID"
                                >
                            </div>
                        </template>

                        <div class="form-group">
                            <label class="form-label">
                                学号<span class="required">*</span>
                            </label>
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="studentId"
                                placeholder="请输入学号"
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label">姓名</label>
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="studentName"
                                placeholder="请输入姓名（选填）"
                            >
                        </div>

                        <button 
                            class="btn btn-primary btn-lg" 
                            style="width: 100%; margin-top: 8px;"
                            @click="activeTab === 'shortCode' ? handleCheckinByShortCode() : handleCheckinByTalkId()"
                            :disabled="loading"
                        >
                            {{ loading ? '签到中...' : '确认签到' }}
                        </button>
                    </div>

                    <div v-else class="checkin-success">
                        <div class="checkin-success-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h3>签到成功！</h3>
                        <p style="margin-bottom: 20px;">
                            学号：{{ checkinInfo?.student_id }}<br>
                            签到时间：{{ checkinInfo?.checkin_time }}
                        </p>
                        <button class="btn btn-secondary" @click="resetCheckin">
                            继续签到
                        </button>
                    </div>
                </div>
            </div>

            <div class="card" style="max-width: 500px; margin: 20px auto 0;">
                <div class="card-body" style="padding: 16px 20px;">
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.8;">
                        <strong style="color: var(--text-primary);">💡 签到说明：</strong><br>
                        1. 请向现场工作人员获取宣讲会短码或ID<br>
                        2. 输入您的学号进行签到<br>
                        3. 首次签到后会自动记住您的学号
                    </p>
                </div>
            </div>
        </div>
    `
    };

    window.CheckinPage = CheckinPage;
})();
