const AdminUsersPage = {
  template: `
    <div class="admin-page">
      <h2>管理后台 - 用户管理</h2>
      <div class="admin-toolbar">
        <input type="text" v-model="searchKey" placeholder="搜索用户名/昵称" @keyup.enter="loadUsers" />
        <button class="btn btn-sm btn-primary" @click="loadUsers">搜索</button>
      </div>
      <div class="admin-table">
        <div class="table-header">
          <span class="col-id">ID</span>
          <span class="col-username">用户名</span>
          <span class="col-nickname">昵称</span>
          <span class="col-score">积分</span>
          <span class="col-status">状态</span>
          <span class="col-actions">操作</span>
        </div>
        <div class="table-row" v-for="u in users" :key="u.id">
          <span class="col-id">{{ u.id }}</span>
          <span class="col-username">{{ u.username }}</span>
          <span class="col-nickname">{{ u.nickname || '-' }}</span>
          <span class="col-score">{{ u.score || 0 }}</span>
          <span class="col-status">
            <span class="badge" :class="getUserBadge(u)">{{ getUserStatus(u) }}</span>
          </span>
          <span class="col-actions">
            <button class="btn btn-xs" v-if="!u.muted" @click="muteUser(u.id)">禁言</button>
            <button class="btn btn-xs" v-if="u.muted" @click="unmuteUser(u.id)">解禁</button>
            <button class="btn btn-xs btn-danger" v-if="!u.banned" @click="banUser(u.id)">封号</button>
            <button class="btn btn-xs" v-if="u.banned" @click="unbanUser(u.id)">解封</button>
          </span>
        </div>
        <div class="empty-list" v-if="users.length === 0">暂无用户数据</div>
      </div>
    </div>
  `,
  setup() {
    const users = Vue.ref([]);
    const searchKey = Vue.ref('');

    async function loadUsers() {
      try {
        const params = {};
        if (searchKey.value) params.search = searchKey.value;
        const res = await XiangqiApi.adminGetUsers(params);
        if (res.code === 0) users.value = res.data || [];
      } catch (e) { /* ignore */ }
    }

    function getUserStatus(u) {
      if (u.banned) return '已封号';
      if (u.muted) return '已禁言';
      return '正常';
    }

    function getUserBadge(u) {
      if (u.banned) return 'badge-danger';
      if (u.muted) return 'badge-warning';
      return 'badge-success';
    }

    async function muteUser(userId) {
      try {
        const res = await XiangqiApi.adminMuteUser(userId, {});
        if (res.code === 0) loadUsers();
        else alert(res.msg || '操作失败');
      } catch (e) { alert('网络错误'); }
    }

    async function unmuteUser(userId) {
      try {
        const res = await XiangqiApi.adminMuteUser(userId, { unmute: true });
        if (res.code === 0) loadUsers();
        else alert(res.msg || '操作失败');
      } catch (e) { alert('网络错误'); }
    }

    async function banUser(userId) {
      if (!confirm('确定封号？')) return;
      try {
        const res = await XiangqiApi.adminBanUser(userId);
        if (res.code === 0) loadUsers();
        else alert(res.msg || '操作失败');
      } catch (e) { alert('网络错误'); }
    }

    async function unbanUser(userId) {
      try {
        const res = await XiangqiApi.adminUnbanUser(userId);
        if (res.code === 0) loadUsers();
        else alert(res.msg || '操作失败');
      } catch (e) { alert('网络错误'); }
    }

    Vue.onMounted(() => {
      loadUsers();
    });

    return { users, searchKey, loadUsers, getUserStatus, getUserBadge, muteUser, unmuteUser, banUser, unbanUser };
  }
};

window.AdminUsersPage = AdminUsersPage;
