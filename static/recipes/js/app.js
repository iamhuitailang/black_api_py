const API_BASE = '/api/recipes';
const AUTH_BASE = '/api/auth';
const TOKEN_KEY = 'recipe_app_token';
const USER_KEY = 'recipe_app_user';

const state = {
    recipes: [],
    favorites: [],
    currentView: 'all',
    searchIngredients: [],
    shoppingSelectedIds: [],
    editingId: null,
    ingredientCount: 0,
    stepCount: 0,
    currentUser: null
};

function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
}

function saveAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    state.currentUser = user;
}

function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    state.currentUser = null;
}

function getStoredUser() {
    try {
        const u = localStorage.getItem(USER_KEY);
        return u ? JSON.parse(u) : null;
    } catch {
        return null;
    }
}

async function api(url, options = {}) {
    const token = getToken();
    const isGet = !options.method || options.method === 'GET';
    const headers = {};
    if (!isGet) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    if (options.headers) {
        Object.assign(headers, options.headers);
    }
    const fetchOptions = {
        ...options,
        headers
    };
    if (isGet) {
        fetchOptions.cache = 'no-cache';
    }
    const res = await fetch(url, fetchOptions);
    if (res.status === 401 || res.status === 403) {
        clearAuth();
        showLoginScreen();
        showToast('请先登录', 'warning');
        throw new Error('Unauthorized');
    }
    return await res.json();
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        setTimeout(() => toast.remove(), 350);
    }, 2500);
}

function showLoginScreen() {
    document.getElementById('loginOverlay').classList.add('active');
    document.getElementById('mainApp').style.display = 'none';
}

function hideLoginScreen() {
    document.getElementById('loginOverlay').classList.remove('active');
    document.getElementById('mainApp').style.display = 'block';
    const user = state.currentUser || getStoredUser();
    if (user) {
        document.getElementById('currentUsername').textContent = user.username;
    }
}

