const { onMounted, ref, computed } = Vue;

const PlaylistManagerPage = {
    template: `
        <div class="playlist-manager-page">
            <div class="page-title-bar">
                <div class="page-title">歌单</div>
                <el-button type="primary" @click="showCreateDialog = true">+ 新建歌单</el-button>
            </div>

            <div style="color: #999; margin-bottom: 16px;">共 {{ playlists.length }} / 50 个歌单</div>

            <div v-if="playlists.length === 0" class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">暂无歌单</div>
                <el-button type="primary" style="margin-top: 12px;" @click="showCreateDialog = true">创建第一个歌单</el-button>
            </div>

            <div v-else class="playlist-grid">
                <div v-for="pl in playlists" :key="pl.id" class="playlist-card" @click="openPlaylist(pl)">
                    <div class="playlist-cover">{{ pl.cover || '📀' }}</div>
                    <div class="playlist-info">
                        <div class="playlist-name" :title="pl.name">{{ pl.name }}</div>
                        <div class="playlist-meta">{{ pl.song_count || 0 }} 首歌</div>
                        <div class="playlist-desc" :title="pl.description">{{ pl.description || '暂无描述' }}</div>
                    </div>
                    <div class="playlist-actions" @click.stop>
                        <el-button size="small" text @click="editPlaylist(pl)">编辑</el-button>
                        <el-button size="small" text type="danger" @click="deletePlaylist(pl)">删除</el-button>
                    </div>
                </div>
            </div>

            <el-dialog v-model="showCreateDialog" :title="isEditMode ? '编辑歌单' : '新建歌单'" width="500px">
                <el-form :model="formData" label-width="80px">
                    <el-form-item label="名称">
                        <el-input v-model="formData.name" placeholder="请输入歌单名称" maxlength="30" show-word-limit />
                    </el-form-item>
                    <el-form-item label="封面">
                        <el-input v-model="formData.cover" placeholder="emoji 或 URL，例如 🎸" maxlength="10" />
                    </el-form-item>
                    <el-form-item label="描述">
                        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="简单介绍一下这个歌单" maxlength="200" show-word-limit />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="showCreateDialog = false">取消</el-button>
                    <el-button type="primary" @click="savePlaylist" :disabled="!formData.name.trim()">保存</el-button>
                </template>
            </el-dialog>
        </div>
    `,
    setup() {
        const s = AudioStore.state;
        const playlists = ref([]);
        const showCreateDialog = ref(false);
        const isEditMode = ref(false);
        const editingPlaylist = ref(null);
        const formData = ref({
            name: '',
            cover: '',
            description: ''
        });

        async function loadPlaylists() {
            const res = await AudioAPI.playlist.list({ page_size: 50 });
            if (res.code === 0) {
                playlists.value = res.data.items || [];
            }
        }

        function openPlaylist(playlist) {
            AudioStore.setCurrentPlaylist(playlist);
            AudioStore.setRoute('playlist');
        }

        function editPlaylist(playlist) {
            isEditMode.value = true;
            editingPlaylist.value = playlist;
            formData.value = {
                name: playlist.name,
                cover: playlist.cover || '',
                description: playlist.description || ''
            };
            showCreateDialog.value = true;
        }

        async function savePlaylist() {
            const data = {
                name: formData.value.name.trim(),
                cover: formData.value.cover.trim() || '📀',
                description: formData.value.description.trim()
            };
            if (isEditMode.value && editingPlaylist.value) {
                await AudioAPI.playlist.update(editingPlaylist.value.id, data);
                ElementPlus.ElMessage.success('修改成功');
            } else {
                if (playlists.value.length >= 50) {
                    ElementPlus.ElMessage.warning('最多创建50个歌单');
                    return;
                }
                await AudioAPI.playlist.create(data);
                ElementPlus.ElMessage.success('创建成功');
            }
            showCreateDialog.value = false;
            resetForm();
            loadPlaylists();
        }

        async function deletePlaylist(playlist) {
            try {
                await ElementPlus.ElMessageBox.confirm(`确定删除歌单「${playlist.name}」吗？`, '确认', { type: 'warning' });
                await AudioAPI.playlist.delete(playlist.id);
                ElementPlus.ElMessage.success('删除成功');
                loadPlaylists();
            } catch (e) {}
        }

        function resetForm() {
            formData.value = { name: '', cover: '', description: '' };
            isEditMode.value = false;
            editingPlaylist.value = null;
        }

        onMounted(() => {
            loadPlaylists();
            AudioStore.loadFavoriteIds();
        });

        return {
            s,
            playlists,
            showCreateDialog,
            isEditMode,
            formData,
            loadPlaylists,
            openPlaylist,
            editPlaylist,
            savePlaylist,
            deletePlaylist
        };
    }
};