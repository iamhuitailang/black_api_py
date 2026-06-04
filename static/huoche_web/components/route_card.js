const RouteCardComponent = {
    props: ['route', 'locked', 'selected'],
    emits: ['select'],
    setup(props, { emit }) {
        const getRouteIcon = (code) => {
            switch (code) {
                case 'countryside': return '🌾';
                case 'mountain': return '⛰️';
                case 'coastal': return '🌊';
                case 'intercity': return '🏙️';
                case 'snow': return '❄️';
                default: return '🗺️';
            }
        };

        return {
            getRouteIcon
        };
    },
    template: `
        <div 
            :class="['route-card', { locked: locked, selected: selected }]"
            @click="$emit('select', route)"
        >
            <div :class="['route-image', route.code]">
                {{ getRouteIcon(route.code) }}
                <div class="route-difficulty">
                    <span v-for="i in 5" :key="i" class="difficulty-star">
                        {{ i <= route.difficulty ? '★' : '☆' }}
                    </span>
                </div>
            </div>
            <div class="route-info">
                <h3 class="route-name">
                    {{ route.name }}
                    <span v-if="locked" style="color: #ef4444; font-size: 14px;">
                        🔒 需要等级 {{ route.unlock_level }}
                    </span>
                </h3>
                <p class="route-description">{{ route.description }}</p>
                
                <div class="route-details">
                    <div class="route-detail-item">
                        <div class="route-detail-label">距离</div>
                        <div class="route-detail-value">{{ route.distance }} km</div>
                    </div>
                    <div class="route-detail-item">
                        <div class="route-detail-label">预计时间</div>
                        <div class="route-detail-value">{{ route.estimated_time }} 分钟</div>
                    </div>
                    <div class="route-detail-item">
                        <div class="route-detail-label">风景</div>
                        <div class="route-detail-value">{{ route.scenery_type }}</div>
                    </div>
                </div>

                <div class="route-reward">
                    <div class="reward-item coin">
                        💰 {{ route.base_reward }}
                    </div>
                    <div class="reward-item exp">
                        ✨ {{ route.base_exp }} EXP
                    </div>
                </div>
            </div>
        </div>
    `
};
