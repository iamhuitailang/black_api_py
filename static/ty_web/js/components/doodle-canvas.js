const DoodleCanvas = {
    name: 'DoodleCanvas',
    props: {
        width: { type: Number, default: 600 },
        height: { type: Number, default: 400 },
        disabled: { type: Boolean, default: false }
    },
    emits: ['drawing-complete'],
    template: `
        <div class="doodle-canvas-container">
            <div class="canvas-toolbar">
                <button 
                    v-for="tool in tools" 
                    :key="tool.id"
                    class="tool-btn"
                    :class="{ active: currentTool === tool.id }"
                    @click="setTool(tool.id)"
                    :title="tool.name"
                >
                    {{ tool.icon }}
                </button>
                <div class="brush-size">
                    <span>🖌️</span>
                    <input 
                        type="range" 
                        v-model="brushSize" 
                        min="1" 
                        max="50" 
                        @input="updateBrushSize"
                    />
                    <span>{{ brushSize }}</span>
                </div>
                <input 
                    type="color" 
                    v-model="currentColor" 
                    class="color-picker"
                    @input="updateColor"
                />
                <button class="tool-btn" @click="undo" title="撤销">↶</button>
                <button class="tool-btn" @click="clearCanvas" title="清空">🗑️</button>
            </div>
            <canvas 
                ref="canvas"
                :width="width" 
                :height="height"
                class="doodle-canvas"
                @mousedown="startDrawing"
                @mousemove="draw"
                @mouseup="stopDrawing"
                @mouseleave="stopDrawing"
                @touchstart="handleTouchStart"
                @touchmove="handleTouchMove"
                @touchend="stopDrawing"
            ></canvas>
        </div>
    `,
    data() {
        return {
            currentTool: 'brush',
            currentColor: '#000000',
            brushSize: 5,
            isDrawing: false,
            lastX: 0,
            lastY: 0,
            history: [],
            historyIndex: -1,
            tools: [
                { id: 'brush', name: '画笔', icon: '✏️' },
                { id: 'eraser', name: '橡皮擦', icon: '🧹' },
                { id: 'fill', name: '填充', icon: '🪣' },
                { id: 'line', name: '直线', icon: '📏' },
                { id: 'circle', name: '圆形', icon: '⭕' },
                { id: 'rect', name: '矩形', icon: '⬜' }
            ]
        };
    },
    mounted() {
        this.initCanvas();
    },
    methods: {
        initCanvas() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            this.saveState();
        },

        setTool(tool) {
            this.currentTool = tool;
        },

        updateBrushSize() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = this.brushSize;
        },

        updateColor() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = this.currentColor;
            ctx.fillStyle = this.currentColor;
        },

        getMousePos(e) {
            const canvas = this.$refs.canvas;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        },

        getTouchPos(e) {
            const canvas = this.$refs.canvas;
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY
            };
        },

        startDrawing(e) {
            if (this.disabled) return;
            this.isDrawing = true;
            const pos = this.getMousePos(e);
            this.lastX = pos.x;
            this.lastY = pos.y;

            if (this.currentTool === 'fill') {
                this.floodFill(Math.floor(pos.x), Math.floor(pos.y), this.currentColor);
                return;
            }

            if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
                this.beginPath();
            }
        },

        handleTouchStart(e) {
            e.preventDefault();
            if (this.disabled) return;
            this.isDrawing = true;
            const pos = this.getTouchPos(e);
            this.lastX = pos.x;
            this.lastY = pos.y;

            if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
                this.beginPath();
            }
        },

        beginPath() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            ctx.beginPath();
            ctx.moveTo(this.lastX, this.lastY);
        },

        draw(e) {
            if (!this.isDrawing || this.disabled) return;
            e.preventDefault();

            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            const pos = this.getMousePos(e);

            if (this.currentTool === 'brush') {
                ctx.strokeStyle = this.currentColor;
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            } else if (this.currentTool === 'eraser') {
                ctx.strokeStyle = '#ffffff';
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }

            this.lastX = pos.x;
            this.lastY = pos.y;
        },

        handleTouchMove(e) {
            if (!this.isDrawing || this.disabled) return;
            e.preventDefault();

            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            const pos = this.getTouchPos(e);

            if (this.currentTool === 'brush') {
                ctx.strokeStyle = this.currentColor;
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            } else if (this.currentTool === 'eraser') {
                ctx.strokeStyle = '#ffffff';
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }

            this.lastX = pos.x;
            this.lastY = pos.y;
        },

        stopDrawing() {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            this.saveState();
            this.$emit('drawing-complete', this.getImageData());
        },

        saveState() {
            const canvas = this.$refs.canvas;
            if (this.history.length > 50) {
                this.history.shift();
            }
            this.history.push(canvas.toDataURL());
            this.historyIndex = this.history.length - 1;
        },

        undo() {
            if (this.historyIndex <= 0) return;
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
        },

        restoreState(dataUrl) {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = dataUrl;
        },

        floodFill(startX, startY, fillColor) {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            const startPos = (startY * canvas.width + startX) * 4;
            const startR = data[startPos];
            const startG = data[startPos + 1];
            const startB = data[startPos + 2];
            
            const fillR = parseInt(fillColor.slice(1, 3), 16);
            const fillG = parseInt(fillColor.slice(3, 5), 16);
            const fillB = parseInt(fillColor.slice(5, 7), 16);
            
            if (startR === fillR && startG === fillG && startB === fillB) return;
            
            const stack = [[startX, startY]];
            const visited = new Set();
            
            while (stack.length > 0) {
                const [x, y] = stack.pop();
                const key = `${x},${y}`;
                
                if (visited.has(key)) continue;
                if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
                
                const pos = (y * canvas.width + x) * 4;
                if (Math.abs(data[pos] - startR) > 10 || 
                    Math.abs(data[pos + 1] - startG) > 10 || 
                    Math.abs(data[pos + 2] - startB) > 10) continue;
                
                visited.add(key);
                data[pos] = fillR;
                data[pos + 1] = fillG;
                data[pos + 2] = fillB;
                data[pos + 3] = 255;
                
                stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
            
            ctx.putImageData(imageData, 0, 0);
            this.saveState();
        },

        clearCanvas() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            this.saveState();
        },

        getImageData() {
            const canvas = this.$refs.canvas;
            return canvas.toDataURL('image/png');
        },

        setImageData(dataUrl) {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                this.saveState();
            };
            img.src = dataUrl;
        },

        isEmpty() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
                    return false;
                }
            }
            return true;
        },

        analyzeDrawing() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            let coloredPixels = 0;
            let totalPixels = data.length / 4;
            let colorCounts = {};
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                
                if (a > 128 && (r < 250 || g < 250 || b < 250)) {
                    coloredPixels++;
                    const colorKey = `${Math.round(r/30)},${Math.round(g/30)},${Math.round(b/30)}`;
                    colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
                }
            }
            
            const coverage = coloredPixels / totalPixels;
            const colorCount = Object.keys(colorCounts).length;
            const complexity = Math.min(10, Math.floor(coverage * 100) + colorCount);
            
            const dominantStyle = this.analyzeStyle(colorCounts);
            
            return {
                coverage: coverage,
                colorCount: colorCount,
                complexity: complexity,
                dominantStyle: dominantStyle,
                coloredPixels: coloredPixels
            };
        },

        analyzeStyle(colorCounts) {
            const styles = {
                fire: { colors: ['5,0,0', '8,2,0', '8,4,0'], count: 0 },
                ice: { colors: ['0,2,5', '0,4,8', '2,6,8'], count: 0 },
                lightning: { colors: ['8,8,0', '8,6,0', '8,4,0'], count: 0 },
                poison: { colors: ['2,5,0', '4,8,0', '0,8,4'], count: 0 },
                holy: { colors: ['8,8,6', '8,8,4', '6,6,2'], count: 0 },
                shadow: { colors: ['2,0,4', '3,1,5', '1,0,3'], count: 0 }
            };
            
            for (const colorKey in colorCounts) {
                for (const styleName in styles) {
                    if (styles[styleName].colors.includes(colorKey)) {
                        styles[styleName].count += colorCounts[colorKey];
                    }
                }
            }
            
            let maxStyle = 'normal';
            let maxCount = 0;
            for (const styleName in styles) {
                if (styles[styleName].count > maxCount) {
                    maxCount = styles[styleName].count;
                    maxStyle = styleName;
                }
            }
            
            return maxCount > 100 ? maxStyle : 'normal';
        }
    }
};
