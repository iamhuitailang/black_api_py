<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Delete, Setting } from '@element-plus/icons-vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { postApi, categoryApi, tagApi, type Category, type Tag } from '@/api/blog'
import { slugify } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const form = ref({
  id: 0,
  title: '',
  content: '',
  summary: '',
  category_id: undefined as number | undefined,
  tag_ids: [] as number[],
  cover: '',
  status: 0
})

const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const loading = ref(false)
const submitting = ref(false)

const editId = computed(() => (route.params.id ? Number(route.params.id) : 0))
const isEdit = computed(() => editId.value > 0)
const wordCount = computed(() => (form.value.content?.length || 0))

const loadCategories = async () => {
  const res = await categoryApi.all()
  categories.value = res.data || []
}

const loadTags = async () => {
  const res = await tagApi.all()
  tags.value = res.data || []
}

const loadPost = async () => {
  if (!editId.value) return
  loading.value = true
  try {
    const res = await postApi.detail(editId.value)
    const p = res.data
    form.value = {
      id: p.id,
      title: p.title,
      content: p.content || '',
      summary: p.summary || '',
      category_id: p.category_id,
      tag_ids: (p.tags || []).map((t: Tag) => t.id),
      cover: p.cover || '',
      status: p.status
    }
  } finally {
    loading.value = false
  }
}

const validate = () => {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入文章标题')
    return false
  }
  if (!form.value.content.trim()) {
    ElMessage.warning('请输入文章内容')
    return false
  }
  if (!form.value.category_id) {
    ElMessage.warning('请选择文章分类')
    return false
  }
  return true
}

const handleSave = async (publish: boolean) => {
  if (!validate()) return
  submitting.value = true
  try {
    const payload = {
      ...form.value,
      status: publish ? 1 : 0,
      slug: slugify(form.value.title)
    }
    if (isEdit.value) {
      await postApi.update(payload)
      ElMessage.success(publish ? '发布成功' : '已保存草稿')
    } else {
      const res = await postApi.create(payload)
      form.value.id = (res.data as any)?.id || 0
      ElMessage.success(publish ? '发布成功' : '已保存草稿')
    }
    if (publish) {
      router.push({ name: 'PostDetail', params: { id: form.value.id } })
    }
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  if (!editId.value) return
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？此操作不可恢复。', '删除确认', {
      type: 'warning'
    })
    await postApi.delete(editId.value)
    ElMessage.success('已删除')
    router.push({ name: 'Home' })
  } catch {}
}

onMounted(() => {
  loadCategories()
  loadTags()
  loadPost()
})
</script>

<template>
  <div class="editor-page" v-loading="loading">
    <header class="editor-header">
      <div class="header-left">
        <el-button text @click="$router.back()">← 返回</el-button>
        <h2 class="title-2" style="margin: 0">{{ isEdit ? '编辑文章' : '写新文章' }}</h2>
      </div>
      <div class="header-right">
        <span class="word-count muted">{{ wordCount }} 字</span>
        <el-button v-if="isEdit" type="danger" text :icon="Delete" @click="handleDelete">删除</el-button>
        <el-button :loading="submitting" @click="handleSave(false)">保存草稿</el-button>
        <el-button type="primary" :loading="submitting" :icon="UploadFilled" @click="handleSave(true)">
          {{ isEdit && form.status === 1 ? '更新发布' : '立即发布' }}
        </el-button>
      </div>
    </header>

    <div class="editor-body">
      <aside class="editor-side card">
        <div class="form-item">
          <label>标题</label>
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </div>
        <div class="form-item">
          <label>分类</label>
          <el-select v-model="form.category_id" placeholder="选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </div>
        <div class="form-item">
          <label>标签</label>
          <el-select v-model="form.tag_ids" multiple placeholder="选择标签" style="width: 100%">
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </div>
        <div class="form-item">
          <label>摘要</label>
          <el-input v-model="form.summary" type="textarea" :rows="3" placeholder="文章摘要（可选）" />
        </div>
        <div class="form-item">
          <label>封面图</label>
          <el-input v-model="form.cover" placeholder="封面图 URL（可选）" />
        </div>
      </aside>

      <div class="editor-main card">
        <MdEditor
          v-model="form.content"
          :editor-id="'blog-editor'"
          language="zh-CN"
          theme="light"
          :toolbars="['bold', 'underline', 'italic', 'strikeThrough', 'title', 'sub', 'sup', 'quote', 'unorderedList', 'orderedList', 'codeRow', 'code', 'link', 'image', 'table', 'mermaid', 'katex', 'revoke', 'next', 'save', 'pageFullscreen']"
          :editor-style="{ height: 'calc(100vh - 280px)', fontSize: '15px' }"
          placeholder="开始写作吧，支持 Markdown..."
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .word-count {
    font-size: 13px;
  }
}

.editor-body {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.editor-side {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: fit-content;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-soft);
  }
}

.editor-main {
  padding: 8px;
}
</style>
