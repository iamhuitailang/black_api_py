var DetailPage = {
  template: `
    <div class="page-content">
      <div class="detail-page">
        <div class="product-hero">
          <span class="hero-emoji">{{ product.emoji || '🛍️' }}</span>
        </div>
        <div class="product-detail">
          <div class="product-title">{{ product.name || '商品详情' }}</div>

          <div class="price-section" v-if="product.id">
            <div class="price-left">
              <span class="group-price-big">¥{{ product.groupPrice }}</span>
              <span class="original-price-big">¥{{ product.originalPrice }}</span>
            </div>
            <span class="discount-tag">省¥{{ product.originalPrice - product.groupPrice }}</span>
          </div>

          <div class="countdown-box" v-if="currentGroup">
            <div class="countdown-label">
              <template v-if="currentGroup.status === 'ongoing'">⏰ 拼团倒计时</template>
              <template v-else-if="currentGroup.status === 'success'">🎉 拼团成功</template>
              <template v-else>😢 拼团失败</template>
            </div>
            <div class="countdown-time" v-if="currentGroup.status === 'ongoing'">
              <div :class="['time-block', { expired: countdown.expired }]">
                {{ PinTuanUtils.padZero(countdown.hours) }}
              </div>
              <span class="time-sep">:</span>
              <div :class="['time-block', { expired: countdown.expired }]">
                {{ PinTuanUtils.padZero(countdown.minutes) }}
              </div>
              <span class="time-sep">:</span>
              <div :class="['time-block', { expired: countdown.expired }]">
                {{ PinTuanUtils.padZero(countdown.seconds) }}
              </div>
            </div>
            <div v-else class="countdown-result">
              {{ currentGroup.status === 'success' ? '所有参团人可享受拼团价' : '已退款至原支付账户' }}
            </div>
          </div>

          <div class="group-info" v-if="currentGroup">
            <div class="section-title">拼团信息</div>
            <div class="info-row">
              <span class="info-label">拼团价</span>
              <span class="info-value price-highlight">¥{{ currentGroup.groupPrice }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">成团人数</span>
              <span class="info-value">{{ currentGroup.groupSize }}人</span>
            </div>
            <div class="info-row">
              <span class="info-label">当前进度</span>
              <span class="info-value">
                <span class="status-badge" :class="currentGroup.status">
                  {{ getStatusText(currentGroup.status) }}
                </span>
                <span class="progress-text">({{ currentGroup.members.length }}/{{ currentGroup.groupSize }}人)</span>
              </span>
            </div>
            <div class="info-row" v-if="currentGroup.leader">
              <span class="info-label">团长</span>
              <span class="info-value">
                <span class="leader-avatar">{{ currentGroup.leader.avatar }}</span>
                <span>{{ currentGroup.leader.name }}</span>
              </span>
            </div>
            <div class="info-row" v-if="currentGroup.id">
              <span class="info-label">团编号</span>
              <span class="info-value group-id">{{ currentGroup.id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">开始时间</span>
              <span class="info-value">{{ formatDate(currentGroup.createTime) }}</span>
            </div>
          </div>

          <div class="progress-section" v-if="currentGroup">
            <div class="section-title">成团进度</div>
            <div class="progress-bar-large">
              <div
                class="progress-fill-large"
                :style="{ width: (currentGroup.members.length / currentGroup.groupSize * 100) + '%' }"
              ></div>
            </div>
            <div class="progress-info">
              <span>已加入 {{ currentGroup.members.length }} 人</span>
              <span v-if="currentGroup.status === 'ongoing'">
                还差 {{ currentGroup.groupSize - currentGroup.members.length }} 人成团
              </span>
              <span v-else-if="currentGroup.status === 'success'">已成功成团</span>
              <span v-else>拼团失败</span>
            </div>
          </div>

          <div class="members-section" v-if="currentGroup">
            <div class="section-title">已加入成员</div>
            <div class="members-list">
              <div
                v-for="(member, index) in currentGroup.members"
                :key="index"
                :class="['member-item', { leader: member.isLeader }]"
              >
                <div class="avatar">{{ member.avatar }}</div>
                <div class="nickname">
                  {{ member.name }}{{ member.isLeader ? '(团长)' : '' }}
                </div>
              </div>
              <div
                v-for="n in (currentGroup.groupSize - currentGroup.members.length)"
                :key="'empty-' + n"
                class="member-item empty"
              >
                <div class="avatar">+</div>
                <div class="nickname">虚位以待</div>
              </div>
            </div>
          </div>

          <div class="product-info-section" v-if="product.id">
            <div class="section-title">商品信息</div>
            <div class="info-row">
              <span class="info-label">商品名称</span>
              <span class="info-value">{{ product.name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">拼团价</span>
              <span class="info-value price-highlight">¥{{ product.groupPrice }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">原价</span>
              <span class="info-value">¥{{ product.originalPrice }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">成团人数</span>
              <span class="info-value">{{ product.groupSize }}人</span>
            </div>
            <div class="info-row">
              <span class="info-label">开团有效期</span>
              <span class="info-value">{{ product.leaderTime }}小时</span>
            </div>
            <div class="info-row">
              <span class="info-label">已拼</span>
              <span class="info-value">{{ product.sales }}件</span>
            </div>
            <div class="info-row">
              <span class="info-label">可节省</span>
              <span class="info-value price-highlight">¥{{ product.originalPrice - product.groupPrice }}</span>
            </div>
          </div>

          <div class="description-section" v-if="product.description">
            <div class="section-title">商品描述</div>
            <p class="description-text">{{ product.description }}</p>
          </div>

          <div class="empty-state" v-if="!product.id && !currentGroup">
            <div class="empty-icon">📦</div>
            <div class="empty-text">未找到商品信息</div>
          </div>
        </div>
      </div>

      <div class="action-bar">
        <button class="action-btn btn-secondary" @click="goBack">返回</button>
        <template v-if="!currentGroup && product.id">
          <button class="action-btn btn-primary" @click="handleCreateGroup">
            我要开团
          </button>
        </template>
        <template v-else-if="currentGroup && currentGroup.status === 'ongoing'">
          <button
            class="action-btn btn-primary"
            @click="handleJoinGroup"
            :disabled="isInGroup"
          >
            {{ isInGroup ? '已在团中' : '参与拼团' }}
          </button>
          <button class="action-btn btn-secondary" @click="handleShare">
            分享
          </button>
        </template>
        <template v-else-if="currentGroup">
          <button class="action-btn btn-primary" @click="handleNewGroup">
            重新开团
          </button>
        </template>
      </div>
    </div>
  `,
  data: function() {
    return {
      product: {},
      currentGroup: null,
      countdown: { expired: false, hours: 0, minutes: 0, seconds: 0 },
      timer: null,
      isInGroup: false
    };
  },
  methods: {
    loadProduct: function() {
      var productId = this.$route.query.id;
      var groupId = this.$route.query.group;

      if (groupId) {
        var group = PinTuanData.getGroupById(groupId);
        if (group) {
          this.product = PinTuanData.getProductById(group.productId) || {};
          return;
        }
      }

      if (productId) {
        this.product = PinTuanData.getProductById(parseInt(productId)) || {};
      } else {
        this.product = {};
      }
    },
    loadGroup: function() {
      var groupId = this.$route.query.group;
      this.currentGroup = null;
      if (groupId) {
        var group = PinTuanData.getGroupById(groupId);
        if (group) {
          this.currentGroup = group;
          this.updateCountdown();
          this.checkIfInGroup();
        }
      }
    },
    checkIfInGroup: function() {
      if (!this.currentGroup) {
        this.isInGroup = false;
        return;
      }
      this.isInGroup = this.currentGroup.members.some(function(m) {
        return m.name === '我';
      });
    },
    updateCountdown: function() {
      if (!this.currentGroup) return;
      PinTuanData.updateGroupStatus();
      var group = PinTuanData.getGroupById(this.currentGroup.id);
      if (group) {
        this.currentGroup = group;
        if (group.status === 'ongoing') {
          this.countdown = PinTuanUtils.formatTime(group.expireTime);
        }
      }
    },
    getStatusText: function(status) {
      var map = {
        ongoing: '拼团中',
        success: '拼团成功',
        failed: '拼团失败'
      };
      return map[status] || status;
    },
    formatDate: function(timestamp) {
      return PinTuanUtils.formatDate(timestamp);
    },
    goBack: function() {
      this.$router.push('/');
    },
    handleCreateGroup: function() {
      var self = this;
      ElementPlus.ElMessageBox.confirm(
        '确认支付 ¥' + this.product.groupPrice + ' 开团？',
        '模拟支付',
        {
          confirmButtonText: '确认支付',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(function() {
        var group = PinTuanData.createGroup(self.product.id, '我', '😊');
        if (group) {
          ElementPlus.ElMessage.success('开团成功！');
          self.$router.push({ path: '/detail', query: { id: self.product.id, group: group.id } });
        } else {
          ElementPlus.ElMessage.error('开团失败，请重试');
        }
      }).catch(function() {});
    },
    handleJoinGroup: function() {
      var self = this;
      ElementPlus.ElMessageBox.confirm(
        '确认支付 ¥' + this.currentGroup.groupPrice + ' 参与拼团？',
        '模拟支付',
        {
          confirmButtonText: '确认支付',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(function() {
        var group = PinTuanData.joinGroup(self.currentGroup.id, '我', '😀');
        if (group) {
          if (group.status === 'success') {
            ElementPlus.ElMessage.success('拼团成功！');
          } else {
            ElementPlus.ElMessage.success('参团成功！还差' + (group.groupSize - group.members.length) + '人即可成团');
          }
          self.currentGroup = group;
          self.updateCountdown();
          self.checkIfInGroup();
        } else {
          ElementPlus.ElMessage.error('参团失败，请重试');
        }
      }).catch(function() {});
    },
    handleShare: function() {
      var link = PinTuanUtils.generateShareLink(this.currentGroup.id);
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
    },
    handleNewGroup: function() {
      this.$router.push({ path: '/detail', query: { id: this.product.id } });
    }
  },
  mounted: function() {
    this.loadProduct();
    this.loadGroup();
    this.timer = setInterval(this.updateCountdown, 1000);
  },
  beforeUnmount: function() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  watch: {
    '$route.query': function() {
      this.loadProduct();
      this.loadGroup();
    }
  }
};
