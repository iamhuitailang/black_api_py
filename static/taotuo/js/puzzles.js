const Puzzles = (function() {
    let currentPuzzle = null;
    let puzzleCallbacks = null;
    
    function openNumberPuzzle(config, callbacks) {
        currentPuzzle = { type: 'number', ...config };
        puzzleCallbacks = callbacks;
        
        const modal = document.getElementById('puzzle-modal');
        const title = document.getElementById('puzzle-title');
        const content = document.getElementById('puzzle-content');
        
        title.textContent = config.title || '数字密码锁';
        
        let currentValue = config.currentValue || [0, 0, 0, 0];
        const targetValue = config.answer;
        
        content.innerHTML = `
            <div class="number-puzzle">
                <div class="number-display">
                    ${currentValue.map((v, i) => `
                        <div class="number-digit" data-index="${i}">${v}</div>
                    `).join('')}
                </div>
                <div class="number-controls">
                    <div class="control-row">
                        ${[0, 1, 2, 3].map(i => `
                            <button class="number-btn" data-action="up" data-index="${i}">▲</button>
                        `).join('')}
                    </div>
                    <div class="control-row">
                        ${[0, 1, 2, 3].map(i => `
                            <button class="number-btn" data-action="down" data-index="${i}">▼</button>
                        `).join('')}
                    </div>
                </div>
                <p class="puzzle-hint">${config.hint || '输入正确的密码组合'}</p>
                <div class="puzzle-actions">
                    <button class="game-btn primary-btn" id="submit-number">确认</button>
                    <button class="game-btn secondary-btn" id="reset-number">重置</button>
                </div>
            </div>
        `;
        
        content.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                const action = btn.dataset.action;
                
                if (action === 'up') {
                    currentValue[index] = (currentValue[index] + 1) % 10;
                } else {
                    currentValue[index] = (currentValue[index] - 1 + 10) % 10;
                }
                
                content.querySelector(`[data-index="${index}"].number-digit`).textContent = currentValue[index];
            });
        });
        
        document.getElementById('submit-number').addEventListener('click', () => {
            const valueStr = currentValue.join('');
            const answerStr = targetValue.join('');
            
            if (valueStr === answerStr) {
                closePuzzle();
                if (callbacks.onSuccess) callbacks.onSuccess();
            } else {
                Utils.showMessage('密码错误！再试试...', 'warning');
                if (callbacks.onFail) callbacks.onFail();
            }
        });
        
        document.getElementById('reset-number').addEventListener('click', () => {
            currentValue = [0, 0, 0, 0];
            content.querySelectorAll('.number-digit').forEach((el, i) => {
                el.textContent = currentValue[i];
            });
        });
        
        modal.style.display = 'flex';
    }
    
    function openPatternPuzzle(config, callbacks) {
        currentPuzzle = { type: 'pattern', ...config };
        puzzleCallbacks = callbacks;
        
        const modal = document.getElementById('puzzle-modal');
        const title = document.getElementById('puzzle-title');
        const content = document.getElementById('puzzle-content');
        
        title.textContent = config.title || '图案排序谜题';
        
        const options = Utils.shuffleArray([...config.patterns]);
        let selectedPattern = null;
        const slots = new Array(config.slots || 4).fill(null);
        
        content.innerHTML = `
            <div class="pattern-puzzle">
                <p class="puzzle-hint">${config.hint || '按照正确顺序排列图案'}</p>
                <div class="pattern-grid">
                    ${slots.map((_, i) => `
                        <div class="pattern-slot" data-slot="${i}"></div>
                    `).join('')}
                </div>
                <div class="pattern-options">
                    ${options.map((pattern, i) => `
                        <div class="pattern-option" data-pattern="${pattern}" data-index="${i}">${pattern}</div>
                    `).join('')}
                </div>
                <div class="puzzle-actions">
                    <button class="game-btn primary-btn" id="submit-pattern">确认</button>
                    <button class="game-btn secondary-btn" id="reset-pattern">重置</button>
                </div>
            </div>
        `;
        
        content.querySelectorAll('.pattern-option').forEach(option => {
            option.addEventListener('click', () => {
                content.querySelectorAll('.pattern-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                selectedPattern = option.dataset.pattern;
            });
        });
        
        content.querySelectorAll('.pattern-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                if (selectedPattern) {
                    slot.textContent = selectedPattern;
                    slot.classList.add('filled');
                    slots[parseInt(slot.dataset.slot)] = selectedPattern;
                    
                    const option = content.querySelector(`[data-pattern="${selectedPattern}"]`);
                    if (option) option.style.opacity = '0.3';
                    
                    selectedPattern = null;
                    content.querySelectorAll('.pattern-option').forEach(o => o.classList.remove('selected'));
                } else if (slot.textContent) {
                    const pattern = slot.textContent;
                    const option = content.querySelector(`[data-pattern="${pattern}"]`);
                    if (option) option.style.opacity = '1';
                    slot.textContent = '';
                    slot.classList.remove('filled');
                    slots[parseInt(slot.dataset.slot)] = null;
                }
            });
        });
        
        document.getElementById('submit-pattern').addEventListener('click', () => {
            const isComplete = slots.every(s => s !== null);
            if (!isComplete) {
                Utils.showMessage('请填满所有位置！', 'warning');
                return;
            }
            
            const isCorrect = slots.every((s, i) => s === config.answer[i]);
            
            if (isCorrect) {
                closePuzzle();
                if (callbacks.onSuccess) callbacks.onSuccess();
            } else {
                Utils.showMessage('顺序不对，再想想...', 'warning');
                if (callbacks.onFail) callbacks.onFail();
            }
        });
        
        document.getElementById('reset-pattern').addEventListener('click', () => {
            slots.fill(null);
            selectedPattern = null;
            content.querySelectorAll('.pattern-slot').forEach(slot => {
                slot.textContent = '';
                slot.classList.remove('filled');
            });
            content.querySelectorAll('.pattern-option').forEach(option => {
                option.style.opacity = '1';
                option.classList.remove('selected');
            });
        });
        
        modal.style.display = 'flex';
    }
    
    function openLightPuzzle(config, callbacks) {
        currentPuzzle = { type: 'light', ...config };
        puzzleCallbacks = callbacks;
        
        const modal = document.getElementById('puzzle-modal');
        const title = document.getElementById('puzzle-title');
        const content = document.getElementById('puzzle-content');
        
        title.textContent = config.title || '光影解谜';
        
        const targetAngle = config.targetAngle || 45;
        let currentAngle = 0;
        
        content.innerHTML = `
            <div class="light-puzzle">
                <p class="puzzle-hint">${config.hint || '调整光线角度，照亮隐藏的密码'}</p>
                <div class="light-container">
                    <div class="light-beam" id="light-beam"></div>
                    <div class="light-target" id="light-target" style="left: ${150 + Math.sin(targetAngle * Math.PI / 180) * 120}px; top: ${Math.cos(targetAngle * Math.PI / 180) * 120}px;"></div>
                </div>
                <div class="light-controls">
                    <span>角度: <span id="angle-display">0</span>°</span>
                    <input type="range" class="angle-slider" id="angle-slider" min="0" max="90" value="0">
                </div>
                <div class="puzzle-actions">
                    <button class="game-btn primary-btn" id="submit-light">确认</button>
                </div>
            </div>
        `;
        
        const beam = document.getElementById('light-beam');
        const target = document.getElementById('light-target');
        const angleDisplay = document.getElementById('angle-display');
        const slider = document.getElementById('angle-slider');
        
        slider.addEventListener('input', () => {
            currentAngle = parseInt(slider.value);
            angleDisplay.textContent = currentAngle;
            beam.style.transform = `translateX(-50%) rotate(${currentAngle}deg)`;
            
            const diff = Math.abs(currentAngle - targetAngle);
            if (diff <= 5) {
                target.classList.add('hit');
            } else {
                target.classList.remove('hit');
            }
        });
        
        document.getElementById('submit-light').addEventListener('click', () => {
            const diff = Math.abs(currentAngle - targetAngle);
            if (diff <= 5) {
                closePuzzle();
                if (callbacks.onSuccess) callbacks.onSuccess();
            } else {
                Utils.showMessage('光线没有照到正确的位置...', 'warning');
                if (callbacks.onFail) callbacks.onFail();
            }
        });
        
        modal.style.display = 'flex';
    }
    
    function openDrawerPuzzle(config, callbacks) {
        currentPuzzle = { type: 'drawer', ...config };
        puzzleCallbacks = callbacks;
        
        const modal = document.getElementById('puzzle-modal');
        const title = document.getElementById('puzzle-title');
        const content = document.getElementById('puzzle-content');
        
        title.textContent = config.title || '抽屉暗格谜题';
        
        const correctSequence = config.sequence;
        let currentSequence = [];
        let openedDrawers = new Set();
        
        content.innerHTML = `
            <div class="drawer-puzzle">
                <p class="puzzle-hint">${config.hint || '按正确顺序拉开抽屉'}</p>
                <div class="drawer-container">
                    ${config.drawers.map((label, i) => `
                        <div class="drawer" data-drawer="${i}">
                            <span style="color: #c9b037; font-weight: bold;">${label}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="puzzle-actions">
                    <button class="game-btn secondary-btn" id="reset-drawer">重置</button>
                </div>
            </div>
        `;
        
        content.querySelectorAll('.drawer').forEach(drawer => {
            drawer.addEventListener('click', () => {
                const index = parseInt(drawer.dataset.drawer);
                
                if (openedDrawers.has(index)) return;
                
                const expectedIndex = currentSequence.length;
                if (correctSequence[expectedIndex] === index) {
                    drawer.classList.add('open', 'correct');
                    openedDrawers.add(index);
                    currentSequence.push(index);
                    
                    if (currentSequence.length === correctSequence.length) {
                        setTimeout(() => {
                            closePuzzle();
                            if (callbacks.onSuccess) callbacks.onSuccess();
                        }, 500);
                    }
                } else {
                    drawer.classList.add('wrong');
                    setTimeout(() => {
                        drawer.classList.remove('wrong');
                    }, 500);
                    
                    if (callbacks.onFail) callbacks.onFail();
                }
            });
        });
        
        document.getElementById('reset-drawer').addEventListener('click', () => {
            currentSequence = [];
            openedDrawers.clear();
            content.querySelectorAll('.drawer').forEach(drawer => {
                drawer.classList.remove('open', 'correct', 'wrong');
            });
        });
        
        modal.style.display = 'flex';
    }
    
    function closePuzzle() {
        const modal = document.getElementById('puzzle-modal');
        modal.style.display = 'none';
        currentPuzzle = null;
        puzzleCallbacks = null;
    }
    
    function init() {
        document.getElementById('close-puzzle-btn').addEventListener('click', closePuzzle);
    }
    
    return {
        openNumberPuzzle,
        openPatternPuzzle,
        openLightPuzzle,
        openDrawerPuzzle,
        closePuzzle,
        init
    };
})();
