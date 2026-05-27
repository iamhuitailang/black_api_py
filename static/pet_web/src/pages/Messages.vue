<template>
  <Layout>
    <div class="messages-page page-container">
      <h2 class="page-title">消息中心</h2>
      <div class="messages-container">
        <div class="conversation-list">
          <div 
            class="conversation-item" 
            v-for="conv in conversationList" 
            :key="conv.id"
            :class="{ active: currentConversationId === conv.id }"
            @click="selectConversation(conv)"
          >
            <div class="user-avatar">{{ conv.other_user_nickname?.charAt(0) }}</div>
            <div class="conversation-info">
              <div class="user-name">{{ conv.other_user_nickname }}</div>
              <div class="last-message">{{ conv.last_message || '暂无消息' }}</div>
            </div>
          </div>
          <el-empty v-if="conversationList.length === 0" description="暂无对话" :image-size="80" />
        </div>
        <div class="chat-area">
          <div class="chat-header" v-if="currentConversation">
            <span>与 {{ currentConversation.other_user_nickname }} 的对话</span>
          </div>
          <div class="chat-messages" ref="messagesContainer">
            <div 
              class="message-item" 
              v-for="msg in messageList" 
              :key="msg.id"
              :class="{ 'my-message': msg.sender_id === userStore.userId }"
            >
              <div class="message-bubble">{{ msg.content }}</div>
              <div class="message-time">{{ formatTime(msg.created_at) }}</div>
            </div>
            <el-empty v-if="messageList.length === 0" description="暂无消息" :image-size="60" />
          </div>
          <div class="chat-input" v-if="currentConversation">
            <el-input 
              v-model="newMessage" 
              placeholder="输入消息..."
              @keyup.enter="sendMessage"
            >
              <template #append>
                <el-button type="primary" :loading="sending" @click="sendMessage">发送</el-button>
              </template>
            </el-input>
          </div>
          <el-empty v-if="!currentConversation" description="请选择一个对话" />
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { messageApi } from '@/api'
import { useUserStore } from '@/stores/user'
import Layout from '@/components/Layout.vue'

const userStore = useUserStore()
const conversationList = ref([])
const messageList = ref([])
const currentConversationId = ref(null)
const currentConversation = ref(null)
const newMessage = ref('')
const sending = ref(false)
const messagesContainer = ref(null)

function formatTime(date) {
  return new Date(date).toLocaleString('zh-CN')
}

function selectConversation(conv) {
  currentConversationId.value = conv.sender_id === userStore.userId ? conv.receiver_id : conv.sender_id
  currentConversation.value = {
    ...conv,
    other_user_id: currentConversationId.value,
    other_user_nickname: conv.sender_nickname
  }
  fetchMessages(currentConversationId.value)
}

async function fetchConversations() {
  try {
    const res = await messageApi.getList({ user_id: userStore.userId, page_size: 100 })
    conversationList.value = res.data?.list || []
  } catch (e) {
    console.error(e)
  }
}

async function fetchMessages(otherUserId) {
  try {
    const res = await messageApi.getList({ 
      user_id: userStore.userId, 
      other_user_id: otherUserId,
      page_size: 100 
    })
    messageList.value = res.data?.list || []
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  } catch (e) {
    console.error(e)
  }
}

async function sendMessage() {
  if (!newMessage.value.trim()) return
  sending.value = true
  try {
    await messageApi.send({
      receiver_id: currentConversation.value.other_user_id,
      content: newMessage.value.trim()
    }, userStore.userId)
    newMessage.value = ''
    fetchMessages(currentConversationId.value)
  } catch (e) {
    console.error(e)
    ElMessage.error('发送失败')
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  fetchConversations()
})
</script>

<style scoped>
.messages-page {
  padding-top: 20px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #303133;
}

.messages-container {
  display: flex;
  height: 600px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.conversation-list {
  width: 280px;
  border-right: 1px solid #ebeef5;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid #f2f6fc;
  transition: background-color 0.3s;
}

.conversation-item:hover, .conversation-item.active {
  background-color: #f5f7fa;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  margin-right: 12px;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.last-message {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  font-weight: 600;
  color: #303133;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.message-item {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.message-item.my-message {
  align-items: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 10px 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  word-wrap: break-word;
}

.message-item.my-message .message-bubble {
  background: #409eff;
  color: #fff;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.chat-input {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}
</style>
