const SubmitPage = {
    data() {
        return {
            form: {
                manuscript_id: null,
                title: '',
                abstract: '',
                file_path: '',
                file_name: '',
                keywords: '',
                section_id: null,
                author_name: '',
                author_email: '',
                author_phone: '',
                author_affiliation: ''
            },
            sections: [],
            uploading: false,
            uploadProgress: 0,
            submitting: false,
            errors: {},
            fileInputKey: 0,
            draftSaved: false,
            initializing: true
        };
    },
    watch: {
        form: {
            deep: true,
            handler: function() {
                if (this.initializing) return;
                this.$nextTick(() => {
                    this.autoSaveDraft();
                });
            }
        }
    },
    computed: {
        isEditMode() {
            return !!(this.form && this.form.manuscript_id);
        }
    },
    methods: {
        autoSaveDraft: Helpers.debounce(function() {
            if (this.isEditMode) return;
            const key = 'journal_submit_draft';
            const data = JSON.parse(JSON.stringify(this.form));
            localStorage.setItem(key, JSON.stringify(data));
            this.draftSaved = true;
            setTimeout(() => { this.draftSaved = false; }, 1500);
        }, 800),
        loadDraftFromStorage() {
            if (this.isEditMode) return;
            const key = 'journal_submit_draft';
            const raw = localStorage.getItem(key);
            if (!raw) return;
            try {
                const data = JSON.parse(raw);
                if (data && typeof data === 'object') {
                    Object.keys(this.form).forEach(k => {
                        if (data[k] !== undefined && data[k] !== null) {
                            this.form[k] = data[k];
                        }
                    });
                    Toast.info('已恢复上次未提交的草稿');
                }
            } catch (e) {
                console.warn('Draft parse failed', e);
            }
        },
        clearDraftStorage() {
            localStorage.removeItem('journal_submit_draft');
        },
        async loadSections() {
            const res = await JournalService.getSections();
            if (res.code === 0 && res.data) {
                this.sections = res.data;
            }
        },
        async loadProfile() {
            const res = await JournalService.getProfile();
            if (res.code === 0 && res.data) {
                this.form.author_name = res.data.real_name || '';
                this.form.author_email = res.data.email || '';
                this.form.author_phone = res.data.phone || '';
                this.form.author_affiliation = res.data.affiliation || '';
            }
            return res;
        },
        handleFileChange(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) {
                this.uploadFile(file);
            }
        },
        handleDrop(e) {
            e.preventDefault();
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) {
                this.uploadFile(file);
            }
        },
        handleDragOver(e) {
            e.target.classList.add('dragover');
        },
        handleDragLeave(e) {
            e.target.classList.remove('dragover');
        },
        async uploadFile(file) {
            if (!file) return;
            const ext = file.name.split('.').pop().toLowerCase();
            const allowed = ['pdf', 'doc', 'docx', 'txt', 'tex', 'zip'];
            if (!allowed.includes(ext)) {
                Toast.error('不支持的文件格式', '支持: PDF, DOC, DOCX, TXT, TEX, ZIP');
                return;
            }
            if (file.size > 50 * 1024 * 1024) {
                Toast.error('文件过大', '单个文件不能超过50MB');
                return;
            }

            this.uploading = true;
            this.uploadProgress = 0;

            const res = await JournalService.uploadFile(file, (p) => {
                this.uploadProgress = p;
            });

            this.uploading = false;
            if (res.code === 0 && res.data) {
                this.form.file_path = res.data.file_path;
                this.form.file_name = res.data.file_name || file.name;
                Toast.success('文件上传成功');
            } else {
                Toast.error(res.message || '上传失败');
            }
        },
        removeFile() {
            this.form.file_path = '';
            this.form.file_name = '';
            this.fileInputKey++;
        },
        validate() {
            this.errors = {};
            if (!this.form.title.trim()) this.errors.title = '请输入论文标题';
            if (!this.form.section_id) this.errors.section_id = '请选择栏目';
            if (!this.form.file_path) {
            }
            if (!this.form.file_path) this.errors.file_path = '请上传正文文件';
            return Object.keys(this.errors).length === 0;
        },
        async handleSave() {
            if (!this.validate()) {
                Toast.warning('请完善必填项');
                return;
            }

            this.submitting = true;
            try {
                let res;
                if (this.form.manuscript_id) {
                    res = await JournalService.updateManuscript({ ...this.form });
                } else {
                    res = await JournalService.createManuscript({ ...this.form });
                }
                if (res.code === 0) {
                    Toast.success('保存成功');
                    if (res.data && res.data.id) {
                        this.form.manuscript_id = res.data.id;
                    }
                    this.clearDraftStorage();
                } else {
                    Toast.error(res.message || '保存失败');
                }
            } finally {
                this.submitting = false;
            }
        },
        async handleSubmit() {
            if (!this.validate()) {
                Toast.warning('请完善必填项');
                return;
            }

            this.submitting = true;
            try {
                let id = this.form.manuscript_id;
                if (!id) {
                    const saveRes = await JournalService.createManuscript({ ...this.form });
                    if (saveRes.code !== 0 || !saveRes.data) {
                        Toast.error(saveRes.message || '保存失败');
                        return;
                    }
                    id = saveRes.data.id;
                } else {
                    const updateRes = await JournalService.updateManuscript({ ...this.form });
                    if (updateRes.code !== 0) {
                        Toast.error(updateRes.message || '保存失败');
                        return;
                    }
                }

                const submitRes = await JournalService.submitManuscript(id);
                if (submitRes.code === 0) {
                    Toast.success(submitRes.message || '提交成功');
                    this.clearDraftStorage();
                    setTimeout(() => {
                        this.$root.navigateTo('submissions');
                    }, 800);
                } else {
                    Toast.error(submitRes.message || '提交失败');
                }
            } finally {
                this.submitting = false;
            }
        },
        loadEditMode() {
            const editId = this.$route && this.$route.params && this.$route.params.id;
            if (editId) {
                this.form.manuscript_id = parseInt(editId);
                this.loadManuscript(editId);
            }
        },
        async loadManuscript(id) {
            const res = await JournalService.getManuscriptDetail(id);
            if (res.code === 0 && res.data) {
                const m = res.data;
                if (m.status !== 'draft') {
                    Toast.warning('该稿件已提交，无法编辑');
                    this.$root.navigateTo('submissions');
                    return;
                }
                this.form.title = m.title;
                this.form.abstract = m.abstract;
                this.form.file_path = m.file_path;
                this.form.file_name = m.file_name;
                this.form.keywords = m.keywords;
                this.form.section_id = m.section_id;
                this.form.author_name = m.author_name;
                this.form.author_email = m.author_email;
                this.form.author_phone = m.author_phone;
                this.form.author_affiliation = m.author_affiliation;
            }
        }
    },
    mounted() {
        this.loadSections();
        this.loadEditMode();
        if (this.isEditMode) {
            setTimeout(() => { this.initializing = false; }, 500);
        } else {
            this.loadProfile().then(() => {
                this.loadDraftFromStorage();
                this.$nextTick(() => {
                    this.initializing = false;
                });
            });
        }
    },
    template: `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">📝 在线投稿</h1>
                <p class="page-subtitle">请按照要求填写投稿信息，带 <span class="text-danger">*</span> 为必填项</p>
            </div>

            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">投稿表单</div>
                        <div class="card-subtitle" v-if="form.manuscript_id">稿件ID: #{{ form.manuscript_id }} (草稿状态)</div>
                        <div class="card-subtitle text-success" v-else-if="draftSaved">✓ 草稿已自动保存</div>
                    </div>
                </div>
                <div class="card-body">
                    <form @submit.prevent="handleSave">
                        <div class="form-group">
                            <label class="form-label">论文标题 <span class="required">*</span></label>
                            <input type="text" v-model="form.title" class="form-control" :class="{ 'form-control-error': errors.title }"
                                placeholder="请输入论文标题" maxlength="200" />
                            <span v-if="errors.title" class="form-error">{{ errors.title }}</span>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">栏目选择 <span class="required">*</span></label>
                                <select v-model="form.section_id" class="form-control" :class="{ 'form-control-error': errors.section_id }">
                                    <option value="">请选择栏目</option>
                                    <option v-for="s in sections" :key="s.id" :value="s.id">{{ s.name }} - {{ s.description }}</option>
                                </select>
                                <span v-if="errors.section_id" class="form-error">{{ errors.section_id }}</span>
                            </div>
                            <div class="form-group">
                                <label class="form-label">关键词</label>
                                <input type="text" v-model="form.keywords" class="form-control" placeholder="多个关键词用逗号分隔，如：人工智能,深度学习,算法" />
                                <span class="form-hint">多个关键词请用英文逗号分隔</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">论文摘要</label>
                            <textarea v-model="form.abstract" class="form-control textarea-lg" rows="5"
                                placeholder="请输入论文摘要，建议200-500字" maxlength="2000"></textarea>
                            <div class="form-hint text-right">{{ form.abstract.length }} / 2000</div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">正文上传 <span class="required">*</span></label>
                            <div v-if="!form.file_path"
                                class="file-upload-area"
                                :class="{ uploading: uploading }"
                                @drop="handleDrop"
                                @dragover.prevent="handleDragOver"
                                @dragleave="handleDragLeave"
                                @click="$refs.fileInput.click()">
                                <input type="file" ref="fileInput" :key="fileInputKey" style="display:none;" accept=".pdf,.doc,.docx,.txt,.tex,.zip" @change="handleFileChange" />
                                <div v-if="uploading">
                                    <div class="spinner" style="width:36px;height:36px;margin:0 auto 10px;"></div>
                                    <div class="file-upload-text">上传中 {{ uploadProgress }}%</div>
                                    <div style="width:100%;max-width:240px;margin:10px auto 0;height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;">
                                        <div style="height:100%;background:var(--primary-color);width:{{ uploadProgress }}%;transition:width .2s;"></div>
                                    </div>
                                </div>
                                <div v-else>
                                    <div class="file-upload-icon">📤</div>
                                    <div class="file-upload-text">点击或拖拽文件到此处上传正文</div>
                                    <div class="file-upload-hint">支持 PDF / DOC / DOCX / TXT / TEX / ZIP，单个文件不超过 50MB</div>
                                </div>
                            </div>
                            <div v-if="form.file_path" class="file-item">
                                <div class="file-info">
                                    <div class="file-icon">{{ $helpers.getFileIcon(form.file_name) }}</div>
                                    <div>
                                        <div class="file-name" :title="form.file_name">{{ form.file_name }}</div>
                                        <div class="text-muted" style="font-size:12px;margin-top:2px;">
                                            <a :href="form.file_path" target="_blank" class="text-primary">点击预览/下载</a>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" class="file-remove" @click="removeFile" title="移除">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <span v-if="errors.file_path" class="form-error">{{ errors.file_path }}</span>
                        </div>

                        <div class="detail-section mt-6">
                            <div class="detail-section-title">作者信息</div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">作者姓名 <span class="required">*</span></label>
                                <input type="text" v-model="form.author_name" class="form-control" placeholder="请输入作者姓名" />
                            </div>
                            <div class="form-group">
                                <label class="form-label">联系邮箱 <span class="required">*</span></label>
                                <input type="email" v-model="form.author_email" class="form-control" placeholder="example@email.com" />
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">联系电话</label>
                                <input type="tel" v-model="form.author_phone" class="form-control" placeholder="请输入手机号码" />
                            </div>
                            <div class="form-group">
                                <label class="form-label">所属单位</label>
                                <input type="text" v-model="form.author_affiliation" class="form-control" placeholder="学校/机构名称" />
                            </div>
                        </div>
                    </form>
                </div>
                <div class="card-footer">
                    <button class="btn btn-secondary" @click="$root.navigateTo('submissions')">返回列表</button>
                    <div style="flex:1;"></div>
                    <button class="btn btn-secondary" @click="handleSave" :disabled="submitting || uploading">
                        <span v-if="submitting" class="spinner" style="margin-right:6px;"></span>
                        保存草稿
                    </button>
                    <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting || uploading">
                        <span v-if="submitting" class="spinner" style="margin-right:6px;"></span>
                        提交审稿
                    </button>
                </div>
            </div>
        </div>
    `
};
