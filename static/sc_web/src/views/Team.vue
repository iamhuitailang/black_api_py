<template>
  <div class="team-page">
    <div class="page-header">
      <h1 class="page-title">车队管理</h1>
      <p class="page-subtitle">管理你的车队，与队友一起征战赛场</p>
    </div>

    <div v-if="loading" class="loading-container">
      <el-loading-fullscreen />
    </div>

    <template v-else-if="!currentTeam">
      <div class="no-team-container">
        <div class="no-team-card">
          <div class="no-team-icon">👥</div>
          <h2 class="no-team-title">你还没有加入车队</h2>
          <p class="no-team-desc">创建或加入一个车队，与队友一起征战赛场，共享资源，赢取更多奖励！</p>
          
          <el-tabs v-model="teamActionTab" class="team-tabs">
            <el-tab-pane label="创建车队" name="create">
              <el-form :model="createForm" label-width="100px" class="create-form">
                <el-form-item label="车队名称" prop="name">
                  <el-input v-model="createForm.name" placeholder="请输入车队名称" maxlength="20" show-word-limit />
                </el-form-item>
                <el-form-item label="车队描述" prop="description">
                  <el-input
                    v-model="createForm.description"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入车队描述"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>
                <el-form-item label="车队Logo">
                  <div class="logo-upload">
                    <div v-if="createForm.logo" class="logo-preview">
                      <img :src="createForm.logo" alt="车队Logo" />
                    </div>
                    <div v-else class="logo-placeholder">
                      <el-icon :size="48"><Picture /></el-icon>
                      <span>点击上传Logo</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      class="logo-input"
                      @change="handleLogoUpload"
                    />
                  </div>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" class="btn-primary" @click="createTeam">
                    创建车队
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="加入车队" name="join">
              <el-form :model="joinForm" label-width="100px" class="join-form">
                <el-form-item label="邀请码" prop="inviteCode">
                  <el-input v-model="joinForm.inviteCode" placeholder="请输入邀请码" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" class="btn-primary" @click="joinTeam">
                    加入车队
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="team-content">
        <div class="team-header card">
          <div class="team-logo">
            <img v-if="currentTeam.logo" :src="currentTeam.logo" alt="车队Logo" />
            <div v-else class="logo-placeholder-large">
              {{ currentTeam.name?.charAt(0) }}
            </div>
          </div>
          <div class="team-info">
            <h2 class="team-name">{{ currentTeam.name }}</h2>
            <p class="team-desc">{{ currentTeam.description || '暂无描述' }}</p>
            <div class="team-tags">
              <el-tag type="warning" effect="dark">Lv.{{ currentTeam.level || 1 }}</el-tag>
              <el-tag type="success" effect="dark">
                <el-icon><Aim /></el-icon>
                {{ currentTeam.reputation || 0 }} 声望
              </el-tag>
              <el-tag type="info" effect="dark">
                <el-icon><Coin /></el-icon>
                {{ (currentTeam.coins || 0).toLocaleString() }} 车队金币
              </el-tag>
              <el-tag effect="dark">
                <el-icon><User /></el-icon>
                {{ currentTeam.member_count || 1 }} 成员
              </el-tag>
            </div>
          </div>
          <div class="team-actions">
            <el-button
              v-if="isTeamOwner"
              type="primary"
              class="btn-primary"
              @click="showInviteDialog = true"
            >
              <el-icon><Plus /></el-icon>
              邀请成员
            </el-button>
            <el-button
              v-if="isTeamOwner"
              class="btn-secondary"
              @click="showDisbandDialog = true"
            >
              <el-icon><Delete /></el-icon>
              解散车队
            </el-button>
            <el-button
              v-else
              class="btn-secondary"
              @click="showLeaveDialog = true"
            >
              <el-icon><SwitchButton /></el-icon>
              退出车队
            </el-button>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="team-tabs">
          <el-tab-pane label="成员管理" name="members">
            <div class="card members-section">
              <div class="section-header">
                <h3 class="section-title">
                  <el-icon><User /></el-icon>
                  车队成员
                </h3>
                <div class="member-stats">
                  <span>共 {{ members.length }} 名成员</span>
                </div>
              </div>
              
              <div class="members-list">
                <div
                  v-for="member in members"
                  :key="member.id"
                  class="member-card"
                >
                  <el-avatar :size="56" :src="member.avatar">
                    {{ member.nickname?.charAt(0) }}
                  </el-avatar>
                  <div class="member-info">
                    <div class="member-name">
                      {{ member.nickname }}
                      <el-tag
                        v-if="member.role === 'owner'"
                        type="warning"
                        effect="dark"
                        size="small"
                      >
                        队长
                      </el-tag>
                      <el-tag
                        v-else-if="member.role === 'engineer'"
                        type="primary"
                        effect="dark"
                        size="small"
                      >
                        工程师
                      </el-tag>
                      <el-tag
                        v-else-if="member.role === 'driver'"
                        type="success"
                        effect="dark"
                        size="small"
                      >
                        车手
                      </el-tag>
                      <el-tag
                        v-else-if="member.role === 'mechanic'"
                        type="info"
                        effect="dark"
                        size="small"
                      >
                        机械师
                      </el-tag>
                      <el-tag
                        v-else
                        size="small"
                      >
                        成员
                      </el-tag>
                    </div>
                    <div class="member-stats">
                      <span class="stat-item">Lv.{{ member.level || 1 }}</span>
                      <span class="stat-item">贡献: {{ member.contribution || 0 }}</span>
                      <span class="stat-item">加入: {{ formatDate(member.joined_at) }}</span>
                    </div>
                  </div>
                  <div v-if="isTeamOwner && member.role !== 'owner'" class="member-actions">
                    <el-dropdown @command="(cmd) => handleRoleChange(member, cmd)">
                      <el-button size="small" class="btn-secondary">
                        <el-icon><Setting /></el-icon>
                        角色
                        <el-icon><ArrowDown /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="driver">
                            <el-icon><Trophy /></el-icon> 车手
                          </el-dropdown-item>
                          <el-dropdown-item command="engineer">
                            <el-icon><Tools /></el-icon> 工程师
                          </el-dropdown-item>
                          <el-dropdown-item command="mechanic">
                            <el-icon><Box /></el-icon> 机械师
                          </el-dropdown-item>
                          <el-dropdown-item command="member">
                            <el-icon><User /></el-icon> 普通成员
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                    <el-button
                      size="small"
                      type="danger"
                      @click="removeMember(member)"
                    >
                      <el-icon><Delete /></el-icon>
                      移除
                    </el-button>
                  </div>
                </div>
              </div>

              <el-empty v-if="members.length === 0" description="暂无成员" />
            </div>

            <div class="card contribution-section">
              <div class="section-header">
                <h3 class="section-title">
                  <el-icon><Setting /></el-icon>
                  贡献排行榜
                </h3>
              </div>
              <el-table :data="contributionLeaderboard" style="width: 100%">
                <el-table-column label="排名" width="80">
                  <template #default="{ $index }">
                    <span :class="getPositionClass($index + 1)">
                      #{{ $index + 1 }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="成员" min-width="150">
                  <template #default="{ row }">
                    <div class="leaderboard-member">
                      <el-avatar :size="32" :src="row.avatar">
                        {{ row.nickname?.charAt(0) }}
                      </el-avatar>
                      <span>{{ row.nickname }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="role" label="角色" width="100">
                  <template #default="{ row }">
                    {{ getRoleName(row.role) }}
                  </template>
                </el-table-column>
                <el-table-column prop="contribution" label="贡献值" width="120">
                  <template #default="{ row }">
                    <span class="contribution-value">{{ row.contribution || 0 }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="card contribute-section">
              <div class="section-header">
                <h3 class="section-title">
                  <el-icon><Aim /></el-icon>
                  贡献积分
                </h3>
              </div>
              <div class="contribute-content">
                <p class="contribute-desc">
                  向车队贡献个人积分，提升车队声望，解锁更多车队福利！
                </p>
                <div class="contribute-form">
                  <el-input-number
                    v-model="contributeAmount"
                    :min="1"
                    :max="userStore.user?.points || 0"
                    size="large"
                  />
                  <el-button type="primary" class="btn-primary" size="large" @click="contributePoints">
                    确认贡献
                  </el-button>
                </div>
                <p class="current-points">
                  当前个人积分: <strong>{{ userStore.user?.points || 0 }}</strong>
                </p>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="车队车库" name="garage">
            <div class="card garage-section">
              <div class="section-header">
                <h3 class="section-title">
                  <el-icon><Monitor /></el-icon>
                  共享赛车
                </h3>
              </div>
              <div class="shared-cars-grid">
                <div
                  v-for="car in sharedCars"
                  :key="car.id"
                  class="shared-car-card"
                >
                  <div class="car-preview">
                    <CarPreview
                      :primary-color="car.colors?.primary || '#ff6b00'"
                      :secondary-color="car.colors?.secondary || '#cc5500'"
                      :accent-color="car.colors?.accent || '#ff8c00'"
                      :body-style="car.body_style || 'sports'"
                    />
                  </div>
                  <div class="car-info">
                    <h4 class="car-name">{{ car.name }}</h4>
                    <div class="car-tags">
                      <el-tag size="small" :class="'tier-' + (car.tier || 1)">
                        Tier {{ car.tier || 1 }}
                      </el-tag>
                      <el-tag size="small" effect="dark">
                        {{ getBodyStyleName(car.body_style) }}
                      </el-tag>
                    </div>
                    <div class="car-owner">
                      <span>所有者: {{ car.owner_name }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <el-empty v-if="sharedCars.length === 0" description="暂无共享赛车" />
            </div>

            <div class="card parts-section">
              <div class="section-header">
                <h3 class="section-title">
                  <el-icon><Box /></el-icon>
                  共享零件
                </h3>
              </div>
              <div class="shared-parts-grid">
                <div
                  v-for="part in sharedParts"
                  :key="part.id"
                  class="shared-part-card"
                >
                  <div class="part-icon">
                    <el-icon :size="32"><Setting /></el-icon>
                  </div>
                  <div class="part-info">
                    <h4 class="part-name">{{ part.name }}</h4>
                    <el-tag size="small" :class="'tier-' + (part.tier || 1)">
                      Tier {{ part.tier || 1 }}
                    </el-tag>
                    <span class="part-type">{{ getPartTypeName(part.type) }}</span>
                  </div>
                </div>
              </div>
              <el-empty v-if="sharedParts.length === 0" description="暂无共享零件" />
            </div>
          </el-tab-pane>

          <el-tab-pane label="车队赛事" name="races">
            <div class="card races-section">
              <div class="section-header">
                <h3 class="section-title">
                  <el-icon><Trophy /></el-icon>
                  车队赛事记录
                </h3>
              </div>
              <el-table :data="teamRaces" style="width: 100%">
                <el-table-column prop="race_name" label="赛事名称" min-width="180" />
                <el-table-column label="参与成员" min-width="200">
                  <template #default="{ row }">
                    <div class="participants">
                      <el-avatar
                        v-for="(member, idx) in row.participants?.slice(0, 3)"
                        :key="member.id"
                        :size="28"
                        :src="member.avatar"
                        :style="{ marginLeft: idx > 0 ? '-8px' : '0' }"
                      >
                        {{ member.nickname?.charAt(0) }}
                      </el-avatar>
                      <span v-if="row.participants?.length > 3" class="more-participants">
                        +{{ row.participants.length - 3 }}
                      </span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="最佳排名" prop="best_rank" width="100">
                  <template #default="{ row }">
                    <span :class="getPositionClass(row.best_rank)">
                      #{{ row.best_rank || '-' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="获得奖励" width="150">
                  <template #default="{ row }">
                    <div class="race-rewards">
                      <span class="reward-coins">+{{ row.coins_earned || 0 }} 金币</span>
                      <span class="reward-reputation">+{{ row.reputation_earned || 0 }} 声望</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="比赛时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.created_at) }}
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="teamRaces.length === 0" description="暂无车队赛事记录" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>

    <el-dialog
      v-model="showInviteDialog"
      title="邀请成员"
      width="500px"
      class="invite-dialog"
    >
      <div class="invite-content">
        <p class="invite-desc">将以下邀请码分享给你的好友，让他们加入车队：</p>
        <div class="invite-code-box">
          <code class="invite-code">{{ inviteCode }}</code>
          <el-button type="primary" class="btn-primary" @click="copyInviteCode">
            <el-icon><DocumentCopy /></el-icon>
            复制
          </el-button>
        </div>
        <p class="invite-tip">邀请码有效期为24小时</p>
      </div>
    </el-dialog>

    <el-dialog
      v-model="showDisbandDialog"
      title="确认解散车队"
      width="400px"
      class="disband-dialog"
    >
      <div class="disband-content">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <p>确定要解散车队 <strong>{{ currentTeam?.name }}</strong> 吗？</p>
        <p class="warning-text">此操作不可撤销，所有车队数据将被清除！</p>
      </div>
      <template #footer>
        <el-button @click="showDisbandDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmDisband">确认解散</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showLeaveDialog"
      title="确认退出车队"
      width="400px"
      class="leave-dialog"
    >
      <div class="leave-content">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <p>确定要退出车队 <strong>{{ currentTeam?.name }}</strong> 吗？</p>
        <p class="warning-text">退出后将无法访问车队资源！</p>
      </div>
      <template #footer>
        <el-button @click="showLeaveDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmLeave">确认退出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User, Aim, Coin, Plus, Delete, SwitchButton, Setting,
  ArrowDown, Trophy, Tools, Box, Monitor,
  Picture, DocumentCopy, Warning
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useGameStore } from '@/stores/game'
import CarPreview from '@/components/CarPreview.vue'
import {
  createTeam as createTeamApi,
  getTeamDetail,
  getUserTeams,
  inviteMember,
  removeMember as removeMemberApi,
  updateMemberRole,
  contributePoints as contributePointsApi,
  disbandTeam
} from '@/api/team'

const userStore = useUserStore()
const gameStore = useGameStore()

const loading = ref(false)
const currentTeam = ref(null)
const activeTab = ref('members')
const teamActionTab = ref('create')

const createForm = reactive({
  name: '',
  description: '',
  logo: ''
})

const joinForm = reactive({
  inviteCode: ''
})

const members = ref([])
const sharedCars = ref([])
const sharedParts = ref([])
const teamRaces = ref([])
const contributionLeaderboard = ref([])
const contributeAmount = ref(100)

const showInviteDialog = ref(false)
const showDisbandDialog = ref(false)
const showLeaveDialog = ref(false)
const inviteCode = ref('')

const isTeamOwner = computed(() => {
  return currentTeam.value?.owner_id === userStore.user?.id
})

const bodyStyleMap = {
  sedan: '轿车',
  sports: '跑车',
  supercar: '超级跑车',
  formula: '方程式',
  offroad: '越野车'
}

const partTypeMap = {
  engine: '引擎',
  chassis: '底盘',
  suspension: '悬挂',
  tires: '轮胎',
  body: '车身',
  aerodynamics: '空气动力学套件'
}

const roleMap = {
  owner: '队长',
  engineer: '工程师',
  driver: '车手',
  mechanic: '机械师',
  member: '成员'
}

function getBodyStyleName(style) {
  return bodyStyleMap[style] || '未知'
}

function getPartTypeName(type) {
  return partTypeMap[type] || '未知'
}

function getRoleName(role) {
  return roleMap[role] || '成员'
}

function getPositionClass(position) {
  if (position === 1) return 'position-1'
  if (position === 2) return 'position-2'
  if (position === 3) return 'position-3'
  return ''
}

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

function handleLogoUpload(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      createForm.logo = e.target?.result
    }
    reader.readAsDataURL(file)
  }
}

