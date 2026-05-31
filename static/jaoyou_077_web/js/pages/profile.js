const ProfilePage = {
    template: `
        <div class="container">
            <h1 class="page-title">我的资料</h1>
            
            <div class="profile-header">
                <div class="profile-avatar">
                    {{ user.nickname ? user.nickname.charAt(0) : '?' }}
                </div>
                <div class="profile-name">{{ user.nickname || '未设置' }}</div>
                <span :class="['gender-badge', user.gender === 1 ? 'gender-male' : 'gender-female']">
                    {{ user.gender_text || '未知' }}
                </span>
            </div>

            <div class="card">
                <h3 style="margin-bottom: 20px;">基本信息</h3>
                <form @submit.prevent="updateProfile">
                    <div class="profile-info-grid">
                        <div class="profile-info-item">
                            <div class="info-label">昵称</div>
                            <input type="text" v-model="form.nickname" class="info-value">
                        </div>
                        <div class="profile-info-item">
                            <div class="info-label">年龄</div>
                            <input type="number" v-model.number="form.age" class="info-value">
                        </div>
                        <div class="profile-info-item">
                            <div class="info-label">身高(cm)</div>
                            <input type="number" v-model.number="form.height" class="info-value">
                        </div>
                        <div class="profile-info-item">
                            <div class="info-label">体重(kg)</div>
                            <input type="number" v-model.number="form.weight" class="info-value">
                        </div>
                        <div class="profile-info-item">
                            <div class="info-label">学历</div>
                            <input type="text" v-model="form.education" class="info-value">
                        </div>
                        <div class="profile-info-item">
                            <div class="info-label">职业</div>
                            <input type="text" v-model="form.occupation" class="info-value">
                        </div>
                        <div class="profile-info-item">
                            <div class="info-label">收入</div>
                            <input type="text" v-model="form.income" class="info-value">
                        </div>
                        <div class="profile-info-item">
                            <div class="info-label">城市</div>
                            <input type="text" v-model="form.city" class="info-value">
                        </div>
                    </div>

                    <div class="form-group" style="margin-top: 20px;">
                        <label>自我介绍</label>
                        <textarea v-model="form.introduction" rows="4"></textarea>
                    </div>

                    <div class="form-group">
                        <label>兴趣爱好</label>
                        <textarea v-model="form.interest" rows="3"></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary" :disabled="saving">
                        {{ saving ? '保存中...' : '保存资料' }}
                    </button>
                </form>
            </div>

            <div class="card">
                <h3 style="margin-bottom: 20px;">修改密码</h3>
                <form @submit.prevent="changePassword">
                    <div class="form-group">
                        <label>原密码</label>
                        <input type="password" v-model="passwordForm.old_password">
                    </div>
                    <div class="form-group">
                        <label>新密码</label>
                        <input type="password" v-model="passwordForm.new_password">
                    </div>
                    <button type="submit" class="btn btn-secondary" :disabled="changingPwd">
                        {{ changingPwd ? '修改中...' : '修改密码' }}
                    </button>
                </form>
            </div>
        </div>
    `,
    data() {
        return {
            user: {},
            form: {
                nickname: '',
                age: 0,
                height: 0,
                weight: 0,
                education: '',
                occupation: '',
                income: '',
                city: '',
                introduction: '',
                interest: ''
            },
            passwordForm: {
                old_password: '',
                new_password: ''
            },
            saving: false,
            changingPwd: false
        };
    },
    mounted() {
        this.loadUser();
    },
    methods: {
        async loadUser() {
            const result = await Api.get('/jaoyou/user/current/get');
            if (result.code === 0) {
                this.user = result.data;
                Object.assign(this.form, result.data);
            }
        },
        async updateProfile() {
            this.saving = true;
            const result = await Api.post('/jaoyou/user/profile/update', this.form);
            this.saving = false;

            if (result.code === 0) {
                this.user = result.data;
                Storage.setUser(result.data);
                alert('保存成功！');
            } else {
                alert(result.msg);
            }
        },
        async changePassword() {
            if (!this.passwordForm.old_password || !this.passwordForm.new_password) {
                alert('请填写完整信息');
                return;
            }
            if (this.passwordForm.new_password.length < 6) {
                alert('新密码长度至少6位');
                return;
            }

            this.changingPwd = true;
            const result = await Api.post('/jaoyou/user/password/change', this.passwordForm);
            this.changingPwd = false;

            if (result.code === 0) {
                alert('密码修改成功，请重新登录');
                Storage.clear();
                this.$router.push('/login');
            } else {
                alert(result.msg);
            }
        }
    }
};
