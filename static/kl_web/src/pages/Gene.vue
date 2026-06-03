<template>
  <div class="gene-page">
    <el-row :gutter="20">
      <el-col :span="10">
        <el-card>
          <template #header>
            <span>基因改造实验室</span>
          </template>
          <div class="gene-lab">
            <div v-if="dinosaurs.length > 0" class="dino-select">
              <h4>选择要改造的恐龙</h4>
              <div class="dino-list">
                <div 
                  v-for="dino in dinosaurs" 
                  :key="dino.id" 
                  class="dino-item"
                  :class="{ selected: selectedDino?.id === dino.id }"
                  @click="selectDino(dino)"
                >
                  <span class="dino-icon">{{ getDinoEmoji(dino) }}</span>
                  <span>{{ dino.name }}</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="请先克隆恐龙" />
            
            <div v-if="selectedDino" class="gene-mods">
              <h4>可应用的基因改造</h4>
              <div class="mod-list">
                <div 
                  v-for="mod in geneMods" 
                  :key="mod.id" 
                  class="mod-item"
                  :class="{ disabled: !canApplyMod(mod) }"
                  @click="applyGene(mod)"
                >
                  <span class="mod-icon">{{ mod.icon }}</span>
                  <div class="mod-info">
                    <div class="mod-name">{{ mod.name }}</div>
                    <div class="mod-desc">{{ mod.effect }}</div>
                    <div class="mod-cost">💎 {{ mod.cost }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card>
          <template #header>
            <span>改造结果</span>
          </template>
          <div v-if="selectedDino" class="gene-result">
            <div class="result-header">
              <span class="result-icon">{{ getDinoEmoji(selectedDino) }}</span>
              <div>
                <h3>{{ selectedDino.name }}</h3>
                <el-tag>Lv.{{ selectedDino.level }}</el-tag>
              </div>
            </div>
            
            <el-descriptions :column="2" border class="stats-table">
              <el-descriptions-item label="生命值">
                <div class="stat-change">
                  <span>{{ selectedDino.health }}</span>
                  <el-tag type="success" size="small" v-if="selectedDino.health_bonus">+{{ selectedDino.health_bonus }}%</el-tag>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="攻击力">
                <div class="stat-change">
                  <span>{{ selectedDino.attack || 50 }}</span>
                  <el-tag type="success" size="small" v-if="selectedDino.attack_bonus">+{{ selectedDino.attack_bonus }}%</el-tag>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="防御力">
                <div class="stat-change">
                  <span>{{ selectedDino.defense || 30 }}</span>
                  <el-tag type="success" size="small" v-if="selectedDino.defense_bonus">+{{ selectedDino.defense_bonus }}%</el-tag>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="速度">
                <div class="stat-change">
                  <span>{{ selectedDino.speed || 40 }}</span>
                  <el-tag type="success" size="small" v-if="selectedDino.speed_bonus">+{{ selectedDino.speed_bonus }}%</el-tag>
                </div>
              </el-descriptions-item>
            </el-descriptions>
            
            <div class="applied-genes">
              <h4>已应用的基因改造</h4>
              <div v-if="appliedGenes.length > 0" class="applied-list">
                <el-tag v-for="gene in appliedGenes" :key="gene.id" size="large" closable>
                  {{ gene.name }}
                </el-tag>
              </div>
              <el-empty v-else description="暂无改造" :image-size="80" />
            </div>
          </div>
          <el-empty v-else description="请选择一只恐龙" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDinosaurs, getGenes, applyGene as applyGeneApi } from '@/services/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const dinosaurs = ref([])
const selectedDino = ref(null)
const geneMods = ref([])
const appliedGenes = ref([])

const getDinoEmoji = (dino) => {
  const emojis = ['🦕', '🦖', '🐊', '🦎', '🐉', '🦴']
  return emojis[(dino.id || 0) % emojis.length]
}

const canApplyMod = (mod) => {
  return userStore.userInfo?.diamonds >= mod.cost
}

const selectDino = (dino) => {
  selectedDino.value = dino
  loadAppliedGenes(dino.id)
}

const loadDinosaurs = async () => {
  const res = await getDinosaurs()
  if (res.code === 200) {
    dinosaurs.value = res.data || []
  }
}

const loadGeneMods = async () => {
  const res = await getGenes()
  if (res.code === 200) {
    geneMods.value = res.data || [
      { id: 1, name: '强壮基因', icon: '💪', effect: '攻击力+20%', cost: 100 },
      { id: 2, name: '坚韧基因', icon: '🛡️', effect: '防御力+20%', cost: 100 },
      { id: 3, name: '敏捷基因', icon: '⚡', effect: '速度+20%', cost: 100 },
      { id: 4, name: '生命基因', icon: '❤️', effect: '生命值+30%', cost: 150 },
      { id: 5, name: '智慧基因', icon: '🧠', effect: '经验获取+50%', cost: 200 },
      { id: 6, name: '繁殖基因', icon: '🥚', effect: '可繁殖后代', cost: 300 },
      { id: 7, name: '伪装基因', icon: '🦎', effect: '减少逃跑几率', cost: 150 },
      { id: 8, name: '巨型基因', icon: '📏', effect: '体型增大50%', cost: 250 },
    ]
  }
}

const loadAppliedGenes = async (dinoId) => {
  appliedGenes.value = []
}

const applyGene = async (mod) => {
  if (!selectedDino.value) {
    ElMessage.warning('请先选择恐龙')
    return
  }
  if (!canApplyMod(mod)) {
    ElMessage.warning('钻石不足')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定花费 ${mod.cost} 钻石为 ${selectedDino.value.name} 应用 ${mod.name}？`,
      '基因改造确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await applyGeneApi({
      dinosaur_id: selectedDino.value.id,
      gene_modification_id: mod.id
    })
    
    if (res.code === 200) {
      ElMessage.success('基因改造成功！')
      userStore.fetchUserInfo()
      loadDinosaurs()
    } else {
      ElMessage.error(res.message || '改造失败')
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadDinosaurs()
  loadGeneMods()
})
</script>

<style scoped>
.gene-page {
  padding: 0;
}

.gene-lab {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dino-select h4,
.gene-mods h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.dino-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.dino-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.dino-item:hover {
  background: #e9ecef;
}

.dino-item.selected {
  border-color: #667eea;
  background: #e8ecff;
}

.dino-icon {
  font-size: 24px;
}

.mod-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mod-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.mod-item:hover:not(.disabled) {
  background: #e9ecef;
}

.mod-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mod-icon {
  font-size: 28px;
}

.mod-info {
  flex: 1;
}

.mod-name {
  font-weight: 600;
  margin-bottom: 2px;
}

.mod-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.mod-cost {
  font-size: 14px;
  color: #e6a23c;
  font-weight: 500;
}

.gene-result {
  padding: 10px 0;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.result-icon {
  font-size: 64px;
}

.result-header h3 {
  margin: 0 0 10px 0;
}

.stats-table {
  margin-bottom: 20px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 10px;
}

.applied-genes h4 {
  margin: 0 0 15px 0;
}

.applied-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
