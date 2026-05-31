const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

const globalUser = ref(JSON.parse(localStorage.getItem('shipu_user') || 'null'));
const globalAdmin = ref(JSON.parse(localStorage.getItem('shipu_admin') || 'null'));

const LoginPage = {
    template: `
        <div class="form-container">
            <h2 class="form-title">用户登录</h2>
            <div class="form-group">
                <label>用户名/邮箱</label>
                <input type="text" v-model="form.username" placeholder="请输入用户名或邮箱">
            </div>
            <div class="form-group">
                <label>密码</label>
                <input type="password" v-model="form.password" placeholder="请输入密码">
            </div>
            <div class="form-actions">
                <button class="btn btn-orange" @click="handleLogin" :disabled="loading">
                    {{ loading ? '登录中...' : '登录' }}
                </button>
            </div>
            <p style="text-align: center; margin-top: 1rem;">
                还没有账号？<router-link to="/register" style="color: #ee5a24;">立即注册</router-link>
            </p>
        </div>
    `,
    setup() {
        const form = reactive({ username: '', password: '' });
        const loading = ref(false);

        const handleLogin = async () => {
            if (!form.username || !form.password) {
                alert('请填写完整信息');
                return;
            }

            loading.value = true;
            const result = await api.post('/user/login', form);
            loading.value = false;

            if (result.code === 0) {
                api.setToken(result.data.token);
                localStorage.setItem('shipu_user', JSON.stringify(result.data.user));
                globalUser.value = result.data.user;
                router.push('/');
            } else {
                alert(result.msg);
            }
        };

        return { form, loading, handleLogin };
    }
};

const RegisterPage = {
    template: `
        <div class="form-container">
            <h2 class="form-title">用户注册</h2>
            <div class="form-group">
                <label>用户名</label>
                <input type="text" v-model="form.username" placeholder="3-20位字母数字下划线">
            </div>
            <div class="form-group">
                <label>邮箱</label>
                <input type="email" v-model="form.email" placeholder="请输入邮箱">
            </div>
            <div class="form-group">
                <label>昵称</label>
                <input type="text" v-model="form.nickname" placeholder="请输入昵称">
            </div>
            <div class="form-group">
                <label>密码</label>
                <input type="password" v-model="form.password" placeholder="至少6位">
            </div>
            <div class="form-actions">
                <button class="btn btn-orange" @click="handleRegister" :disabled="loading">
                    {{ loading ? '注册中...' : '注册' }}
                </button>
            </div>
            <p style="text-align: center; margin-top: 1rem;">
                已有账号？<router-link to="/login" style="color: #ee5a24;">立即登录</router-link>
            </p>
        </div>
    `,
    setup() {
        const form = reactive({ username: '', email: '', nickname: '', password: '' });
        const loading = ref(false);

        const handleRegister = async () => {
            if (!form.username || !form.email || !form.password) {
                alert('请填写完整信息');
                return;
            }

            loading.value = true;
            const result = await api.post('/user/register', form);
            loading.value = false;

            if (result.code === 0) {
                api.setToken(result.data.token);
                localStorage.setItem('shipu_user', JSON.stringify(result.data.user));
                globalUser.value = result.data.user;
                router.push('/');
            } else {
                alert(result.msg);
            }
        };

        return { form, loading, handleRegister };
    }
};

const HomePage = {
    template: `
        <div class="container">
            <div class="search-bar">
                <input type="text" v-model="keyword" placeholder="搜索食谱..." @keyup.enter="searchRecipes">
                <select v-model="difficulty" @change="loadRecipes">
                    <option value="">全部难度</option>
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                </select>
                <button class="btn btn-orange" @click="searchRecipes">搜索</button>
            </div>

            <div class="category-tabs">
                <div class="category-tab" :class="{ active: !selectedCategory }" @click="selectCategory(null)">全部</div>
                <div class="category-tab" 
                     v-for="cat in categories" 
                     :key="cat.id"
                     :class="{ active: selectedCategory === cat.id }"
                     @click="selectCategory(cat.id)">
                    {{ cat.name }}
                </div>
            </div>

            <div v-if="loading" class="loading">加载中...</div>
            
            <div v-else class="recipe-grid">
                <div class="recipe-card" v-for="recipe in recipes" :key="recipe.id" @click="goToDetail(recipe.id)">
                    <img :src="recipe.cover_image || 'https://picsum.photos/400/300?random=' + recipe.id" :alt="recipe.title">
                    <div class="recipe-card-content">
                        <div class="recipe-card-title">{{ recipe.title }}</div>
                        <div class="recipe-card-meta">
                            <span>{{ recipe.author?.nickname || '未知作者' }}</span>
                            <span>{{ recipe.difficulty_text }}</span>
                        </div>
                        <div class="recipe-card-stats">
                            <span>👁 {{ recipe.view_count }}</span>
                            <span>❤️ {{ recipe.favorite_count }}</span>
                            <span>💬 {{ recipe.comment_count }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="!loading && recipes.length === 0" class="empty-state">
                <div class="empty-state-icon">🍳</div>
                <p>暂无食谱</p>
            </div>
        </div>
    `,
    setup() {
        const keyword = ref('');
        const difficulty = ref('');
        const selectedCategory = ref(null);
        const categories = ref([]);
        const recipes = ref([]);
        const loading = ref(true);

        const loadCategories = async () => {
            const result = await api.get('/category/all/get');
            if (result.code === 0) {
                categories.value = result.data;
            }
        };

        const loadRecipes = async () => {
            loading.value = true;
            const params = {
                page: 1,
                page_size: 20,
                category_id: selectedCategory.value || undefined,
                difficulty: difficulty.value || undefined,
                keyword: keyword.value || undefined
            };
            const result = await api.get('/recipe/list/get', params);
            if (result.code === 0) {
                recipes.value = result.data.items;
            }
            loading.value = false;
        };

        const selectCategory = (id) => {
            selectedCategory.value = id;
            loadRecipes();
        };

        const searchRecipes = () => {
            loadRecipes();
        };

        const goToDetail = (id) => {
            router.push(`/recipe/${id}`);
        };

        onMounted(() => {
            loadCategories();
            loadRecipes();
        });

        return { keyword, difficulty, selectedCategory, categories, recipes, loading, selectCategory, searchRecipes, loadRecipes, goToDetail };
    }
};

