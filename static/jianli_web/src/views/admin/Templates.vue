<template>
  <div class="templates-page">
    <div class="page-header">
      <h2>模板管理</h2>
      <div class="actions">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog">
          新增模板
        </el-button>
      </div>
    </div>

    <div class="table-card">
      <el-table :data="templateList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="缩略图" width="100">
          <template #default="scope">
            <el-image
              :src="scope.row.thumbnail || 'https://picsum.photos/60/80'"
              :preview-src-list="[scope.row.thumbnail || 'https://picsum.photos/300/400']"
              width="60"
              height="80"
              fit="cover"
              style="border-radius: 4px"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="模板名称" min-width="140" />
        <el-table-column prop="category_code" label="分类编码" width="120" />
        <el-table-column prop="use_count" label="使用次数" width="100">
          <template #default="scope">
            <el-tag type="primary">{{ scope.row.use_count }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ scope.row.created_at?.split('T')[0] }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 0"
              size="small"
              type="success"
              @click="publishTemplate(scope.row.id)"
            >
              上架
            </el-button>
            <el-button
              v-else
              size="small"
              type="warning"
              @click="unpublishTemplate(scope.row.id)"
            >
              下架
            </el-button>
            <el-button size="small" type="primary" @click="editTemplate(scope.row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="deleteTemplate(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          @current-change="loadTemplates"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑模板' : '新增模板'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="form.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="所属分类" required>
          <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        <el-form-item label="缩略图">
          <el-input v-model="form.thumbnail" placeholder="请输入缩略图URL" />
        </el-form-item>
        <el-form-item label="预览URL">
          <el-input v-model="form.preview_url" placeholder="请输入预览URL" />
        </el-form-item>
        <el-form-item label="样式配置">
          <el-input
            v-model="form.style_config"
            type="textarea"
            :rows="3"
            placeholder="请输入样式配置JSON"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { templateApi } from '@/api'
import type { Template, TemplateCategory } from '@/types'

const templateList = ref<Template[]>([])
const categories = ref<TemplateCategory[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  name: '',
  category_id: 0,
  description: '',
  thumbnail: '',
  preview_url: '',
  style_config: '',
  sort_order: 0
})

const loadCategories = async () => {
  try {
    const res = await templateApi.getCategoryList({ page: 1, page_size: 100 })
    categories.value = res.items
  } catch (error) {
    console.error('Load categories error:', error)
  }
}

const loadTemplates = async () => {
  loading.value = true
  try {
    const res = await templateApi.getTemplateList({
      page: page.value,
      page_size: pageSize.value
    })
    templateList.value = res.items
    total.value = res.total
  } catch (error) {
    console.error('Load templates error:', error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = () => {
  page.value = 1
  loadTemplates()
}

const showCreateDialog = () => {
  isEdit.value = false
  editingId.value = null
  Object.assign(form, {
    name: '',
    category_id: categories.value[0]?.id || 0,
    description: '',
    thumbnail: '',
    preview_url: '',
    style_config: '',
    sort_order: 0
  })
  dialogVisible.value = true
}

const editTemplate = (template: Template) => {
  isEdit.value = true
  editingId.value = template.id
  Object.assign(form, {
    name: template.name,
    category_id: template.category_id,
    description: template.description,
    thumbnail: template.thumbnail,
    preview_url: template.preview_url,
    style_config: template.style_config,
    sort_order: template.sort_order
  })
  dialogVisible.value = true
}

const saveTemplate = async () => {
  if (!form.name) {
    ElMessage.error('请输入模板名称')
    return
  }
  if (!form.category_id) {
    ElMessage.error('请选择分类')
    return
  }

  try {
    const category = categories.value.find(cat => cat.id === form.category_id)
    const data = {
      ...form,
      category_code: category?.code || ''
    }

    if (isEdit.value && editingId.value) {
      await templateApi.updateTemplate({ template_id: editingId.value }, data)
      ElMessage.success('更新成功')
    } else {
      await templateApi.createTemplate(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadTemplates()
  } catch (error) {
    console.error('Save template error:', error)
  }
}

const publishTemplate = async (templateId: number) => {
  ElMessageBox.confirm('确定要上架该模板吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await templateApi.publishTemplate({ template_id: templateId })
      ElMessage.success('上架成功')
      loadTemplates()
    } catch (error) {
      console.error('Publish template error:', error)
    }
  }).catch(() => {})
}

const unpublishTemplate = async (templateId: number) => {
  ElMessageBox.confirm('确定要下架该模板吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await templateApi.unpublishTemplate({ template_id: templateId })
      ElMessage.success('下架成功')
      loadTemplates()
    } catch (error) {
      console.error('Unpublish template error:', error)
    }
  }).catch(() => {})
}

const deleteTemplate = async (templateId: number) => {
  ElMessageBox.confirm('确定要删除该模板吗？删除后无法恢复。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await templateApi.deleteTemplate({ template_id: templateId })
      ElMessage.success('删除成功')
      loadTemplates()
    } catch (error) {
      console.error('Delete template error:', error)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadCategories()
  loadTemplates()
})
</script>

<style scoped>
.templates-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
