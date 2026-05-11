(function(global) {
    'use strict';
    
    const ExportService = {
        renderer: null,
        decorationsManager: null,
        
        init: function(renderer, decorationsManager) {
            this.renderer = renderer;
            this.decorationsManager = decorationsManager;
        },
        
        exportPNG: function(state, filename) {
            filename = filename || 'mask_' + Date.now() + '.png';
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.renderer.width;
            tempCanvas.height = this.renderer.height;
            
            this.renderer.renderToCanvas(tempCanvas, state);
            this.renderDecorationsToCanvas(tempCanvas, state);
            
            const dataUrl = tempCanvas.toDataURL('image/png');
            
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            link.click();
            
            return true;
        },
        
        exportJSON: function(state, filename) {
            filename = filename || 'mask_config_' + Date.now() + '.json';
            
            const exportData = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                maskShape: state.maskShape,
                primaryColor: state.primaryColor,
                secondaryColor: state.secondaryColor,
                texture: state.texture,
                eyeShape: state.eyeShape,
                lensColor: state.lensColor,
                decorations: state.decorations.map(function(d) {
                    return {
                        itemId: d.itemId,
                        icon: d.icon,
                        name: d.name,
                        x: d.x,
                        y: d.y,
                        size: d.size,
                        rotation: d.rotation,
                        opacity: d.opacity
                    };
                })
            };
            
            Helpers.downloadFile(
                JSON.stringify(exportData, null, 2),
                filename,
                'application/json'
            );
            
            return true;
        },
        
        exportJSONString: function(state) {
            const exportData = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                maskShape: state.maskShape,
                primaryColor: state.primaryColor,
                secondaryColor: state.secondaryColor,
                texture: state.texture,
                eyeShape: state.eyeShape,
                lensColor: state.lensColor,
                decorations: state.decorations.map(function(d) {
                    return {
                        itemId: d.itemId,
                        icon: d.icon,
                        name: d.name,
                        x: d.x,
                        y: d.y,
                        size: d.size,
                        rotation: d.rotation,
                        opacity: d.opacity
                    };
                })
            };
            
            return JSON.stringify(exportData, null, 2);
        },
        
        printTemplate: function(state, printCanvasId) {
            const printCanvas = document.getElementById(printCanvasId);
            if (!printCanvas) return false;
            
            this.renderer.renderToCanvas(printCanvas, state);
            this.renderDecorationsToCanvas(printCanvas, state);
            
            const ctx = printCanvas.getContext('2d');
            ctx.save();
            
            ctx.fillStyle = '#333';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('面具模板', printCanvas.width / 2, 40);
            
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText('沿边缘剪下，在两侧打孔穿绳即可佩戴', printCanvas.width / 2, printCanvas.height - 40);
            
            ctx.restore();
            
            return true;
        },
        
        renderDecorationsToCanvas: function(canvas, state) {
            const ctx = canvas.getContext('2d');
            const scaleX = canvas.width / this.renderer.width;
            const scaleY = canvas.height / this.renderer.height;
            
            ctx.save();
            ctx.scale(scaleX, scaleY);
            
            state.decorations.forEach(function(deco) {
                ctx.save();
                ctx.translate(deco.x, deco.y);
                ctx.rotate(deco.rotation * Math.PI / 180);
                ctx.globalAlpha = deco.opacity;
                
                ctx.font = (deco.size * 0.8) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(deco.icon, 0, 0);
                
                ctx.restore();
            });
            
            ctx.restore();
        },
        
        copyToClipboard: function(text) {
            return new Promise(function(resolve, reject) {
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text)
                        .then(function() { resolve(true); })
                        .catch(function(err) { reject(err); });
                } else {
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    textarea.style.position = 'fixed';
                    textarea.style.left = '-9999px';
                    document.body.appendChild(textarea);
                    textarea.select();
                    
                    try {
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        resolve(true);
                    } catch (e) {
                        document.body.removeChild(textarea);
                        reject(e);
                    }
                }
            });
        }
    };
    
    global.ExportService = ExportService;
})(window);