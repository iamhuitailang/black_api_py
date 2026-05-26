<template>
  <div class="products-admin">
    <div class="toolbar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索商品" 
        style="width: 200px;"
        clearable
        @clear="loadProducts"
        @keyup.enter="loadProducts"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="warning" @click="showAddDialog">+ 添加商品</el-button>
    </div>

    <el-table :data="products" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="商品名称" />
      <el-table-column prop="category_name" label="分类" width="100" />
      <el-table-column prop="price" label="积分" width="100" />
      <el-table-column prop="stock" label="库存" width="100" />
      <el-table-column prop="exchange_count" label="已兑" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_online ? 'success' : 'info'">
            {{ row.is_online ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="editProduct(row)">编辑</el-button>
          <el-button size="small" @click="toggleOnline(row)">
            {{ row.is_online ? '下架' : '上架' }}
          </el-button>
          <el-button size="small" type="danger" @click="deleteProduct(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadProducts"
      />
    </div>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑商品' : '添加商品'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="商品名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category_id" style="width: 100%;">
            <el-option 
              v-for="cat in categories" 
              :key="cat.id" 
              :label="cat.name" 
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="积分价格">
          <el-input-number v-model="form.price" :min="0" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="是否热门">
          <el-switch v-model="form.is_hot" />
        </el-form-item>
        <el-form-item label="是否上架">
          <el-switch v-model="form.is_online" />
        </el-form-item>
        <el-form-item label="是否虚拟">
          <el-switch v-model="form.is_virtual" />
        </el-form-item>
        <el-form-item label="限购类型">
          <el-select v-model="form.limit_type" style="width: 100%;">
            <el-option label="不限" value="none" />
            <el-option label="每日" value="day" />
            <el-option label="每周" value="week" />
            <el-option label="每月" value="month" />
            <el-option label="终身" value="lifetime" />
          </el-select>
        </el-form-item>
        <el-form-item label="限购数量" v-if="form.limit_type !== 'none'">
          <el-input-number v-model="form.limit_count" :min="1" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { productApi } from '@/api/product'
import { categoryApi } from '@/api/category'

const products = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchKeyword = ref('')

const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const form = reactive({
  name: '',
  category_id: 1,
  description: '',
  image: '',
  images: '',
  price: 0,
  original_price: 0,
  stock: 0,
  total_stock: 0,
  is_hot: false,
  is_online: true,
  is_virtual: true,
  limit_type: 'none',
  limit_count: 0,
  sort: 0
})

onMounted(async () => {
  await loadCategories()
  await loadProducts()
})

async function loadCategories() {
  try {
    const res: any = await categoryApi.getList()
    categories.value = res.data
  } catch (error) {
    console.error(error)
  }
}

async function loadProducts() {
  loading.value = true
  try {
    const res: any = await productApi.getList({
      page: page.value,
      page_size: pageSize.value,
      keyword: searchKeyword.value
    })
    products.value = res.data
    total.value = res.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function showAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    name: '',
    category_id: 1,
    description: '',
    image: '',
    images: '',
    price: 0,
    original_price: 0,
    stock: 0,
    total_stock: 0,
    is_hot: false,
    is_online: true,
    is_virtual: true,
    limit_type: 'none',
    limit_count: 0,
    sort: 0
  })
  showDialog.value = true
}

function editProduct(product: any) {
  isEdit.value = true
  editId.value = product.id
  Object.assign(form, product)
  showDialog.value = true
}

async function submitForm() {
  saving.value = true
  try {
    if (isEdit.value && editId.value) {
      await productApi.update(editId.value, form)
      ElMessage.success('修改成功')
    } else {
      await productApi.create(form)
      ElMessage.success('添加成功')
    }
    showDialog.value = false
    await loadProducts()
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}

async function toggleOnline(product: any) {
  try {
    await productApi.toggleOnline(product.id)
    ElMessage.success('操作成功')
    await loadProducts()
  } catch (error) {
    console.error(error)
  }
}

async function deleteProduct(product: any) {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await productApi.delete(product.id)
    ElMessage.success('删除成功')
    await loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}
</script>

<style scoped>
.products-admin {
  background: white;
  padding: 20px;
  border-radius: 12px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
