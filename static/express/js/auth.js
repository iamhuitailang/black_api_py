const TOKEN_KEY = 'express_token';
const USER_KEY = 'express_user';
const PROFILE_KEY = 'express_profile';
const ORDER_DRAFT_KEY = 'express_order_draft';

function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function getCachedUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

function setCachedUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function removeCachedUser() {
    localStorage.removeItem(USER_KEY);
}

function getCachedProfile() {
    const profileStr = localStorage.getItem(PROFILE_KEY);
    return profileStr ? JSON.parse(profileStr) : null;
}

function setCachedProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function removeCachedProfile() {
    localStorage.removeItem(PROFILE_KEY);
}

function isLoggedIn() {
    return !!getToken();
}

function getOrderDraft() {
    const draftStr = localStorage.getItem(ORDER_DRAFT_KEY);
    return draftStr ? JSON.parse(draftStr) : null;
}

function setOrderDraft(draft) {
    if (draft) {
        localStorage.setItem(ORDER_DRAFT_KEY, JSON.stringify(draft));
    } else {
        localStorage.removeItem(ORDER_DRAFT_KEY);
    }
}

function removeOrderDraft() {
    localStorage.removeItem(ORDER_DRAFT_KEY);
}

async function login(username, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (data.code === 0 && data.data) {
            setToken(data.data.token);
            setCachedUser(data.data.user);
            return data;
        }
        return data;
    } catch (error) {
        console.error('登录错误:', error);
        return {
            code: -1,
            message: '网络请求失败',
            data: null
        };
    }
}

async function register(username, password) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('注册错误:', error);
        return {
            code: -1,
            message: '网络请求失败',
            data: null
        };
    }
}

function logout() {
    removeToken();
    removeCachedUser();
    removeCachedProfile();
}

async function getCurrentUser() {
    const token = getToken();
    if (!token) {
        return null;
    }
    
    try {
        const response = await fetch('/api/auth/current/user/get', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (data.code === 0 && data.data) {
            setCachedUser(data.data);
            return data.data;
        }
        return null;
    } catch (error) {
        console.error('获取当前用户错误:', error);
        return null;
    }
}

async function loadUserProfile() {
    if (!isLoggedIn()) {
        return null;
    }
    
    try {
        const result = await getProfile();
        if (result.code === 0 && result.data) {
            setCachedProfile(result.data);
            return result.data;
        }
        return null;
    } catch (error) {
        console.error('加载用户资料错误:', error);
        return null;
    }
}
