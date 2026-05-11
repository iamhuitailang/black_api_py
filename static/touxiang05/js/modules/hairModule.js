const HairModule = (function() {
    let skinContainer = null;
    let hairColorContainer = null;
    let hairStyleContainer = null;
    let onSkinChange = null;
    let onHairColorChange = null;
    let onHairStyleChange = null;

    function init(callbacks) {
        skinContainer = document.getElementById('skin-colors');
        hairColorContainer = document.getElementById('hair-colors');
        hairStyleContainer = document.getElementById('hair-options');
        onSkinChange = callbacks.onSkinChange;
        onHairColorChange = callbacks.onHairColorChange;
        onHairStyleChange = callbacks.onHairStyleChange;
        
        renderSkinColors();
        renderHairColors();
        renderHairstyles();
    }

    function renderSkinColors() {
        if (!skinContainer) return;
        skinContainer.innerHTML = '';
        
        PixelData.skinColors.forEach(skinColor => {
            const swatch = UI.createColorSwatch(
                skinColor.color,
                false,
                () => {
                    onSkinChange(skinColor.color);
                    updateActiveSkinColor(skinColor.color);
                }
            );
            swatch.title = skinColor.name;
            skinContainer.appendChild(swatch);
        });
    }

    function renderHairColors() {
        if (!hairColorContainer) return;
        hairColorContainer.innerHTML = '';
        
        PixelData.hairColors.forEach(hairColor => {
            const swatch = UI.createColorSwatch(
                hairColor.color,
                false,
                () => {
                    onHairColorChange(hairColor.color);
                    updateActiveHairColor(hairColor.color);
                }
            );
            swatch.title = hairColor.name;
            hairColorContainer.appendChild(swatch);
        });
    }

    function renderHairstyles() {
        if (!hairStyleContainer) return;
        hairStyleContainer.innerHTML = '';
        
        PixelData.hairstyles.forEach(style => {
            const previewCanvas = createHairPreview(style.id);
            const item = document.createElement('div');
            item.className = 'option-item';
            item.dataset.id = style.id;
            item.title = style.name;
            item.appendChild(previewCanvas);
            item.addEventListener('click', () => {
                onHairStyleChange(style.id);
                updateActiveHairstyle(style.id);
            });
            hairStyleContainer.appendChild(item);
        });
    }

    function createHairPreview(styleId) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(0, 0, 32, 32);
        
        ctx.fillStyle = '#F5D6BA';
        ctx.fillRect(8, 10, 16, 14);
        
        const color = '#4A3728';
        drawPreviewHair(ctx, styleId, color);
        return canvas;
    }

    function drawPreviewHair(ctx, styleId, color) {
        ctx.fillStyle = color;
        
        switch (styleId) {
            case 'short':
                ctx.fillRect(7, 7, 18, 4);
                ctx.fillRect(6, 10, 2, 4);
                ctx.fillRect(24, 10, 2, 4);
                break;
            case 'long':
                ctx.fillRect(7, 7, 18, 4);
                ctx.fillRect(5, 10, 4, 12);
                ctx.fillRect(23, 10, 4, 12);
                break;
            case 'ponytail':
                ctx.fillRect(7, 7, 18, 4);
                ctx.fillRect(13, 6, 6, 16);
                break;
            case 'buzz':
                ctx.fillRect(8, 8, 16, 2);
                break;
            case 'twintail':
                ctx.fillRect(7, 7, 18, 4);
                ctx.fillRect(3, 12, 6, 8);
                ctx.fillRect(23, 12, 6, 8);
                break;
            case 'bald':
                break;
            case 'mohawk':
                ctx.fillRect(14, 4, 4, 8);
                break;
            case 'curly':
                ctx.fillRect(7, 7, 18, 3);
                ctx.fillRect(4, 10, 4, 4);
                ctx.fillRect(24, 10, 4, 4);
                break;
        }
    }

    function updateActiveSkinColor(color) {
        UI.updateActiveColor(skinContainer, color);
    }

    function updateActiveHairColor(color) {
        UI.updateActiveColor(hairColorContainer, color);
    }

    function updateActiveHairstyle(styleId) {
        UI.updateActiveOptions(hairStyleContainer, styleId);
    }

    return {
        init,
        updateActiveSkinColor,
        updateActiveHairColor,
        updateActiveHairstyle
    };
})();