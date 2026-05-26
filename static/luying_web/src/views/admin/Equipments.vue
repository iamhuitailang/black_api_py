<template>
  <div class="admin-equipments">
    <div class="page-header flex-between">
      <h1 class="page-title">装备管理</h1>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        添加装备
      </el-button>
    </div>

    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索装备名称"
        clearable
        style="width: 250px"
        @keyup.enter="fetchList"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="fetchList">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="装备名称" />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column prop="brand" label="品牌" width="120" />
      <el-table-column prop="weight" label="重量(kg)" width="100">
        <template #default="{ row }">
          {{ row.weight || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格" width="100">
        <template #default="{ row }">
          {{ row.price ? `¥${row.price}` : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="公开" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_public ? 'success' : 'info'" size="small">
            {{ row.is_public ? '公开' : '私有' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <el-dialog v-model="showCreateDialog" title="添加装备" width="500px">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="装备名称" required>
          <el-input v-model="formData.name" placeholder="请输入装备名称" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌">
          <el-input v-model="formData.brand" placeholder="请输入品牌" />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="formData.model" placeholder="请输入型号" />
        </el-form-item>
        <el-form-item label="重量(kg)">
          <el-input-number v-model="formData.weight" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="价格(元)">
          <el-input-number v-model="formData.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="公开">
          <el-switch v-model="formData.is_public" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminEquipments, deleteAdminEquipment, createAdminEquipment } from '@/api/admin'
import { useUserStore } from '@/stores/user'
import type { Equipment } from '@/types'

const userStore = useUserStore()
const loading = ref(false)
const creating = ref(false)
const list = ref<Equipment[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const showCreateDialog = ref(false)
const categories = ['帐篷', '睡袋', '背包', '炉具', '餐具', '照明', '工具', '其他']
const formData = ref({
  name: '',
  category: '',
  brand: '',
  model: '',
  weight: 0,
  price: 0,
  description: '',
  is_public: false
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getAdminEquipments({
      page: page.value,
      page_size: pageSize.value,
      keyword: keyword.value || undefined
    })
    if (res.code === 200) {
      list.value = res.data.items
      total.value = res.data.total
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!formData.value.name) {
    ElMessage.warning('请输入装备名称')
    return
  }
  creating.value = true
  try {
    const res = await createAdminEquipment(userStore.userInfo!.id, formData.value)
    if (res.code === 200) {
      ElMessage.success('创建成功')
      showCreateDialog.value = false
      formData.value = {
        name: '',
        category: '',
        brand: '',
        model: '',
        weight: 0,
        price: 0,
        description: '',
        is_public: false
      }
      fetchList()
    }
  } catch (error) {
    console.error(error)
  } finally {
    creating.value = false
  }
}

const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定要删除这个装备吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteAdminEquipment(id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchList()
      }
    } catch (error) {
      console.error(error)
    }
  }).catch(() => {})
}

const formatTime = (time?: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

onMounted(fetchList)
</script>

<style scoped>
.admin-equipments {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
