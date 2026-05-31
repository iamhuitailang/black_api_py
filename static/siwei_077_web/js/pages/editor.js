const EditorPage = {
    mapId: null,
    mapData: null,
    nodes: [],
    edges: [],
    selectedNode: null,
    draggingNode: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    canvasOffsetX: 0,
    canvasOffsetY: 0,
    scale: 1,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    themes: [],
    connectingFrom: null,

    async render(args) {
        this.mapId = Router.getParams().mapId || (args && args[0] ? parseInt(args[0]) : null);
        if (!this.mapId) {
            Router.navigate('home');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="editor-page">
                <div class="editor-toolbar">
                    <div class="toolbar-left">
                        <button class="toolbar-btn" id="back-btn" title="返回">←</button>
                        <input type="text" class="map-title-input" id="map-title" value="">
                    </div>
                    <div class="toolbar-center">
                        <button class="toolbar-btn" id="zoom-out-btn" title="缩小">-</button>
                        <span class="zoom-text" id="zoom-text">100%</span>
                        <button class="toolbar-btn" id="zoom-in-btn" title="放大">+</button>
                        <button class="toolbar-btn" id="zoom-reset-btn" title="重置">⊙</button>
                    </div>
                    <div class="toolbar-right">
                        <button class="toolbar-btn" id="theme-btn" title="主题">🎨</button>
                        <button class="toolbar-btn" id="export-btn" title="导出">📤</button>
                        <button class="toolbar-btn" id="collab-btn" title="协作">👥</button>
                    </div>
                </div>
                <div class="editor-canvas-container" id="canvas-container">
                    <svg class="editor-svg" id="editor-svg"></svg>
                    <div class="editor-nodes" id="editor-nodes"></div>
                </div>
                <div class="editor-context-menu hidden" id="context-menu">
                    <div class="context-menu-item" data-action="add-child">添加子节点</div>
                    <div class="context-menu-item" data-action="add-sibling">添加兄弟节点</div>
                    <div class="context-menu-item" data-action="edit">编辑节点</div>
                    <div class="context-menu-item" data-action="connect">连接到...</div>
                    <div class="context-menu-divider"></div>
                    <div class="context-menu-item context-menu-danger" data-action="delete">删除节点</div>
                </div>
                <div class="theme-panel hidden" id="theme-panel">
                    <div class="panel-header"><span>主题选择</span><button class="panel-close" id="theme-close">✕</button></div>
                    <div class="panel-body" id="theme-list"></div>
                </div>
                <div class="export-panel hidden" id="export-panel">
                    <div class="panel-header"><span>导出</span><button class="panel-close" id="export-close">✕</button></div>
                    <div class="panel-body">
                        <button class="btn btn-primary btn-block" id="export-png">导出为 PNG 图片</button>
                        <button class="btn btn-outline btn-block" style="margin-top:8px;" id="export-json">导出为 JSON</button>
                    </div>
                </div>
                <div class="collab-panel hidden" id="collab-panel">
                    <div class="panel-header"><span>协作编辑</span><button class="panel-close" id="collab-close">✕</button></div>
                    <div class="panel-body">
                        <div class="form-group">
                            <div class="form-label">邀请用户</div>
                            <div style="display:flex;gap:8px;">
                                <input type="text" class="form-control" id="collab-username" placeholder="输入用户名" style="flex:1;">
                                <select class="form-control" id="collab-role" style="width:80px;">
                                    <option value="editor">编辑</option>
                                    <option value="viewer">查看</option>
                                </select>
                                <button class="btn btn-primary btn-sm" id="collab-invite-btn">邀请</button>
                            </div>
                        </div>
                        <div id="collab-list"></div>
                    </div>
                </div>
                <div class="node-edit-modal hidden" id="node-edit-modal">
                    <div class="modal-overlay"></div>
                    <div class="modal-content">
                        <div class="modal-header">编辑节点</div>
                        <div class="modal-body">
                            <div class="form-group">
                                <div class="form-label">文本</div>
                                <input type="text" class="form-control" id="node-text-input">
                            </div>
                            <div class="form-group">
                                <div class="form-label">备注</div>
                                <textarea class="form-control" id="node-note-input" rows="3"></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <div class="form-label">背景色</div>
                                    <input type="color" id="node-bg-color" style="width:100%;height:36px;">
                                </div>
                                <div class="form-group">
                                    <div class="form-label">文字色</div>
                                    <input type="color" id="node-text-color" style="width:100%;height:36px;">
                                </div>
                                <div class="form-group">
                                    <div class="form-label">字号</div>
                                    <input type="number" class="form-control" id="node-font-size" min="10" max="72">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" id="node-edit-cancel">取消</button>
                            <button class="btn btn-primary" id="node-edit-save">保存</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        Utils.showLoading();
        try {
            const result = await MindmapService.getMapDetail(this.mapId);
            if (result.code === 0) {
                this.mapData = result.data;
                this.nodes = result.data.nodes || [];
                this.edges = result.data.edges || [];
                document.getElementById('map-title').value = this.mapData.title || '';
                this.renderCanvas();
            } else {
                Utils.showToast(result.msg || '加载失败');
                Router.navigate('home');
            }
        } catch (e) {
            Utils.showToast('加载失败');
            Router.navigate('home');
        } finally {
            Utils.hideLoading();
        }

        try {
            const themeResult = await MindmapService.getThemes();
            if (themeResult.code === 0) {
                this.themes = themeResult.data || [];
                this.renderThemePanel();
            }
        } catch (e) {}

        try {
            const collabResult = await MindmapService.getCollaborators(this.mapId);
            if (collabResult.code === 0) {
                this.renderCollabList(collabResult.data || []);
            }
        } catch (e) {}
    },

    renderCanvas() {
        const svg = document.getElementById('editor-svg');
        const nodesContainer = document.getElementById('editor-nodes');
        if (!svg || !nodesContainer) return;

        svg.innerHTML = '';
        nodesContainer.innerHTML = '';

        this.edges.forEach(edge => {
            const source = this.nodes.find(n => n.id === edge.source_id);
            const target = this.nodes.find(n => n.id === edge.target_id);
            if (source && target) {
                this.drawEdge(svg, source, target, edge);
            }
        });

        this.nodes.forEach(node => {
            this.renderNode(nodesContainer, node);
        });
    },

    drawEdge(svg, source, target, edge) {
        const sx = source.x + (source.width || 120) / 2;
        const sy = source.y + (source.height || 40) / 2;
        const tx = target.x + (target.width || 120) / 2;
        const ty = target.y + (target.height || 40) / 2;

        let pathStr;
        const lineType = edge.line_type || 'curve';
        if (lineType === 'straight') {
            pathStr = `M ${sx} ${sy} L ${tx} ${ty}`;
        } else {
            const cx1 = sx + (tx - sx) * 0.5;
            const cy1 = sy;
            const cx2 = sx + (tx - sx) * 0.5;
            const cy2 = ty;
            pathStr = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathStr);
        path.setAttribute('stroke', edge.line_color || '#909399');
        path.setAttribute('stroke-width', edge.line_width || 2);
        path.setAttribute('fill', 'none');
        path.setAttribute('data-edge-id', edge.id);
        svg.appendChild(path);

        if (edge.label) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', (sx + tx) / 2);
            text.setAttribute('y', (sy + ty) / 2 - 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', '#666');
            text.textContent = edge.label;
            svg.appendChild(text);
        }
    },

    renderNode(container, node) {
        const el = document.createElement('div');
        el.className = 'mind-node' + (this.selectedNode && this.selectedNode.id === node.id ? ' selected' : '');
        el.dataset.nodeId = node.id;
        const safeWidth = Math.max(40, Math.min(600, node.width || 120));
        const safeHeight = Math.max(20, Math.min(300, node.height || 40));
        const safeFontSize = Math.max(10, Math.min(72, node.font_size || 14));
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';
        el.style.width = safeWidth + 'px';
        el.style.minHeight = safeHeight + 'px';
        el.style.backgroundColor = node.bg_color || '#409eff';
        el.style.color = node.text_color || '#ffffff';
        el.style.fontSize = safeFontSize + 'px';
        el.style.borderRadius = node.shape === 'circle' ? '50%' : (node.shape === 'diamond' ? '4px' : '8px');

        if (node.parent_id === 0) {
            el.classList.add('root-node');
        }

        el.innerHTML = `
            <div class="node-text">${node.text || '未命名'}</div>
            ${node.note ? '<div class="node-note-indicator">📝</div>' : ''}
            <div class="node-resize-handle"></div>
        `;

        container.appendChild(el);
    },

    bindEvents() {
        document.getElementById('back-btn').addEventListener('click', () => {
            this.saveTitle();
            Router.navigate('home');
        });

        document.getElementById('map-title').addEventListener('change', () => {
            this.saveTitle();
        });

        document.getElementById('zoom-in-btn').addEventListener('click', () => {
            this.scale = Math.min(2, this.scale + 0.1);
            this.applyTransform();
        });

        document.getElementById('zoom-out-btn').addEventListener('click', () => {
            this.scale = Math.max(0.3, this.scale - 0.1);
            this.applyTransform();
        });

        document.getElementById('zoom-reset-btn').addEventListener('click', () => {
            this.scale = 1;
            this.canvasOffsetX = 0;
            this.canvasOffsetY = 0;
            this.applyTransform();
        });

        const container = document.getElementById('canvas-container');

        container.addEventListener('mousedown', (e) => {
            if (e.target.closest('.mind-node')) {
                const nodeEl = e.target.closest('.mind-node');
                const nodeId = parseInt(nodeEl.dataset.nodeId);
                const node = this.nodes.find(n => n.id === nodeId);
                if (node) {
                    this.selectNode(node);
                    this.draggingNode = node;
                    this.dragOffsetX = e.clientX / this.scale - node.x;
                    this.dragOffsetY = e.clientY / this.scale - node.y;
                }
            } else {
                this.isPanning = true;
                this.panStartX = e.clientX - this.canvasOffsetX;
                this.panStartY = e.clientY - this.canvasOffsetY;
                this.deselectNode();
            }
            this.hideContextMenu();
        });

        container.addEventListener('mousemove', (e) => {
            if (this.draggingNode) {
                const newX = e.clientX / this.scale - this.dragOffsetX;
                const newY = e.clientY / this.scale - this.dragOffsetY;
                this.draggingNode.x = newX;
                this.draggingNode.y = newY;
                this.renderCanvas();
                this.selectNode(this.draggingNode);
            } else if (this.isPanning) {
                this.canvasOffsetX = e.clientX - this.panStartX;
                this.canvasOffsetY = e.clientY - this.panStartY;
                this.applyTransform();
            }
        });

        container.addEventListener('mouseup', async () => {
            if (this.draggingNode) {
                await MindmapService.updateNode(this.mapId, this.draggingNode.id, {
                    x: this.draggingNode.x,
                    y: this.draggingNode.y
                });
                this.draggingNode = null;
            }
            this.isPanning = false;
        });

        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            this.scale = Math.max(0.3, Math.min(2, this.scale + delta));
            this.applyTransform();
        }, { passive: false });

        container.addEventListener('dblclick', (e) => {
            const nodeEl = e.target.closest('.mind-node');
            if (nodeEl) {
                const nodeId = parseInt(nodeEl.dataset.nodeId);
                const node = this.nodes.find(n => n.id === nodeId);
                if (node) {
                    this.openNodeEditor(node);
                }
            }
        });

        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const nodeEl = e.target.closest('.mind-node');
            if (nodeEl) {
                const nodeId = parseInt(nodeEl.dataset.nodeId);
                const node = this.nodes.find(n => n.id === nodeId);
                if (node) {
                    this.selectNode(node);
                    this.showContextMenu(e.clientX, e.clientY);
                }
            }
        });

        document.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleContextAction(action);
                this.hideContextMenu();
            });
        });

        document.getElementById('theme-btn').addEventListener('click', () => {
            document.getElementById('theme-panel').classList.toggle('hidden');
            document.getElementById('export-panel').classList.add('hidden');
            document.getElementById('collab-panel').classList.add('hidden');
        });

        document.getElementById('theme-close').addEventListener('click', () => {
            document.getElementById('theme-panel').classList.add('hidden');
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            document.getElementById('export-panel').classList.toggle('hidden');
            document.getElementById('theme-panel').classList.add('hidden');
            document.getElementById('collab-panel').classList.add('hidden');
        });

        document.getElementById('export-close').addEventListener('click', () => {
            document.getElementById('export-panel').classList.add('hidden');
        });

        document.getElementById('export-png').addEventListener('click', () => this.exportPNG());
        document.getElementById('export-json').addEventListener('click', () => this.exportJSON());

        document.getElementById('collab-btn').addEventListener('click', () => {
            document.getElementById('collab-panel').classList.toggle('hidden');
            document.getElementById('theme-panel').classList.add('hidden');
            document.getElementById('export-panel').classList.add('hidden');
        });

        document.getElementById('collab-close').addEventListener('click', () => {
            document.getElementById('collab-panel').classList.add('hidden');
        });

        document.getElementById('collab-invite-btn').addEventListener('click', async () => {
            const username = document.getElementById('collab-username').value.trim();
            const role = document.getElementById('collab-role').value;
            if (!username) { Utils.showToast('请输入用户名'); return; }
            Utils.showLoading();
            try {
                const result = await MindmapService.addCollaborator(this.mapId, username, role);
                if (result.code === 0) {
                    Utils.showToast('邀请成功');
                    document.getElementById('collab-username').value = '';
                    const collabResult = await MindmapService.getCollaborators(this.mapId);
                    if (collabResult.code === 0) this.renderCollabList(collabResult.data || []);
                } else {
                    Utils.showToast(result.msg || '邀请失败');
                }
            } catch (e) {
                Utils.showToast('邀请失败');
            } finally {
                Utils.hideLoading();
            }
        });

        document.getElementById('node-edit-cancel').addEventListener('click', () => {
            document.getElementById('node-edit-modal').classList.add('hidden');
        });

        document.getElementById('node-edit-save').addEventListener('click', async () => {
            if (!this.selectedNode) return;
            const text = document.getElementById('node-text-input').value.trim();
            const note = document.getElementById('node-note-input').value.trim();
            const bg_color = document.getElementById('node-bg-color').value;
            const text_color = document.getElementById('node-text-color').value;
            let font_size = parseInt(document.getElementById('node-font-size').value) || 14;
            font_size = Math.max(10, Math.min(72, font_size));
            document.getElementById('node-font-size').value = font_size;

            Utils.showLoading();
            try {
                const result = await MindmapService.updateNode(this.mapId, this.selectedNode.id, {
                    text, note, bg_color, text_color, font_size
                });
                if (result.code === 0) {
                    this.selectedNode.text = text;
                    this.selectedNode.note = note;
                    this.selectedNode.bg_color = bg_color;
                    this.selectedNode.text_color = text_color;
                    this.selectedNode.font_size = font_size;
                    this.renderCanvas();
                    this.selectNode(this.selectedNode);
                    Utils.showToast('更新成功');
                } else {
                    Utils.showToast(result.msg || '更新失败');
                }
            } catch (e) {
                Utils.showToast('更新失败');
            } finally {
                Utils.hideLoading();
            }
            document.getElementById('node-edit-modal').classList.add('hidden');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedNode && !e.target.closest('input, textarea')) {
                this.deleteSelectedNode();
            }
            if (e.key === 'Tab' && this.selectedNode && !e.target.closest('input, textarea')) {
                e.preventDefault();
                this.addChildNode();
            }
        });
    },

    applyTransform() {
        const svg = document.getElementById('editor-svg');
        const nodesContainer = document.getElementById('editor-nodes');
        const transform = `translate(${this.canvasOffsetX}px, ${this.canvasOffsetY}px) scale(${this.scale})`;
        svg.style.transform = transform;
        nodesContainer.style.transform = transform;
        document.getElementById('zoom-text').textContent = Math.round(this.scale * 100) + '%';
    },

    selectNode(node) {
        this.selectedNode = node;
        document.querySelectorAll('.mind-node').forEach(el => el.classList.remove('selected'));
        const nodeEl = document.querySelector(`.mind-node[data-node-id="${node.id}"]`);
        if (nodeEl) nodeEl.classList.add('selected');
    },

    deselectNode() {
        this.selectedNode = null;
        document.querySelectorAll('.mind-node').forEach(el => el.classList.remove('selected'));
    },

    showContextMenu(x, y) {
        const menu = document.getElementById('context-menu');
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.remove('hidden');
    },

    hideContextMenu() {
        document.getElementById('context-menu').classList.add('hidden');
    },

    async handleContextAction(action) {
        if (!this.selectedNode) return;

        switch (action) {
            case 'add-child':
                await this.addChildNode();
                break;
            case 'add-sibling':
                await this.addSiblingNode();
                break;
            case 'edit':
                this.openNodeEditor(this.selectedNode);
                break;
            case 'connect':
                this.startConnecting();
                break;
            case 'delete':
                await this.deleteSelectedNode();
                break;
        }
    },

    async addChildNode() {
        if (!this.selectedNode) return;
        Utils.showLoading();
        try {
            const offsetX = 200;
            const offsetY = 60;
            const newNodeData = {
                text: '新节点',
                parent_id: this.selectedNode.id,
                x: this.selectedNode.x + offsetX,
                y: this.selectedNode.y + offsetY,
                bg_color: '#67c23a',
                text_color: '#ffffff',
                font_size: 14
            };
            const result = await MindmapService.createNode(this.mapId, newNodeData);
            if (result.code === 0) {
                this.nodes.push(result.data);
                this.edges.push({
                    id: result.data.id + 10000,
                    source_id: this.selectedNode.id,
                    target_id: result.data.id,
                    line_type: 'curve',
                    line_color: '#909399',
                    line_width: 2
                });
                this.renderCanvas();
                this.selectNode(result.data);
                Utils.showToast('添加成功');
            } else {
                Utils.showToast(result.msg || '添加失败');
            }
        } catch (e) {
            Utils.showToast('添加失败');
        } finally {
            Utils.hideLoading();
        }
    },

    async addSiblingNode() {
        if (!this.selectedNode || this.selectedNode.parent_id === 0) {
            Utils.showToast('根节点无法添加兄弟节点');
            return;
        }
        Utils.showLoading();
        try {
            const parent = this.nodes.find(n => n.id === this.selectedNode.parent_id);
            const siblings = this.nodes.filter(n => n.parent_id === this.selectedNode.parent_id);
            const offsetY = 60;
            const newNodeData = {
                text: '新节点',
                parent_id: this.selectedNode.parent_id,
                x: this.selectedNode.x,
                y: this.selectedNode.y + offsetY * (siblings.length),
                bg_color: '#67c23a',
                text_color: '#ffffff',
                font_size: 14
            };
            const result = await MindmapService.createNode(this.mapId, newNodeData);
            if (result.code === 0) {
                this.nodes.push(result.data);
                this.edges.push({
                    id: result.data.id + 10000,
                    source_id: this.selectedNode.parent_id,
                    target_id: result.data.id,
                    line_type: 'curve',
                    line_color: '#909399',
                    line_width: 2
                });
                this.renderCanvas();
                this.selectNode(result.data);
                Utils.showToast('添加成功');
            }
        } catch (e) {
            Utils.showToast('添加失败');
        } finally {
            Utils.hideLoading();
        }
    },

    async deleteSelectedNode() {
        if (!this.selectedNode) return;
        if (this.selectedNode.parent_id === 0) {
            Utils.showToast('不能删除根节点');
            return;
        }
        if (!confirm('确定要删除此节点及其子节点吗？')) return;
        Utils.showLoading();
        try {
            const result = await MindmapService.deleteNode(this.mapId, this.selectedNode.id);
            if (result.code === 0) {
                this.nodes = this.nodes.filter(n => n.id !== this.selectedNode.id);
                this.edges = this.edges.filter(e => e.source_id !== this.selectedNode.id && e.target_id !== this.selectedNode.id);
                this.selectedNode = null;
                this.renderCanvas();
                Utils.showToast('删除成功');
            } else {
                Utils.showToast(result.msg || '删除失败');
            }
        } catch (e) {
            Utils.showToast('删除失败');
        } finally {
            Utils.hideLoading();
        }
    },

    openNodeEditor(node) {
        document.getElementById('node-text-input').value = node.text || '';
        document.getElementById('node-note-input').value = node.note || '';
        document.getElementById('node-bg-color').value = node.bg_color || '#409eff';
        document.getElementById('node-text-color').value = node.text_color || '#ffffff';
        document.getElementById('node-font-size').value = node.font_size || 14;
        document.getElementById('node-edit-modal').classList.remove('hidden');
    },

    startConnecting() {
        this.connectingFrom = this.selectedNode;
        Utils.showToast('请点击目标节点来建立连线');
        const container = document.getElementById('canvas-container');
        const handler = async (e) => {
            const nodeEl = e.target.closest('.mind-node');
            if (nodeEl) {
                const targetId = parseInt(nodeEl.dataset.nodeId);
                if (targetId !== this.connectingFrom.id) {
                    Utils.showLoading();
                    try {
                        const result = await MindmapService.createEdge(this.mapId, {
                            source_id: this.connectingFrom.id,
                            target_id: targetId
                        });
                        if (result.code === 0) {
                            this.edges.push(result.data);
                            const targetNode = this.nodes.find(n => n.id === targetId);
                            if (targetNode) targetNode.parent_id = this.connectingFrom.id;
                            this.renderCanvas();
                            Utils.showToast('连线成功');
                        } else {
                            Utils.showToast(result.msg || '连线失败');
                        }
                    } catch (e) {
                        Utils.showToast('连线失败');
                    } finally {
                        Utils.hideLoading();
                    }
                }
            }
            this.connectingFrom = null;
            container.removeEventListener('click', handler);
        };
        setTimeout(() => container.addEventListener('click', handler), 100);
    },

    renderThemePanel() {
        const list = document.getElementById('theme-list');
        if (!list) return;
        list.innerHTML = this.themes.map(t => `
            <div class="theme-item ${this.mapData && this.mapData.theme === t.code ? 'active' : ''}" data-code="${t.code}">
                <div class="theme-preview" style="background:${t.bg_color};border:2px solid ${t.node_color};">
                    <div style="background:${t.node_color};color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;">${t.name}</div>
                </div>
                <div class="theme-name">${t.name}</div>
            </div>
        `).join('');

        list.querySelectorAll('.theme-item').forEach(item => {
            item.addEventListener('click', async () => {
                const code = item.dataset.code;
                Utils.showLoading();
                try {
                    const result = await MindmapService.updateMap(this.mapId, { theme: code });
                    if (result.code === 0) {
                        this.mapData.theme = code;
                        const theme = this.themes.find(t => t.code === code);
                        if (theme) {
                            const container = document.getElementById('canvas-container');
                            container.style.backgroundColor = theme.bg_color;
                        }
                        list.querySelectorAll('.theme-item').forEach(i => i.classList.remove('active'));
                        item.classList.add('active');
                        Utils.showToast('主题切换成功');
                    }
                } catch (e) {
                    Utils.showToast('切换失败');
                } finally {
                    Utils.hideLoading();
                }
            });
        });
    },

    renderCollabList(collaborators) {
        const list = document.getElementById('collab-list');
        if (!list) return;
        if (collaborators.length === 0) {
            list.innerHTML = '<div style="color:#999;font-size:13px;padding:8px 0;">暂无协作者</div>';
            return;
        }
        list.innerHTML = collaborators.map(c => `
            <div class="collab-item">
                <span>${c.user ? (c.user.nickname || c.user.username) : '未知'}</span>
                <span class="badge ${c.role === 'editor' ? 'badge-success' : 'badge-info'}">${c.role === 'editor' ? '编辑' : c.role === 'owner' ? '所有者' : '查看'}</span>
                ${c.role !== 'owner' ? `<button class="btn btn-sm btn-outline collab-remove-btn" data-user-id="${c.user_id}">移除</button>` : ''}
            </div>
        `).join('');

        list.querySelectorAll('.collab-remove-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userId = parseInt(btn.dataset.userId);
                if (!confirm('确定移除此协作者？')) return;
                Utils.showLoading();
                try {
                    const result = await MindmapService.removeCollaborator(this.mapId, userId);
                    if (result.code === 0) {
                        Utils.showToast('已移除');
                        const collabResult = await MindmapService.getCollaborators(this.mapId);
                        if (collabResult.code === 0) this.renderCollabList(collabResult.data || []);
                    }
                } catch (e) {
                    Utils.showToast('移除失败');
                } finally {
                    Utils.hideLoading();
                }
            });
        });
    },

    exportPNG() {
        const container = document.getElementById('canvas-container');
        const nodesContainer = document.getElementById('editor-nodes');
        const svgEl = document.getElementById('editor-svg');

        const canvas = document.createElement('canvas');
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        ctx.fillStyle = container.style.backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);

        this.edges.forEach(edge => {
            const source = this.nodes.find(n => n.id === edge.source_id);
            const target = this.nodes.find(n => n.id === edge.target_id);
            if (source && target) {
                ctx.beginPath();
                ctx.strokeStyle = edge.line_color || '#909399';
                ctx.lineWidth = edge.line_width || 2;
                const sx = source.x + (source.width || 120) / 2;
                const sy = source.y + (source.height || 40) / 2;
                const tx = target.x + (target.width || 120) / 2;
                const ty = target.y + (target.height || 40) / 2;
                ctx.moveTo(sx, sy);
                ctx.bezierCurveTo(sx + (tx - sx) * 0.5, sy, sx + (tx - sx) * 0.5, ty, tx, ty);
                ctx.stroke();
            }
        });

        this.nodes.forEach(node => {
            const w = node.width || 120;
            const h = node.height || 40;
            ctx.fillStyle = node.bg_color || '#409eff';
            ctx.beginPath();
            const r = node.shape === 'circle' ? Math.min(w, h) / 2 : 8;
            if (node.shape === 'circle') {
                ctx.arc(node.x + w / 2, node.y + h / 2, r, 0, Math.PI * 2);
            } else {
                ctx.roundRect(node.x, node.y, w, h, r);
            }
            ctx.fill();
            ctx.fillStyle = node.text_color || '#ffffff';
            ctx.font = `${node.font_size || 14}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.text || '未命名', node.x + w / 2, node.y + h / 2);
        });

        const link = document.createElement('a');
        link.download = (this.mapData.title || 'mindmap') + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        Utils.showToast('导出成功');
        document.getElementById('export-panel').classList.add('hidden');
    },

    exportJSON() {
        const data = {
            title: this.mapData.title,
            theme: this.mapData.theme,
            layout: this.mapData.layout,
            nodes: this.nodes,
            edges: this.edges
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = (this.mapData.title || 'mindmap') + '.json';
        link.href = URL.createObjectURL(blob);
        link.click();
        Utils.showToast('导出成功');
        document.getElementById('export-panel').classList.add('hidden');
    },

    async saveTitle() {
        const title = document.getElementById('map-title').value.trim();
        if (title && this.mapData && title !== this.mapData.title) {
            try {
                await MindmapService.updateMap(this.mapId, { title });
                this.mapData.title = title;
            } catch (e) {}
        }
    }
};
