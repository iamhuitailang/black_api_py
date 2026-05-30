(function() {
    const { ref, onMounted, reactive, computed } = Vue;
    
    window.DetailPage = {
        name: 'DetailPage',
        template: `
            <div class="detail-container" v-if="emoji">
                <div class="detail-back" @click="goBack">
                    ← 返回
                </div>
    
                <div class="detail-content">
                    <div class="detail-left">
                        <div class="detail-image-wrapper">
                            <img :src="emoji.url" :alt="emoji.title" class="detail-image">
                        </div>
    
                        <div class="detail-actions">
                            <button class="action-btn primary" @click="downloadEmoji">
                                ⬇️ 下载
                            </button>
                            <button class="action-btn success" @click="copyEmoji">
                                📋 复制
                            </button>
                            <button class="action-btn" 
                                    :class="{ active: emoji.is_favorited }"
                                    @click="toggleFavorite">
                                {{ emoji.is_favorited ? '❤️ 已收藏' : '🤍 收藏' }}
                            </button>
                            <button class="action-btn" @click="likeEmoji">
                                👍 点赞 ({{ emoji.like_count || 0 }})
                            </button>
                            <button class="action-btn danger" @click="showReportDialog = true">
                                🚩 举报
                            </button>
                        </div>
    
                        <div class="share-links">
                            <span>分享到：</span>
                            <span class="share-link" @click="shareToWechat">💬 微信</span>
                            <span class="share-link" @click="shareToQQ">🐧 QQ</span>
                            <span class="share-link" @click="shareToWeibo">📢 微博</span>
                        </div>
                    </div>
    
                    <div class="detail-right">
                        <h1 class="detail-title">{{ emoji.title || '暂无标题' }}</h1>
                        
                        <div class="detail-meta">
                            <span class="meta-item">
                                👤 {{ uploader.nickname || '匿名用户' }}
                            </span>
                            <span class="meta-item">
                                📅 {{ Utils.formatTime(emoji.created_at) }}
                            </span>
                        </div>
    
                        <div class="detail-stats">
                            <div class="stat-item">
                                <div class="stat-value">{{ Utils.formatNumber(emoji.view_count || 0) }}</div>
                                <div class="stat-label">浏览</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">{{ Utils.formatNumber(emoji.favorite_count || 0) }}</div>
                                <div class="stat-label">收藏</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">{{ Utils.formatNumber(emoji.download_count || 0) }}</div>
                                <div class="stat-label">下载</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">{{ Utils.formatNumber(emoji.like_count || 0) }}</div>
                                <div class="stat-label">点赞</div>
                            </div>
                        </div>
    
                        <div class="detail-tags" v-if="emoji.tags && emoji.tags.length">
                            <div class="tags-title">标签：</div>
                            <div class="tags-list">
                                <span class="emoji-tag" v-for="tag in emoji.tags" :key="tag">{{ tag }}</span>
                            </div>
                        </div>
    
                        <div class="detail-category">
                            <div class="category-title">分类：</div>
                            <span class="category-badge">{{ categoryName }}</span>
                        </div>
    
                        <div class="detail-description" v-if="emoji.description">
                            <div class="description-title">描述：</div>
                            <div class="description-content">{{ emoji.description }}</div>
                        </div>
                    </div>
                </div>
    
                <div class="related-section">
                    <div class="section-title">
                        <span>🔗 相关推荐</span>
                    </div>
                    <div class="emoji-grid">
                        <div class="emoji-card" v-for="item in relatedEmojis" :key="item.id" @click="viewDetail(item.id)">
                            <img :src="item.url" :alt="item.title" class="emoji-image">
                            <div class="emoji-info">
                                <div class="emoji-title">{{ item.title || '暂无标题' }}</div>
                            </div>
                        </div>
                    </div>
                </div>
    
                <div class="report-dialog" v-if="showReportDialog" @click.self="showReportDialog = false">
                    <div class="report-content">
                        <div class="report-header">
                            <span>举报表情包</span>
                            <span class="close-btn" @click="showReportDialog = false">✕</span>
                        </div>
                        <div class="report-body">
                            <div class="report-types">
                                <label v-for="type in reportTypes" :key="type.value">
                                    <input type="radio" v-model="reportType" :value="type.value">
                                    {{ type.label }}
                                </label>
                            </div>
                            <textarea 
                                class="report-textarea" 
                                v-model="reportContent"
                                placeholder="请描述举报原因（选填）"
                                rows="4">
                            </textarea>
                        </div>
                        <div class="report-footer">
                            <button class="btn-cancel" @click="showReportDialog = false">取消</button>
                            <button class="btn-submit" @click="submitReport">提交举报</button>
                        </div>
                    </div>
                </div>
            </div>
    
            <div class="empty-state" v-if="!emoji && !loading">
                <div class="empty-icon">😅</div>
                <div class="empty-text">表情包不存在或已被删除</div>
                <div class="empty-hint" @click="goBack">返回首页</div>
            </div>
    
            <div class="load-more" v-if="loading">
                <span class="loading-spinner"></span> 加载中...
            </div>
        `,
        setup() {
            const router = VueRouter.useRouter();
            const route = VueRouter.useRoute();
    
            const emoji = ref(null);
            const uploader = ref({});
            const relatedEmojis = ref([]);
            const categoryName = ref('');
            const loading = ref(true);
            const showReportDialog = ref(false);
            const reportType = ref('');
            const reportContent = ref('');
    
            const reportTypes = [
                { value: 'porn', label: '色情低俗' },
                { value: 'violence', label: '暴力恐怖' },
                { value: 'politics', label: '政治敏感' },
                { value: 'copyright', label: '侵权' },
                { value: 'other', label: '其他' }
            ];
    
            const isLoggedIn = computed(() => Auth.isLoggedIn());
    
            const loadDetail = async () => {
                const id = route.params.id;
                if (!id) return;
    
                loading.value = true;
                try {
                    const result = await API.emoji.getDetail(id);
                    if (result.code === 0 && result.data) {
                        emoji.value = result.data;
                        loadUploader(result.data.user_id);
                        loadCategory(result.data.category_id);
                        loadRelated(id);
                    }
                } catch (error) {
                    console.error('Load detail error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadUploader = async (userId) => {
                if (!userId) {
                    uploader.value = { nickname: '匿名用户' };
                    return;
                }
                try {
                    const result = await API.user.getUserInfo(userId);
                    if (result.code === 0 && result.data) {
                        uploader.value = result.data;
                    }
                } catch (error) {
                    console.error('Load uploader error:', error);
                }
            };
    
            const loadCategory = async (categoryId) => {
                if (!categoryId) {
                    categoryName.value = '未分类';
                    return;
                }
                try {
                    const result = await API.category.getById(categoryId);
                    if (result.code === 0 && result.data) {
                        categoryName.value = result.data.name;
                    }
                } catch (error) {
                    console.error('Load category error:', error);
                }
            };
    
            const loadRelated = async (id) => {
                try {
                    const result = await API.emoji.getRelatedList(id, 8);
                    if (result.code === 0 && result.data) {
                        relatedEmojis.value = result.data;
                    }
                } catch (error) {
                    console.error('Load related error:', error);
                }
            };
    
            const goBack = () => {
                router.go(-1);
            };
    
            const viewDetail = (id) => {
                router.push({ name: 'detail', params: { id } });
            };
    
            const downloadEmoji = async () => {
                if (!emoji.value) return;
                
                try {
                    const result = await API.emoji.recordDownload(emoji.value.id);
                    if (result.code === 0) {
                        emoji.value.download_count = (emoji.value.download_count || 0) + 1;
                    }
                    
                    const link = document.createElement('a');
                    link.href = emoji.value.url;
                    link.download = `emoji_${emoji.value.id}.gif`;
                    link.click();
                    
                    Utils.showToast('下载成功', 'success');
                } catch (error) {
                    console.error('Download error:', error);
                    Utils.showToast('下载失败', 'error');
                }
            };
    
            const copyEmoji = async () => {
                if (!emoji.value) return;
                
                try {
                    const result = await Utils.copyToClipboard(emoji.value.url);
                    if (result) {
                        Utils.showToast('链接已复制到剪贴板', 'success');
                    } else {
                        Utils.showToast('复制失败，请手动复制', 'error');
                    }
                } catch (error) {
                    console.error('Copy error:', error);
                    Utils.showToast('复制失败', 'error');
                }
            };
    
            const toggleFavorite = async () => {
                if (!isLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'login' });
                    return;
                }
    
                try {
                    const result = await API.emoji.toggleFavorite(emoji.value.id);
                    if (result.code === 0 && result.data) {
                        emoji.value.is_favorited = result.data.is_favorited;
                        emoji.value.favorite_count = result.data.is_favorited 
                            ? (emoji.value.favorite_count || 0) + 1 
                            : Math.max(0, (emoji.value.favorite_count || 0) - 1);
                        Utils.showToast(result.data.is_favorited ? '收藏成功' : '已取消收藏', 'success');
                    }
                } catch (error) {
                    console.error('Toggle favorite error:', error);
                }
            };
    
            const likeEmoji = async () => {
                if (!isLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'login' });
                    return;
                }
    
                try {
                    const result = await API.emoji.like(emoji.value.id);
                    if (result.code === 0 && result.data) {
                        emoji.value.like_count = result.data.like_count;
                        Utils.showToast('点赞成功', 'success');
                    }
                } catch (error) {
                    console.error('Like error:', error);
                }
            };
    
            const submitReport = async () => {
                if (!isLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'login' });
                    return;
                }
    
                if (!reportType.value) {
                    Utils.showToast('请选择举报类型', 'warning');
                    return;
                }
    
                try {
                    const result = await API.report.create(
                        emoji.value.id,
                        reportType.value,
                        reportContent.value
                    );
                    if (result.code === 0) {
                        Utils.showToast('举报提交成功，我们会尽快处理', 'success');
                        showReportDialog.value = false;
                        reportType.value = '';
                        reportContent.value = '';
                    }
                } catch (error) {
                    console.error('Report error:', error);
                    Utils.showToast('举报提交失败', 'error');
                }
            };
    
            const shareToWechat = () => {
                Utils.showToast('请截图分享到微信', 'info');
            };
    
            const shareToQQ = () => {
                Utils.showToast('请截图分享到QQ', 'info');
            };
    
            const shareToWeibo = () => {
                Utils.showToast('请截图分享到微博', 'info');
            };
    
            onMounted(() => {
                loadDetail();
            });
    
            return {
                emoji,
                uploader,
                relatedEmojis,
                categoryName,
                loading,
                showReportDialog,
                reportType,
                reportContent,
                reportTypes,
                isLoggedIn,
                goBack,
                viewDetail,
                downloadEmoji,
                copyEmoji,
                toggleFavorite,
                likeEmoji,
                submitReport,
                shareToWechat,
                shareToQQ,
                shareToWeibo,
                Utils
            };
        }
    };
})();
