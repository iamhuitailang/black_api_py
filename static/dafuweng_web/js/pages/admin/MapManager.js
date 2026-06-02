import { ref, onMounted } from 'vue'
import Api from '../../api.js'

export default {
  setup() {
    const cells = ref([])
    const loading = ref(false)
    const error = ref('')
    const showEdit = ref(false)
    const editCell = ref({ id: null, name: '', type: 'land', price: 0, icon: '🏠', position: 0 })

    async function loadCells() {
      loading.value = true
      try {
        const res = await Api.getMapList()
        cells.value = res.data || []
      } catch (e) {
        error.value = e.message
      } finally {
        loading.value = false
      }
    }

    function openEdit(cell) {
      editCell.value = { ...cell }
      showEdit.value = true
    }

    function openCreate() {
      editCell.value = { id: null, name: '', type: 'land', price: 0, icon: '🏠', position: cells.value.length }
      showEdit.value = true
    }

    async function saveCell() {
      try {
        await Api.saveMapCell(editCell.value)
        showEdit.value = false
        await loadCells()
      } catch (e) {
        error.value = e.message
      }
    }

    async function deleteCell(cell) {
      if (!confirm('确定删除该格子？')) return
      try {
        await Api.deleteMapCell({ id: cell.id })
        await loadCells()
      } catch (e) {
        error.value = e.message
      }
    }

    function typeText(type) {
      const map = { start: '起点', land: '地产', event: '事件', item: '道具', tax: '税收', jail: '监狱', parking: '停车' }
      return map[type] || type
    }

    onMounted(loadCells)

    return { cells, loading, error, showEdit, editCell, openEdit, openCreate, saveCell, deleteCell, typeText }
  },
  template: `
    <div class="admin-page">
      <h2 class="page-title">🗺️ 地图管理</h2>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div class="page-header">
        <button class="btn btn-primary" @click="openCreate">新增格子</button>
      </div>

      <div v-if="showEdit" class="modal-overlay" @click.self="showEdit = false">
        <div class="modal">
          <h3>{{ editCell.id ? '编辑格子' : '新增格子' }}</h3>
          <div class="form-group">
            <label>名称</label>
            <input v-model="editCell.name" type="text" />
          </div>
          <div class="form-group">
            <label>类型</label>
            <select v-model="editCell.type">
              <option value="start">起点</option>
              <option value="land">地产</option>
              <option value="event">事件</option>
              <option value="item">道具</option>
              <option value="tax">税收</option>
              <option value="jail">监狱</option>
              <option value="parking">停车</option>
            </select>
          </div>
          <div class="form-group">
            <label>图标</label>
            <input v-model="editCell.icon" type="text" />
          </div>
          <div class="form-group">
            <label>价格</label>
            <input v-model.number="editCell.price" type="number" />
          </div>
          <div class="form-group">
            <label>位置</label>
            <input v-model.number="editCell.position" type="number" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="showEdit = false">取消</button>
            <button class="btn btn-primary" @click="saveCell">保存</button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>位置</th>
              <th>图标</th>
              <th>名称</th>
              <th>类型</th>
              <th>价格</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cell in cells" :key="cell.id">
              <td>{{ cell.position }}</td>
              <td>{{ cell.icon }}</td>
              <td>{{ cell.name }}</td>
              <td>{{ typeText(cell.type) }}</td>
              <td>{{ cell.price }}</td>
              <td>
                <button class="btn btn-sm btn-outline" @click="openEdit(cell)">编辑</button>
                <button class="btn btn-sm btn-danger" @click="deleteCell(cell)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="cells.length === 0" class="empty">暂无地图数据</div>
      </div>
    </div>
  `
}
