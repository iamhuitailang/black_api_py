const TOKEN_KEY = 'express_token';
const USER_KEY = 'express_user';
const PROFILE_KEY = 'express_profile';

function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function removeUser() {
    localStorage.removeItem(USER_KEY);
}

function getProfile() {
    const profileStr = localStorage.getItem(PROFILE_KEY);
    return profileStr ? JSON.parse(profileStr) : null;
}

function setProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function removeProfile() {
    localStorage.removeItem(PROFILE_KEY);
}

function isLoggedIn() {
    return !!getToken();
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
            setUser(data.data.user);
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
    removeUser();
    removeProfile();
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
            setUser(data.data);
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
    
    const result = await getProfile();
    if (result.code === 0 && result.data) {
        setProfile(result.data);
        return result.data;
    }
    return null;
}