async function createTeam() {
  if (!createForm.name.trim()) {
    ElMessage.error('请输入车队名称')
    return
  }
  loading.value = true
  try {
    const res = await createTeamApi({
      name: createForm.name,
      description: createForm.description,
      logo: createForm.logo
    })
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('车队创建成功！')
      await fetchTeamData()
    }
  } catch (error) {
    console.error('Create team error:', error)
  } finally {
    loading.value = false
  }
}

async function joinTeam() {
  if (!joinForm.inviteCode.trim()) {
    ElMessage.error('请输入邀请码')
    return
  }
  loading.value = true
  try {
    const res = await inviteMember({
      invite_code: joinForm.inviteCode
    })
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('加入车队成功！')
      await fetchTeamData()
    }
  } catch (error) {
    console.error('Join team error:', error)
  } finally {
    loading.value = false
  }
}

async function fetchTeamData() {
  loading.value = true
  try {
    const res = await getUserTeams()
    if (res.code === 0 || res.code === 200) {
      const teams = res.data || []
      if (teams.length > 0) {
        currentTeam.value = teams[0]
        const detailRes = await getTeamDetail(currentTeam.value.id)
        if (detailRes.code === 0 || detailRes.code === 200) {
          const data = detailRes.data || {}
          members.value = data.members || []
          sharedCars.value = data.shared_cars || []
          sharedParts.value = data.shared_parts || []
          teamRaces.value = data.team_races || []
          contributionLeaderboard.value = [...members.value].sort(
            (a, b) => (b.contribution || 0) - (a.contribution || 0)
          )
          generateInviteCode()
        }
      } else {
        currentTeam.value = null
      }
    }
  } catch (error) {
    console.error('Fetch team data error:', error)
  } finally {
    loading.value = false
  }
}

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  inviteCode.value = code
}

