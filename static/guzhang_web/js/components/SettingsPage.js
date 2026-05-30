const SettingsPage = {
  template: `
    <div class="settings-container">
      <div class="settings-card">
        <h2>账号设置</h2>
        
        <div class="settings-section">
          <h3>个人信息</h3>
          <div class="form-group">
            <label>用户名</label>
            <input :value="store.user?.username" disabled />
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input :value="store.user?.nickname" disabled />
          </div>
        </div>
        
        <div class="settings-section">
          <h3>修改密码</h3>
          <div class="form-group">
            <label>原密码</label>
            <input v-model="oldPassword" type="password" placeholder="请输入原密码" />
          </div>
          <div class="form-group">
            <label>新密码</label>
            <input v-model="newPassword" type="password" placeholder="请输入新密码" />
          </div>
          <div class="form-group">
            <label>确认新密码</label>
            <input v-model="confirmPassword" type="password" placeholder="请确认新密码" />
          </div>
          <button class="btn btn-primary" @click="updatePassword" :disabled="loading">
            {{ loading ? '修改中...' : '修改密码' }}
          </button>
          <p v-if="message" :style="{ color: messageType === 'success' ? '#4ade80' : '#f5576c', marginTop: '15px' }">
            {{ message }}
          </p>
        </div>
        
        <button class="btn btn-secondary" @click="goBack" style="margin-top: 20px;">返回首页</button>
      </div>
    </div>
  `,
  setup() {
    const oldPassword = Vue.ref('');
    const newPassword = Vue.ref('');
    const confirmPassword = Vue.ref('');
    const loading = Vue.ref(false);
    const message = Vue.ref('');
    const messageType = Vue.ref('');

    const updatePassword = async () => {
      if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
        message.value = '请填写完整信息';
        messageType.value = 'error';
        return;
      }

      if (oldPassword.value === newPassword.value) {
        message.value = '新密码不能与原密码相同';
        messageType.value = 'error';
        return;
      }

      if (newPassword.value !== confirmPassword.value) {
        message.value = '两次密码输入不一致';
        messageType.value = 'error';
        return;
      }

      loading.value = true;
      message.value = '';

      try {
        const result = await api.updatePassword(oldPassword.value, newPassword.value);
        if (result.code === 200) {
          message.value = '密码修改成功';
          messageType.value = 'success';
          oldPassword.value = '';
          newPassword.value = '';
          confirmPassword.value = '';
        } else {
          message.value = result.message;
          messageType.value = 'error';
        }
      } catch (e) {
        message.value = '修改失败，请重试';
        messageType.value = 'error';
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      window.location.hash = '#/home';
    };

    Vue.onMounted(() => {
      if (!store.isLoggedIn()) {
        window.location.hash = '#/login';
      }
    });

    return {
      store,
      oldPassword,
      newPassword,
      confirmPassword,
      loading,
      message,
      messageType,
      updatePassword,
      goBack
    };
  }
};
