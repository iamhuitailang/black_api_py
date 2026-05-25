var MyGroupsPage = {
  template: `
    <div class="page-content">
      <el-tabs v-model="activeTab" type="card" class="custom-tabs">
        <el-tab-pane label="我开的团" name="created">
          <div class="group-list" v-if="createdGroups.length > 0">
            <div
              v-for="group in createdGroups"
              :key="group.id"
              class="group-card"
            >
              <div class="group-header">
                <span class="group-title">{{ group.productName }}</span>
                <span
                  class="group-status-tag"
                  :class="getStatusClass(group.status)"
                >
                  {{ getStatusText(group.status) }}
                </span>
              </div>
              <div class="group-info">
                <div class="group-product">
                  <div class="product-emoji">{{ group.productEmoji }}</div>
                  <div>
                    <div class="product-name">{{ group.productName }}</div>
                    <div class="product-price">¥{{ group.groupPrice }}</div>
                  </div>
                </div>
                <div class="group-progress">
                  <div class="progress-text">
                    已拼 {{ group.members.length }}/{{ group.groupSize }} 人
                    <span v-if="group.status === 'ongoing'">
                      · 还差 {{ group.groupSize - group.members.length }} 人成团
                    </span>
                  </div>
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      :style="{ width: (group.members.length / group.groupSize * 100) + '%' }"
                    ></div>
                  </div>
                  <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                    <span v-if="group.status === 'ongoing'">
                      剩余时间: {{ formatTime(group.expireTime) }}
                    </span>
                    <span v-else-if="group.status === 'success'">
                      开团时间: {{ formatDate(group.createTime) }}
                    </span>
                    <span v-else>
                      结束时间: {{ formatDate(group.expireTime) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="group-actions">
                <button class="mini-btn" @click="viewDetail(group)">查看详情</button>
                <button
                  class="mini-btn primary"
                  @click="shareGroup(group)"
                  v-if="group.status === 'ongoing'"
                >
                  分享
                </button>
              </div>
            </div>
          </div>
          <div class="empty-state" v-else>
            <div class="empty-icon">📦</div>
            <div class="empty-text">还没有开过团，去首页开个团吧~</div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我参与的团" name="joined">
          <div class="group-list" v-if="joinedGroups.length > 0">
            <div
              v-for="group in joinedGroups"
              :key="group.id"
              class="group-card"
            >
              <div class="group-header">
                <span class="group-title">{{ group.productName }}</span>
                <span
                  class="group-status-tag"
                  :class="getStatusClass(group.status)"
                >
                  {{ getStatusText(group.status) }}
                </span>
              </div>
              <div class="group-info">
                <div class="group-product">
                  <div class="product-emoji">{{ group.productEmoji }}</div>
                  <div>
                    <div class="product-name">{{ group.productName }}</div>
                    <div class="product-price">¥{{ group.groupPrice }}</div>
                  </div>
                </div>
                <div class="group-progress">
                  <div class="progress-text">
                    已拼 {{ group.members.length }}/{{ group.groupSize }} 人
                    <span v-if="group.status === 'ongoing'">
                      · 还差 {{ group.groupSize - group.members.length }} 人成团
                    </span>
                  </div>
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      :style="{ width: (group.members.length / group.groupSize * 100) + '%' }"
                    ></div>
                  </div>
                  <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                    <span v-if="group.status === 'ongoing'">
                      剩余时间: {{ formatTime(group.expireTime) }}
                    </span>
                    <span v-else-if="group.status === 'success'">
                      成团时间: {{ formatDate(group.createTime) }}
                    </span>
                    <span v-else>
                      结束时间: {{ formatDate(group.expireTime) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="group-actions">
                <button class="mini-btn" @click="viewDetail(group)">查看详情</button>
                <button
                  class="mini-btn primary"
                  @click="shareGroup(group)"
                  v-if="group.status === 'ongoing'"
                >
                  分享
                </button>
              </div>
            </div>
          </div>
          <div class="empty-state" v-else>
            <div class="empty-icon">🤝</div>
            <div class="empty-text">还没有参与过拼团，快去首页看看有没有感兴趣的团吧~</div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  `,
  data: function() {
    return {
      activeTab: 'created',
      createdGroups: [],
      joinedGroups: [],
      timer: null
    };
  },
  methods: {
    loadMyGroups: function() {
      PinTuanData.updateGroupStatus();
      var myGroups = PinTuanData.getMyGroups();
      var allGroups = PinTuanData.getGroups();

      this.createdGroups = myGroups.created
        .map(function(id) { return allGroups.find(function(g) { return g.id === id; }); })
        .filter(function(g) { return g; })
        .sort(function(a, b) { return b.createTime - a.createTime; });

      this.joinedGroups = myGroups.joined
        .map(function(id) { return allGroups.find(function(g) { return g.id === id; }); })
        .filter(function(g) { return g; })
        .sort(function(a, b) { return b.createTime - a.createTime; });
    },
    getStatusClass: function(status) {
      return {
        'status-ongoing': status === 'ongoing',
        'status-success': status === 'success',
        'status-failed': status === 'failed'
      };
    },
    getStatusText: function(status) {
      var map = {
        ongoing: '进行中',
        success: '已成功',
        failed: '已失败'
      };
      return map[status] || status;
    },
    formatTime: function(timestamp) {
      return PinTuanUtils.formatTimeString(timestamp);
    },
    formatDate: function(timestamp) {
      return PinTuanUtils.formatDate(timestamp);
    },
    viewDetail: function(group) {
      this.$router.push({ path: '/detail', query: { id: group.productId, group: group.id } });
    },
    shareGroup: function(group) {
      var link = PinTuanUtils.generateShareLink(group.id);
      ElementPlus.ElMessageBox.alert(
        '分享链接已复制：\n\n' + link,
        '分享拼团',
        {
          confirmButtonText: '复制链接',
          callback: function() {
            PinTuanUtils.copyToClipboard(link).then(function() {
              ElementPlus.ElMessage.success('链接已复制到剪贴板');
            }).catch(function() {
              ElementPlus.ElMessage.warning('复制失败，请手动复制');
            });
          }
        }
      );
    }
  },
  mounted: function() {
    this.loadMyGroups();
    this.timer = setInterval(this.loadMyGroups, 1000);
  },
  beforeUnmount: function() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
};