async function copyInviteCode() {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    ElMessage.success('邀请码已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

async function handleRoleChange(member, newRole) {
  try {
    const res = await updateMemberRole({
      team_id: currentTeam.value.id,
      user_id: member.user_id,
      role: newRole
    })
    if (res.code === 0 || res.code === 200) {
      ElMessage.success(`已将 ${member.nickname} 设为${getRoleName(newRole)}`)
      member.role = newRole
      contributionLeaderboard.value = [...members.value].sort(
        (a, b) => (b.contribution || 0) - (a.contribution || 0)
      )
    }
  } catch (error) {
    console.error('Update role error:', error)
  }
}

async function removeMember(member) {
  try {
    await ElMessageBox.confirm(
      `确定要移除 ${member.nickname} 吗？`,
      '确认移除',
      {
        confirmButtonText: '确认移除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await removeMemberApi({
      team_id: currentTeam.value.id,
      user_id: member.user_id
    })
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('已移除成员')
      members.value = members.value.filter(m => m.id !== member.id)
      contributionLeaderboard.value = [...members.value].sort(
        (a, b) => (b.contribution || 0) - (a.contribution || 0)
      )
    }
  } catch (error) {
    console.error('Remove member error:', error)
  }
}

async function contributePoints() {
  if (contributeAmount.value <= 0) {
    ElMessage.error('请输入有效的贡献值')
    return
  }
  if (contributeAmount.value > (userStore.user?.points || 0)) {
    ElMessage.error('积分不足')
    return
  }
  loading.value = true
  try {
    const res = await contributePointsApi({
      team_id: currentTeam.value.id,
      points: contributeAmount.value
    })
    if (res.code === 0 || res.code === 200) {
      ElMessage.success(`贡献了 ${contributeAmount.value} 积分！`)
      userStore.fetchCurrentUser()
      await fetchTeamData()
    }
  } catch (error) {
    console.error('Contribute points error:', error)
  } finally {
    loading.value = false
  }
}

async function confirmDisband() {
  loading.value = true
  try {
    const res = await disbandTeam(currentTeam.value.id)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('车队已解散')
      showDisbandDialog.value = false
      currentTeam.value = null
      userStore.fetchCurrentUser()
    }
  } catch (error) {
    console.error('Disband team error:', error)
  } finally {
    loading.value = false
  }
}

