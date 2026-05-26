<template>
  <div class="orders-admin">
    <div class="toolbar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索订单" 
        style="width: 200px;"
        clearable
        @clear="loadOrders"
        @keyup.enter="loadOrders"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="订单状态" clearable style="width: 150px;" @change="loadOrders">
        <el-option label="待处理" value="pending" />
        <el-option label="已发货" value="shipped" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
    </div>

    <el-table :data="orders" style="width: 100%" v-loading="loading">
      <el-table-column prop="order_no" label="订单号" width="180" />
      <el-table-column prop="username" label="用户" width="100" />
      <el-table-column prop="product_name" label="商品" />
      <el-table-column prop="total_price" label="积分" width="80" />
      <el-table-column prop="quantity" label="数量" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="receiver_name" label="收件人" width="100" />
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="viewOrder(row)">查看</el-button>
          <el-button size="small" type="warning" @click="shipOrder(row)" v-if="row.status === 'pending'">发货</el-button>
          <el-button size="small" type="success" @click="completeOrder(row)" v-if="row.status === 'shipped'">完成</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadOrders"
      />
    </div>

    <el-dialog v-model="showShipDialog" title="发货" width="400px">
      <el-form :model="shipForm" label-width="80px">
        <el-form-item label="物流公司">
          <el-input v-model="shipForm.express_company" placeholder="请输入物流公司" />
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="shipForm.express_no" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showShipDialog = false">取消</el-button>
        <el-button type="warning" @click="confirmShip" :loading="shipping">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { orderApi } from '@/api/order'

const orders = ref<any[]>([])
const loading = ref(false)
const shipping = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchKeyword = ref('')
const statusFilter = ref('')

const showShipDialog = ref(false)
const currentOrder = ref<any>(null)
const shipForm = reactive({
  express_company: '',
  express_no: ''
})

onMounted(() => {
  loadOrders()
})

async function loadOrders() {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      page_size: pageSize.value,
      keyword: searchKeyword.value
    }
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    const res: any = await orderApi.getList(params)
    orders.value = res.data
    total.value = res.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    pending: '待处理',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

function getStatusType(status: string) {
  const types: Record<string, string> = {
    pending: 'warning',
    shipped: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

function viewOrder(order: any) {
  ElMessageBox.alert(
    `订单号: ${order.order_no}\n商品: ${order.product_name}\n数量: ${order.quantity}\n积分: ${order.total_price}\n收件人: ${order.receiver_name}\n电话: ${order.receiver_phone}\n状态: ${getStatusText(order.status)}`,
    '订单详情',
    { confirmButtonText: '确定' }
  )
}

function shipOrder(order: any) {
  currentOrder.value = order
  shipForm.express_company = ''
  shipForm.express_no = ''
  showShipDialog.value = true
}

async function confirmShip() {
  if (!shipForm.express_company || !shipForm.express_no) {
    ElMessage.warning('请填写完整的物流信息')
    return
  }
  shipping.value = true
  try {
    await orderApi.updateExpress(currentOrder.value.id, shipForm.express_no, shipForm.express_company)
    ElMessage.success('发货成功')
    showShipDialog.value = false
    await loadOrders()
  } catch (error) {
    console.error(error)
  } finally {
    shipping.value = false
  }
}

async function completeOrder(order: any) {
  try {
    await ElMessageBox.confirm('确定要完成该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await orderApi.updateStatus(order.id, 'completed')
    ElMessage.success('订单已完成')
    await loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}
</script>

<style scoped>
.orders-admin {
  background: white;
  padding: 20px;
  border-radius: 12px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
