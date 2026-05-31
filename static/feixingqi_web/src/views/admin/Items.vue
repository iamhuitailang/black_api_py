<template>
  <div class="admin-page">
    <div class="page-header">
      <h2 class="page-title">🎁 道具管理</h2>
      <div class="header-actions">
        <el-select v-model="rarityFilter" placeholder="稀有度筛选" style="width: 140px" clearable @change="loadItems">
          <el-option label="普通" value="common" />
          <el-option label="稀有" value="rare" />
          <el-option label="史诗" value="epic" />
          <el-option label="传说" value="legendary" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索道具名称"
          style="width: 200px"
          clearable
          @keyup.enter="loadItems"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon> 新增道具
        </el-button>
        <el-button type="success" @click="loadItems">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <div class="content-card game-card">
      <el-table :data="items" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="图标" width="80" align="center">
          <template #default="{ row }">
            <div class="item-icon" :class="'rarity-' + row.rarity">
              {{ row.item_icon || '🎁' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="item_name" label="道具名称" min-width="120" />
        <el-table-column prop="item_type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeText(row.item_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="道具描述" min-width="200" />
        <el-table-column prop="price" label="价格" width="100" align="center" />
        <el-table-column prop="rarity" label="稀有度" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRarityType(row.rarity)" size="small">
              {{ getRarityText(row.rarity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="效果" width="140" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ getEffectType(row.effect) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editItem(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button type="danger" size="small" @click="deleteItem(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next, jumper"
        @current-change="loadItems"
        @size-change="handleSizeChange"
        class="pagination"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑道具' : '新增道具'" width="600px">
      <el-form :model="itemForm" label-width="100px">
        <el-form-item label="道具名称" required>
          <el-input v-model="itemForm.item_name" placeholder="请输入道具名称" />
        </el-form-item>
        <el-form-item label="道具类型" required>
          <el-select v-model="itemForm.item_type" style="width: 100%">
            <el-option label="骰子" value="dice" />
            <el-option label="移动" value="move" />
            <el-option label="防御" value="defense" />
            <el-option label="攻击" value="attack" />
            <el-option label="幸运" value="luck" />
            <el-option label="特殊" value="special" />
          </el-select>
        </el-form-item>
        <el-form-item label="道具图标">
          <el-select v-model="itemForm.item_icon" placeholder="选择图标" style="width: 100%">
            <el-option label="🎲 骰子" value="🎲" />
            <el-option label="⚡ 闪电" value="⚡" />
            <el-option label="🛡️ 盾牌" value="🛡️" />
            <el-option label="🚀 火箭" value="🚀" />
            <el-option label="💣 炸弹" value="💣" />
            <el-option label="🌀 传送" value="🌀" />
            <el-option label="🎁 礼包" value="🎁" />
            <el-option label="⭐ 星星" value="⭐" />
            <el-option label="💎 钻石" value="💎" />
            <el-option label="🍀 幸运草" value="🍀" />
          </el-select>
        </el-form-item>
        <el-form-item label="道具描述">
          <el-input v-model="itemForm.description" type="textarea" :rows="2" placeholder="请输入道具描述" />
        </el-form-item>
        <el-form-item label="效果类型" required>
          <el-select v-model="effectType" style="width: 100%" @change="updateEffect">
            <el-option label="双倍骰子" value="double_dice" />
            <el-option label="传送" value="teleport" />
            <el-option label="护盾" value="shield" />
            <el-option label="导弹" value="missile" />
            <el-option label="幸运6" value="lucky_six" />
            <el-option label="时间回溯" value="rewind" />
          </el-select>
        </el-form-item>
        <el-form-item label="道具价格">
          <el-input-number v-model="itemForm.price" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="稀有度">
          <el-select v-model="itemForm.rarity" style="width: 100%">
            <el-option label="普通" value="common" />
            <el-option label="稀有" value="rare" />
            <el-option label="史诗" value="epic" />
            <el-option label="传说" value="legendary" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="itemForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveItem" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getItemList, createItem, updateItem, deleteItem as deleteItemApi } from '@/api'

const items = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const searchKeyword = ref('')
const rarityFilter = ref('')
const dialogVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const effectType = ref('double_dice')
const itemForm = reactive({
  item_id: null,
  item_name: '',
  item_type: 'dice',
  item_icon: '🎁',
  description: '',
  effect: '{"type": "double_dice"}',
  price: 0,
  rarity: 'common',
  status: 1
})

const loadItems = async () => {
  loading.value = true
  try {
    const data = await getItemList({
      page: page.value,
      page_size: pageSize.value,
      keyword: searchKeyword.value,
      rarity: rarityFilter.value
    })
    items.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleSizeChange = () => {
  page.value = 1
  loadItems()
}

const updateEffect = () => {
  itemForm.effect = JSON.stringify({ type: effectType.value })
}

const getRarityType = (rarity) => {
  const types = {
    common: 'info',
    rare: 'success',
    epic: 'warning',
    legendary: 'danger'
  }
  return types[rarity] || 'info'
}

const getRarityText = (rarity) => {
  const texts = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return texts[rarity] || rarity
}

const getTypeText = (type) => {
  const texts = {
    dice: '骰子',
    move: '移动',
    defense: '防御',
    attack: '攻击',
    luck: '幸运',
    special: '特殊'
  }
  return texts[type] || type
}

const getEffectType = (effect) => {
  try {
    const obj = JSON.parse(effect)
    const texts = {
      double_dice: '双倍骰子',
      teleport: '传送',
      shield: '护盾',
      missile: '导弹',
      lucky_six: '幸运6',
      rewind: '时间回溯'
    }
    return texts[obj.type] || obj.type
  } catch {
    return '未知'
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const showAddDialog = () => {
  isEdit.value = false
  effectType.value = 'double_dice'
  Object.assign(itemForm, {
    item_id: null,
    item_name: '',
    item_type: 'dice',
    item_icon: '🎁',
    description: '',
    effect: '{"type": "double_dice"}',
    price: 0,
    rarity: 'common',
    status: 1
  })
  dialogVisible.value = true
}

const editItem = (row) => {
  isEdit.value = true
  try {
    const effect = JSON.parse(row.effect)
    effectType.value = effect.type || 'double_dice'
  } catch {
    effectType.value = 'double_dice'
  }
  Object.assign(itemForm, {
    item_id: row.id,
    item_name: row.item_name,
    item_type: row.item_type,
    item_icon: row.item_icon,
    description: row.description,
    effect: row.effect,
    price: row.price,
    rarity: row.rarity,
    status: row.status
  })
  dialogVisible.value = true
}

const saveItem = async () => {
  if (!itemForm.item_name) {
    ElMessage.warning('请输入道具名称')
    return
  }
  if (!itemForm.item_type) {
    ElMessage.warning('请选择道具类型')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateItem({
        item_id: itemForm.item_id,
        item_name: itemForm.item_name,
        item_type: itemForm.item_type,
        item_icon: itemForm.item_icon,
        description: itemForm.description,
        effect: itemForm.effect,
        price: itemForm.price,
        rarity: itemForm.rarity,
        status: itemForm.status
      })
      ElMessage.success('更新成功')
    } else {
      await createItem({
        item_name: itemForm.item_name,
        item_type: itemForm.item_type,
        item_icon: itemForm.item_icon,
        description: itemForm.description,
        effect: itemForm.effect,
        price: itemForm.price,
        rarity: itemForm.rarity
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadItems()
  } finally {
    saving.value = false
  }
}

const deleteItem = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该道具吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    await deleteItemApi(row.id)
    ElMessage.success('删除成功')
    loadItems()
  } catch (e) {}
}

onMounted(loadItems)
</script>

<style scoped>
.admin-page {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  margin: 0;
  font-size: 24px;
  color: #333;
}
.header-actions {
  display: flex;
  gap: 12px;
}
.content-card {
  padding: 24px;
}
.item-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto;
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.item-icon.rarity-common { background: linear-gradient(135deg, #a8a8a8, #808080); }
.item-icon.rarity-rare { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.item-icon.rarity-epic { background: linear-gradient(135deg, #a18cd1, #fbc2eb); }
.item-icon.rarity-legendary { background: linear-gradient(135deg, #fa709a, #fee140); }
.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