const RecipeDetailPage = {
    template: `
        <div class="container">
            <div v-if="loading" class="loading">加载中...</div>
            <div v-else-if="recipe" class="recipe-detail">
                <div class="recipe-detail-header">
                    <h1 class="recipe-detail-title">{{ recipe.title }}</h1>
                    <div class="recipe-detail-meta">
                        <span>👤 {{ recipe.author?.nickname || '未知' }}</span>
                        <span>⏱ {{ recipe.cook_time }}分钟</span>
                        <span>👥 {{ recipe.servings }}人份</span>
                        <span>📊 {{ recipe.difficulty_text }}</span>
                        <span>👁 {{ recipe.view_count }}</span>
                    </div>
                </div>

                <img class="recipe-detail-cover" :src="recipe.cover_image || 'https://picsum.photos/800/400?random=' + recipe.id" :alt="recipe.title">

                <div class="action-buttons">
                    <button class="icon-btn" :class="{ active: isFavorited }" @click="toggleFavorite">
                        {{ isFavorited ? '❤️' : '🤍' }} {{ isFavorited ? '已收藏' : '收藏' }}
                    </button>
                    <button class="icon-btn" @click="generateIngredientList">
                        📋 生成食材清单
                    </button>
                </div>

                <div class="recipe-section">
                    <h3 class="recipe-section-title">简介</h3>
                    <p>{{ recipe.description || '暂无简介' }}</p>
                </div>

                <div class="recipe-section">
                    <h3 class="recipe-section-title">食材</h3>
                    <ul class="ingredient-list">
                        <li class="ingredient-item" v-for="(ing, index) in recipe.ingredients" :key="index">
                            <span>{{ ing?.name || '' }}</span>
                            <span>{{ ing?.amount || '' }}</span>
                        </li>
                    </ul>
                </div>

                <div class="recipe-section">
                    <h3 class="recipe-section-title">步骤</h3>
                    <div class="step-item" v-for="(step, index) in recipe.steps" :key="index">
                        <div class="step-number">{{ index + 1 }}</div>
                        <div class="step-content">{{ step?.content || '' }}</div>
                    </div>
                </div>

                <div v-if="recipe.tips" class="recipe-section">
                    <h3 class="recipe-section-title">小贴士</h3>
                    <p>{{ recipe.tips }}</p>
                </div>

                <div class="comment-section">
                    <h3 class="recipe-section-title">评论 ({{ recipe.comment_count }})</h3>
                    
                    <div v-if="user" class="comment-input">
                        <textarea v-model="commentContent" placeholder="发表你的评论..."></textarea>
                        <button class="btn btn-orange" @click="submitComment">发表</button>
                    </div>

                    <div class="comment-list">
                        <div class="comment-item" v-for="comment in comments" :key="comment.id">
                            <div class="comment-header">
                                <span class="comment-author">{{ comment.nickname || '匿名用户' }}</span>
                                <span class="comment-time">{{ comment.created_at }}</span>
                            </div>
                            <p>{{ comment.content }}</p>
                            <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                                <span style="color: #999; cursor: pointer;" @click="likeComment(comment.id)">👍 {{ comment.like_count }}</span>
                            </div>
                        </div>
                    </div>

                    <div v-if="comments.length === 0" style="text-align: center; color: #999; padding: 2rem;">
                        暂无评论，快来抢沙发吧~
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const route = VueRouter.useRoute();
        const recipe = ref(null);
        const comments = ref([]);
        const loading = ref(true);
        const isFavorited = ref(false);
        const commentContent = ref('');
        const user = ref(JSON.parse(localStorage.getItem('shipu_user') || 'null'));

        const loadRecipe = async () => {
            loading.value = true;
            const result = await api.get('/recipe/detail/get', { recipe_id: route.params.id });
            if (result.code === 0) {
                recipe.value = result.data;
            }
            loading.value = false;
        };

        const checkFavorite = async () => {
            if (user.value) {
                const result = await api.get('/favorite/check/get', { recipe_id: route.params.id });
                if (result.code === 0) {
                    isFavorited.value = result.data.is_favorited;
                }
            }
        };

        const toggleFavorite = async () => {
            if (!user.value) {
                router.push('/login');
                return;
            }
            const result = await api.post('/favorite/toggle', null, { recipe_id: route.params.id });
            if (result.code === 0) {
                isFavorited.value = result.data.is_favorited;
                alert(result.msg);
            }
        };

        const generateIngredientList = async () => {
            if (!user.value) {
                router.push('/login');
                return;
            }
            const result = await api.post('/ingredient/generate', null, { recipe_id: route.params.id });
            if (result.code === 0) {
                alert('食材清单已生成，可在"食材清单"中查看');
                router.push('/ingredients');
            } else {
                alert(result.msg);
            }
        };

        const loadComments = async () => {
            const result = await api.get('/comment/list/get', { recipe_id: route.params.id, page_size: 50 });
            if (result.code === 0) {
                comments.value = result.data.items;
            }
        };

        const submitComment = async () => {
            if (!commentContent.value.trim()) {
                alert('请输入评论内容');
                return;
            }
            const result = await api.post('/comment/create', {
                recipe_id: route.params.id,
                content: commentContent.value
            });
            if (result.code === 0) {
                commentContent.value = '';
                loadComments();
                recipe.value.comment_count++;
            } else {
                alert(result.msg);
            }
        };

        const likeComment = async (commentId) => {
            await api.post('/comment/like', null, { comment_id: commentId });
            loadComments();
        };

        onMounted(() => {
            loadRecipe();
            checkFavorite();
            loadComments();
        });

        return { recipe, comments, loading, isFavorited, commentContent, user, toggleFavorite, generateIngredientList, submitComment, likeComment };
    }
};

const PublishPage = {
    template: `
        <div class="container">
            <div class="form-container" style="max-width: 700px;">
                <h2 class="form-title">发布食谱</h2>
                
                <div class="form-group">
                    <label>分类</label>
                    <select v-model="form.category_id">
                        <option value="">请选择分类</option>
                        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>食谱标题</label>
                    <input type="text" v-model="form.title" placeholder="请输入食谱标题">
                </div>

                <div class="form-group">
                    <label>封面图片URL</label>
                    <input type="text" v-model="form.cover_image" placeholder="请输入图片链接（可选）">
                </div>

                <div class="form-group">
                    <label>简介</label>
                    <textarea v-model="form.description" placeholder="简单介绍一下这道菜"></textarea>
                </div>

                <div class="form-group">
                    <label>难度</label>
                    <select v-model="form.difficulty">
                        <option value="easy">简单</option>
                        <option value="medium">中等</option>
                        <option value="hard">困难</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>烹饪时间（分钟）</label>
                    <input type="number" v-model.number="form.cook_time" min="0">
                </div>

                <div class="form-group">
                    <label>份量（人份）</label>
                    <input type="number" v-model.number="form.servings" min="1">
                </div>

                <div class="form-group">
                    <label>食材</label>
                    <div v-for="(ing, index) in form.ingredients" :key="index" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <input type="text" v-model="ing.name" placeholder="食材名称" style="flex: 1;">
                        <input type="text" v-model="ing.amount" placeholder="用量" style="width: 150px;">
                        <button type="button" @click="removeIngredient(index)" style="padding: 0 0.5rem;">✕</button>
                    </div>
                    <button type="button" class="btn btn-outline" style="width: 100%;" @click="addIngredient">+ 添加食材</button>
                </div>

                <div class="form-group">
                    <label>步骤</label>
                    <div v-for="(step, index) in form.steps" :key="index" style="margin-bottom: 0.5rem;">
                        <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
                            <span style="padding: 0.75rem; background: #ee5a24; color: white; border-radius: 4px; width: 40px; text-align: center;">{{ index + 1 }}</span>
                            <textarea v-model="step.content" placeholder="描述这一步怎么做" style="flex: 1;"></textarea>
                            <button type="button" @click="removeStep(index)" style="padding: 0 0.5rem; height: fit-content;">✕</button>
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline" style="width: 100%;" @click="addStep">+ 添加步骤</button>
                </div>

                <div class="form-group">
                    <label>小贴士</label>
                    <textarea v-model="form.tips" placeholder="分享一些小技巧（可选）"></textarea>
                </div>

                <div class="form-actions">
                    <button class="btn btn-orange" @click="handlePublish" :disabled="loading">
                        {{ loading ? '发布中...' : '发布食谱' }}
                    </button>
                </div>
            </div>
        </div>
    `,
    setup() {
        const categories = ref([]);
        const form = reactive({
            category_id: '',
            title: '',
            cover_image: '',
            description: '',
            difficulty: 'easy',
            cook_time: 30,
            servings: 2,
            ingredients: [{ name: '', amount: '' }],
            steps: [{ content: '' }],
            tips: ''
        });
        const loading = ref(false);

        const loadCategories = async () => {
            const result = await api.get('/category/all/get');
            if (result.code === 0) {
                categories.value = result.data;
            }
        };

        const addIngredient = () => {
            form.ingredients.push({ name: '', amount: '' });
        };

        const removeIngredient = (index) => {
            if (form.ingredients.length > 1) {
                form.ingredients.splice(index, 1);
            }
        };

        const addStep = () => {
            form.steps.push({ content: '' });
        };

        const removeStep = (index) => {
            if (form.steps.length > 1) {
                form.steps.splice(index, 1);
            }
        };

        const handlePublish = async () => {
            if (!form.category_id || !form.title) {
                alert('请填写分类和标题');
                return;
            }

            const validIngredients = form.ingredients.filter(ing => ing.name.trim() !== '');
            const validSteps = form.steps.filter(step => step.content.trim() !== '');

            if (validIngredients.length === 0) {
                alert('请至少添加一个食材');
                return;
            }

            if (validSteps.length === 0) {
                alert('请至少添加一个步骤');
                return;
            }

            loading.value = true;
            const data = {
                ...form,
                category_id: parseInt(form.category_id),
                ingredients: validIngredients,
                steps: validSteps
            };
            const result = await api.post('/recipe/create', data);
            loading.value = false;

            if (result.code === 0) {
                alert('发布成功，等待审核');
                router.push('/my-recipes');
            } else {
                alert(result.msg);
            }
        };

        onMounted(() => {
            loadCategories();
        });

        return { categories, form, loading, addIngredient, removeIngredient, addStep, removeStep, handlePublish };
    }
};

const ProfilePage = {
    template: `
        <div class="container">
            <div class="profile-header">
                <div class="profile-avatar">{{ user?.nickname?.charAt(0) || 'U' }}</div>
                <div class="profile-info">
                    <h2>{{ user?.nickname || user?.username }}</h2>
                    <p style="color: #888;">@{{ user?.username }}</p>
                    <p style="margin-top: 0.5rem;">{{ user?.bio || '这个人很懒，什么都没写' }}</p>
                    <div class="profile-stats">
                        <div class="profile-stat">
                            <div class="profile-stat-value">{{ user?.recipe_count || 0 }}</div>
                            <div class="profile-stat-label">食谱</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">{{ user?.favorite_count || 0 }}</div>
                            <div class="profile-stat-label">收藏</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="admin-card" style="max-width: 500px; margin: 0 auto;">
                <h3 style="margin-bottom: 1.5rem;">修改密码</h3>
                <div class="form-group">
                    <label>原密码</label>
                    <input type="password" v-model="passwordForm.old_password" placeholder="请输入原密码">
                </div>
                <div class="form-group">
                    <label>新密码</label>
                    <input type="password" v-model="passwordForm.new_password" placeholder="请输入新密码">
                </div>
                <button class="btn btn-orange" @click="changePassword" :disabled="loading">
                    {{ loading ? '修改中...' : '修改密码' }}
                </button>
            </div>
        </div>
    `,
    setup() {
        const user = ref(JSON.parse(localStorage.getItem('shipu_user') || 'null'));
        const passwordForm = reactive({ old_password: '', new_password: '' });
        const loading = ref(false);

        const changePassword = async () => {
            if (!passwordForm.old_password || !passwordForm.new_password) {
                alert('请填写完整信息');
                return;
            }

            loading.value = true;
            const result = await api.post('/user/password/change', passwordForm);
            loading.value = false;

            if (result.code === 0) {
                alert('密码修改成功，请重新登录');
                api.clearToken();
                localStorage.removeItem('shipu_user');
                router.push('/login');
            } else {
                alert(result.msg);
            }
        };

        return { user, passwordForm, loading, changePassword };
    }
};

const FavoritesPage = {
    template: `
        <div class="container">
            <h2 style="margin-bottom: 1.5rem;">我的收藏</h2>
            
            <div v-if="loading" class="loading">加载中...</div>
            
            <div v-else class="recipe-grid">
                <div class="recipe-card" v-for="item in favorites" :key="item.id" @click="goToDetail(item.recipe_id)">
                    <img :src="item.cover_image || 'https://picsum.photos/400/300?random=' + item.recipe_id" :alt="item.title">
                    <div class="recipe-card-content">
                        <div class="recipe-card-title">{{ item.title }}</div>
                        <div class="recipe-card-meta">
                            <span>{{ item.difficulty || '简单' }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="!loading && favorites.length === 0" class="empty-state">
                <div class="empty-state-icon">❤️</div>
                <p>还没有收藏任何食谱</p>
            </div>
        </div>
    `,
    setup() {
        const favorites = ref([]);
        const loading = ref(true);

        const loadFavorites = async () => {
            loading.value = true;
            const result = await api.get('/favorite/my/get', { page_size: 50 });
            if (result.code === 0) {
                favorites.value = result.data.items;
            }
            loading.value = false;
        };

        const goToDetail = (id) => {
            router.push(`/recipe/${id}`);
        };

        onMounted(() => {
            loadFavorites();
        });

        return { favorites, loading, goToDetail };
    }
};

const IngredientListPage = {
    template: `
        <div class="container">
            <h2 style="margin-bottom: 1.5rem;">食材清单</h2>
            
            <div v-if="loading" class="loading">加载中...</div>
            
            <div v-else>
                <div class="ingredient-list-card" v-for="list in lists" :key="list.id">
                    <div class="ingredient-list-header">
                        <span class="ingredient-list-name">{{ list.name || '未命名清单' }}</span>
                        <div class="ingredient-list-actions">
                            <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" @click="toggleComplete(list)">
                                {{ list.is_completed ? '标记未完成' : '标记完成' }}
                            </button>
                            <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" @click="deleteList(list.id)">
                                删除
                            </button>
                        </div>
                    </div>
                    <ul style="list-style: none; margin-top: 0.5rem;">
                        <li v-for="(ing, index) in list.ingredients" :key="index" style="padding: 0.25rem 0; border-bottom: 1px solid #eee;">
                            {{ ing.name || ing }} - {{ ing.amount || '' }}
                        </li>
                    </ul>
                </div>
            </div>

            <div v-if="!loading && lists.length === 0" class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>还没有食材清单，去食谱详情页生成一个吧</p>
            </div>
        </div>
    `,
    setup() {
        const lists = ref([]);
        const loading = ref(true);

        const loadLists = async () => {
            loading.value = true;
            const result = await api.get('/ingredient/my/get', { page_size: 50 });
            if (result.code === 0) {
                lists.value = result.data.items;
            }
            loading.value = false;
        };

        const toggleComplete = async (list) => {
            const result = await api.post('/ingredient/update', {
                is_completed: list.is_completed ? 0 : 1
            }, { list_id: list.id });
            if (result.code === 0) {
                list.is_completed = result.data.is_completed;
            }
        };

        const deleteList = async (id) => {
            if (confirm('确定删除此清单吗？')) {
                const result = await api.post('/ingredient/delete', null, { list_id: id });
                if (result.code === 0) {
                    loadLists();
                }
            }
        };

        onMounted(() => {
            loadLists();
        });

        return { lists, loading, toggleComplete, deleteList };
    }
};

const MyRecipesPage = {
    template: `
        <div class="container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2>我的食谱</h2>
                <button class="btn btn-orange" @click="router.push('/publish')">+ 发布食谱</button>
            </div>

            <div class="tabs">
                <div class="tab" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部</div>
                <div class="tab" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">待审核</div>
                <div class="tab" :class="{ active: activeTab === 'approved' }" @click="activeTab = 'approved'">已通过</div>
            </div>
            
            <div v-if="loading" class="loading">加载中...</div>
            
            <div v-else class="recipe-grid">
                <div class="recipe-card" v-for="recipe in recipes" :key="recipe.id" @click="goToDetail(recipe.id)">
                    <img :src="recipe.cover_image || 'https://picsum.photos/400/300?random=' + recipe.id" :alt="recipe.title">
                    <div class="recipe-card-content">
                        <div class="recipe-card-title">{{ recipe.title }}</div>
                        <div class="recipe-card-meta">
                            <span :class="'status-badge status-' + (recipe.status === 1 ? 'approved' : recipe.status === 2 ? 'rejected' : 'pending')">
                                {{ recipe.status_text }}
                            </span>
                        </div>
                        <div class="recipe-card-stats">
                            <span>👁 {{ recipe.view_count }}</span>
                            <span>❤️ {{ recipe.favorite_count }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="!loading && recipes.length === 0" class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>还没有发布任何食谱</p>
            </div>
        </div>
    `,
    setup() {
        const activeTab = ref('all');
        const recipes = ref([]);
        const loading = ref(true);

        const statusMap = { all: null, pending: 0, approved: 1 };

        const loadRecipes = async () => {
            loading.value = true;
            const result = await api.get('/recipe/my/get', {
                page_size: 50,
                status: statusMap[activeTab.value]
            });
            if (result.code === 0) {
                recipes.value = result.data.items;
            }
            loading.value = false;
        };

        const goToDetail = (id) => {
            router.push(`/recipe/${id}`);
        };

        watch(activeTab, () => {
            loadRecipes();
        });

        onMounted(() => {
            loadRecipes();
        });

        return { activeTab, recipes, loading, goToDetail, router };
    }
};

const AdminLoginPage = {
    template: `
        <div class="form-container">
            <h2 class="form-title">管理员登录</h2>
            <div class="form-group">
                <label>用户名</label>
                <input type="text" v-model="form.username" placeholder="请输入用户名">
            </div>
            <div class="form-group">
                <label>密码</label>
                <input type="password" v-model="form.password" placeholder="请输入密码">
            </div>
            <div class="form-actions">
                <button class="btn btn-orange" @click="handleLogin" :disabled="loading">
                    {{ loading ? '登录中...' : '登录' }}
                </button>
            </div>
            <p style="text-align: center; margin-top: 1rem;">
                <router-link to="/" style="color: #ee5a24;">返回首页</router-link>
            </p>
        </div>
    `,
    setup() {
        const form = reactive({ username: '', password: '' });
        const loading = ref(false);

        const handleLogin = async () => {
            if (!form.username || !form.password) {
                alert('请填写完整信息');
                return;
            }

            loading.value = true;
            const result = await adminApi.post('/admin/login', form);
            loading.value = false;

            if (result.code === 0) {
                adminApi.setToken(result.data.token);
                localStorage.setItem('shipu_admin', JSON.stringify(result.data.admin));
                globalAdmin.value = result.data.admin;
                router.push('/admin/dashboard');
            } else {
                alert(result.msg);
            }
        };

        return { form, loading, handleLogin };
    }
};

const AdminLayout = {
    template: `
        <div v-if="isLoggedIn" class="admin-layout">
            <div class="admin-sidebar">
                <div class="admin-sidebar-header">🍳 食谱后台</div>
                <ul class="admin-sidebar-menu">
                    <li :class="{ active: $route.path === '/admin/dashboard' }" @click="router.push('/admin/dashboard')">数据统计</li>
                    <li :class="{ active: $route.path === '/admin/users' }" @click="router.push('/admin/users')">用户管理</li>
                    <li :class="{ active: $route.path === '/admin/recipes' }" @click="router.push('/admin/recipes')">食谱审核</li>
                    <li :class="{ active: $route.path === '/admin/categories' }" @click="router.push('/admin/categories')">分类管理</li>
                </ul>
                <div style="position: absolute; bottom: 1rem; width: 100%; padding: 0 1.5rem;">
                    <button class="btn btn-secondary" style="width: 100%;" @click="logout">退出登录</button>
                </div>
            </div>
            <div class="admin-content">
                <router-view></router-view>
            </div>
        </div>
        <div v-else>
            <router-view></router-view>
        </div>
    `,
    setup() {
        const isLoggedIn = computed(() => {
            return !!globalAdmin.value;
        });

        const logout = () => {
            adminApi.clearToken();
            localStorage.removeItem('shipu_admin');
            globalAdmin.value = null;
            router.push('/admin');
        };

        return { isLoggedIn, logout, router };
    }
};

const AdminDashboardPage = {
    template: `
        <div>
            <div class="admin-header">
                <h2>数据统计</h2>
            </div>
            
            <div v-if="loading" class="loading">加载中...</div>
            
            <div v-else class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-value">{{ stats.total || 0 }}</div>
                    <div class="stat-card-label">食谱总数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">{{ stats.pending || 0 }}</div>
                    <div class="stat-card-label">待审核</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">{{ stats.approved || 0 }}</div>
                    <div class="stat-card-label">已通过</div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const stats = ref({});
        const loading = ref(true);

        const loadStats = async () => {
            loading.value = true;
            const result = await adminApi.get('/admin/statistics/get');
            if (result.code === 0) {
                stats.value = result.data;
            }
            loading.value = false;
        };

        onMounted(() => {
            loadStats();
        });

        return { stats, loading };
    }
};

const AdminUsersPage = {
    template: `
        <div>
            <div class="admin-header">
                <h2>用户管理</h2>
            </div>
            
            <div v-if="loading" class="loading">加载中...</div>
            
            <div v-else class="admin-card">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>用户名</th>
                            <th>邮箱</th>
                            <th>昵称</th>
                            <th>状态</th>
                            <th>注册时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in users" :key="user.id">
                            <td>{{ user.id }}</td>
                            <td>{{ user.username }}</td>
                            <td>{{ user.email }}</td>
                            <td>{{ user.nickname }}</td>
                            <td>
                                <span :class="'status-badge ' + (user.status === 0 ? 'status-approved' : 'status-rejected')">
                                    {{ user.status_text }}
                                </span>
                            </td>
                            <td>{{ user.created_at }}</td>
                            <td>
                                <button v-if="user.status === 0" class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" @click="updateStatus(user.id, 2)">封号</button>
                                <button v-else class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" @click="updateStatus(user.id, 0)">解封</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    setup() {
        const users = ref([]);
        const loading = ref(true);

        const loadUsers = async () => {
            loading.value = true;
            const result = await adminApi.get('/admin/user/list/get', { page_size: 50 });
            if (result.code === 0) {
                users.value = result.data.items;
            }
            loading.value = false;
        };

        const updateStatus = async (userId, status) => {
            const result = await adminApi.post('/admin/user/status/update', null, { user_id: userId, status: status });
            if (result.code === 0) {
                loadUsers();
            } else {
                alert(result.msg);
            }
        };

        onMounted(() => {
            loadUsers();
        });

        return { users, loading, updateStatus };
    }
};

const AdminRecipesPage = {
    template: `
        <div>
            <div class="admin-header">
                <h2>食谱审核</h2>
            </div>
            
            <div class="tabs">
                <div class="tab" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">待审核</div>
                <div class="tab" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部</div>
            </div>
            
            <div v-if="loading" class="loading">加载中...</div>
            
            <div v-else class="admin-card">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>标题</th>
                            <th>作者</th>
                            <th>分类</th>
                            <th>状态</th>
                            <th>发布时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="recipe in recipes" :key="recipe.id">
                            <td>{{ recipe.id }}</td>
                            <td>{{ recipe.title }}</td>
                            <td>{{ recipe.author?.nickname || '-' }}</td>
                            <td>{{ recipe.category_name || '-' }}</td>
                            <td>
                                <span :class="'status-badge status-' + (recipe.status === 1 ? 'approved' : recipe.status === 2 ? 'rejected' : 'pending')">
                                    {{ recipe.status_text }}
                                </span>
                            </td>
                            <td>{{ recipe.created_at }}</td>
                            <td>
                                <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-right: 0.5rem;" @click="viewDetail(recipe.id)">查看</button>
                                <button v-if="recipe.status === 0" class="btn btn-orange" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-right: 0.5rem;" @click="approve(recipe.id)">通过</button>
                                <button v-if="recipe.status === 0" class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" @click="reject(recipe.id)">拒绝</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    setup() {
        const activeTab = ref('pending');
        const recipes = ref([]);
        const loading = ref(true);

        const statusMap = { all: null, pending: 0 };

        const loadRecipes = async () => {
            loading.value = true;
            const result = await adminApi.get('/admin/recipe/list/get', {
                page_size: 50,
                status: statusMap[activeTab.value]
            });
            if (result.code === 0) {
                recipes.value = result.data.items;
            }
            loading.value = false;
        };

        const approve = async (id) => {
            const result = await adminApi.post('/admin/recipe/approve', null, { recipe_id: id });
            if (result.code === 0) {
                loadRecipes();
            } else {
                alert(result.msg);
            }
        };

        const reject = async (id) => {
            const result = await adminApi.post('/admin/recipe/reject', null, { recipe_id: id });
            if (result.code === 0) {
                loadRecipes();
            } else {
                alert(result.msg);
            }
        };

        const viewDetail = (id) => {
            window.open(`/static/shipu_077_web/#/recipe/${id}`, '_blank');
        };

        watch(activeTab, () => {
            loadRecipes();
        });

        onMounted(() => {
            loadRecipes();
        });

        return { activeTab, recipes, loading, approve, reject, viewDetail };
    }
};

