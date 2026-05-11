const StorageManager = (function() {
    const STATE_KEY = 'circus_poster_state';
    const TEMPLATES_KEY = 'circus_poster_templates';

    function saveState(state) {
        try {
            localStorage.setItem(STATE_KEY, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('保存状态失败:', e);
            return false;
        }
    }

    function loadState() {
        try {
            const data = localStorage.getItem(STATE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('加载状态失败:', e);
        }
        return null;
    }

    function clearState() {
        try {
            localStorage.removeItem(STATE_KEY);
            return true;
        } catch (e) {
            console.error('清除状态失败:', e);
            return false;
        }
    }

    function getSavedTemplates() {
        try {
            const data = localStorage.getItem(TEMPLATES_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('加载模板失败:', e);
        }
        return [];
    }

    function saveTemplate(template) {
        try {
            const templates = getSavedTemplates();
            template.id = 'template_' + Date.now();
            template.createdAt = new Date().toISOString();
            templates.push(template);
            localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
            return template;
        } catch (e) {
            console.error('保存模板失败:', e);
            return null;
        }
    }

    function deleteTemplate(templateId) {
        try {
            let templates = getSavedTemplates();
            templates = templates.filter(t => t.id !== templateId);
            localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
            return true;
        } catch (e) {
            console.error('删除模板失败:', e);
            return false;
        }
    }

    function clearAllTemplates() {
        try {
            localStorage.removeItem(TEMPLATES_KEY);
            return true;
        } catch (e) {
            console.error('清除所有模板失败:', e);
            return false;
        }
    }

    return {
        saveState,
        loadState,
        clearState,
        getSavedTemplates,
        saveTemplate,
        deleteTemplate,
        clearAllTemplates
    };
})();
