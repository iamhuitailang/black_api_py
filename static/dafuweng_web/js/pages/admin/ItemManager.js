import { ref, onMounted } from 'vue'
import Api from '../../api.js'

export default {
  setup() {
    const items = ref([])
    const loading = ref(false)
    const error = ref('')
    const showEdit = ref(false)
    const editItem = ref({ id: null, name: '', description: '', icon: '📦', price: 0, type: 'attack', effect: '' })

    async function loadItems() {
      loading.value = true
      try {
        const res = await Api.getAdminItemList()
        items.value = res.data || []
      } catch (e) {
        error.value = e.message
      } finally {
        loading.value = false
      }
    }

    function openEdit(item) {
      editItem.value = { ...item }
      showEdit.value = true
    }

    function openCreate() {
      editItem.value = { id: null, name: '', description: '', icon: '📦', price: 0, type: 'attack', effect: '' }
      showEdit.value = true
    }

    async function saveItem() {
      try {
        await Api.saveItem(editItem.value)
        showEdit.value = false
        await loadItems()
      } catch (e) {
        error.value = e.message
      }
    }

    async function deleteItem(item) {
      if (!confirm('确定删除该道具？')) return
      try {
        await Api.deleteItem({ id: item.id })
        await loadItems()
      } catch (e) {
        error.value = e.message
      }
    }

    function typeText(type) {
      const map = { attack: '攻击', defense: '防御', movement: '移动', special: '特殊' }
      return map[type] || type
    }

    onMounted(loadItems)

    return { items, loading, error, showEdit, editItem, openEdit, openCreate, saveItem, deleteItem, typeText }
  },
  template: `
    <div class="admin-page">
      <h2 class="page-title">🎒 道具管理</h2>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div class="page-header">
        <button class="btn btn-primary" @click="openCreate">新增道具</button>
      </div>

      <div v-if="showEdit" class="modal-overlay" @click.self="showEdit = false">
        <div class="modal">
          <h3>{{ editItem.id ? '编辑道具' : '新增道具' }}</h3>
          <div class="form-group">
            <label>名称</label>
            <input v-model="editItem.name" type="text" />
          </div>
          <div class="form-group">
            <label>图标</label>
            <input v-model="editItem.icon" type="text" />
          </div>
          <div class="form-group">
            <label>类型</label>
            <select v-model="editItem.type">
              <option value="attack">攻击</option>
              <option value="defense">防御</option>
              <option value="movement">移动</option>
              <option value="special">特殊</option>
            </select>
          </div>
          <div class="form-group">
            <label>价格</label>
            <input v-model.number="editItem.price" type="number" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="editItem.description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>效果</label>
            <input v-model="editItem.effect" type="text" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="showEdit = false">取消</button>
            <button class="btn btn-primary" @click="saveItem">保存</button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>图标</th>
              <th>名称</th>
              <th>类型</th>
              <th>价格</th>
              <th>描述</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.icon }}</td>
              <td>{{ item.name }}</td>
              <td>{{ typeText(item.type) }}</td>
              <td>{{ item.price }}</td>
              <td>{{ item.description }}</td>
              <td>
                <button class="btn btn-sm btn-outline" @click="openEdit(item)">编辑</button>
                <button class="btn btn-sm btn-danger" @click="deleteItem(item)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="items.length === 0" class="empty">暂无道具数据</div>
      </div>
    </div>
  `
}
