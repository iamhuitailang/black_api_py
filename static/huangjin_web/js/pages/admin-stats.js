const AdminStatsPage = {
    props: ['user', 'isAdmin'],
    template: `
    <div>
        <div class="page-header">
            <h2 class="page-title">📈 数据统计</h2>
        </div>
        <div class="card mb-24">
            <h3 class="card-title">💰 分数分布</h3>
            <div v-if="scoreDist.length > 0" style="display:flex;gap:8px;align-items:flex-end;height:200px;padding:20px 0;">
                <div v-for="item in scoreDist" :key="item.score_range" style="flex:1;display:flex;flex-direction:column;align-items:center;">
                    <div class="text-secondary" style="font-size:12px;margin-bottom:4px;">{{ item.count }}</div>
                    <div :style="{width:'100%',backgroundColor:'var(--primary)',borderRadius:'4px 4px 0 0',height: (item.count / maxCount * 150) + 'px', minHeight:'4px'}"></div>
                    <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;text-align:center;">{{ item.score_range }}</div>
                </div>
            </div>
            <div v-else class="empty-state"><p>暂无数据</p></div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div class="card">
                <h3 class="card-title">💎 矿石统计</h3>
                <div v-if="oreStats.length > 0">
                    <div v-for="ore in oreStats" :key="ore.id" style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
                        <span class="ore-sample" :style="{backgroundColor:ore.color}"></span>
                        <span style="flex:1;">{{ ore.name }}</span>
                        <span class="text-gold">{{ ore.value }}分</span>
                        <span :class="'badge badge-' + ['common','uncommon','rare','epic','legendary'][ore.rarity]">{{ ore.rarity_text }}</span>
                    </div>
                </div>
                <div v-else class="empty-state"><p>暂无数据</p></div>
            </div>
            <div class="card">
                <h3 class="card-title">🎖️ 成就统计</h3>
                <div v-if="achStats.length > 0">
                    <div v-for="ach in achStats" :key="ach.id" style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
                        <span style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;" :style="{backgroundColor:ach.badge_color + '30',color:ach.badge_color}">
                            {{ ach.condition_type === 'score' ? '💰' : ach.condition_type === 'games' ? '🎮' : ach.condition_type === 'ore' ? '💎' : '⭐' }}
                        </span>
                        <span style="flex:1;">{{ ach.name }}</span>
                        <span class="text-secondary">{{ ach.unlock_count || 0 }}人</span>
                    </div>
                </div>
                <div v-else class="empty-state"><p>暂无数据</p></div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            scoreDist: [],
            oreStats: [],
            achStats: [],
            maxCount: 1
        };
    },
    async mounted() {
        await this.loadData();
    },
    methods: {
        async loadData() {
            const [scoreResult, oreResult, achResult] = await Promise.all([
                Api.admin.getScoreStats(),
                Api.admin.getOreStats(),
                Api.admin.getAchievementStats()
            ]);
            if (scoreResult.code === 0 && scoreResult.data) {
                this.scoreDist = scoreResult.data;
                this.maxCount = Math.max(...this.scoreDist.map(d => d.count), 1);
            }
            if (oreResult.code === 0 && oreResult.data) {
                this.oreStats = oreResult.data;
            }
            if (achResult.code === 0 && achResult.data) {
                this.achStats = achResult.data;
            }
        }
    }
};
