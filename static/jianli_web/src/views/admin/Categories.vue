<template>
  <div class="categories-page">
    <div class="page-header">
      <h3>分类管理</h3>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增分类
      </el-button>
    </div>

    <el-card class="table-card">
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" min-width="150" />
        <el-table-column prop="code" label="分类编码" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="sort_order" label="排序" width="100" />
        <el-table-column prop="status_text" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === 1"
              type="warning"
              link
              @click="handleToggleStatus(row, 0)"
            >
              禁用
            </el-button>
            <el-button
              v-else
              type="success"
              link
              @click="handleToggleStatus(row, 1)"
            >
              启用
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="500px"
      @close="resetForm"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="formData.sort_order" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { templateApi } from '@/api'
import type { TemplateCategory } from '@/types'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(0)
const formRef = ref<FormInstance>()

const tableData = ref<TemplateCategory[]>([])

const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})

const formData = reactive({
  name: '',
  code: '',
  description: '',
  sort_order: 0
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分类编码', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await templateApi.getCategoryList({
      page: pagination.page,
      page_size: pagination.page_size
    })
    if (res.code === 0) {
      tableData.value = res.data.items
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.msg || '获取数据失败')
    }
  } catch (error) {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  editId.value = 0
  dialogVisible.value = true
}

const handleEdit = (row: TemplateCategory) => {
  isEdit.value = true
  editId.value = row.id
  formData.name = row.name
  formData.code = row.code
  formData.description = row.description
  formData.sort_order = row.sort_order
  dialogVisible.value = true
}

const resetForm = () => {
  formData.name = ''
  formData.code = ''
  formData.description = ''
  formData.sort_order = 0
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      let res
      if (isEdit.value) {
        res = await templateApi.updateCategory(
          { category_id: editId.value },
          { ...formData }
        )
      } else {
        res = await templateApi.createCategory({ ...formData })
      }

      if (res.code === 0) {
        ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
        dialogVisible.value = false
        fetchData()
      } else {
        ElMessage.error(res.msg || '操作失败')
      }
    } catch (error) {
      ElMessage.error('网络错误')
    } finally {
      submitting.value = false
    }
  })
}

const handleToggleStatus = async (row: TemplateCategory, status: number) => {
  try {
    const res = await templateApi.updateCategory(
      { category_id: row.id },
      { status }
    )
    if (res.code === 0) {
      ElMessage.success('操作成功')
      fetchData()
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (error) {
    ElMessage.error('网络错误')
  }
}

const handleDelete = (row: TemplateCategory) => {
  ElMessageBox.confirm('确定要删除该分类吗？', '提示', {
    type: 'warning'
  })
    .then(async () => {
      try {
        const res = await templateApi.deleteCategory({ category_id: row.id })
        if (res.code === 0) {
          ElMessage.success('删除成功')
          fetchData()
        } else {
          ElMessage.error(res.msg || '删除失败')
        }
      } catch (error) {
        ElMessage.error('网络错误')
      }
    })
    .catch(() => {})
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.categories-page {
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
  font-size: 20px;
}

.table-card {
  background: #fff;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
