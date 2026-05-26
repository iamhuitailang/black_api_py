<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">用户注册</h2>
      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleRegister">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名(至少3位)" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码(至少6位)" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称(选填)" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱(选填)" :prefix-icon="Message" size="large" />
        </el-form-item>
        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号(选填)" :prefix-icon="Phone" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="handleRegister">
            注册
          </el-button>
        </el-form-item>
        <el-form-item>
          <div style="text-align: center; width: 100%">
            <span style="color: #909399">已有账号？</span>
            <el-link type="primary" @click="$router.push('/login')">立即登录</el-link>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Message, Phone } from '@element-plus/icons-vue'
import { api } from '@/api/request'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 3, message: '用户名至少3位', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }]
}

async function handleRegister() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await api.post('/movie/register', form)
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } catch (e: any) {
        // Error handled in interceptor
      } finally {
        loading.value = false
      }
    }
  })
}
</script>