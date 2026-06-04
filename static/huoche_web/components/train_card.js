const TrainCardComponent = {
    props: ['train', 'selected'],
    emits: ['select'],
    setup(props, { emit }) {
        const getTypeBadgeClass = (typeCode) => {
            return typeCode || 'steam';
        };

        const getTrainIcon = (typeCode) => {
            switch (typeCode) {
                case 'steam': return '🚂';
                case 'electric': return '🚆';
                case 'highspeed': return '🚄';
                default: return '🚃';
            }
        };

        return {
            getTypeBadgeClass,
            getTrainIcon
        };
    },
    template: `
        <div 
            :class="['train-card', { selected: selected }]"
            @click="$emit('select', train)"
        >
            <div class="train-card-header">
                <span class="train-icon">
                    {{ getTrainIcon(train.type_code) }}
                </span>
                <span :class="['train-badge', getTypeBadgeClass(train.type_code)]">
                    {{ train.type_name }}
                </span>
            </div>
            <div class="train-name">{{ train.name }}</div>
            <div class="train-stats">
                <div class="stat-item">
                    <span class="stat-label">最高速度</span>
                    <span class="stat-value">{{ train.max_speed }} km/h</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">容量</span>
                    <span class="stat-value">{{ train.base_capacity }} 人</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">速度等级</span>
                    <span class="stat-value">Lv.{{ train.speed_level }}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">容量等级</span>
                    <span class="stat-value">Lv.{{ train.capacity_level }}</span>
                </div>
            </div>
            <div class="train-level">
                <span class="level-text">等级 Lv.{{ train.level }}</span>
                <span>经验: {{ train.experience }}</span>
            </div>
        </div>
    `
};
