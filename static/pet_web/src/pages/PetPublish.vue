<template>
  <Layout>
    <div class="pet-publish-page page-container">
      <div class="card">
        <h2>发布宠物</h2>
        <p class="subtitle">填写宠物信息，帮助它们找到温暖的家</p>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="publish-form">
          <el-form-item label="宠物名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入宠物名称" />
          </el-form-item>
          <el-form-item label="宠物类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择宠物类型">
              <el-option label="狗狗" value="dog" />
              <el-option label="猫咪" value="cat" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="品种" prop="breed">
            <el-input v-model="form.breed" placeholder="请输入品种" />
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="年龄（月）" prop="age">
                <el-input-number v-model="form.age" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="form.gender">
                  <el-radio value="male">公</el-radio>
                  <el-radio value="female">母</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="体重（kg）">
                <el-input-number v-model="form.weight" :min="0" :precision="1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="颜色">
                <el-input v-model="form.color" placeholder="请输入颜色" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="健康状况">
            <el-checkbox-group v-model="healthStatus">
              <el-checkbox label="vaccinated">已接种疫苗</el-checkbox>
              <el-checkbox label="sterilized">已绝育</el-checkbox>
              <el-checkbox label="dewormed">已驱虫</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="所在地址" prop="address">
            <el-input v-model="form.address" placeholder="请输入所在地址" />
          </el-form-item>
          <el-form-item label="宠物描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="5"
              placeholder="请详细描述宠物的性格、习惯等信息"
            />
          </el-form-item>
          <el-form-item label="宠物图片">
            <div class="image-preview" v-if="form.images">
              <img v-for="(img, index) in form.images.split(',')" :key="index" :src="img" class="preview-img" />
            </div>
            <el-input v-model="form.images" placeholder="多个图片URL用逗号分隔，例如：https://xxx.com/1.jpg,https://xxx.com/2.jpg" />
            <div class="tip">请输入图片URL，多个图片用逗号分隔</div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" :loading="loading" @click="handleSubmit">
              发布宠物
            </el-button>
            <el-button size="large" @click="$router.back()">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { petApi } from '@/api'
import { useUserStore } from '@/stores/user'
import Layout from '@/components/Layout.vue'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  name: '',
  type: '',
  breed: '',
  age: null,
  gender: '',
  weight: null,
  color: '',
  vaccinated: 0,
  sterilized: 0,
  dewormed: 0,
  address: '',
  description: '',
  images: ''
})

const healthStatus = ref([])

const rules = {
  name: [{ required: true, message: '请输入宠物名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择宠物类型', trigger: 'change' }],
  breed: [{ required: true, message: '请输入品种', trigger: 'blur' }],
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  address: [{ required: true, message: '请输入所在地址', trigger: 'blur' }],
  description: [{ required: true, message: '请输入宠物描述', trigger: 'blur' }]
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      form.vaccinated = healthStatus.value.includes('vaccinated') ? 1 : 0
      form.sterilized = healthStatus.value.includes('sterilized') ? 1 : 0
      form.dewormed = healthStatus.value.includes('dewormed') ? 1 : 0
      
      loading.value = true
      try {
        await petApi.create(form, userStore.userId)
        ElMessage.success('发布成功，等待审核')
        router.push('/my-pets')
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.pet-publish-page {
  padding-top: 20px;
}

.publish-form {
  max-width: 800px;
}

.image-preview {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.preview-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.card h2 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #303133;
}

.subtitle {
  color: #909399;
  margin-bottom: 24px;
}

.tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style>
