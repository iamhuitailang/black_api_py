<template>
  <div class="create-campsite">
    <el-page-header @back="$router.back()" title="添加营地" class="page-header" />

    <div class="form-container">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="营地名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入营地名称" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="form.location" placeholder="请输入地点" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input-number v-model="form.latitude" :precision="6" :step="0.000001" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input-number v-model="form.longitude" :precision="6" :step="0.000001" />
        </el-form-item>
        <el-form-item label="封面图片">
          <el-input v-model="form.cover_image" placeholder="封面图片URL" />
        </el-form-item>
        <el-form-item label="图片集">
          <el-input
            v-model="form.images"
            type="textarea"
            :rows="3"
            placeholder="多张图片URL用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="描述营地的特点"
          />
        </el-form-item>
        <el-form-item label="设施配置">
          <el-input
            v-model="form.facilities"
            type="textarea"
            :rows="2"
            placeholder="设施用逗号分隔，如：水源,卫生间,停车场"
          />
        </el-form-item>
        <el-form-item label="最佳季节">
          <el-input v-model="form.best_season" placeholder="如：春秋季" />
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="form.difficulty" placeholder="选择难度" style="width: 100%">
            <el-option label="简单" value="简单" />
            <el-option label="中等" value="中等" />
            <el-option label="困难" value="困难" />
          </el-select>
        </el-form-item>
        <el-form-item label="费用信息">
          <el-input v-model="form.price_info" placeholder="如：免费/50元/天" />
        </el-form-item>
        <el-form-item label="温馨提示">
          <el-input
            v-model="form.tips"
            type="textarea"
            :rows="3"
            placeholder="一些提示信息"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">提交</el-button>
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
import { createCampsite } from '@/api/campsite'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  name: '',
  location: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
  cover_image: '',
  images: '',
  description: '',
  facilities: '',
  best_season: '',
  difficulty: '',
  price_info: '',
  tips: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入营地名称', trigger: 'blur' }]
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await createCampsite(userStore.userInfo!.id, form)
    if (res.code === 200) {
      ElMessage.success('添加成功')
      router.push('/admin/campsites')
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-campsite {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.form-container {
  max-width: 800px;
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
</style>
