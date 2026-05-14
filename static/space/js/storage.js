const Storage = (function() {
    const STORAGE_KEY = 'space_earth_state';
    
    const defaultState = {
        rotationSpeed: 0.5,
        zoomLevel: 1.0,
        starDensity: 1000,
        cloudDensity: 50,
        autoRotate: true,
        showAtmosphere: true,
        showStars: true,
        showClouds: true,
        lensFlare: true,
        cameraAngleX: 0.3,
        cameraAngleY: 0,
        cameraDistance: 300,
        earthRotation: 0,
        timestamp: Date.now()
    };

    function save(state) {
        try {
            const dataToSave = {
                ...state,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
            return true;
        } catch (e) {
            console.error('保存状态失败:', e);
            return false;
        }
    }

    function load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    ...defaultState,
                    ...parsed
                };
            }
        } catch (e) {
            console.error('加载状态失败:', e);
        }
        return { ...defaultState };
    }

    function clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除状态失败:', e);
            return false;
        }
    }

    function getDefault() {
        return { ...defaultState };
    }

    return {
        save,
        load,
        clear,
        getDefault
    };
})();
