(function() {
const { ref, onMounted } = Vue;

const TaskDetailPage = {
    template: `
        <div class="task-detail-page">
            <div v-if="loading" class="empty-state">
                <div class="empty-icon">⏳</div>
                <div class="empty-text">加载中...</div>
            </div>

            <template v-else-if="task">
                <div class="card" style="text-align: center; padding: 32px 16px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">{{ task.icon }}</div>
                    <h2 style="font-size: 22px; margin-bottom: 8px;">{{ task.name }}</h2>
                    <div style="color: #999; margin-bottom: 16px;">
                        <span class="task-type-tag" style="margin-right: 8px;">{{ task.type_text }}</span>
                        <span>目标: {{ task.target_value }}{{ task.unit }}</span>
                    </div>
                    <p v-if="task.description" style="color: #666; font-size: 14px;">
                        {{ task.description }}
                    </p>
                </div>

                <div class="card">
                    <div class="card-title">任务信息</div>
                    <div style="line-height: 2.5;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">任务类型</span>
                            <span>{{ task.type_text }}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">目标值</span>
                            <span>{{ task.target_value }} {{ task.unit }}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">提醒时间</span>
                            <span>{{ task.remind_time || '未设置' }}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">是否系统任务</span>
                            <span>{{ task.is_system ? '是' : '否' }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="!task.is_system" class="card">
                    <div class="card-title">操作</div>
                    <button class="btn btn-danger btn-block" @click="handleDelete" :disabled="deleting">
                        {{ deleting ? '删除中...' : '删除任务' }}
                    </button>
                </div>
            </template>
        </div>
    `,
    setup() {
        const { useRoute, useRouter } = VueRouter;
        const route = useRoute();
        const router = useRouter();

        const task = ref(null);
        const loading = ref(true);
        const deleting = ref(false);

        const loadTask = async () => {
            const taskId = route.query.id;
            if (!taskId) {
                router.back();
                return;
            }

            loading.value = true;
            try {
                const result = await Api.task.getDetail(taskId);
                if (result.code === 0) {
                    task.value = result.data;
                } else {
                    Toast.error(result.msg);
                    router.back();
                }
            } catch (e) {
                Toast.error('加载失败');
                router.back();
            } finally {
                loading.value = false;
            }
        };

        const handleDelete = async () => {
            if (!confirm('确定要删除这个任务吗？')) return;

            deleting.value = true;
            try {
                const result = await Api.task.delete(task.value.id);
                if (result.code === 0) {
                    Toast.success('删除成功');
                    router.back();
                } else {
                    Toast.error(result.msg);
                }
            } catch (e) {
                Toast.error('删除失败，请稍后重试');
            } finally {
                deleting.value = false;
            }
        };

        onMounted(() => {
            loadTask();
        });

        return {
            task,
            loading,
            deleting,
            handleDelete
        };
    }
};

window.TaskDetailPage = TaskDetailPage;
})();
