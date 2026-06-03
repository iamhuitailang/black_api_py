import { apiService } from '../services/api.js';

export default {
    template: `
        <div class="profile-container">
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">👤</div>
                    <div class="profile-info">
                        <h2>{{ user?.nickname || '探险者' }}</h2>
                        <div>
                            <span class="level">Lv.{{ user?.level || 1 }}</span>
                        </div>
                        <div style="margin-top: 10px; color: #b8d4e8;">
                            @{{ user?.username }}
                        </div>
                    </div>
                </div>
                
                <div class="profile-stats">
                    <div class="stat-card">
                        <div class="stat-value">{{ user?.coins || 0 }}</div>
                        <div class="stat-label">💰 金币</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ user?.gems || 0 }}</div>
                        <div class="stat-label">💎 宝石</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ user?.experience || 0 }}</div>
                        <div class="stat-label">⭐ 经验</div>
                    </div>
                </div>
                
                <div class="progress-section">
                    <h3 style="margin-bottom: 20px;">📊 探险进度</h3>
                    
                    <div class="progress-item">
                        <div class="progress-label">
                            <span>最大下潜深度</span>
                            <span>{{ progress?.deepest_reached || 0 }} 米</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: Math.min((progress?.deepest_reached || 0) / 10, 100) + '%' }"></div>
                        </div>
                    </div>
                    
                    <div class="progress-item">
                        <div class="progress-label">
                            <span>收集海洋生物</span>
                            <span>{{ progress?.total_creatures_caught || 0 }}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: Math.min((progress?.total_creatures_caught || 0), 100) + '%' }"></div>
                        </div>
                    </div>
                    
                    <div class="progress-item">
                        <div class="progress-label">
                            <span>发现宝藏</span>
                            <span>{{ progress?.total_treasures_found || 0 }}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: Math.min((progress?.total_treasures_found || 0), 100) + '%' }"></div>
                        </div>
                    </div>
                    
                    <div class="progress-item">
                        <div class="progress-label">
                            <span>探索遗迹</span>
                            <span>{{ progress?.total_ruins_explored || 0 }}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: Math.min((progress?.total_ruins_explored || 0) * 25, 100) + '%' }"></div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <h3 style="margin-bottom: 15px;">🎵 当前音乐</h3>
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
                        <div style="font-weight: 600;">{{ currentMusic?.name || '海洋晨曦' }}</div>
                        <div style="font-size: 14px; color: #b8d4e8; margin-top: 5px;">
                            BPM: {{ currentMusic?.bpm || 80 }} | {{ getMoodLabel(currentMusic?.mood) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            progress: null,
            currentMusic: null
        };
    },
    computed: {
        user() {
            return this.$root.user || {};
        }
    },
    mounted() {
        this.loadProfileData();
    },
    methods: {
        async loadProfileData() {
            try {
                const progressRes = await apiService.getProgress().catch(() => null);
                this.progress = progressRes?.data || null;
                
                const musicRes = await apiService.getUnlockedMusic().catch(() => null);
                const musics = musicRes?.data || [];
                this.currentMusic = musics[0] || { name: '海洋晨曦', bpm: 80, mood: 'calm' };
            } catch (error) {
                console.error('加载资料失败:', error);
                this.currentMusic = { name: '海洋晨曦', bpm: 80, mood: 'calm' };
            }
        },
        
        getMoodLabel(mood) {
            const labels = { calm: '平静', playful: '欢快', mysterious: '神秘', intense: '紧张', epic: '史诗' };
            return labels[mood] || '平静';
        }
    }
};
