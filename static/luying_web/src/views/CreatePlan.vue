<template>
  <div class="create-plan">
    <el-page-header @back="$router.back()" title="创建露营计划" class="page-header" />

    <div class="plan-form">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="计划名称" prop="title">
          <el-input v-model="form.title" placeholder="给你的露营计划起个名字" />
        </el-form-item>
        <el-form-item label="目的地" prop="destination">
          <el-input v-model="form.destination" placeholder="你要去哪里露营？" />
        </el-form-item>
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker
            v-model="form.start_date"
            type="date"
            placeholder="选择开始日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="end_date">
          <el-date-picker
            v-model="form.end_date"
            type="date"
            placeholder="选择结束日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="封面图片" prop="cover_image">
          <el-input v-model="form.cover_image" placeholder="输入封面图片URL（可选）" />
        </el-form-item>
        <el-form-item label="计划描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="描述一下你的露营计划..."
          />
        </el-form-item>
        <el-form-item label="装备清单">
          <div class="items-editor">
            <div v-for="(item, index) in form.items" :key="index" class="item-row">
              <el-input v-model="item.name" placeholder="装备名称" style="flex: 2" />
              <el-input v-model="item.category" placeholder="分类" style="flex: 1" />
              <el-input-number v-model="item.quantity" :min="1" />
              <el-button type="danger" circle @click="removeItem(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="dashed" @click="addItem">
              <el-icon><Plus /></el-icon>
              添加装备
            </el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">创建计划</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { createPlan } from '@/api/plan'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  title: '',
  destination: '',
  start_date: '',
  end_date: '',
  cover_image: '',
  description: '',
  items: [
    { name: '', category: '帐篷', quantity: 1 },
    { name: '', category: '睡袋', quantity: 1 },
    { name: '', category: '防潮垫', quantity: 1 }
  ]
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入计划名称', trigger: 'blur' }]
}

const addItem = () => {
  form.items.push({ name: '', category: '', quantity: 1 })
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await createPlan(userStore.userInfo!.id, {
      ...form,
      start_date: form.start_date ? new Date(form.start_date).toISOString().split('T')[0] : '',
      end_date: form.end_date ? new Date(form.end_date).toISOString().split('T')[0] : '',
      items: form.items.filter(item => item.name)
    })
    if (res.code === 200) {
      ElMessage.success('创建成功')
      router.push(`/plan/${res.data.id}`)
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-plan {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.plan-form {
  max-width: 800px;
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.items-editor {
  width: 100%;
}

.item-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}
</style>
