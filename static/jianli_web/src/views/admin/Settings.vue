<template>
  <div class="settings-page">
    <div class="page-header">
      <h3>系统设置</h3>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增配置
      </el-button>
    </div>

    <el-card class="table-card">
      <div class="search-bar">
        <el-select
          v-model="groupFilter"
          placeholder="选择分组"
          clearable
          style="width: 200px"
          @change="fetchData"
        >
          <el-option label="基础设置" value="basic" />
          <el-option label="安全设置" value="security" />
          <el-option label="上传设置" value="upload" />
          <el-option label="其他设置" value="default" />
        </el-select>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="setting_key" label="配置键" min-width="180" />
        <el-table-column prop="setting_name" label="配置名称" min-width="150" />
        <el-table-column prop="setting_value" label="配置值" min-width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.setting_value" placement="top" v-if="row.setting_value.length > 30">
              <span>{{ row.setting_value.slice(0, 30) }}...</span>
            </el-tooltip>
            <span v-else>{{ row.setting_value }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="group_name" label="分组" width="120" />
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column prop="updated_at" label="更新时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
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
      :title="isEdit ? '编辑配置' : '新增配置'"
      width="500px"
      @close="resetForm"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="配置键" prop="setting_key">
          <el-input
            v-model="formData.setting_key"
            placeholder="请输入配置键"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="配置名称" prop="setting_name">
          <el-input v-model="formData.setting_name" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="配置值" prop="setting_value">
          <el-input
            v-model="formData.setting_value"
            type="textarea"
            :rows="3"
            placeholder="请输入配置值"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="分组" prop="group_name">
          <el-select v-model="formData.group_name" placeholder="请选择分组">
            <el-option label="基础设置" value="basic" />
            <el-option label="安全设置" value="security" />
            <el-option label="上传设置" value="upload" />
            <el-option label="其他设置" value="default" />
          </el-select>
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
import { settingsApi } from '@/api'
import type { SystemSettings } from '@/types'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(0)
const groupFilter = ref('')
const formRef = ref<FormInstance>()

const tableData = ref<SystemSettings[]>([])

const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})

const formData = reactive({
  setting_key: '',
  setting_name: '',
  setting_value: '',
  description: '',
  group_name: 'default',
  sort_order: 0
})

const formRules: FormRules = {
  setting_key: [{ required: true, message: '请输入配置键', trigger: 'blur' }],
  setting_value: [{ required: true, message: '请输入配置值', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.page_size
    }
    if (groupFilter.value) {
      params.group_name = groupFilter.value
    }
    const res = await settingsApi.getList(params)
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

const handleEdit = (row: SystemSettings) => {
  isEdit.value = true
  editId.value = row.id
  formData.setting_key = row.setting_key
  formData.setting_name = row.setting_name
  formData.setting_value = row.setting_value
  formData.description = row.description
  formData.group_name = row.group_name
  formData.sort_order = row.sort_order
  dialogVisible.value = true
}

const resetForm = () => {
  formData.setting_key = ''
  formData.setting_name = ''
  formData.setting_value = ''
  formData.description = ''
  formData.group_name = 'default'
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
        res = await settingsApi.update(
          { setting_id: editId.value },
          {
            setting_value: formData.setting_value,
            setting_name: formData.setting_name,
            description: formData.description,
            group_name: formData.group_name,
            sort_order: formData.sort_order
          }
        )
      } else {
        res = await settingsApi.create({ ...formData })
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

const handleDelete = (row: SystemSettings) => {
  ElMessageBox.confirm('确定要删除该配置吗？', '提示', {
    type: 'warning'
  })
    .then(async () => {
      try {
        const res = await settingsApi.delete({ setting_id: row.id })
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
.settings-page {
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

.search-bar {
  margin-bottom: 20px;
}

.table-card {
  background: #fff;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