async function confirmLeave() {
  loading.value = true
  try {
    const res = await removeMemberApi({
      team_id: currentTeam.value.id,
      user_id: userStore.user?.id
    })
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('已退出车队')
      showLeaveDialog.value = false
      currentTeam.value = null
      userStore.fetchCurrentUser()
    }
  } catch (error) {
    console.error('Leave team error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  gameStore.fetchCars()
  fetchTeamData()
})
</script>

<style scoped>
.team-page {
  padding: 24px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  margin-bottom: 24px;
}

.no-team-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.no-team-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #2a2a4a;
  border-radius: 20px;
  padding: 48px;
  max-width: 600px;
  width: 100%;
  text-align: center;
  animation: slideUp 0.6s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.no-team-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.no-team-title {
  font-size: 28px;
  color: #fff;
  margin: 0 0 8px 0;
}

.no-team-desc {
  color: #888;
  margin-bottom: 32px;
  line-height: 1.6;
}

.team-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.create-form,
.join-form {
  text-align: left;
  margin-top: 24px;
}

.logo-upload {
  position: relative;
  width: 120px;
  height: 120px;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed #3a3a5e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  gap: 8px;
  transition: all 0.3s ease;
}

.logo-placeholder:hover {
  border-color: #ff6b00;
  color: #ff6b00;
}

