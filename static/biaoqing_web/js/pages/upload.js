(function() {
    const { ref, reactive, computed, onMounted } = Vue;
    
    window.UploadPage = {
        name: 'UploadPage',
        template: `
            <div class="upload-container">
                <div class="upload-header">
                    <h1>📤 上传表情包</h1>
                    <p>分享你的表情包，让更多人快乐！上传成功可获得积分奖励。</p>
                </div>
    
                <div class="upload-card">
                    <form class="upload-form" @submit.prevent="handleUpload">
                        <div class="form-group">
                            <label class="form-label">表情包图片 *</label>
                            <div class="upload-area" :class="{ 'has-file': filePreview }" @click="triggerFileInput">
                                <input 
                                    type="file" 
                                    ref="fileInput"
                                    class="file-input"
                                    accept="image/*"
                                    @change="handleFileChange"
                                >
                                <div v-if="filePreview" class="file-preview">
                                    <img :src="filePreview" alt="预览">
                                    <div class="remove-file" @click.stop="removeFile">✕</div>
                                </div>
                                <div v-else class="upload-placeholder">
                                    <div class="upload-icon">📁</div>
                                    <div class="upload-text">点击或拖拽图片到此处上传</div>
                                    <div class="upload-hint">支持 JPG、PNG、GIF 格式，不超过 10MB</div>
                                </div>
                            </div>
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">标题 *</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                v-model="form.title"
                                placeholder="请输入表情包标题"
                                required
                            >
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">分类 *</label>
                            <select class="form-input" v-model="form.category_id" required>
                                <option value="">请选择分类</option>
                                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                                    {{ cat.name }}
                                </option>
                            </select>
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">标签</label>
                            <div class="tag-input-wrapper">
                                <span class="tag-item" v-for="(tag, index) in tags" :key="index">
                                    {{ tag }}
                                    <span class="tag-remove" @click="removeTag(index)">✕</span>
                                </span>
                                <input 
                                    type="text" 
                                    class="tag-input" 
                                    v-model="newTag"
                                    @keyup.enter.prevent="addTag"
                                    placeholder="输入标签后按回车添加"
                                >
                            </div>
                            <div class="form-hint">最多添加 5 个标签，按回车添加</div>
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">描述</label>
                            <textarea 
                                class="form-textarea" 
                                v-model="form.description"
                                placeholder="请输入表情包描述（选填）"
                                rows="3">
                            </textarea>
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">来源</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                v-model="form.source"
                                placeholder="请输入来源（选填）"
                            >
                        </div>
    
                        <div class="upload-tips">
                            <h4>📋 上传须知</h4>
                            <ul>
                                <li>请确保上传的图片不侵犯他人权益</li>
                                <li>禁止上传色情、暴力、政治等违规内容</li>
                                <li>上传后需经过审核，审核通过后才会展示</li>
                                <li>审核通过可获得积分奖励，优质内容额外加分</li>
                            </ul>
                        </div>
    
                        <div class="form-actions">
                            <button type="button" class="btn-cancel" @click="goBack">取消</button>
                            <button type="submit" class="btn-submit" :disabled="loading">
                                <span v-if="loading">
                                    <span class="loading-spinner"></span> 上传中...
                                </span>
                                <span v-else>提交审核</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `,
        setup() {
            const router = VueRouter.useRouter();
            const fileInput = ref(null);
            const file = ref(null);
            const filePreview = ref('');
            const form = reactive({
                title: '',
                category_id: '',
                description: '',
                source: ''
            });
            const tags = ref([]);
            const newTag = ref('');
            const categories = ref([]);
            const loading = ref(false);
    
            const isLoggedIn = computed(() => Auth.isLoggedIn());
    
            const loadCategories = async () => {
                try {
                    const result = await API.category.getAll();
                    if (result.code === 0 && result.data) {
                        categories.value = result.data;
                    }
                } catch (error) {
                    console.error('Load categories error:', error);
                }
            };
    
            const triggerFileInput = () => {
                fileInput.value?.click();
            };
    
            const handleFileChange = (e) => {
                const selectedFile = e.target.files?.[0];
                if (!selectedFile) return;
    
                if (!selectedFile.type.startsWith('image/')) {
                    Utils.showToast('请选择图片文件', 'warning');
                    return;
                }
    
                if (selectedFile.size > 10 * 1024 * 1024) {
                    Utils.showToast('图片大小不能超过 10MB', 'warning');
                    return;
                }
    
                file.value = selectedFile;
                const reader = new FileReader();
                reader.onload = (e) => {
                    filePreview.value = e.target?.result;
                };
                reader.readAsDataURL(selectedFile);
            };
    
            const removeFile = () => {
                file.value = null;
                filePreview.value = '';
                if (fileInput.value) {
                    fileInput.value.value = '';
                }
            };
    
            const addTag = () => {
                const tag = newTag.value.trim();
                if (!tag) return;
                
                if (tags.value.includes(tag)) {
                    Utils.showToast('标签已存在', 'warning');
                    return;
                }
                
                if (tags.value.length >= 5) {
                    Utils.showToast('最多添加 5 个标签', 'warning');
                    return;
                }
    
                if (tag.length > 20) {
                    Utils.showToast('标签长度不能超过 20 字符', 'warning');
                    return;
                }
    
                tags.value.push(tag);
                newTag.value = '';
            };
    
            const removeTag = (index) => {
                tags.value.splice(index, 1);
            };
    
            const validate = () => {
                if (!isLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
                    return false;
                }
                if (!file.value) {
                    Utils.showToast('请选择要上传的图片', 'warning');
                    return false;
                }
                if (!form.title.trim()) {
                    Utils.showToast('请输入标题', 'warning');
                    return false;
                }
                if (!form.category_id) {
                    Utils.showToast('请选择分类', 'warning');
                    return false;
                }
                return true;
            };
    
            const handleUpload = async () => {
                if (!validate()) return;
    
                loading.value = true;
                try {
                    const formData = new FormData();
                    formData.append('file', file.value);
                    formData.append('title', form.title);
                    formData.append('category_id', form.category_id);
                    formData.append('description', form.description || '');
                    formData.append('source', form.source || '');
                    formData.append('tags', JSON.stringify(tags.value));
    
                    const result = await API.emoji.upload(formData);
                    if (result.code === 0) {
                        Utils.showToast('上传成功，等待审核', 'success');
                        router.push({ name: 'my-uploads' });
                    } else {
                        Utils.showToast(result.msg || '上传失败', 'error');
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    Utils.showToast('上传失败，请稍后重试', 'error');
                } finally {
                    loading.value = false;
                }
            };
    
            const goBack = () => {
                router.go(-1);
            };
    
            onMounted(() => {
                if (!isLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
                    return;
                }
                loadCategories();
            });
    
            return {
                fileInput,
                file,
                filePreview,
                form,
                tags,
                newTag,
                categories,
                loading,
                isLoggedIn,
                triggerFileInput,
                handleFileChange,
                removeFile,
                addTag,
                removeTag,
                handleUpload,
                goBack,
                Utils
            };
        }
    };
})();
