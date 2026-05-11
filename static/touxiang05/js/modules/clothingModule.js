const ClothingModule = (function() {
    let shirtContainer = null;
    let headwearContainer = null;
    let faceAccessoryContainer = null;
    let backgroundContainer = null;
    
    let onShirtChange = null;
    let onHeadwearChange = null;
    let onFaceAccessoryChange = null;
    let onBackgroundChange = null;

    function init(callbacks) {
        shirtContainer = document.getElementById('shirt-options');
        headwearContainer = document.getElementById('headwear-options');
        faceAccessoryContainer = document.getElementById('face-accessory-options');
        backgroundContainer = document.getElementById('background-options');
        
        onShirtChange = callbacks.onShirtChange;
        onHeadwearChange = callbacks.onHeadwearChange;
        onFaceAccessoryChange = callbacks.onFaceAccessoryChange;
        onBackgroundChange = callbacks.onBackgroundChange;
        
        renderShirts();
        renderHeadwears();
        renderFaceAccessories();
        renderBackgrounds();
    }

    function renderShirts() {
        if (!shirtContainer) return;
        shirtContainer.innerHTML = '';
        
        PixelData.shirts.forEach(shirt => {
            const previewCanvas = createClothingPreview('shirt', shirt.id);
            const item = document.createElement('div');
            item.className = 'option-item';
            item.dataset.id = shirt.id;
            item.title = shirt.name;
            item.appendChild(previewCanvas);
            item.addEventListener('click', () => {
                onShirtChange(shirt.id);
                updateActive('shirt', shirt.id);
            });
            shirtContainer.appendChild(item);
        });
    }

    function renderHeadwears() {
        if (!headwearContainer) return;
        headwearContainer.innerHTML = '';
        
        PixelData.headwears.forEach(headwear => {
            const previewCanvas = createClothingPreview('headwear', headwear.id);
            const item = document.createElement('div');
            item.className = 'option-item';
            item.dataset.id = headwear.id;
            item.title = headwear.name;
            item.appendChild(previewCanvas);
            item.addEventListener('click', () => {
                onHeadwearChange(headwear.id);
                updateActive('headwear', headwear.id);
            });
            headwearContainer.appendChild(item);
        });
    }

    function renderFaceAccessories() {
        if (!faceAccessoryContainer) return;
        faceAccessoryContainer.innerHTML = '';
        
        PixelData.faceAccessories.forEach(accessory => {
            const previewCanvas = createClothingPreview('faceAccessory', accessory.id);
            const item = document.createElement('div');
            item.className = 'option-item';
            item.dataset.id = accessory.id;
            item.title = accessory.name;
            item.appendChild(previewCanvas);
            item.addEventListener('click', () => {
                onFaceAccessoryChange(accessory.id);
                updateActive('faceAccessory', accessory.id);
            });
            faceAccessoryContainer.appendChild(item);
        });
    }

    function renderBackgrounds() {
        if (!backgroundContainer) return;
        backgroundContainer.innerHTML = '';
        
        PixelData.backgrounds.forEach(bg => {
            const previewCanvas = createClothingPreview('background', bg.id);
            const item = document.createElement('div');
            item.className = 'option-item';
            item.dataset.id = bg.id;
            item.title = bg.name;
            item.appendChild(previewCanvas);
            item.addEventListener('click', () => {
                onBackgroundChange(bg.id);
                updateActive('background', bg.id);
            });
            backgroundContainer.appendChild(item);
        });
    }

    function createClothingPreview(type, id) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        drawPreviewBackground(ctx, type, id);
        drawPreviewBase(ctx, type, id);
        drawPreviewItem(ctx, type, id);
        return canvas;
    }

    function drawPreviewBackground(ctx, type, id) {
        if (type === 'background') {
            switch (id) {
                case 'transparent':
                    ctx.fillStyle = '#1A1A2E';
                    ctx.fillRect(0, 0, 32, 32);
                    ctx.fillStyle = '#2A2A4E';
                    for (let i = 0; i < 32; i += 4) {
                        for (let j = 0; j < 32; j += 4) {
                            if ((i + j) % 8 === 0) {
                                ctx.fillRect(i, j, 4, 4);
                            }
                        }
                    }
                    break;
                case 'solid':
                    ctx.fillStyle = '#2A2A4E';
                    ctx.fillRect(0, 0, 32, 32);
                    break;
                case 'clouds':
                    ctx.fillStyle = '#87CEEB';
                    ctx.fillRect(0, 0, 32, 32);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(4, 8, 8, 2);
                    ctx.fillRect(5, 7, 6, 1);
                    break;
                case 'stars':
                    ctx.fillStyle = '#1A1A2E';
                    ctx.fillRect(0, 0, 32, 32);
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(8, 8, 1, 1);
                    ctx.fillRect(7, 9, 3, 1);
                    ctx.fillRect(8, 10, 1, 1);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(24, 12, 1, 1);
                    ctx.fillRect(23, 13, 3, 1);
                    ctx.fillRect(24, 14, 1, 1);
                    break;
                case 'grid':
                    ctx.fillStyle = '#16213E';
                    ctx.fillRect(0, 0, 32, 32);
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    for (let i = 0; i < 32; i += 4) {
                        for (let j = 0; j < 32; j += 4) {
                            if ((i + j) % 8 === 0) {
                                ctx.fillRect(i, j, 4, 4);
                            }
                        }
                    }
                    break;
            }
        } else {
            ctx.fillStyle = '#1A1A2E';
            ctx.fillRect(0, 0, 32, 32);
        }
    }

    function drawPreviewBase(ctx, type, id) {
        if (type === 'background') return;
        
        if (type === 'headwear' || type === 'faceAccessory') {
            ctx.fillStyle = '#F5D6BA';
            ctx.fillRect(8, 10, 16, 14);
            ctx.fillStyle = '#2C2C2C';
            ctx.fillRect(11, 14, 2, 2);
            ctx.fillRect(19, 14, 2, 2);
            ctx.fillRect(13, 19, 6, 1);
        }
    }

    function drawPreviewItem(ctx, type, id) {
        switch (type) {
            case 'shirt':
                drawShirtPreview(ctx, id);
                break;
            case 'headwear':
                drawHeadwearPreview(ctx, id);
                break;
            case 'faceAccessory':
                drawFaceAccessoryPreview(ctx, id);
                break;
            case 'background':
                break;
        }
    }

    function drawShirtPreview(ctx, id) {
        const color = '#E94560';
        
        switch (id) {
            case 'none':
                break;
            case 'tshirt':
                ctx.fillStyle = '#F5D6BA';
                ctx.fillRect(8, 20, 16, 6);
                ctx.fillStyle = color;
                ctx.fillRect(4, 26, 24, 6);
                ctx.fillRect(2, 26, 3, 3);
                ctx.fillRect(27, 26, 3, 3);
                break;
            case 'armor':
                ctx.fillStyle = '#F5D6BA';
                ctx.fillRect(8, 20, 16, 6);
                ctx.fillStyle = '#9E9E9E';
                ctx.fillRect(4, 26, 24, 6);
                ctx.fillStyle = '#BDBDBD';
                ctx.fillRect(12, 26, 8, 6);
                ctx.fillStyle = '#757575';
                ctx.fillRect(14, 27, 4, 4);
                break;
            case 'robe':
                ctx.fillStyle = '#F5D6BA';
                ctx.fillRect(8, 20, 16, 6);
                ctx.fillStyle = color;
                ctx.fillRect(6, 26, 20, 6);
                ctx.fillRect(4, 27, 24, 5);
                break;
            case 'vest':
                ctx.fillStyle = '#F5D6BA';
                ctx.fillRect(8, 20, 16, 6);
                ctx.fillStyle = color;
                ctx.fillRect(6, 26, 20, 6);
                ctx.fillStyle = '#1A1A2E';
                ctx.fillRect(14, 26, 4, 6);
                break;
            case 'hoodie':
                ctx.fillStyle = '#F5D6BA';
                ctx.fillRect(10, 20, 12, 6);
                ctx.fillStyle = color;
                ctx.fillRect(4, 24, 24, 8);
                ctx.fillRect(2, 26, 3, 4);
                ctx.fillRect(27, 26, 3, 4);
                break;
        }
    }

    function drawHeadwearPreview(ctx, id) {
        switch (id) {
            case 'none':
                break;
            case 'cap':
                ctx.fillStyle = '#E94560';
                ctx.fillRect(6, 7, 20, 3);
                ctx.fillRect(4, 9, 3, 2);
                break;
            case 'wizard':
                ctx.fillStyle = '#2C3E50';
                ctx.fillRect(12, 4, 8, 4);
                ctx.fillRect(14, 2, 4, 2);
                ctx.fillStyle = '#F1C40F';
                ctx.fillRect(11, 7, 10, 2);
                break;
            case 'crown':
                ctx.fillStyle = '#F1C40F';
                ctx.fillRect(6, 5, 20, 3);
                ctx.fillRect(7, 3, 2, 2);
                ctx.fillRect(12, 2, 2, 3);
                ctx.fillRect(18, 3, 2, 2);
                ctx.fillRect(23, 3, 2, 2);
                break;
            case 'helmet':
                ctx.fillStyle = '#9E9E9E';
                ctx.fillRect(6, 6, 20, 6);
                ctx.fillRect(8, 5, 16, 1);
                ctx.fillStyle = '#2196F3';
                ctx.fillRect(12, 8, 2, 2);
                ctx.fillRect(18, 8, 2, 2);
                break;
            case 'bow':
                ctx.fillStyle = '#E94560';
                ctx.fillRect(12, 7, 8, 2);
                ctx.fillRect(10, 6, 3, 4);
                ctx.fillRect(19, 6, 3, 4);
                break;
            case 'headband':
                ctx.fillStyle = '#E94560';
                ctx.fillRect(5, 11, 22, 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(14, 10, 4, 3);
                break;
            case 'headphone':
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(5, 8, 22, 2);
                ctx.fillRect(3, 10, 4, 6);
                ctx.fillRect(25, 10, 4, 6);
                break;
        }
    }

    function drawFaceAccessoryPreview(ctx, id) {
        switch (id) {
            case 'none':
                break;
            case 'round_glasses':
                ctx.strokeStyle = '#2C2C2C';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(11.5, 15, 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(20.5, 15, 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(13, 15, 6, 1);
                break;
            case 'square_glasses':
                ctx.strokeStyle = '#2C2C2C';
                ctx.lineWidth = 1;
                ctx.strokeRect(8, 12, 6, 6);
                ctx.strokeRect(18, 12, 6, 6);
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(14, 14, 4, 1);
                break;
            case 'sunglasses':
                ctx.fillStyle = '#1A1A1A';
                ctx.fillRect(8, 12, 6, 5);
                ctx.fillRect(18, 12, 6, 5);
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(14, 14, 4, 1);
                break;
            case 'mask':
                ctx.fillStyle = '#2C3E50';
                ctx.fillRect(10, 16, 12, 4);
                ctx.fillStyle = '#BDC3C7';
                ctx.fillRect(11, 17, 10, 2);
                break;
            case 'scar':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(9, 12, 6, 1);
                ctx.fillRect(12, 13, 2, 3);
                break;
            case 'beard':
                ctx.fillStyle = '#4A3728';
                ctx.fillRect(10, 18, 12, 4);
                ctx.fillRect(12, 16, 8, 2);
                break;
            case 'bandaid':
                ctx.fillStyle = '#F5DEB3';
                ctx.fillRect(9, 13, 6, 3);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(11, 14, 2, 1);
                break;
        }
    }

    function updateActive(type, id) {
        let container = null;
        switch (type) {
            case 'shirt':
                container = shirtContainer;
                break;
            case 'headwear':
                container = headwearContainer;
                break;
            case 'faceAccessory':
                container = faceAccessoryContainer;
                break;
            case 'background':
                container = backgroundContainer;
                break;
        }
        if (container) {
            UI.updateActiveOptions(container, id);
        }
    }

    return {
        init,
        updateActive
    };
})();