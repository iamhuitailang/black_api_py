const HomePage = {
    props: ['user', 'isAdmin'],
    template: `
    <div>
        <div class="home-hero">
            <h1 class="home-hero-title">⛏️ 黄金矿工</h1>
            <p class="home-hero-subtitle">深入地下，挖掘宝藏，成为最富有的矿工！</p>
            <div v-if="user" style="margin-bottom:16px;">
                <p style="font-size:16px;">欢迎回来，<span class="text-gold">{{ user.nickname || user.username }}</span>！</p>
                <p class="text-secondary mt-8">累计得分: <span class="text-gold">{{ user.total_score || 0 }}</span> | 最高分: <span class="text-gold">{{ user.best_score || 0 }}</span> | 游戏局数: <span class="text-gold">{{ user.total_games || 0 }}</span></p>
            </div>
            <button v-if="user && !isAdmin" class="btn btn-primary btn-lg" @click="$emit('navigate', 'game')">
                🎮 开始挖矿
            </button>
            <template v-if="!user">
                <button class="btn btn-primary btn-lg" @click="$emit('navigate', 'login')">开始挖矿</button>
            </template>
        </div>

        <div class="home-features">
            <div class="home-feature" @click="user && !isAdmin ? $emit('navigate', 'game') : $emit('navigate', 'login')">
                <div class="home-feature-icon">⛏️</div>
                <div class="home-feature-title">拉绳挖矿</div>
                <div class="home-feature-desc">控制拉绳角度，精准抓取矿石</div>
            </div>
            <div class="home-feature" @click="$emit('navigate', 'leaderboard')">
                <div class="home-feature-icon">🏆</div>
                <div class="home-feature-title">排行榜</div>
                <div class="home-feature-desc">与全球矿工一较高下</div>
            </div>
            <div class="home-feature" @click="user && !isAdmin ? $emit('navigate', 'achievements') : $emit('navigate', 'login')">
                <div class="home-feature-icon">🎖️</div>
                <div class="home-feature-title">成就系统</div>
                <div class="home-feature-desc">解锁各种成就，证明你的实力</div>
            </div>
            <div class="home-feature" @click="user && !isAdmin ? $emit('navigate', 'profile') : $emit('navigate', 'login')">
                <div class="home-feature-icon">👤</div>
                <div class="home-feature-title">个人中心</div>
                <div class="home-feature-desc">管理你的矿工档案</div>
            </div>
        </div>

        <div class="mt-24" v-if="ores.length > 0">
            <h3 class="mb-16 text-gold">💎 矿石图鉴</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">
                <div v-for="ore in ores" :key="ore.id" class="card" style="text-align:center;padding:16px;">
                    <div class="ore-sample" :style="{backgroundColor: ore.color, width:'40px', height:'40px', borderRadius:'8px', margin:'0 auto 8px'}"></div>
                    <div style="font-weight:600;font-size:14px;">{{ ore.name }}</div>
                    <div class="text-secondary" style="font-size:12px;">价值: {{ ore.value }} 分</div>
                    <span :class="'badge badge-' + ['common','uncommon','rare','epic','legendary'][ore.rarity]">{{ ore.rarity_text }}</span>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            ores: []
        };
    },
    async mounted() {
        const result = await Api.ore.getEnabled();
        if (result.code === 0 && result.data) {
            this.ores = result.data;
        }
    }
};