const AdminCategoriesPage = {
    template: `
        <div>
            <div class="admin-header">
                <h2>分类管理</h2>
                <button class="btn btn-orange" @click="showAddModal = true">+ 添加分类</button>
            </div>
            
            <div v-if="loading" class="loading">加载中...</div>
            
            <div v-else class="admin-card">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>名称</th>
                            <th>描述</th>
                            <th>排序</th>
                            <th>状态</th>
                            <th>食谱数</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="cat in categories" :key="cat.id">
                            <td>{{ cat.id }}</td>
                            <td>{{ cat.name }}</td>
                            <td>{{ cat.description || '-' }}</td>
                            <td>{{ cat.sort_order }}</td>
                            <td>
                                <span :class="'status-badge ' + (cat.is_active ? 'status-approved' : 'status-rejected')">
                                    {{ cat.is_active ? '启用' : '禁用' }}
                                </span>
                            </td>
                            <td>{{ cat.recipe_count }}</td>
                            <td>
                                <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-right: 0.5rem;" @click="editCategory(cat)">编辑</button>
                                <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" @click="deleteCategory(cat.id)">删除</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="showAddModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="admin-card" style="width: 500px;">
                    <h3 style="margin-bottom: 1.5rem;">{{ editingCategory ? '编辑分类' : '添加分类' }}</h3>
                    <div class="form-group">
                        <label>分类名称</label>
                        <input type="text" v-model="categoryForm.name">
                    </div>
                    <div class="form-group">
                        <label>描述</label>
                        <textarea v-model="categoryForm.description"></textarea>
                    </div>
                    <div class="form-group">
                        <label>排序</label>
                        <input type="number" v-model.number="categoryForm.sort_order">
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select v-model.number="categoryForm.is_active">
                            <option :value="1">启用</option>
                            <option :value="0">禁用</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button class="btn btn-outline" @click="showAddModal = false; editingCategory = null;">取消</button>
                        <button class="btn btn-orange" @click="saveCategory">{{ editingCategory ? '保存' : '添加' }}</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const categories = ref([]);
        const loading = ref(true);
        const showAddModal = ref(false);
        const editingCategory = ref(null);
        const categoryForm = reactive({
            name: '',
            description: '',
            sort_order: 0,
            is_active: 1
        });

        const loadCategories = async () => {
            loading.value = true;
            const result = await adminApi.get('/category/list/get', { page_size: 50 });
            if (result.code === 0) {
                categories.value = result.data.items;
            }
            loading.value = false;
        };

        const editCategory = (cat) => {
            editingCategory.value = cat;
            categoryForm.name = cat.name;
            categoryForm.description = cat.description;
            categoryForm.sort_order = cat.sort_order;
            categoryForm.is_active = cat.is_active;
            showAddModal.value = true;
        };

        const saveCategory = async () => {
            if (!categoryForm.name) {
                alert('请填写分类名称');
                return;
            }

            let result;
            if (editingCategory.value) {
                result = await adminApi.post('/admin/category/update', null, {
                    category_id: editingCategory.value.id,
                    name: categoryForm.name,
                    description: categoryForm.description,
                    sort_order: categoryForm.sort_order,
                    is_active: categoryForm.is_active
                });
            } else {
                result = await adminApi.post('/admin/category/create', null, categoryForm);
            }

            if (result.code === 0) {
                showAddModal.value = false;
                editingCategory.value = null;
                categoryForm.name = '';
                categoryForm.description = '';
                categoryForm.sort_order = 0;
                categoryForm.is_active = 1;
                loadCategories();
            } else {
                alert(result.msg);
            }
        };

        const deleteCategory = async (id) => {
            if (confirm('确定删除此分类吗？')) {
                const result = await adminApi.post('/admin/category/delete', null, { category_id: id });
                if (result.code === 0) {
                    loadCategories();
                } else {
                    alert(result.msg);
                }
            }
        };

        onMounted(() => {
            loadCategories();
        });

        return { categories, loading, showAddModal, editingCategory, categoryForm, editCategory, saveCategory, deleteCategory };
    }
};

const App = {
    template: `
        <div>
            <header class="header" v-if="!isAdminPage">
                <div class="container">
                    <div class="header-content">
                        <div class="logo" @click="router.push('/')">🍳 美食食谱</div>
                        <nav class="nav-links">
                            <router-link to="/">首页</router-link>
                            <router-link to="/publish" v-if="user">发布</router-link>
                            <router-link to="/favorites" v-if="user">收藏</router-link>
                            <router-link to="/ingredients" v-if="user">食材清单</router-link>
                            <router-link to="/my-recipes" v-if="user">我的食谱</router-link>
                        </nav>
                        <div class="user-actions">
                            <template v-if="user">
                                <router-link to="/profile" style="color: white; text-decoration: none;">{{ user.nickname || user.username }}</router-link>
                                <button class="btn btn-secondary" @click="logout">退出</button>
                            </template>
                            <template v-else>
                                <button class="btn btn-secondary" @click="router.push('/login')">登录</button>
                                <button class="btn btn-primary" @click="router.push('/register')">注册</button>
                            </template>
                        </div>
                    </div>
                </div>
            </header>

            <main class="main" v-if="!isAdminPage">
                <router-view></router-view>
            </main>

            <router-view v-else></router-view>

            <footer class="footer" v-if="!isAdminPage">
                <p>© 2024 美食食谱分享平台 - 让烹饪更简单</p>
            </footer>
        </div>
    `,
    setup() {
        const isAdminPage = computed(() => {
            return router.currentRoute.value.path.startsWith('/admin');
        });

        const logout = () => {
            api.clearToken();
            localStorage.removeItem('shipu_user');
            globalUser.value = null;
            router.push('/');
        };

        return { user: globalUser, isAdminPage, logout, router };
    }
};

const userRoutes = [
    { path: '/', component: HomePage, meta: { title: '首页' } },
    { path: '/login', component: LoginPage, meta: { title: '登录' } },
    { path: '/register', component: RegisterPage, meta: { title: '注册' } },
    { path: '/recipe/:id', component: RecipeDetailPage, meta: { title: '食谱详情' } },
    { path: '/publish', component: PublishPage, meta: { title: '发布食谱', requiresAuth: true } },
    { path: '/profile', component: ProfilePage, meta: { title: '个人中心', requiresAuth: true } },
    { path: '/favorites', component: FavoritesPage, meta: { title: '我的收藏', requiresAuth: true } },
    { path: '/ingredients', component: IngredientListPage, meta: { title: '食材清单', requiresAuth: true } },
    { path: '/my-recipes', component: MyRecipesPage, meta: { title: '我的食谱', requiresAuth: true } }
];

userRoutes.forEach(r => router.addRoute(r));

router.addRoute({
    path: '/admin',
    component: AdminLayout,
    children: [
        { path: '', component: AdminLoginPage, meta: { title: '管理员登录' } },
        { path: 'dashboard', component: AdminDashboardPage, meta: { title: '管理后台', requiresAdmin: true } },
        { path: 'users', component: AdminUsersPage, meta: { title: '用户管理', requiresAdmin: true } },
        { path: 'recipes', component: AdminRecipesPage, meta: { title: '食谱审核', requiresAdmin: true } },
        { path: 'categories', component: AdminCategoriesPage, meta: { title: '分类管理', requiresAdmin: true } }
    ]
});

const app = createApp(App);
app.use(router);
app.mount('#app');
