const HallPage = {
  template: `
    <div class="hall-page">
      <div class="hall-user-info" v-if="user">
        <div class="user-card">
          <div class="user-avatar">{{ (user.nickname || user.username || '?')[0] }}</div>
          <div class="user-detail">
            <div class="user-name">{{ user.nickname || user.username }}</div>
            <div class="user-stats">
              <span>积分: {{ user.score || 0 }}</span>
              <span>胜率: {{ winRate }}%</span>
              <span>胜/负/和: {{ user.wins || 0 }}/{{ user.losses || 0 }}/{{ user.draws || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="hall-actions">
        <div class="action-section">
          <h3>人机对战</h3>
          <div class="action-cards">
            <div class="action-card" v-for="ai in aiConfigs" :key="ai.id" @click="startPve(ai.level)">
              <div class="action-icon">🤖</div>
              <div class="action-title">{{ ai.name }}</div>
              <div class="action-desc">{{ ai.description || '难度: ' + ai.level }}</div>
            </div>
            <div class="action-card" v-if="aiConfigs.length === 0">
              <div class="action-desc">暂无可用的AI</div>
            </div>
          </div>
        </div>

        <div class="action-section">
          <h3>在线对战</h3>
          <div class="action-cards">
            <div class="action-card" @click="createPvp" :disabled="creatingPvp">
              <div class="action-icon">⚔️</div>
              <div class="action-title">{{ creatingPvp ? '创建中...' : '创建对局' }}</div>
              <div class="action-desc">创建房间等待对手加入</div>
            </div>
            <div class="action-card" @click="refreshWaiting">
              <div class="action-icon">🔍</div>
              <div class="action-title">加入对局</div>
              <div class="action-desc">加入等待中的对局</div>
            </div>
          </div>
          <div class="waiting-list" v-if="showWaiting">
            <div class="waiting-item" v-for="g in waitingGames" :key="g.id" @click="joinGame(g.id)">
              <span>{{ getCreatorName(g) }}</span>
              <span class="waiting-time">{{ formatTime(g.created_at) }}</span>
              <button class="btn btn-sm btn-primary">加入</button>
            </div>
            <div class="waiting-item empty" v-if="waitingGames.length === 0">暂无等待中的对局</div>
          </div>
        </div>

        <div class="action-section">
          <h3>更多</h3>
          <div class="action-cards">
            <div class="action-card" @click="navigate('/spectator')">
              <div class="action-icon">👁️</div>
              <div class="action-title">观战大厅</div>
              <div class="action-desc">观看高手对弈</div>
            </div>
            <div class="action-card" @click="navigate('/leaderboard')">
              <div class="action-icon">🏆</div>
              <div class="action-title">排行榜</div>
              <div class="action-desc">查看棋力排行</div>
            </div>
          </div>
        </div>
      </div>

      <div class="hall-chat">
        <h3>大厅聊天</h3>
        <div class="chat-messages" ref="chatBox">
          <div class="chat-msg" v-for="msg in messages" :key="msg.id">
            <span class="chat-name">{{ msg.nickname || msg.username || '匿名' }}:</span>
            <span class="chat-text">{{ msg.content }}</span>
          </div>
          <div class="chat-msg empty" v-if="messages.length === 0">暂无消息</div>
        </div>
        <div class="chat-input">
          <input type="text" v-model="chatInput" placeholder="输入消息..." @keyup.enter="sendChat" />
          <button class="btn btn-sm btn-primary" @click="sendChat" :disabled="sendingChat">
            {{ sendingChat ? '发送中...' : '发送' }}
          </button>
        </div>
      </div>
    </div>
  `,
  setup() {
    const user = Vue.ref(XiangqiAuth.getUser());
    const aiConfigs = Vue.ref([]);
    const waitingGames = Vue.ref([]);
    const showWaiting = Vue.ref(false);
    const messages = Vue.ref([]);
    const chatInput = Vue.ref('');
    const chatBox = Vue.ref(null);
    const creatingPvp = Vue.ref(false);
    const sendingChat = Vue.ref(false);

    const winRate = Vue.computed(() => {
      if (!user.value) return 0;
      const total = (user.value.wins || 0) + (user.value.losses || 0);
      if (total === 0) return 0;
      return Math.round((user.value.wins || 0) / total * 100);
    });

    function navigate(path) {
      window.location.hash = '#' + path;
    }

    function formatTime(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function getCreatorName(g) {
      if (g.red_player_name) return g.red_player_name;
      if (g.red_player_id === user.value?.id) return user.value.nickname || user.value.username;
      return '棋手' + g.red_player_id;
    }

    async function loadAIConfigs() {
      try {
        const res = await XiangqiApi.getEnabledAIConfigs();
        if (res.code === 0) aiConfigs.value = res.data || [];
      } catch (e) {
        console.error('loadAIConfigs error:', e);
      }
    }

    async function startPve(aiLevel) {
      try {
        const res = await XiangqiApi.createPveGame({ ai_level: aiLevel, play_color: 'red' });
        if (res.code === 0) {
          window.location.hash = '#/game?id=' + res.data.id;
        } else {
          alert(res.msg || '创建对局失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function createPvp() {
      creatingPvp.value = true;
      try {
        const res = await XiangqiApi.createPvpGame();
        if (res.code === 0) {
          window.location.hash = '#/game?id=' + res.data.id;
        } else {
          alert(res.msg || '创建对局失败');
        }
      } catch (e) {
        alert('网络错误');
      }
      creatingPvp.value = false;
    }

    async function refreshWaiting() {
      showWaiting.value = true;
      try {
        const res = await XiangqiApi.getWaitingGames();
        if (res.code === 0) {
          waitingGames.value = res.data?.items || res.data || [];
        }
      } catch (e) {
        console.error('refreshWaiting error:', e);
      }
    }

    async function joinGame(gameId) {
      try {
        const res = await XiangqiApi.joinPvpGame(gameId);
        if (res.code === 0) {
          window.location.hash = '#/game?id=' + gameId;
        } else {
          alert(res.msg || '加入对局失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function loadMessages() {
      try {
        const res = await XiangqiApi.getHallMessages();
        if (res.code === 0) messages.value = res.data || [];
        if (chatBox.value) {
          setTimeout(() => {
            chatBox.value.scrollTop = chatBox.value.scrollHeight;
          }, 100);
        }
      } catch (e) {
        console.error('loadMessages error:', e);
      }
    }

    async function sendChat() {
      if (!chatInput.value.trim()) return;
      sendingChat.value = true;
      try {
        const res = await XiangqiApi.sendMessage({
          content: chatInput.value.trim()
        });
        if (res.code === 0) {
          chatInput.value = '';
          loadMessages();
        } else {
          alert(res.msg || '发送失败');
        }
      } catch (e) {
        console.error('sendChat error:', e);
      }
      sendingChat.value = false;
    }

    Vue.onMounted(() => {
      loadAIConfigs();
      loadMessages();
    });

    return {
      user, aiConfigs, waitingGames, showWaiting, messages, chatInput, chatBox,
      creatingPvp, sendingChat, winRate,
      navigate, formatTime, loadAIConfigs, startPve, createPvp, refreshWaiting,
      joinGame, sendChat, getCreatorName
    };
  }
};

window.HallPage = HallPage;
