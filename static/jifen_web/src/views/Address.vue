<template>
  <div class="address-container">
    <div class="page-header">
      <div class="header-content">
        <h1>📍 地址管理</h1>
        <el-button type="warning" @click="showAddDialog">+ 添加地址</el-button>
      </div>
    </div>

    <div class="main-content">
      <div class="address-list">
        <div
          v-for="addr in addresses"
          :key="addr.id"
          class="address-card"
          :class="{ default: addr.is_default }"
        >
          <div class="address-info">
            <div class="address-header">
              <span class="name">{{ addr.receiver_name }}</span>
              <span class="phone">{{ addr.phone }}</span>
              <span class="default-tag" v-if="addr.is_default">默认</span>
            </div>
            <p class="address-detail">
              {{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}
            </p>
          </div>
          <div class="address-actions">
            <el-button text @click="editAddress(addr)">编辑</el-button>
            <el-button text @click="setDefault(addr.id)" v-if="!addr.is_default">设为默认</el-button>
            <el-button text type="danger" @click="deleteAddress(addr.id)">删除</el-button>
          </div>
        </div>
        <div v-if="addresses.length === 0" class="empty-state">
          <span>📍</span>
          <p>暂无收货地址</p>
        </div>
      </div>
    </div>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑地址' : '添加地址'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="收件人" prop="receiver_name">
          <el-input v-model="form.receiver_name" placeholder="请输入收件人姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="form.province" placeholder="请输入省份" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="form.city" placeholder="请输入城市" />
        </el-form-item>
        <el-form-item label="区县">
          <el-input v-model="form.district" placeholder="请输入区县" />
        </el-form-item>
        <el-form-item label="详细地址" prop="detail">
          <el-input v-model="form.detail" type="textarea" :rows="2" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="form.is_default" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="warning" @click="submitForm" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { addressApi } from '@/api/address'

const addresses = ref<any[]>([])
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  receiver_name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false
})

const rules: FormRules = {
  receiver_name: [{ required: true, message: '请输入收件人姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  detail: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

onMounted(() => {
  loadAddresses()
})

async function loadAddresses() {
  try {
    const res: any = await addressApi.getList()
    addresses.value = res.data || []
  } catch (error) {
    console.error(error)
  }
}

function showAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    receiver_name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    is_default: false
  })
  showDialog.value = true
}

function editAddress(addr: any) {
  isEdit.value = true
  editId.value = addr.id
  Object.assign(form, addr)
  showDialog.value = true
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        if (isEdit.value && editId.value) {
          await addressApi.update(editId.value, form)
          ElMessage.success('修改成功')
        } else {
          await addressApi.create(form)
          ElMessage.success('添加成功')
        }
        showDialog.value = false
        await loadAddresses()
      } catch (error) {
        console.error(error)
      } finally {
        saving.value = false
      }
    }
  })
}

async function setDefault(id: number) {
  try {
    await addressApi.setDefault(id)
    ElMessage.success('设置成功')
    await loadAddresses()
  } catch (error) {
    console.error(error)
  }
}

async function deleteAddress(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除该地址吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await addressApi.delete(id)
    ElMessage.success('删除成功')
    await loadAddresses()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}
</script>

<style scoped>
.address-container {
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #FF8C00, #FF6600);
  color: white;
  padding: 20px 0;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.address-list {
  display: grid;
  gap: 15px;
}

.address-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.address-card.default {
  border: 2px solid #FF8C00;
}

.address-info {
  flex: 1;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.name {
  font-weight: 600;
}

.phone {
  color: #666;
}

.default-tag {
  background: #FF8C00;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.address-detail {
  color: #666;
  font-size: 14px;
}

.address-actions {
  display: flex;
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}

.empty-state span {
  font-size: 64px;
  display: block;
  margin-bottom: 15px;
}
</style>
