const AdminAIPage = {
  template: `
    <div class="admin-page">
      <h2>管理后台 - AI难度管理</h2>
      <div class="admin-toolbar">
        <button class="btn btn-sm btn-primary" @click="showCreateForm = true">新增AI配置</button>
      </div>

      <div class="ai-form" v-if="showCreateForm || editItem">
        <h3>{{ editItem ? '编辑AI配置' : '新增AI配置' }}</h3>
        <div class="form-group">
          <label>名称</label>
          <input type="text" v-model="form.name" placeholder="如：初级AI" />
        </div>
        <div class="form-group">
          <label>难度等级</label>
          <input type="number" v-model.number="form.level" min="1" max="10" />
        </div>
        <div class="form-group">
          <label>描述</label>
          <input type="text" v-model="form.description" placeholder="AI描述" />
        </div>
        <div class="form-group">
          <label>思考深度</label>
          <input type="number" v-model.number="form.depth" min="1" max="20" />
        </div>
        <div class="form-group">
          <label>思考时间(秒)</label>
          <input type="number" v-model.number="form.think_time" min="1" max="60" />
        </div>
        <div class="form-actions">
          <button class="btn btn-sm btn-primary" @click="saveConfig">保存</button>
          <button class="btn btn-sm" @click="cancelForm">取消</button>
        </div>
      </div>

      <div class="admin-table">
        <div class="table-header">
          <span class="col-id">ID</span>
          <span class="col-name">名称</span>
          <span class="col-level">等级</span>
          <span class="col-desc">描述</span>
          <span class="col-status">状态</span>
          <span class="col-actions">操作</span>
        </div>
        <div class="table-row" v-for="ai in configs" :key="ai.id">
          <span class="col-id">{{ ai.id }}</span>
          <span class="col-name">{{ ai.name }}</span>
          <span class="col-level">{{ ai.level }}</span>
          <span class="col-desc">{{ ai.description || '-' }}</span>
          <span class="col-status">
            <span class="badge" :class="ai.enabled ? 'badge-success' : 'badge-danger'">{{ ai.enabled ? '启用' : '禁用' }}</span>
          </span>
          <span class="col-actions">
            <button class="btn btn-xs" @click="editConfig(ai)">编辑</button>
            <button class="btn btn-xs" v-if="!ai.enabled" @click="enableConfig(ai.id)">启用</button>
            <button class="btn btn-xs" v-if="ai.enabled" @click="disableConfig(ai.id)">禁用</button>
            <button class="btn btn-xs btn-danger" @click="deleteConfig(ai.id)">删除</button>
          </span>
        </div>
        <div class="empty-list" v-if="configs.length === 0">暂无AI配置</div>
      </div>
    </div>
  `,
  setup() {
    const configs = Vue.ref([]);
    const showCreateForm = Vue.ref(false);
    const editItem = Vue.ref(null);
    const form = Vue.reactive({ name: '', level: 1, description: '', depth: 3, think_time: 5 });

    async function loadConfigs() {
      try {
        const res = await XiangqiApi.adminGetAIConfigs();
        if (res.code === 0) configs.value = res.data || [];
      } catch (e) { /* ignore */ }
    }

    function editConfig(ai) {
      editItem.value = ai;
      form.name = ai.name;
      form.level = ai.level;
      form.description = ai.description || '';
      form.depth = ai.depth || 3;
      form.think_time = ai.think_time || 5;
      showCreateForm.value = false;
    }

    function cancelForm() {
      showCreateForm.value = false;
      editItem.value = null;
      form.name = '';
      form.level = 1;
      form.description = '';
      form.depth = 3;
      form.think_time = 5;
    }

    async function saveConfig() {
      if (!form.name) { alert('请输入名称'); return; }
      try {
        let res;
        if (editItem.value) {
          res = await XiangqiApi.adminUpdateAIConfig(editItem.value.id, { ...form });
        } else {
          res = await XiangqiApi.adminCreateAIConfig({ ...form });
        }
        if (res.code === 0) {
          cancelForm();
          loadConfigs();
        } else {
          alert(res.msg || '保存失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function enableConfig(id) {
      try {
        const res = await XiangqiApi.adminEnableAIConfig(id);
        if (res.code === 0) loadConfigs();
        else alert(res.msg || '操作失败');
      } catch (e) { alert('网络错误'); }
    }

    async function disableConfig(id) {
      try {
        const res = await XiangqiApi.adminDisableAIConfig(id);
        if (res.code === 0) loadConfigs();
        else alert(res.msg || '操作失败');
      } catch (e) { alert('网络错误'); }
    }

    async function deleteConfig(id) {
      if (!confirm('确定删除？')) return;
      try {
        const res = await XiangqiApi.adminDeleteAIConfig(id);
        if (res.code === 0) loadConfigs();
        else alert(res.msg || '删除失败');
      } catch (e) { alert('网络错误'); }
    }

    Vue.onMounted(() => {
      loadConfigs();
    });

    return {
      configs, showCreateForm, editItem, form,
      loadConfigs, editConfig, cancelForm, saveConfig, enableConfig, disableConfig, deleteConfig
    };
  }
};

window.AdminAIPage = AdminAIPage;
