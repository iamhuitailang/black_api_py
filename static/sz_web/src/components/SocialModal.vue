<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { useUiStore } from '../stores/uiStore';
import { generateShareLink, copyToClipboard, shareWebAPI, downloadGameState } from '../utils/share';
import { X, Copy, Share2, Download, Check, UserPlus } from 'lucide-vue-next';

const gameStore = useGameStore();
const uiStore = useUiStore();

const shareLink = ref('');
const copied = ref(false);
const friendEmail = ref('');

function generateLink() {
  shareLink.value = generateShareLink(gameStore.getGameState());
}

async function copyLink() {
  if (!shareLink.value) {
    generateLink();
  }
  const success = await copyToClipboard(shareLink.value);
  if (success) {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}

async function nativeShare() {
  if (!shareLink.value) {
    generateLink();
  }
  await shareWebAPI(
    `参观我的城市「${gameStore.cityName}」`,
    `来看看我在城市建设游戏中建造的城市！`,
    shareLink.value
  );
}

function exportSave() {
  downloadGameState(gameStore.getGameState(), `${gameStore.cityName}_save.json`);
}

function inviteFriend() {
  if (!shareLink.value) {
    generateLink();
  }
  const subject = encodeURIComponent(`邀请你参观我的城市「${gameStore.cityName}」`);
  const body = encodeURIComponent(`来看看我在城市建设游戏中建造的城市！\n\n点击链接参观：${shareLink.value}`);
  window.open(`mailto:${friendEmail.value}?subject=${subject}&body=${body}`);
  friendEmail.value = '';
}
</script>

<template>
  <div v-if="uiStore.showSocialModal" class="modal-overlay" @click.self="uiStore.closeAllModals()">
    <div class="modal">
      <div class="modal-header">
        <h2>👥 分享与社交</h2>
        <button class="close-btn" @click="uiStore.closeAllModals()">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="modal-content">
        <div class="section">
          <h3>🔗 分享链接</h3>
          <p class="section-desc">生成链接，让好友参观你的城市</p>

          <div class="link-section">
            <button class="generate-btn" @click="generateLink">
              <Share2 class="w-4 h-4" />
              生成分享链接
            </button>

            <div v-if="shareLink" class="link-display">
              <input
                type="text"
                :value="shareLink"
                readonly
                class="link-input"
              />
              <button class="copy-btn" @click="copyLink">
                <Check v-if="copied" class="w-4 h-4 text-green-400" />
                <Copy v-else class="w-4 h-4" />
                {{ copied ? '已复制' : '复制' }}
              </button>
            </div>
          </div>

          <div class="share-buttons">
            <button class="share-btn native" @click="nativeShare">
              <Share2 class="w-4 h-4" />
              系统分享
            </button>
            <button class="share-btn export" @click="exportSave">
              <Download class="w-4 h-4" />
              导出存档
            </button>
          </div>
        </div>

        <div class="section">
          <h3>📧 邀请好友</h3>
          <p class="section-desc">通过邮件邀请好友一起玩</p>

          <div class="invite-section">
            <input
              v-model="friendEmail"
              type="email"
              placeholder="输入好友邮箱..."
              class="email-input"
            />
            <button class="invite-btn" @click="inviteFriend">
              <UserPlus class="w-4 h-4" />
              发送邀请
            </button>
          </div>
        </div>

        <div class="section">
          <h3>💡 提示</h3>
          <div class="tips">
            <p>• 分享链接包含你的城市完整数据</p>
            <p>• 好友打开链接后可以查看但不能修改你的城市</p>
            <p>• 导出的存档文件可以在任意设备上导入</p>
            <p>• 记得经常保存游戏进度哦！</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.section {
  margin-bottom: 28px;
}

.section:last-child {
  margin-bottom: 0;
}

.section h3 {
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px 0;
}

.section-desc {
  color: #94a3b8;
  font-size: 13px;
  margin: 0 0 16px 0;
}

.link-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #4A90D9 0%, #3b82f6 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.generate-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 217, 0.4);
}

.link-display {
  display: flex;
  gap: 8px;
}

.link-input {
  flex: 1;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 12px;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.copy-btn:hover {
  background: rgba(74, 144, 217, 0.2);
  border-color: rgba(74, 144, 217, 0.5);
  color: white;
}

.share-buttons {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.share-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.share-btn:hover {
  background: rgba(74, 144, 217, 0.2);
  border-color: rgba(74, 144, 217, 0.5);
  color: white;
}

.invite-section {
  display: flex;
  gap: 8px;
}

.email-input {
  flex: 1;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
}

.email-input::placeholder {
  color: #64748b;
}

.invite-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.invite-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.tips {
  background: rgba(74, 144, 217, 0.1);
  border: 1px solid rgba(74, 144, 217, 0.3);
  border-radius: 8px;
  padding: 16px;
}

.tips p {
  color: #94a3b8;
  font-size: 13px;
  margin: 8px 0;
}

.tips p:first-child {
  margin-top: 0;
}

.tips p:last-child {
  margin-bottom: 0;
}
</style>
