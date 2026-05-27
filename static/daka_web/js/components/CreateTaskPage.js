(function() {
const { ref, onMounted } = Vue;

const CreateTaskPage = {
    template: `
        <div class="create-task-page">
            <div class="card">
                <div class="card-title">创建自定义任务</div>
                
                <div class="form-group">
                    <label class="form-label">任务名称 *</label>
                    <input v-model="form.name" type="text" class="form-input" placeholder="请输入任务名称" />
                </div>

                <div class="form-group">
                    <label class="form-label">任务类型</label>
                    <select v-model="form.type" class="select-input">
                        <option v-for="type in taskTypes" :key="type.value" :value="type.value">
                            {{ type.icon }} {{ type.label }}
                        </option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">选择图标</label>
                    <div class="icon-picker">
                        <div 
                            v-for="icon in icons" 
                            :key="icon"
                            class="icon-option"
                            :class="{ selected: form.icon === icon }"
                            @click="form.icon = icon"
                        >
                            {{ icon }}
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">目标值</label>
                    <input v-model.number="form.target_value" type="number" class="form-input" placeholder="请输入目标值" min="1" />
                </div>

                <div class="form-group">
                    <label class="form-label">单位</label>
                    <input v-model="form.unit" type="text" class="form-input" placeholder="如：次、分钟、个、杯" />
                </div>

                <div class="form-group">
                    <label class="form-label">提醒时间</label>
                    <input v-model="form.remind_time" type="time" class="form-input" placeholder="选择提醒时间" />
                </div>

                <div class="form-group">
                    <label class="form-label">任务描述</label>
                    <textarea v-model="form.description" class="form-input" rows="3" placeholder="请输入任务描述（选填）" style="resize: vertical;"></textarea>
                </div>

                <button class="btn btn-primary btn-block" @click="handleCreate" :disabled="creating">
                    {{ creating ? '创建中...' : '创建任务' }}
                </button>
            </div>
        </div>
        `,
    setup() {
        const { useRouter } = VueRouter;
        const router = useRouter();

        const creating = ref(false);
        
        const form = ref({
            name: '',
            type: 4,
            icon: '✏️',
            target_value: 1,
            unit: '次',
            remind_time: '',
            description: ''
        });

        const taskTypes = ref([
            { value: 1, label: '每日必做', icon: '☀️' },
            { value: 2, label: '每周目标', icon: '🏃' },
            { value: 3, label: '习惯养成', icon: '🧘' },
            { value: 4, label: '自定义', icon: '✏️' }
        ]);

        const icons = [
            '☀️', '🌅', '🌙', '💧', '📖', '🏋️', '🧘', '📚', '✍️', '🥗',
            '👟', '💻', '🎹', '🍬', '💰', '🙏', '✏️', '🎯', '💪', '🌟',
            '🎨', '🎵', '📝', '🏃', '🚴', '🧗', '🏊', '⛹️', '🎾', '🏸',
            '🧹', '🛒', '🍳', '💊', '🧘‍♀️', '💤', '🌱', '🌸', '🍀', '🌺'
        ];

        const handleCreate = async () => {
            if (!form.value.name) {
                Toast.error('请输入任务名称');
                return;
            }
            if (form.value.target_value < 1) {
                Toast.error('目标值必须大于0');
                return;
            }

            creating.value = true;
            try {
                const result = await Api.task.create(form.value);
                if (result.code === 0) {
                    Toast.success('创建成功');
                    router.back();
                } else {
                    Toast.error(result.msg);
                }
            } catch (e) {
                Toast.error('创建失败，请稍后重试');
            } finally {
                creating.value = false;
            }
        };

        return {
            form,
            taskTypes,
            icons,
            creating,
            handleCreate
        };
    }
};

window.CreateTaskPage = CreateTaskPage;
})();
