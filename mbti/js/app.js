(function() {
    let state = null;

    function init() {
        try {
            state = MBTIStorage.initState();
        } catch (e) {
            console.error('初始化状态失败:', e);
            state = {
                currentQuestionIndex: 0,
                answers: {},
                isCompleted: false,
                result: null,
                startTime: Date.now()
            };
        }

        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('找不到Canvas元素');
            return;
        }

        try {
            MBTIRenderer.init(canvas, state);
            MBTIRenderer.setState(state);
            MBTIRenderer.start();
        } catch (e) {
            console.error('初始化渲染器失败:', e);
            showError();
        }

        window.addEventListener('beforeunload', handleBeforeUnload);
    }

    function handleBeforeUnload(e) {
        if (state && Object.keys(state.answers || {}).length > 0 && !state.isCompleted) {
            e.preventDefault();
            e.returnValue = '';
        }
    }

    function showError() {
        const overlay = document.getElementById('ui-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                            text-align: center; color: #e0d0ff;">
                    <h2 style="margin-bottom: 20px;">加载失败</h2>
                    <p style="margin-bottom: 20px; color: #a090c0;">请刷新页面重试</p>
                    <button onclick="location.reload()" 
                            style="background: rgba(100, 80, 180, 0.8); 
                                   color: #e8e8ff; padding: 12px 32px; 
                                   border: 1px solid rgba(180, 160, 255, 0.5);
                                   border-radius: 8px; cursor: pointer;">
                        刷新页面
                    </button>
                </div>
            `;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
