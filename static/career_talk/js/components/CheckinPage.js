(function() {
    const ref = Vue.ref;
    const computed = Vue.computed;
    const onMounted = Vue.onMounted;
    const watch = Vue.watch;

    const CheckinPage = {
        name: 'CheckinPage',
        props: {
            isLoggedIn: { type: Boolean, default: false },
            currentUser: { type: Object, default: null }
        },
        emits: ['go-login'],
        setup(props, { emit }) {
            const activeTab = ref('shortCode');
            const shortCode = ref('');
            const studentId = ref('');
            const studentName = ref('');
            const talkId = ref('');
            const checkinSuccess = ref(false);
            const checkinInfo = ref(null);
            const loading = ref(false);

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

            const handleCheckinByShortCode = async () => {
                if (!props.isLoggedIn) {
                    emit('go-login');
                    return;
                }
                fillUserInfo();
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
                        short_code: shortCode.value.trim().toUpperCase(),
                        student_id: studentId.value.trim(),
                        student_name: studentName.value.trim()
                    });
                    if (result.code === 0) {
                        checkinSuccess.value = true;
                        checkinInfo.value = result.data;
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
                if (!props.isLoggedIn) {
                    emit('go-login');
                    return;
                }
                fillUserInfo();
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
                talkId.value = '';
            };

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

                <div v-if="!isLoggedIn" class="card" style="max-width: 500px; margin: 40px auto; text-align: center;">
                    <div class="card-body">
                        <div style="font-size: 60px; margin-bottom: 16px;">🔐</div>
                        <h3>请先登录</h3>
                        <p style="color: #666; margin: 12px 0 24px;">签到功能需要登录后使用</p>
                        <button class="btn btn-primary" @click="$emit('go-login')">前往登录</button>
                    </div>
                </div>

                <div v-else class="card" style="max-width: 500px; margin: 0 auto;">
                    <div class="card-body">
                        <div v-if="!checkinSuccess" class="checkin-form">
                            <div class="tabs" style="margin-bottom: 24px;">
                                <div 
                                    class="tab-item"
                                    :class="{ active: activeTab === 'shortCode' }"
                                    @click="activeTab = 'shortCode'"
                                >短码签到</div>
                                <div 
                                    class="tab-item"
                                    :class="{ active: activeTab === 'talkId' }"
                                    @click="activeTab = 'talkId'"
                                >宣讲会ID签到</div>
                            </div>

                            <template v-if="activeTab === 'shortCode'">
                                <div class="form-group">
                                    <label class="form-label">宣讲会短码<span class="required">*</span></label>
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
                                    <label class="form-label">宣讲会ID<span class="required">*</span></label>
                                    <input 
                                        type="number" 
                                        class="form-control" 
                                        v-model="talkId"
                                        placeholder="请输入宣讲会ID"
                                    >
                                </div>
                            </template>

                            <div class="form-group">
                                <label class="form-label">学号<span class="required">*</span></label>
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
                                class="btn btn-primary btn-block" 
                                style="margin-top: 8px;"
                                :disabled="loading"
                                @click="activeTab === 'shortCode' ? handleCheckinByShortCode() : handleCheckinByTalkId()"
                            >
                                {{ loading ? '签到中...' : '确认签到' }}
                            </button>
                        </div>

                        <div v-else class="checkin-success">
                            <div class="success-icon">✓</div>
                            <h3 style="color: #10b981;">签到成功</h3>
                            <div v-if="checkinInfo" style="margin: 16px 0;">
                                <div class="info-row">
                                    <span class="info-label">学号</span>
                                    <span class="info-value">{{ checkinInfo.student_id }}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">姓名</span>
                                    <span class="info-value">{{ checkinInfo.student_name || '-' }}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">签到时间</span>
                                    <span class="info-value">{{ checkinInfo.checkin_time }}</span>
                                </div>
                            </div>
                            <button class="btn btn-outline" @click="resetCheckin">继续签到</button>
                        </div>
                    </div>
                </div>
            </div>
        `
    };

    window.CheckinPage = CheckinPage;
})();
