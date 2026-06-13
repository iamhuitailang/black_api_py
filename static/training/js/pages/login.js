var _v = VueApi; var ref = _v.ref, reactive = _v.reactive, computed = _v.computed, onMounted = _v.onMounted, watch = _v.watch;

window.LoginPage = {
    setup: function() {
        var employeeId = ref('');
        var password = ref('');
        var loginAs = ref('');
        var loading = ref(false);
        var errorMsg = ref('');
        var showPassword = ref(false);
        var showHint = ref(false);

        var defaultAccounts = [
            { id: 'HR001', name: '张HR', dept: '人力资源部', role: 'HR管理员' },
            { id: 'EMP001', name: '李小明', dept: '技术部', role: '员工' },
            { id: 'EMP002', name: '王小红', dept: '技术部', role: '员工' },
            { id: 'EMP003', name: '赵大伟', dept: '市场部', role: '员工' }
        ];

        function useAccount(acc) {
            employeeId.value = acc.id;
            password.value = acc.id;
            loginAs.value = acc.id;
            errorMsg.value = '';
        }

        function clearLoginAs() {
            loginAs.value = '';
            employeeId.value = '';
            password.value = '';
            errorMsg.value = '';
        }

        async function doLogin() {
            errorMsg.value = '';
            if (!employeeId.value.trim()) {
                errorMsg.value = '请输入工号';
                return;
            }
            if (!password.value) {
                errorMsg.value = '请输入密码';
                return;
            }
            loading.value = true;
            try {
                var res = await Api.login(employeeId.value.trim(), password.value);
                if (res.code === 0 && res.data) {
                    GlobalStore.setUser(res.data);
                    localStorage.removeItem(STORAGE_KEYS.NOTIFIED);
                    GlobalStore.addToast('success', '登录成功', '欢迎，' + res.data.name + '！');
                    setTimeout(function() {
                        var isHR = res.data.role === 'hr' || res.data.role === 'admin';
                        GlobalStore.setRoute(isHR ? 'hr-courses' : 'emp-courses');
                    }, 600);
                } else {
                    errorMsg.value = res.message || '登录失败，请检查工号和密码';
                }
            } catch (e) {
                errorMsg.value = '网络错误，请稍后重试';
            } finally {
                loading.value = false;
            }
        }

        function onKeyEnter(e) {
            if (e.key === 'Enter') doLogin();
        }

        return {
            employeeId: employeeId,
            password: password,
            loginAs: loginAs,
            loading: loading,
            errorMsg: errorMsg,
            showPassword: showPassword,
            showHint: showHint,
            defaultAccounts: defaultAccounts,
            useAccount: useAccount,
            clearLoginAs: clearLoginAs,
            doLogin: doLogin,
            onKeyEnter: onKeyEnter,
            toasts: GlobalStore.toasts,
            removeToast: GlobalStore.removeToast.bind(GlobalStore)
        };
    },
    template: '<div class="login-page">\n        <div class="login-bg-decor"></div>\n        <div class="login-card">\n            <div class="login-brand">\n                <div class="brand-icon">🎓</div>\n                <h1 class="brand-title">企业培训管理系统</h1>\n                <p class="brand-subtitle">Enterprise Training Management Platform</p>\n            </div>\n\n            <div v-if="!loginAs" class="role-selector">\n                <div class="role-label">选择快速登录（密码与工号相同）</div>\n                <div class="role-grid">\n                    <div v-for="acc in defaultAccounts" :key="acc.id"\n                         class="role-card"\n                         :class="{ hr: acc.role === \'HR管理员\' }"\n                         @click="useAccount(acc)">\n                        <div class="role-avatar">{{ acc.name.charAt(0) }}</div>\n                        <div class="role-info">\n                            <div class="role-name">{{ acc.name }}</div>\n                            <div class="role-meta">\n                                <span class="role-tag" :class="acc.role === \'HR管理员\' ? \'tag-hr\' : \'tag-emp\'">{{ acc.role }}</span>\n                                <span class="role-dept">{{ acc.dept }}</span>\n                            </div>\n                            <div class="role-id">工号: {{ acc.id }}</div>\n                        </div>\n                        <div class="role-arrow">›</div>\n                    </div>\n                </div>\n                <div class="divider-line"><span>或手动登录</span></div>\n            </div>\n\n            <form v-else class="login-form" @submit.prevent="doLogin">\n                <div class="login-back" @click="clearLoginAs">\n                    <span>←</span> 返回选择账号\n                </div>\n                <h2 class="form-title">账号登录</h2>\n                <div class="form-tip">默认密码与工号相同，登录后可联系管理员修改</div>\n\n                <div class="form-group">\n                    <label class="form-label">工号</label>\n                    <div class="input-wrap">\n                        <span class="input-icon">🪪</span>\n                        <input type="text" v-model="employeeId" class="form-input" \n                               placeholder="请输入工号，如 EMP001" autocomplete="off" @keydown="onKeyEnter" />\n                    </div>\n                </div>\n\n                <div class="form-group">\n                    <label class="form-label">密码</label>\n                    <div class="input-wrap">\n                        <span class="input-icon">🔒</span>\n                        <input :type="showPassword ? \'text\' : \'password\'" v-model="password" \n                               class="form-input" placeholder="请输入密码" @keydown="onKeyEnter" />\n                        <span class="input-toggle" @click="showPassword = !showPassword">\n                            {{ showPassword ? \'🙈\' : \'👁️\' }}\n                        </span>\n                    </div>\n                </div>\n\n                <div v-if="errorMsg" class="form-error">\n                    <span>⚠️</span> {{ errorMsg }}\n                </div>\n\n                <button type="submit" class="btn-login" :disabled="loading">\n                    <span v-if="loading" class="btn-spinner"></span>\n                    <span>{{ loading ? \'登录中...\' : \'登 录\' }}</span>\n                </button>\n\n                <div class="hint-bar">\n                    <span class="hint-toggle" @click="showHint = !showHint">\n                        {{ showHint ? \'隐藏\' : \'查看\' }}登录提示\n                    </span>\n                    <div v-if="showHint" class="hint-content">\n                        <p><b>HR管理员：</b>工号 <code>HR001</code>，密码 <code>HR001</code>（张HR）</p>\n                        <p><b>测试员工：</b>工号 <code>EMP001</code> ~ <code>EMP005</code>，密码与工号相同</p>\n                    </div>\n                </div>\n            </form>\n        </div>\n\n        <div class="toast-container">\n            <transition-group name="toast">\n                <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type" @click="removeToast(t.id)">\n                    <div class="toast-icon">\n                        <span v-if="t.type === \'success\'">✅</span>\n                        <span v-else-if="t.type === \'error\'">❌</span>\n                        <span v-else-if="t.type === \'warning\'">⚠️</span>\n                        <span v-else>ℹ️</span>\n                    </div>\n                    <div class="toast-content">\n                        <div class="toast-title">{{ t.title }}</div>\n                        <div v-if="t.message" class="toast-message">{{ t.message }}</div>\n                    </div>\n                    <div class="toast-close">×</div>\n                </div>\n            </transition-group>\n        </div>\n\n        <footer class="login-footer">\n            <p>© 2026 企业培训管理系统 · 人力资源部专用平台</p>\n        </footer>\n    </div>'
};
