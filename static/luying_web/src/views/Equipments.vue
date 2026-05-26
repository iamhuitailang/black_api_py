<template>
  <div class="equipments-page">
    <div class="page-header flex-between">
      <h1 class="page-title">装备库</h1>
      <el-button type="primary" @click="showCreateDialog = true" :disabled="!userStore.isLoggedIn">
        <el-icon><Plus /></el-icon>
        添加装备
      </el-button>
    </div>

    <el-alert
      v-if="!userStore.isLoggedIn"
      title="请先登录后管理装备"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #default>
        <el-button size="small" type="primary" @click="$router.push('/login')">去登录</el-button>
      </template>
    </el-alert>

    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索装备"
        clearable
        style="width: 200px"
        @keyup.enter="fetchList"
      />
      <el-select v-model="category" placeholder="分类" clearable style="width: 150px">
        <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
      </el-select>
      <el-button type="primary" @click="fetchList">搜索</el-button>
    </div>

    <div class="equipment-grid" v-loading="loading">
      <div v-for="equipment in list" :key="equipment.id" class="equipment-card">
        <div class="equipment-image">
          <img :src="equipment.image || placeholderImage" alt="" />
        </div>
        <div class="equipment-info">
          <h3 class="text-ellipsis">{{ equipment.name }}</h3>
          <div class="equipment-meta">
            <el-tag v-if="equipment.category" size="small" type="info">{{ equipment.category }}</el-tag>
            <span v-if="equipment.brand" class="brand">{{ equipment.brand }}</span>
          </div>
          <div class="equipment-specs">
            <span v-if="equipment.weight"><el-icon><Scale /></el-icon> {{ equipment.weight }}kg</span>
            <span v-if="equipment.price"><el-icon><Money /></el-icon> ¥{{ equipment.price }}</span>
          </div>
          <div class="equipment-actions">
            <el-button size="small" @click="handleEdit(equipment)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(equipment.id)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && list.length === 0" description="暂无装备" />

    <el-dialog v-model="showCreateDialog" :title="editingEquipment ? '编辑装备' : '添加装备'" width="600px">
      <el-form :model="equipmentForm" :rules="equipmentRules" ref="equipmentFormRef" label-width="80px">
        <el-form-item label="装备名称" prop="name">
          <el-input v-model="equipmentForm.name" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="equipmentForm.category" placeholder="选择或输入" allow-create filterable style="width: 100%">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌">
          <el-input v-model="equipmentForm.brand" />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="equipmentForm.model" />
        </el-form-item>
        <el-form-item label="重量(kg)">
          <el-input-number v-model="equipmentForm.weight" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="价格(¥)">
          <el-input-number v-model="equipmentForm.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="购买日期">
          <el-date-picker v-model="equipmentForm.purchase_date" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="图片">
          <el-input v-model="equipmentForm.image" placeholder="图片URL" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="equipmentForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="equipmentForm.condition" style="width: 100%">
            <el-option label="全新" value="new" />
            <el-option label="良好" value="good" />
            <el-option label="一般" value="fair" />
            <el-option label="破旧" value="worn" />
          </el-select>
        </el-form-item>
        <el-form-item label="公开">
          <el-switch v-model="equipmentForm.is_public" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { getEquipmentList, createEquipment, updateEquipment, deleteEquipment, getCategories } from '@/api/equipment'
import { useUserStore } from '@/stores/user'
import type { Equipment } from '@/types'

const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const list = ref<Equipment[]>([])
const categories = ref<string[]>([])
const keyword = ref('')
const category = ref('')
const showCreateDialog = ref(false)
const editingEquipment = ref<Equipment | null>(null)
const equipmentFormRef = ref<FormInstance>()
const placeholderImage = 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=400&h=300&fit=crop'

const equipmentForm = reactive({
  name: '',
  category: '',
  brand: '',
  model: '',
  weight: undefined as number | undefined,
  price: undefined as number | undefined,
  purchase_date: '',
  image: '',
  description: '',
  condition: 'good',
  is_public: false
})

const equipmentRules: FormRules = {
  name: [{ required: true, message: '请输入装备名称', trigger: 'blur' }]
}

const fetchList = async () => {
  if (!userStore.isLoggedIn) return
  loading.value = true
  try {
    const res = await getEquipmentList(userStore.userInfo!.id, {
      category: category.value || undefined
    })
    if (res.code === 200) {
      list.value = res.data.items
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await getCategories(userStore.userInfo?.id)
    if (res.code === 200) {
      categories.value = res.data.categories
    }
  } catch (error) {
    console.error(error)
  }
}

const handleEdit = (equipment: Equipment) => {
  editingEquipment.value = equipment
  Object.assign(equipmentForm, {
    name: equipment.name,
    category: equipment.category || '',
    brand: equipment.brand || '',
    model: equipment.model || '',
    weight: equipment.weight,
    price: equipment.price,
    purchase_date: equipment.purchase_date || '',
    image: equipment.image || '',
    description: equipment.description || '',
    condition: equipment.condition,
    is_public: equipment.is_public
  })
  showCreateDialog.value = true
}

const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定要删除这个装备吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteEquipment(id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchList()
      }
    } catch (error) {
      console.error(error)
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  const valid = await equipmentFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingEquipment.value) {
      const res = await updateEquipment(editingEquipment.value.id, equipmentForm)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        showCreateDialog.value = false
        fetchList()
      }
    } else {
      const res = await createEquipment(userStore.userInfo!.id, equipmentForm)
      if (res.code === 200) {
        ElMessage.success('添加成功')
        showCreateDialog.value = false
        fetchList()
        fetchCategories()
      }
    }
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
    resetForm()
  }
}

const resetForm = () => {
  editingEquipment.value = null
  Object.assign(equipmentForm, {
    name: '',
    category: '',
    brand: '',
    model: '',
    weight: undefined,
    price: undefined,
    purchase_date: '',
    image: '',
    description: '',
    condition: 'good',
    is_public: false
  })
  equipmentFormRef.value?.resetFields()
}

onMounted(() => {
  fetchList()
  fetchCategories()
})
</script>

<style scoped>
.equipments-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.equipment-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.equipment-image {
  height: 180px;
  overflow: hidden;
}

.equipment-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.equipment-info {
  padding: 16px;
}

.equipment-info h3 {
  font-size: 16px;
  margin-bottom: 8px;
}

.equipment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.equipment-meta .brand {
  color: #909399;
  font-size: 14px;
}

.equipment-specs {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 14px;
  margin-bottom: 12px;
}

.equipment-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .equipment-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