async function doLogin(username, password) {
    const res = await api(`${AUTH_BASE}/login`, {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    if (res.code === 0) {
        saveAuth(res.data.token, res.data.user);
        hideLoginScreen();
        showToast(`欢迎回来，${res.data.user.username}！`, 'success');
        await loadAppData();
        await seedSampleDataIfEmpty();
        return true;
    } else {
        showToast(res.message || '登录失败', 'error');
        return false;
    }
}

async function doRegister(username, password) {
    const res = await api(`${AUTH_BASE}/register`, {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    if (res.code === 0) {
        saveAuth(res.data.token, res.data.user);
        hideLoginScreen();
        showToast(`注册成功，欢迎 ${res.data.user.username}！`, 'success');
        await loadAppData();
        await seedSampleDataIfEmpty();
        return true;
    } else {
        showToast(res.message || '注册失败', 'error');
        return false;
    }
}

async function doLogout() {
    const token = getToken();
    if (token) {
        try {
            await api(`${AUTH_BASE}/logout`, { method: 'POST' });
        } catch (e) {}
    }
    clearAuth();
    showLoginScreen();
    showToast('已退出登录', 'info');
}

async function checkAuth() {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user) {
        clearAuth();
        showLoginScreen();
        return false;
    }

    try {
        const res = await api(`${AUTH_BASE}/current/user/get`);
        if (res.code === 0 && res.data) {
            state.currentUser = res.data;
            localStorage.setItem(USER_KEY, JSON.stringify(res.data));
            hideLoginScreen();
            return true;
        } else {
            clearAuth();
            showLoginScreen();
            return false;
        }
    } catch (e) {
        console.error('checkAuth exception:', e);
        clearAuth();
        showLoginScreen();
        return false;
    }
}

function getDifficultyClass(d) {
    if (d === '简单') return 'difficulty-easy';
    if (d === '中等') return 'difficulty-medium';
    return 'difficulty-hard';
}

function getMatchClass(pct) {
    if (pct >= 70) return 'match-high';
    if (pct >= 40) return 'match-medium';
    return 'match-low';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function renderRecipeCard(recipe, showMatch = false) {
    const tags = recipe.tags || [];
    const ingredients = recipe.ingredients || [];
    const favIcon = recipe.is_favorited ? '⭐' : '☆';
    const matchHtml = showMatch && recipe.match_percentage !== undefined
        ? `<div class="match-percent-bar ${getMatchClass(recipe.match_percentage)}">
             <span class="match-color-block"></span>
             ${recipe.match_percentage}%
           </div>`
        : '';

    return `
        <div class="recipe-card" data-id="${recipe.id}" onclick="showRecipeDetail(${recipe.id})">
            ${matchHtml}
            <div class="recipe-card-header">
                <div class="recipe-card-title">${escapeHtml(recipe.name)}</div>
                <button class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${recipe.id}, this)">
                    ${favIcon}
                </button>
            </div>
            <div class="recipe-card-meta">
                <span class="meta-item ${getDifficultyClass(recipe.difficulty)}">${escapeHtml(recipe.difficulty)}</span>
                <span class="meta-item">⏱ ${recipe.cook_time}分钟</span>
            </div>
            <div class="recipe-tags">
                ${tags.map(t => `<span class="ingredient-tag">#${escapeHtml(t)}</span>`).join('')}
            </div>
            <div class="recipe-ingredients-preview">
                <div class="ingredients-title">🥬 食材 (${ingredients.length}样)</div>
                <ul>
                    ${ingredients.slice(0, 4).map(i => `
                        <li>
                            <span class="ing-name">${escapeHtml(i.name)}</span>
                            <span class="ing-amount">${escapeHtml(i.amount || '')}</span>
                        </li>
                    `).join('')}
                    ${ingredients.length > 4 ? `<li><span class="ing-name" style="color: var(--text-medium);">...还有${ingredients.length - 4}样</span></li>` : ''}
                </ul>
            </div>
            <div class="recipe-card-actions">
                <button class="btn btn-sm btn-light" onclick="event.stopPropagation(); editRecipe(${recipe.id})">✏️ 编辑</button>
                <button class="btn btn-sm btn-light" onclick="event.stopPropagation(); addToShopping(${recipe.id})">🛒 加入清单</button>
                <button class="btn btn-sm btn-light" onclick="event.stopPropagation(); deleteRecipe(${recipe.id})">🗑️</button>
            </div>
        </div>
    `;
}

async function loadRecipes() {
    const difficulty = document.getElementById('filterDifficulty').value;
    const tag = document.getElementById('filterTag').value;
    const keyword = document.getElementById('searchKeyword').value;

    let url = `${API_BASE}/getlist`;
    const params = [];
    if (difficulty) params.push(`difficulty=${encodeURIComponent(difficulty)}`);
    if (tag) params.push(`tag=${encodeURIComponent(tag)}`);
    if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
    if (params.length) url += '?' + params.join('&');

    try {
        const res = await api(url);
        if (res.code === 0) {
            state.recipes = res.data;
        } else {
            console.error('loadRecipes error:', res.message);
        }
    } catch (e) {
        console.error('loadRecipes exception:', e);
    }
}

async function loadFavorites() {
    try {
        const res = await api(`${API_BASE}/getfavorites/get`);
        if (res.code === 0) {
            state.favorites = res.data;
        } else {
            console.error('loadFavorites error:', res.message);
        }
    } catch (e) {
        console.error('loadFavorites exception:', e);
    }
}

async function loadAppData() {
    await Promise.all([loadRecipes(), loadFavorites()]);
    renderRecipesGrid();
}

function renderRecipesGrid() {
    const grid = document.getElementById('recipesGrid');
    const title = document.getElementById('sectionTitle');
    const btnShowAll = document.getElementById('btnShowAll');
    const btnShowFav = document.getElementById('btnShowFavorites');

    let recipes = state.currentView === 'favorites' ? state.favorites : state.recipes;

    if (state.currentView === 'favorites') {
        title.innerHTML = '<h2>⭐ 我的收藏</h2>';
        btnShowAll.style.display = 'inline-flex';
        btnShowFav.style.display = 'none';
    } else {
        title.innerHTML = '<h2>📖 全部菜谱</h2>';
        btnShowAll.style.display = 'none';
        btnShowFav.style.display = 'inline-flex';
    }

    if (!recipes || recipes.length === 0) {
        const emptyMsg = state.currentView === 'favorites'
            ? '还没有收藏的菜谱，去给喜欢的菜点个⭐吧！'
            : '还没有菜谱，点击"录入新菜谱"开始吧！';
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🍽️</div>
                <p>${emptyMsg}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = recipes.map(r => renderRecipeCard(r)).join('');
}

function openRecipeModal() {
    state.editingId = null;
    document.getElementById('modalTitle').textContent = '📝 录入新菜谱';
    document.getElementById('recipeForm').reset();
    document.getElementById('recipeId').value = '';
    document.getElementById('recipeCookTime').value = 15;
    document.querySelectorAll('#tagCheckboxes input').forEach(cb => cb.checked = false);

    state.ingredientCount = 0;
    state.stepCount = 0;
    document.getElementById('ingredientsList').innerHTML = '';
    document.getElementById('stepsList').innerHTML = '';

    addIngredientRow();
    addIngredientRow();
    addStepRow();
    addStepRow();

    document.getElementById('recipeModal').classList.add('active');
}

function closeRecipeModal() {
    document.getElementById('recipeModal').classList.remove('active');
}

function addIngredientRow(name = '', amount = '') {
    state.ingredientCount++;
    const div = document.createElement('div');
    div.className = 'ingredient-row';
    div.innerHTML = `
        <input type="text" placeholder="食材名称，如:番茄" value="${escapeHtml(name)}">
        <input type="text" placeholder="用量，如:2个" value="${escapeHtml(amount)}">
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
    `;
    document.getElementById('ingredientsList').appendChild(div);
}

function addStepRow(text = '') {
    state.stepCount++;
    const idx = document.querySelectorAll('.step-row').length + 1;
    const div = document.createElement('div');
    div.className = 'step-row';
    div.innerHTML = `
        <div class="step-index">${idx}</div>
        <textarea placeholder="描述这一步怎么做...">${escapeHtml(text)}</textarea>
        <button type="button" class="remove-btn" onclick="removeStep(this)">×</button>
    `;
    document.getElementById('stepsList').appendChild(div);
}

function removeStep(btn) {
    btn.parentElement.remove();
    updateStepIndexes();
}

function updateStepIndexes() {
    document.querySelectorAll('.step-index').forEach((el, i) => {
        el.textContent = i + 1;
    });
}

function collectFormData() {
    const name = document.getElementById('recipeName').value.trim();
    const difficulty = document.getElementById('recipeDifficulty').value;
    const cook_time = parseInt(document.getElementById('recipeCookTime').value) || 0;
    const tags = Array.from(document.querySelectorAll('#tagCheckboxes input:checked')).map(cb => cb.value);
    const ingredients = Array.from(document.querySelectorAll('#ingredientsList .ingredient-row'))
        .map(row => {
            const inputs = row.querySelectorAll('input');
            return { name: inputs[0].value.trim(), amount: inputs[1].value.trim() };
        })
        .filter(i => i.name);
    const steps = Array.from(document.querySelectorAll('#stepsList .step-row textarea'))
        .map(ta => ta.value.trim())
        .filter(s => s);

    return { name, difficulty, cook_time, tags, ingredients, steps };
}

async function saveRecipe(e) {
    e.preventDefault();
    const data = collectFormData();

    if (!data.name) return showToast('请填写菜名', 'error');
    if (!data.ingredients.length) return showToast('请至少添加一个食材', 'error');
    if (!data.steps.length) return showToast('请至少添加一个步骤', 'error');

    const id = document.getElementById('recipeId').value;

    try {
        if (id) {
            const res = await api(`${API_BASE}/put`, {
                method: 'PUT',
                body: JSON.stringify({
                    id: parseInt(id),
                    ...data
                })
            });
            if (res.code === 0) {
                showToast('更新成功！', 'success');
                closeRecipeModal();
                await loadAppData();
            } else {
                showToast(res.message, 'error');
            }
        } else {
            const res = await api(`${API_BASE}/set`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (res.code === 0) {
                showToast('菜谱创建成功！', 'success');
                closeRecipeModal();
                await loadAppData();
            } else {
                showToast(res.message, 'error');
            }
        }
    } catch (e) {}
}

async function editRecipe(id) {
    try {
        const res = await api(`${API_BASE}/get?id=${id}`);
        if (res.code !== 0 || !res.data) return showToast('获取菜谱失败', 'error');

        const r = res.data;
        state.editingId = id;
        document.getElementById('modalTitle').textContent = '✏️ 编辑菜谱';
        document.getElementById('recipeId').value = r.id;
        document.getElementById('recipeName').value = r.name;
        document.getElementById('recipeDifficulty').value = r.difficulty;
        document.getElementById('recipeCookTime').value = r.cook_time;

        document.querySelectorAll('#tagCheckboxes input').forEach(cb => {
            cb.checked = (r.tags || []).includes(cb.value);
        });

        document.getElementById('ingredientsList').innerHTML = '';
        (r.ingredients || []).forEach(ing => addIngredientRow(ing.name, ing.amount));

        document.getElementById('stepsList').innerHTML = '';
        (r.steps || []).forEach(s => addStepRow(s));

        document.getElementById('recipeModal').classList.add('active');
    } catch (e) {}
}

async function deleteRecipe(id) {
    if (!confirm('确定要删除这道菜谱吗？')) return;
    try {
        const res = await api(`${API_BASE}/delete?id=${id}`, { method: 'DELETE' });
        if (res.code === 0) {
            showToast('删除成功', 'success');
            await loadAppData();
        } else {
            showToast(res.message, 'error');
        }
    } catch (e) {}
}

async function toggleFavorite(id, btn) {
    try {
        const res = await api(`${API_BASE}/togglefavorite`, {
            method: 'POST',
            body: JSON.stringify({ recipe_id: id })
        });
        if (res.code === 0) {
            showToast(res.message, 'success');
            const isFav = res.data.is_favorited;
            if (btn) btn.textContent = isFav ? '⭐' : '☆';
            const recipe = state.recipes.find(r => r.id === id);
            if (recipe) recipe.is_favorited = isFav;
            if (isFav) {
                if (recipe && !state.favorites.find(f => f.id === id)) {
                    state.favorites.push(recipe);
                }
            } else {
                state.favorites = state.favorites.filter(f => f.id !== id);
            }
            if (state.currentView === 'favorites') {
                renderRecipesGrid();
            }
        } else {
            showToast(res.message, 'error');
        }
    } catch (e) {}
}

async function showRecipeDetail(id) {
    try {
        const res = await api(`${API_BASE}/get?id=${id}`);
        if (res.code !== 0 || !res.data) return showToast('获取菜谱失败', 'error');

        const r = res.data;
        document.getElementById('detailTitle').textContent = `🍳 ${r.name}`;
        document.getElementById('detailBody').innerHTML = `
            <div class="detail-section">
                <div class="detail-meta-row">
                    <span class="meta-item ${getDifficultyClass(r.difficulty)}">难度：${escapeHtml(r.difficulty)}</span>
                    <span class="meta-item">⏱ 烹饪时间：${r.cook_time}分钟</span>
                    ${r.is_favorited ? '<span class="meta-item fav-badge" style="background:#FFF3E0;color:#E65100;">⭐ 已收藏</span>' : ''}
                </div>
                <div class="recipe-tags">
                    ${(r.tags || []).map(t => `<span class="ingredient-tag">#${escapeHtml(t)}</span>`).join('')}
                </div>
            </div>
            <div class="detail-section">
                <h3>🥬 所需食材</h3>
                <table class="detail-ingredients-table">
                    <tbody>
                        ${(r.ingredients || []).map(i => `
                            <tr>
                                <td>${escapeHtml(i.name)}</td>
                                <td>${escapeHtml(i.amount || '-')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="detail-section">
                <h3>👨‍🍳 烹饪步骤</h3>
                <ol class="detail-steps-list">
                    ${(r.steps || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                </ol>
            </div>
            <div class="detail-actions">
                <button class="btn btn-light" onclick="closeDetailModal(); editRecipe(${r.id});">✏️ 编辑</button>
                <button class="btn btn-warm" onclick="closeDetailModal(); addToShopping(${r.id});">🛒 加入购物清单</button>
                <button class="btn btn-primary" id="detailFavBtn" data-id="${r.id}" data-fav="${r.is_favorited ? '1' : '0'}" onclick="toggleDetailFav(this)">
                    ${r.is_favorited ? '💔 取消收藏' : '⭐ 收藏菜谱'}
                </button>
            </div>
        `;
        document.getElementById('recipeDetailModal').classList.add('active');
    } catch (e) {}
}

function closeDetailModal() {
    document.getElementById('recipeDetailModal').classList.remove('active');
}

async function toggleDetailFav(btn) {
    const id = parseInt(btn.dataset.id);
    try {
        const res = await api(`${API_BASE}/togglefavorite`, {
            method: 'POST',
            body: JSON.stringify({ recipe_id: id })
        });
        if (res.code === 0) {
            const isFav = res.data.is_favorited;
            btn.textContent = isFav ? '💔 取消收藏' : '⭐ 收藏菜谱';
            btn.dataset.fav = isFav ? '1' : '0';
            const favBadge = document.querySelector('.detail-meta-row .fav-badge');
            if (isFav && !favBadge) {
                const metaRow = document.querySelector('.detail-meta-row');
                if (metaRow) {
                    const span = document.createElement('span');
                    span.className = 'meta-item fav-badge';
                    span.style.cssText = 'background:#FFF3E0;color:#E65100;';
                    span.textContent = '⭐ 已收藏';
                    metaRow.appendChild(span);
                }
            } else if (!isFav && favBadge) {
                favBadge.remove();
            }
            const cardBtn = document.querySelector(`.recipe-card[data-id="${id}"] .favorite-btn`);
            if (cardBtn) cardBtn.textContent = isFav ? '⭐' : '☆';
            const recipe = state.recipes.find(r => r.id === id);
            if (recipe) recipe.is_favorited = isFav;
            if (isFav) {
                if (recipe && !state.favorites.find(f => f.id === id)) state.favorites.push(recipe);
            } else {
                state.favorites = state.favorites.filter(f => f.id !== id);
            }
            if (state.currentView === 'favorites') {
                renderRecipesGrid();
            }
            showToast(res.message, 'success');
        }
    } catch (e) {}
}

function openIngredientSearch() {
    state.searchIngredients = [];
    renderSearchIngredients();
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('ingredientSearchInput').value = '';
    document.getElementById('ingredientSearchModal').classList.add('active');
}

function closeIngredientSearch() {
    document.getElementById('ingredientSearchModal').classList.remove('active');
}

function renderSearchIngredients() {
    const container = document.getElementById('addedSearchIngredients');
    if (state.searchIngredients.length === 0) {
        container.innerHTML = '<span style="color: var(--text-light); font-size: 0.88em;">还没有添加食材</span>';
        return;
    }
    container.innerHTML = state.searchIngredients.map((ing, idx) => `
        <span class="added-ingredient-chip">
            ${escapeHtml(ing)}
            <button class="ingredient-remove-btn" onclick="removeSearchIngredient(${idx})">×</button>
        </span>
    `).join('');
}

function addSearchIngredient() {
    const input = document.getElementById('ingredientSearchInput');
    const val = input.value.trim();
    if (!val) return;
    if (state.searchIngredients.includes(val)) {
        showToast('已添加过这个食材', 'warning');
        return;
    }
    state.searchIngredients.push(val);
    input.value = '';
    renderSearchIngredients();
}

function removeSearchIngredient(idx) {
    state.searchIngredients.splice(idx, 1);
    renderSearchIngredients();
}

async function doSearchByIngredients() {
    if (state.searchIngredients.length === 0) {
        return showToast('请至少添加一个食材', 'warning');
    }

    try {
        const res = await api(`${API_BASE}/searchbyingredients`, {
            method: 'POST',
            body: JSON.stringify({ ingredients: state.searchIngredients })
        });

        if (res.code !== 0) {
            showToast(res.message, 'error');
            return;
        }

        const results = res.data.results;
        const container = document.getElementById('searchResults');
        const list = document.getElementById('searchResultsList');
        container.style.display = 'block';

        if (!results || results.length === 0) {
            list.innerHTML = `
                <div style="padding:30px;text-align:center;color:var(--text-medium);background:rgba(255,255,255,0.6);border-radius:10px;">
                    <div style="font-size:2.5em;margin-bottom:10px;">😕</div>
                    没有找到匹配的菜谱，试试录入新菜谱吧！
                </div>
            `;
            return;
        }

        list.innerHTML = results.map(r => {
            const pct = r.match_percentage;
            const cls = getMatchClass(pct);
            return `
                <div class="search-result-card" onclick="closeIngredientSearch(); showRecipeDetail(${r.id});" style="cursor:pointer;">
                    <div class="search-result-header">
                        <span class="search-result-name">${escapeHtml(r.name)}</span>
                        <div class="match-percent-bar ${cls}">
                            <span class="match-color-block"></span>
                            ${pct}%
                        </div>
                    </div>
                    <div class="search-result-meta">
                        <span class="meta-item ${getDifficultyClass(r.difficulty)}">${escapeHtml(r.difficulty)}</span>
                        <span class="meta-item">⏱ ${r.cook_time}分钟</span>
                        <span class="meta-item" style="background:#E3F2FD;color:#1565C0;">
                            匹配 ${r.match_count}/${r.total_ingredients} 样
                        </span>
                    </div>
                    <div class="match-bar-outer">
                        <div class="match-bar-inner ${cls}-bar" style="width:${pct}%; background:${pct >= 70 ? '#4CAF50' : pct >= 40 ? '#FF9800' : '#F44336'};"></div>
                    </div>
                    <div class="match-info">
                        ${(r.tags || []).map(t => `<span class="ingredient-tag" style="margin-right:4px;">#${escapeHtml(t)}</span>`).join('')}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {}
}

function openShoppingList() {
    renderShoppingRecipeList();
    document.getElementById('shoppingSelection').style.display = 'block';
    document.getElementById('shoppingResult').style.display = 'none';
    document.getElementById('shoppingListModal').classList.add('active');
}

function closeShoppingList() {
    document.getElementById('shoppingListModal').classList.remove('active');
}

function renderShoppingRecipeList() {
    const container = document.getElementById('shoppingRecipeList');
    if (!state.recipes || state.recipes.length === 0) {
        container.innerHTML = `
            <div style="padding:30px;text-align:center;color:var(--text-medium);">
                <div style="font-size:2em;margin-bottom:8px;">📭</div>
                还没有菜谱，先去录入吧~
            </div>
        `;
        return;
    }

    container.innerHTML = state.recipes.map(r => {
        const checked = state.shoppingSelectedIds.includes(r.id) ? 'checked' : '';
        return `
            <label class="recipe-check-item">
                <input type="checkbox" value="${r.id}" ${checked} onchange="toggleShoppingSelection(${r.id}, this)">
                <span class="recipe-check-label">${escapeHtml(r.name)}</span>
                <span class="recipe-check-meta">${escapeHtml(r.difficulty)} · ${r.cook_time}分钟 · ${r.ingredients?.length || 0}样食材</span>
            </label>
        `;
    }).join('');
}

function toggleShoppingSelection(id, cb) {
    if (cb.checked) {
        if (!state.shoppingSelectedIds.includes(id)) {
            state.shoppingSelectedIds.push(id);
        }
    } else {
        state.shoppingSelectedIds = state.shoppingSelectedIds.filter(i => i !== id);
    }
    updateShoppingBadge();
}

function addToShopping(id) {
    if (!state.shoppingSelectedIds.includes(id)) {
        state.shoppingSelectedIds.push(id);
        updateShoppingBadge();
        showToast('已加入购物清单', 'success');
    } else {
        showToast('已在购物清单中', 'info');
    }
}

function updateShoppingBadge() {
    document.getElementById('shoppingBadge').textContent = state.shoppingSelectedIds.length;
}

async function generateShoppingList() {
    if (state.shoppingSelectedIds.length === 0) {
        return showToast('请先选择要做的菜', 'warning');
    }

    try {
        const res = await api(`${API_BASE}/shoppinglist`, {
            method: 'POST',
            body: JSON.stringify({ recipe_ids: state.shoppingSelectedIds })
        });

        if (res.code !== 0) {
            showToast(res.message, 'error');
            return;
        }

        const { recipes, shopping_list } = res.data;
        const container = document.getElementById('shoppingResultList');
        document.getElementById('shoppingSelection').style.display = 'none';
        document.getElementById('shoppingResult').style.display = 'block';

        const recipesText = recipes.map(r => `• ${r.name}`).join('\n');
        const listText = shopping_list.map(item => {
            const amounts = item.amounts.length ? ` (${item.amounts.join(' + ')})` : '';
            return `□ ${item.name}${amounts}`;
        }).join('\n');
        window._shoppingClipboard = `准备做：\n${recipesText}\n\n购物清单：\n${listText}`;

        container.innerHTML = `
            <div style="margin-bottom:14px;padding:10px 14px;background:rgba(255,248,220,0.6);border-radius:8px;font-size:0.92em;">
                <div style="font-weight:600;color:var(--primary-dark);margin-bottom:4px;">🥘 准备做的菜：</div>
                ${recipes.map(r => `<div style="padding:2px 0;color:var(--text-dark);">• ${escapeHtml(r.name)}</div>`).join('')}
            </div>
            <div style="margin-bottom:8px;color:var(--text-medium);font-size:0.9em;">共需 ${shopping_list.length} 样食材：</div>
            ${shopping_list.map(item => `
                <div class="shopping-item">
                    <span class="shopping-item-name">${escapeHtml(item.name)}</span>
                    <div class="shopping-item-amounts">
                        ${item.amounts.map(a => `<span class="shopping-amount-tag">${escapeHtml(a)}</span>`).join('')}
                        ${item.recipe_count > 1 ? `<span class="shopping-amount-tag" style="background:#FFE0B2;color:#E65100;">×${item.recipe_count}道菜</span>` : ''}
                    </div>
                </div>
            `).join('')}
        `;
    } catch (e) {}
}

function copyShoppingList() {
    if (!window._shoppingClipboard) return showToast('没有可复制的内容', 'warning');
    navigator.clipboard.writeText(window._shoppingClipboard).then(() => {
        showToast('购物清单已复制到剪贴板！', 'success');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = window._shoppingClipboard;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('购物清单已复制！', 'success');
    });
}

function backToShoppingSelect() {
    document.getElementById('shoppingSelection').style.display = 'block';
    document.getElementById('shoppingResult').style.display = 'none';
}

async function seedSampleDataIfEmpty() {
    if (state.recipes && state.recipes.length > 0) return;

    const samples = [
        {
            name: '番茄炒蛋', difficulty: '简单', cook_time: 15,
            tags: ['家常菜', '快手菜'],
            ingredients: [
                { name: '番茄', amount: '2个' },
                { name: '鸡蛋', amount: '3个' },
                { name: '葱花', amount: '适量' },
                { name: '盐', amount: '少许' },
                { name: '白糖', amount: '1勺' }
            ],
            steps: [
                '番茄洗净切块，鸡蛋打散加少许盐搅匀',
                '热锅凉油，倒入蛋液，炒至金黄盛出',
                '锅中再加少许油，下番茄翻炒出汁',
                '加白糖、盐调味，倒入炒好的鸡蛋翻匀',
                '撒上葱花出锅即可'
            ]
        },
        {
            name: '红烧肉', difficulty: '复杂', cook_time: 90,
            tags: ['家常菜', '硬菜'],
            ingredients: [
                { name: '五花肉', amount: '500g' },
                { name: '冰糖', amount: '30g' },
                { name: '生抽', amount: '2勺' },
                { name: '老抽', amount: '1勺' },
                { name: '料酒', amount: '2勺' },
                { name: '姜片', amount: '5片' },
                { name: '八角', amount: '2个' }
            ],
            steps: [
                '五花肉切块，冷水下锅焯水去腥',
                '锅中放少许油，加冰糖小火炒出糖色',
                '下五花肉翻炒上色',
                '加姜片、八角、生抽、老抽、料酒翻炒',
                '加水没过肉，大火烧开转小火炖60分钟',
                '大火收汁至浓稠即可出锅'
            ]
        },
        {
            name: '西红柿鸡蛋汤', difficulty: '简单', cook_time: 10,
            tags: ['家常菜', '快手菜', '汤'],
            ingredients: [
                { name: '番茄', amount: '1个' },
                { name: '鸡蛋', amount: '2个' },
                { name: '葱花', amount: '少许' },
                { name: '盐', amount: '适量' },
                { name: '香油', amount: '几滴' }
            ],
            steps: [
                '番茄切块，鸡蛋打散',
                '锅中水烧开，下番茄煮2分钟出味',
                '淋入蛋液，边倒边搅拌形成蛋花',
                '加盐调味，撒葱花，滴几滴香油出锅'
            ]
        },
        {
            name: '凉拌黄瓜', difficulty: '简单', cook_time: 5,
            tags: ['快手菜', '家常菜'],
            ingredients: [
                { name: '黄瓜', amount: '2根' },
                { name: '大蒜', amount: '3瓣' },
                { name: '生抽', amount: '2勺' },
                { name: '香醋', amount: '1勺' },
                { name: '辣椒油', amount: '1勺' },
                { name: '白糖', amount: '少许' }
            ],
            steps: [
                '黄瓜拍碎切段，蒜切末',
                '黄瓜加少许盐腌5分钟，倒掉多余水分',
                '加入蒜末、生抽、香醋、辣椒油、白糖拌匀即可'
            ]
        },
        {
            name: '芒果布丁', difficulty: '中等', cook_time: 120,
            tags: ['甜品'],
            ingredients: [
                { name: '芒果', amount: '2个' },
                { name: '牛奶', amount: '250ml' },
                { name: '淡奶油', amount: '150ml' },
                { name: '吉利丁片', amount: '10g' },
                { name: '细砂糖', amount: '40g' }
            ],
            steps: [
                '吉利丁片冷水泡软',
                '芒果去皮取肉，一部分打成泥，一部分切粒',
                '牛奶加糖加热至糖融化，加泡软的吉利丁搅匀',
                '加入淡奶油和芒果泥搅匀',
                '倒入布丁杯，加入芒果粒，冷藏2小时凝固即可'
            ]
        }
    ];

    try {
        for (const sample of samples) {
            await api(`${API_BASE}/set`, { method: 'POST', body: JSON.stringify(sample) });
        }
        showToast('已为你添加5道示例菜谱，快试试吧！', 'success');
        await loadAppData();
    } catch (e) {}
}

function setupEventListeners() {
    document.getElementById('btnAddRecipe').onclick = openRecipeModal;
    document.getElementById('btnSearchIngredients').onclick = openIngredientSearch;
    document.getElementById('btnShoppingList').onclick = openShoppingList;
    document.getElementById('btnShowFavorites').onclick = () => { state.currentView = 'favorites'; loadFavorites().then(renderRecipesGrid); };
    document.getElementById('btnShowAll').onclick = () => { state.currentView = 'all'; loadRecipes(); };

    document.getElementById('closeRecipeModal').onclick = closeRecipeModal;
    document.getElementById('btnCancelRecipe').onclick = closeRecipeModal;
    document.getElementById('btnAddIngredient').onclick = () => addIngredientRow();
    document.getElementById('btnAddStep').onclick = () => addStepRow();
    document.getElementById('recipeForm').onsubmit = saveRecipe;

    document.getElementById('closeIngredientSearchModal').onclick = closeIngredientSearch;
    document.getElementById('btnAddSearchIngredient').onclick = addSearchIngredient;
    document.getElementById('btnSearchRecipes').onclick = doSearchByIngredients;
    document.getElementById('ingredientSearchInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); addSearchIngredient(); }
    });

    document.getElementById('closeShoppingModal').onclick = closeShoppingList;
    document.getElementById('btnGenerateShoppingList').onclick = generateShoppingList;
    document.getElementById('btnBackToSelect').onclick = backToShoppingSelect;
    document.getElementById('btnCopyList').onclick = copyShoppingList;

    document.getElementById('closeDetailModal').onclick = closeDetailModal;

    document.getElementById('filterDifficulty').onchange = loadRecipes;
    document.getElementById('filterTag').onchange = loadRecipes;
    let searchTimer;
    document.getElementById('searchKeyword').addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadRecipes, 300);
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });

    document.getElementById('loginForm').addEventListener('submit', async e => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!username || !password) {
            showToast('请输入用户名和密码', 'warning');
            return;
        }
        await doLogin(username, password);
    });

    document.getElementById('showRegister').addEventListener('click', async e => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!username || !password) {
            showToast('请输入用户名和密码再注册', 'warning');
            return;
        }
        await doRegister(username, password);
    });

    document.getElementById('btnLogout').addEventListener('click', doLogout);
}

async function init() {
    setupEventListeners();
    const authed = await checkAuth();
    if (authed) {
        await loadAppData();
    }
}

window.addEventListener('DOMContentLoaded', init);