.logo-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.team-content {
  animation: fadeIn 0.5s ease;
}

.team-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.team-logo {
  width: 100px;
  height: 100px;
  border-radius: 20px;
  overflow: hidden;
  flex-shrink: 0;
  border: 3px solid rgba(255, 107, 0, 0.5);
}

.team-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder-large {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 700;
  color: #fff;
}

.team-info {
  flex: 1;
  min-width: 0;
}

.team-name {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
}

.team-desc {
  color: #888;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.team-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.team-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #2a2a4a;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  padding-left: 12px;
  border-left: 3px solid #ff6b00;
}

.section-title .el-icon {
  color: #ff6b00;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.member-card:hover {
  border-color: rgba(255, 107, 0, 0.3);
  background: rgba(255, 107, 0, 0.05);
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.member-stats .stat-item {
  font-size: 13px;
  color: #888;
}

.member-actions {
  display: flex;
  gap: 8px;
}

.leaderboard-member {
  display: flex;
  align-items: center;
  gap: 10px;
}

.contribution-value {
  color: #ff6b00;
  font-weight: 600;
}

.position-1 {
  color: #fbbf24;
  font-weight: 700;
}

.position-2 {
  color: #c0c0c0;
  font-weight: 600;
}

.position-3 {
  color: #cd7f32;
  font-weight: 600;
}

.contribute-section .contribute-content {
  text-align: center;
}

.contribute-desc {
  color: #888;
  margin-bottom: 20px;
}

.contribute-form {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.current-points {
  color: #888;
  margin: 0;
}

.current-points strong {
  color: #ff6b00;
}

.shared-cars-grid,
.shared-parts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.shared-car-card,
.shared-part-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.shared-car-card:hover,
.shared-part-card:hover {
  border-color: rgba(255, 107, 0, 0.3);
  transform: translateY(-4px);
}

.car-preview {
  aspect-ratio: 16/6;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.car-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
}

.car-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.car-owner {
  font-size: 13px;
  color: #888;
}

.part-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(255, 140, 0, 0.1) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff6b00;
  margin-bottom: 12px;
}

.part-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.part-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.part-type {
  font-size: 13px;
  color: #888;
  margin-left: 8px;
}

.participants {
  display: flex;
  align-items: center;
}

.more-participants {
  margin-left: 8px;
  font-size: 13px;
  color: #888;
}

.race-rewards {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reward-coins {
  color: #fbbf24;
  font-weight: 600;
  font-size: 13px;
}

.reward-reputation {
  color: #ff6b00;
  font-size: 12px;
}

.invite-content {
  text-align: center;
  color: #fff;
}

.invite-desc {
  color: #888;
  margin-bottom: 20px;
}

.invite-code-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 107, 0, 0.1);
  border: 1px solid rgba(255, 107, 0, 0.3);
  border-radius: 12px;
  margin-bottom: 12px;
}

