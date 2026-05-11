(function(global) {
    'use strict';
    
    const DecorationsManager = {
        layer: null,
        app: null,
        dragging: null,
        resizing: null,
        rotating: null,
        dragOffset: { x: 0, y: 0 },
        startAngle: 0,
        
        init: function(layerId, appInstance) {
            this.layer = document.getElementById(layerId);
            this.app = appInstance;
            this.bindEvents();
        },
        
        bindEvents: function() {
            const self = this;
            
            document.addEventListener('mousemove', function(e) {
                self.handleMouseMove(e);
            });
            
            document.addEventListener('mouseup', function(e) {
                self.handleMouseUp(e);
            });
            
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (self.app && self.app.state.selectedDecorationId) {
                        self.app.removeDecoration(self.app.state.selectedDecorationId);
                    }
                }
            });
        },
        
        addDecoration: function(decorationItem) {
            const deco = {
                id: Helpers.generateId(),
                itemId: decorationItem.id,
                icon: decorationItem.icon,
                name: decorationItem.name,
                x: 250,
                y: 200,
                size: 60,
                rotation: 0,
                opacity: 1
            };
            
            this.app.state.decorations.push(deco);
            this.app.state.selectedDecorationId = deco.id;
            this.render();
            this.app.saveToHistory();
            this.app.updateDecorationControls();
            return deco;
        },
        
        removeDecoration: function(id) {
            const index = this.app.state.decorations.findIndex(function(d) { return d.id === id; });
            if (index !== -1) {
                this.app.state.decorations.splice(index, 1);
                if (this.app.state.selectedDecorationId === id) {
                    this.app.state.selectedDecorationId = null;
                }
                this.render();
                this.app.saveToHistory();
                this.app.updateDecorationControls();
            }
        },
        
        clearAll: function() {
            this.app.state.decorations = [];
            this.app.state.selectedDecorationId = null;
            this.render();
            this.app.saveToHistory();
            this.app.updateDecorationControls();
        },
        
        getDecoration: function(id) {
            return this.app.state.decorations.find(function(d) { return d.id === id; });
        },
        
        updateDecoration: function(id, updates) {
            const deco = this.getDecoration(id);
            if (deco) {
                Object.assign(deco, updates);
                this.render();
            }
        },
        
        selectDecoration: function(id) {
            this.app.state.selectedDecorationId = id;
            this.render();
            this.app.updateDecorationControls();
        },
        
        deselectAll: function() {
            this.app.state.selectedDecorationId = null;
            this.render();
            this.app.updateDecorationControls();
        },
        
        render: function() {
            const self = this;
            this.layer.innerHTML = '';
            
            this.app.state.decorations.forEach(function(deco) {
                const el = self.createDecorationElement(deco);
                self.layer.appendChild(el);
            });
        },
        
        createDecorationElement: function(deco) {
            const self = this;
            const el = document.createElement('div');
            el.className = 'decoration-item';
            if (this.app.state.selectedDecorationId === deco.id) {
                el.classList.add('selected');
            }
            
            el.dataset.id = deco.id;
            el.style.left = (deco.x - deco.size / 2) + 'px';
            el.style.top = (deco.y - deco.size / 2) + 'px';
            el.style.width = deco.size + 'px';
            el.style.height = deco.size + 'px';
            el.style.transform = 'rotate(' + deco.rotation + 'deg)';
            el.style.opacity = deco.opacity;
            el.style.fontSize = (deco.size * 0.8) + 'px';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.userSelect = 'none';
            el.textContent = deco.icon;
            
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            
            const rotateHandle = document.createElement('div');
            rotateHandle.className = 'rotate-handle';
            
            el.appendChild(resizeHandle);
            el.appendChild(rotateHandle);
            
            el.addEventListener('mousedown', function(e) {
                if (e.target === resizeHandle) {
                    self.startResize(e, deco);
                } else if (e.target === rotateHandle) {
                    self.startRotate(e, deco);
                } else {
                    self.startDrag(e, deco);
                }
            });
            
            return el;
        },
        
        startDrag: function(e, deco) {
            e.preventDefault();
            e.stopPropagation();
            this.selectDecoration(deco.id);
            this.dragging = deco;
            
            const rect = this.layer.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left - (deco.x - deco.size / 2);
            this.dragOffset.y = e.clientY - rect.top - (deco.y - deco.size / 2);
        },
        
        startResize: function(e, deco) {
            e.preventDefault();
            e.stopPropagation();
            this.resizing = deco;
            this.resizeStartSize = deco.size;
            this.resizeStartX = e.clientX;
            this.resizeStartY = e.clientY;
        },
        
        startRotate: function(e, deco) {
            e.preventDefault();
            e.stopPropagation();
            this.rotating = deco;
            
            const rect = this.layer.getBoundingClientRect();
            const centerX = deco.x;
            const centerY = deco.y;
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            this.startAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * 180 / Math.PI;
            this.rotationStart = deco.rotation;
        },
        
        handleMouseMove: function(e) {
            if (this.dragging) {
                const rect = this.layer.getBoundingClientRect();
                const x = e.clientX - rect.left - this.dragOffset.x + this.dragging.size / 2;
                const y = e.clientY - rect.top - this.dragOffset.y + this.dragging.size / 2;
                
                this.updateDecoration(this.dragging.id, { x: x, y: y });
                this.app.updateDecorationControls();
            }
            
            if (this.resizing) {
                const dx = e.clientX - this.resizeStartX;
                const dy = e.clientY - this.resizeStartY;
                const delta = Math.max(dx, dy);
                const newSize = Math.max(20, Math.min(300, this.resizeStartSize + delta));
                
                this.updateDecoration(this.resizing.id, { size: newSize });
                this.app.updateDecorationControls();
            }
            
            if (this.rotating) {
                const rect = this.layer.getBoundingClientRect();
                const centerX = this.rotating.x;
                const centerY = this.rotating.y;
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * 180 / Math.PI;
                const deltaAngle = currentAngle - this.startAngle;
                const newRotation = (this.rotationStart + deltaAngle) % 360;
                
                this.updateDecoration(this.rotating.id, { rotation: newRotation });
                this.app.updateDecorationControls();
            }
        },
        
        handleMouseUp: function(e) {
            if (this.dragging || this.resizing || this.rotating) {
                this.app.saveToHistory();
            }
            
            this.dragging = null;
            this.resizing = null;
            this.rotating = null;
        }
    };
    
    global.DecorationsManager = DecorationsManager;
})(window);