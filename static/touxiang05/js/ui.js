const UI = (function() {
    let onTabChangeCallback = null;

    function initTabs(onTabChange) {
        onTabChangeCallback = onTabChange;
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                switchToTab(tabId);
            });
        });
    }

    function switchToTab(tabId) {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const targetContent = document.getElementById(`tab-${tabId}`);
        
        if (targetBtn) targetBtn.classList.add('active');
        if (targetContent) targetContent.classList.add('active');
        
        if (onTabChangeCallback) {
            onTabChangeCallback(tabId);
        }
    }

    function createColorSwatch(color, isActive, onClick) {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch' + (isActive ? ' active' : '');
        swatch.style.backgroundColor = color;
        swatch.addEventListener('click', onClick);
        return swatch;
    }

    function createOptionItem(name, isActive, onClick, previewCanvas = null) {
        const item = document.createElement('div');
        item.className = 'option-item' + (isActive ? ' active' : '');
        item.title = name;
        item.addEventListener('click', onClick);
        
        if (previewCanvas) {
            item.appendChild(previewCanvas);
        }
        
        return item;
    }

    function createPreviewCanvas(renderFn, width = 32, height = 32) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        renderFn(ctx);
        return canvas;
    }

    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    function initModals() {
        const closeButtons = document.querySelectorAll('.modal-close');
        const modals = document.querySelectorAll('.modal');
        
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });
        
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    function updateActiveOptions(container, activeId) {
        const options = container.querySelectorAll('.option-item');
        options.forEach((opt, index) => {
            if (opt.dataset.id === activeId || index === 0 && !activeId) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    }

    function updateActiveColor(container, activeColor) {
        const swatches = container.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            if (swatch.style.backgroundColor === activeColor || 
                rgbToHex(swatch.style.backgroundColor) === activeColor) {
                swatch.classList.add('active');
            } else {
                swatch.classList.remove('active');
            }
        });
    }

    function rgbToHex(rgb) {
        if (!rgb || !rgb.startsWith('rgb')) return rgb;
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return rgb;
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`.toUpperCase();
    }

    function copyToClipboard(text) {
        return navigator.clipboard.writeText(text);
    }

    function downloadFile(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return {
        initTabs,
        switchToTab,
        createColorSwatch,
        createOptionItem,
        createPreviewCanvas,
        showModal,
        hideModal,
        initModals,
        updateActiveOptions,
        updateActiveColor,
        copyToClipboard,
        downloadFile
    };
})();