.invite-code {
  font-size: 32px;
  font-weight: 700;
  color: #ff6b00;
  letter-spacing: 4px;
  font-family: 'Courier New', monospace;
}

.invite-tip {
  color: #666;
  font-size: 13px;
  margin: 0;
}

.disband-content,
.leave-content {
  text-align: center;
  color: #fff;
  padding: 20px 0;
}

.warning-icon {
  font-size: 48px;
  color: #ff6b00;
  margin-bottom: 16px;
}

.warning-text {
  color: #f56c6c;
  margin-top: 8px;
}

.tier-1 { background: rgba(128, 128, 128, 0.2); color: #aaa; border-color: rgba(128, 128, 128, 0.5); }
.tier-2 { background: rgba(0, 255, 0, 0.2); color: #4ade80; border-color: rgba(74, 222, 128, 0.5); }
.tier-3 { background: rgba(0, 112, 255, 0.2); color: #60a5fa; border-color: rgba(96, 165, 250, 0.5); }
.tier-4 { background: rgba(147, 51, 234, 0.2); color: #c084fc; border-color: rgba(192, 132, 252, 0.5); }
.tier-5 { background: rgba(255, 215, 0, 0.2); color: #fbbf24; border-color: rgba(251, 191, 36, 0.5); }

@media (max-width: 768px) {
  .team-header {
    flex-direction: column;
    text-align: center;
  }
  
  .team-actions {
    width: 100%;
    justify-content: center;
  }
  
  .member-card {
    flex-direction: column;
    text-align: center;
  }
  
  .member-actions {
    width: 100%;
    justify-content: center;
  }
  
  .shared-cars-grid,
  .shared-parts-grid {
    grid-template-columns: 1fr;
  }
  
  .contribute-form {
    flex-direction: column;
  }
}
</style>
