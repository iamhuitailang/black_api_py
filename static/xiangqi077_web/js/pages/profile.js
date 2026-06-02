const ProfilePage = {
  template: `
    <div class="profile-page">
      <h2>个人中心</h2>
      <div class="profile-section" v-if="user">
        <div class="profile-card">
          <div class="avatar">{{ (user.nickname || user.username || '?')[0] }}</div>
          <div class="profile-info">
            <div class="info-row">
              <label>用户名</label>
              <span>{{ user.username }}</span>
            </div>
            <div class="info-row">
              <label>昵称</label>
              <input type="text" v-model="editForm.nickname" />
            </div>
            <button class="btn btn-sm btn-primary" @click="saveProfile">保存修改</button>
          </div>
        </div>

        <div class="profile-section">
          <h3>修改密码</h3>
          <div class="form-group">
            <label>旧密码</label>
            <input type="password" v-model="passwordForm.old_password" />
          </div>
          <div class="form-group">
            <label>新密码</label>
            <input type="password" v-model="passwordForm.new_password" />
          </div>
          <div class="form-group">
            <label>确认新密码</label>
            <input type="password" v-model="passwordForm.confirm_password" />
          </div>
          <div class="form-error" v-if="pwdError">{{ pwdError }}</div>
          <button class="btn btn-sm btn-primary" @click="changePassword">修改密码</button>
        </div>

        <div class="profile-section">
          <h3>个人统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ user.score || 0 }}</div>
              <div class="stat-label">积分</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ user.wins || 0 }}</div>
              <div class="stat-label">胜</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ user.losses || 0 }}</div>
              <div class="stat-label">负</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ user.draws || 0 }}</div>
              <div class="stat-label">和</div>
            </div>
          </div>
        </div>

        <div class="profile-section">
          <h3>历史对局</h3>
          <div class="game-list">
            <div class="game-item" v-for="g in myGames" :key="g.id">
              <div class="game-players">
                <span class="red">{{ g.red_player_name || '红方' }}</span>
                <span class="vs">VS</span>
                <span class="black">{{ g.black_player_name || '黑方' }}</span>
              </div>
              <div class="game-result" :class="getResultClass(g)">{{ getResultText(g) }}</div>
              <div class="game-time">{{ formatTime(g.updated_at) }}</div>
            </div>
            <div class="empty-list" v-if="myGames.length === 0">暂无对局记录</div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const user = Vue.ref(XiangqiAuth.getUser());
    const editForm = Vue.reactive({ nickname: '' });
    const passwordForm = Vue.reactive({ old_password: '', new_password: '', confirm_password: '' });
    const pwdError = Vue.ref('');
    const myGames = Vue.ref([]);

    if (user.value) {
      editForm.nickname = user.value.nickname || '';
    }

    async function saveProfile() {
      try {
        const res = await XiangqiApi.updateProfile({ nickname: editForm.nickname });
        if (res.code === 0) {
          const updated = { ...user.value, nickname: editForm.nickname };
          XiangqiAuth.setUser(updated);
          user.value = updated;
          alert('保存成功');
        } else {
          alert(res.msg || '保存失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function changePassword() {
      pwdError.value = '';
      if (!passwordForm.old_password || !passwordForm.new_password) {
        pwdError.value = '请填写密码';
        return;
      }
      if (passwordForm.new_password !== passwordForm.confirm_password) {
        pwdError.value = '两次密码不一致';
        return;
      }
      if (passwordForm.new_password.length < 6) {
        pwdError.value = '新密码至少6位';
        return;
      }
      try {
        const res = await XiangqiApi.changePassword({
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password
        });
        if (res.code === 0) {
          alert('密码修改成功');
          passwordForm.old_password = '';
          passwordForm.new_password = '';
          passwordForm.confirm_password = '';
        } else {
          pwdError.value = res.msg || '修改失败';
        }
      } catch (e) {
        pwdError.value = '网络错误';
      }
    }

    async function loadMyGames() {
      try {
        const res = await XiangqiApi.getMyGames();
        if (res.code === 0) myGames.value = res.data || [];
      } catch (e) { /* ignore */ }
    }

    function getResultClass(g) {
      if (g.status !== 'finished') return '';
      if (!user.value) return '';
      const won = (g.winner_id === user.value.id);
      return won ? 'win' : 'lose';
    }

    function getResultText(g) {
      if (g.status === 'draw') return '和棋';
      if (g.status !== 'finished') return '进行中';
      if (!user.value) return '已结束';
      return g.winner_id === user.value.id ? '胜利' : '失败';
    }

    function formatTime(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    Vue.onMounted(() => {
      loadMyGames();
    });

    return {
      user, editForm, passwordForm, pwdError, myGames,
      saveProfile, changePassword, getResultClass, getResultText, formatTime
    };
  }
};

window.ProfilePage = ProfilePage;
