// ============================================================
// 视频播放器 - 简化可靠版本
// ============================================================

// 测试视频URL（公开可访问的测试视频）
const TEST_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

class VideoPlayer {
    constructor() {
        console.log('========================================');
        console.log('VideoPlayer 构造函数开始');
        console.log('========================================');
        
        // ========== 1. 获取DOM元素 ==========
        this.video = document.getElementById('videoPlayer');
        this.videoContainer = document.getElementById('videoContainer');
        
        // 播放控制
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.playIcon = this.playPauseBtn ? this.playPauseBtn.querySelector('.play-icon') : null;
        this.pauseIcon = this.playPauseBtn ? this.playPauseBtn.querySelector('.pause-icon') : null;
        
        // 进度条
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.timeDisplay = document.getElementById('timeDisplay');
        
        // 音量控制
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeHighIcon = this.volumeBtn ? this.volumeBtn.querySelector('.volume-high-icon') : null;
        this.volumeMuteIcon = this.volumeBtn ? this.volumeBtn.querySelector('.volume-mute-icon') : null;
        
        // 倍速控制
        this.speedBtn = document.getElementById('speedBtn');
        this.speedDropdown = document.getElementById('speedDropdown');
        this.speedOptions = document.querySelectorAll('.speed-option');
        
        // 全屏控制
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.fullscreenIcon = this.fullscreenBtn ? this.fullscreenBtn.querySelector('.fullscreen-icon') : null;
        this.exitFullscreenIcon = this.fullscreenBtn ? this.fullscreenBtn.querySelector('.exit-fullscreen-icon') : null;
        
        // URL输入
        this.videoUrlInput = document.getElementById('videoUrl');
        this.loadBtn = document.getElementById('loadBtn');
        
        // 拖拽提示
        this.dropHint = document.getElementById('dropHint');
        
        // ========== 2. 状态变量 ==========
        this.hasVideoSource = false;
        this.isLocalFile = false;
        this.isDragging = false;
        this.previousVolume = 1;
        
        // 用于恢复播放位置
        this.savedPlaybackTime = 0;
        
        console.log('DOM元素检查完成');
        console.log('- video:', !!this.video);
        console.log('- video.src:', this.video ? this.video.src : 'N/A');
        console.log('- playPauseBtn:', !!this.playPauseBtn);
        
        // ========== 3. 初始化 ==========
        this.init();
    }
    
    init() {
        console.log('========================================');
        console.log('init() 开始');
        console.log('========================================');
        
        // 先绑定事件
        this.bindEvents();
        
        // 然后从localStorage恢复状态
        this.loadState();
        
        console.log('========================================');
        console.log('init() 完成');
        console.log('========================================');
    }
    
    // ============================================================
    // 事件绑定
    // ============================================================
    bindEvents() {
        console.log('----------------------------------------');
        console.log('bindEvents() 开始');
        console.log('----------------------------------------');
        
        if (!this.video) {
            console.error('ERROR: video元素不存在！');
            return;
        }
        
        // ========== 视频事件 ==========
        console.log('绑定视频事件...');
        
        // 元数据加载完成（duration可用）
        this.video.addEventListener('loadedmetadata', () => {
            console.log('>>> 事件: loadedmetadata <<<');
            console.log('- video.duration:', this.video.duration);
            console.log('- video.src:', this.video.src);
            console.log('- video.readyState:', this.video.readyState);
            this.onVideoReady();
        });
        
        // 可以播放
        this.video.addEventListener('canplay', () => {
            console.log('>>> 事件: canplay <<<');
            console.log('- video.readyState:', this.video.readyState);
        });
        
        // 开始加载
        this.video.addEventListener('loadstart', () => {
            console.log('>>> 事件: loadstart <<<');
            console.log('- video.src:', this.video.src);
        });
        
        // 加载错误
        this.video.addEventListener('error', (e) => {
            console.error('>>> 事件: error <<<');
            console.error('- video.error:', this.video.error);
            console.error('- video.error.code:', this.video.error ? this.video.error.code : 'N/A');
            this.onVideoError();
        });
        
        // 播放状态变化
        this.video.addEventListener('play', () => {
            console.log('>>> 事件: play <<<');
            this.updatePlayButton();
        });
        
        this.video.addEventListener('pause', () => {
            console.log('>>> 事件: pause <<<');
            this.updatePlayButton();
        });
        
        this.video.addEventListener('ended', () => {
            console.log('>>> 事件: ended <<<');
            this.updatePlayButton();
        });
        
        // 播放位置更新
        this.video.addEventListener('timeupdate', () => {
            this.updateProgress();
        });
        
        // ========== 播放按钮事件 ==========
        if (this.playPauseBtn) {
            this.playPauseBtn.addEventListener('click', () => {
                console.log('点击播放/暂停按钮');
                this.togglePlay();
            });
        }
        
        this.video.addEventListener('click', () => {
            console.log('点击视频区域');
            this.togglePlay();
        });
        
        // ========== 进度条事件 ==========
        if (this.progressContainer) {
            this.progressContainer.addEventListener('click', (e) => {
                console.log('点击进度条');
                this.seekTo(e);
            });
            
            this.progressContainer.addEventListener('mousedown', (e) => {
                console.log('按下进度条');
                this.isDragging = true;
                this.seekTo(e);
            });
        }
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.seekTo(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                console.log('释放进度条');
                this.isDragging = false;
            }
        });
        
        // ========== 音量事件 ==========
        if (this.volumeBtn) {
            this.volumeBtn.addEventListener('click', () => {
                console.log('点击音量按钮');
                this.toggleMute();
            });
        }
        
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (e) => {
                console.log('音量滑块变化:', e.target.value);
                this.setVolume(e.target.value);
            });
            
            this.volumeSlider.addEventListener('change', () => {
                console.log('音量滑块最终值');
                this.saveState();
            });
        }
        
        // ========== 倍速事件 ==========
        if (this.speedBtn) {
            this.speedBtn.addEventListener('click', () => {
                console.log('点击倍速按钮');
                this.toggleSpeedDropdown();
            });
        }
        
        this.speedOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                console.log('选择倍速:', e.target.dataset.speed);
                this.setSpeed(e.target.dataset.speed);
            });
        });
        
        // 点击其他地方关闭倍速下拉菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.speed-control')) {
                if (this.speedDropdown) {
                    this.speedDropdown.style.opacity = '0';
                    this.speedDropdown.style.visibility = 'hidden';
                }
            }
        });
        
        // ========== 全屏事件 ==========
        if (this.fullscreenBtn) {
            this.fullscreenBtn.addEventListener('click', () => {
                console.log('点击全屏按钮');
                this.toggleFullscreen();
            });
        }
        
        document.addEventListener('fullscreenchange', () => {
            console.log('全屏状态变化');
            this.updateFullscreenButton();
        });
        
        document.addEventListener('webkitfullscreenchange', () => {
            console.log('webkit全屏状态变化');
            this.updateFullscreenButton();
        });
        
        // ========== URL输入事件 ==========
        if (this.loadBtn) {
            this.loadBtn.addEventListener('click', () => {
                console.log('========================================');
                console.log('点击加载按钮');
                console.log('========================================');
                this.loadVideoFromInput();
            });
        }
        
        if (this.videoUrlInput) {
            this.videoUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('========================================');
                    console.log('输入框按下Enter');
                    console.log('========================================');
                    this.loadVideoFromInput();
                }
            });
        }
        
        // ========== 拖拽事件 ==========
        if (this.videoContainer) {
            this.videoContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                console.log('dragover事件');
                this.videoContainer.classList.add('drop-highlight');
            });
            
            this.videoContainer.addEventListener('dragleave', (e) => {
                e.preventDefault();
                console.log('dragleave事件');
                this.videoContainer.classList.remove('drop-highlight');
            });
            
            this.videoContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                console.log('========================================');
                console.log('drop事件');
                console.log('========================================');
                this.videoContainer.classList.remove('drop-highlight');
                
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('video/')) {
                    this.loadVideoFile(file);
                } else {
                    console.log('不是视频文件:', file ? file.type : '无文件');
                    alert('请选择视频文件（.mp4, .webm, .ogg等）');
                }
            });
        }
        
        // ========== 键盘快捷键 ==========
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    console.log('快捷键: 空格/K - 播放/暂停');
                    this.togglePlay();
                    break;
                case 'f':
                    e.preventDefault();
                    console.log('快捷键: F - 全屏');
                    this.toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    console.log('快捷键: M - 静音');
                    this.toggleMute();
                    break;
                case 'arrowright':
                    e.preventDefault();
                    console.log('快捷键: 右箭头 - 快进');
                    if (this.hasVideoSource && this.video.duration) {
                        this.video.currentTime = Math.min(this.video.currentTime + 5, this.video.duration);
                    }
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    console.log('快捷键: 左箭头 - 快退');
                    if (this.hasVideoSource) {
                        this.video.currentTime = Math.max(this.video.currentTime - 5, 0);
                    }
                    break;
            }
        });
        
        // ========== 自动保存状态（节流）==========
        let saveTimeout = null;
        this.video.addEventListener('timeupdate', () => {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                if (this.hasVideoSource) {
                    this.saveState();
                }
            }, 1000);
        });
        
        console.log('----------------------------------------');
        console.log('bindEvents() 完成');
        console.log('----------------------------------------');
    }
    
    // ============================================================
    // 加载视频（核心方法）
    // ============================================================
    
    loadVideoFromInput() {
        console.log('----------------------------------------');
        console.log('loadVideoFromInput() 开始');
        console.log('----------------------------------------');
        
        if (!this.videoUrlInput) {
            console.error('ERROR: videoUrlInput不存在');
            return;
        }
        
        const url = this.videoUrlInput.value.trim();
        console.log('输入的URL:', url);
        
        if (!url) {
            console.log('URL为空，使用测试视频');
            // 使用测试视频
            this.videoUrlInput.value = TEST_VIDEO_URL;
            this.loadVideo(TEST_VIDEO_URL, false);
            return;
        }
        
        this.loadVideo(url, false);
        
        console.log('----------------------------------------');
        console.log('loadVideoFromInput() 完成');
        console.log('----------------------------------------');
    }
    
    loadVideoFile(file) {
        console.log('----------------------------------------');
        console.log('loadVideoFile() 开始');
        console.log('----------------------------------------');
        
        console.log('文件信息:', {
            name: file.name,
            type: file.type,
            size: file.size
        });
        
        // 释放之前的blob URL
        if (this.video.src && this.video.src.startsWith('blob:')) {
            console.log('释放之前的blob URL');
            URL.revokeObjectURL(this.video.src);
        }
        
        const blobUrl = URL.createObjectURL(file);
        console.log('创建的blob URL:', blobUrl);
        
        // 更新输入框显示
        if (this.videoUrlInput) {
            this.videoUrlInput.value = file.name;
        }
        
        this.loadVideo(blobUrl, true);
        
        console.log('----------------------------------------');
        console.log('loadVideoFile() 完成');
        console.log('----------------------------------------');
    }
    
    loadVideo(url, isLocalFile) {
        console.log('========================================');
        console.log('loadVideo() 开始');
        console.log('========================================');
        console.log('参数:');
        console.log('- url:', url);
        console.log('- isLocalFile:', isLocalFile);
        
        // ========== 步骤1：重置状态 ==========
        console.log('---------- 步骤1：重置状态 ----------');
        this.hasVideoSource = false;
        this.isLocalFile = isLocalFile;
        console.log('设置 hasVideoSource = false');
        console.log('设置 isLocalFile =', isLocalFile);
        
        // 更新播放按钮状态
        this.updatePlayButton();
        
        // ========== 步骤2：设置视频源 ==========
        console.log('---------- 步骤2：设置视频源 ----------');
        
        if (!this.video) {
            console.error('ERROR: video元素不存在！');
            return;
        }
        
        console.log('设置 video.src =', url);
        this.video.src = url;
        
        console.log('设置后 video.src =', this.video.src);
        
        // 调用 load() 确保开始加载
        console.log('调用 video.load()');
        this.video.load();
        
        // ========== 步骤3：隐藏提示 ==========
        console.log('---------- 步骤3：隐藏提示 ----------');
        if (this.dropHint) {
            this.dropHint.style.display = 'none';
            console.log('隐藏 dropHint');
        }
        
        // ========== 重要：不在这里保存状态！ ==========
        // 状态应该在视频加载完成（onVideoReady）后保存
        console.log('---------- 注意 ----------');
        console.log('不在这里保存状态，等待 loadedmetadata 事件');
        
        console.log('========================================');
        console.log('loadVideo() 完成');
        console.log('========================================');
    }
    
    // ============================================================
    // 视频加载事件处理
    // ============================================================
    
    onVideoReady() {
        console.log('========================================');
        console.log('onVideoReady() 开始');
        console.log('========================================');
        
        // 视频元数据加载完成，设置 hasVideoSource = true
        this.hasVideoSource = true;
        console.log('设置 hasVideoSource = true');
        
        // 更新播放按钮状态
        this.updatePlayButton();
        
        // 恢复保存的播放位置
        if (this.savedPlaybackTime > 0 && this.savedPlaybackTime <= this.video.duration) {
            console.log('恢复播放位置:', this.savedPlaybackTime);
            this.video.currentTime = this.savedPlaybackTime;
            // 重置，避免重复恢复
            this.savedPlaybackTime = 0;
        } else {
            console.log('没有播放位置需要恢复');
            console.log('- savedPlaybackTime:', this.savedPlaybackTime);
            console.log('- video.duration:', this.video.duration);
        }
        
        // 更新时间显示
        this.updateTimeDisplay();
        
        // ========== 重要：在这里保存状态！ ==========
        console.log('---------- 保存状态 ----------');
        this.saveState();
        
        console.log('========================================');
        console.log('onVideoReady() 完成');
        console.log('========================================');
    }
    
    onVideoError() {
        console.error('========================================');
        console.error('onVideoError() 开始');
        console.error('========================================');
        
        this.hasVideoSource = false;
        console.error('设置 hasVideoSource = false');
        
        this.updatePlayButton();
        
        alert('视频加载失败，请检查URL是否正确');
        
        console.error('========================================');
        console.error('onVideoError() 完成');
        console.error('========================================');
    }
    
    // ============================================================
    // 播放控制
    // ============================================================
    
    togglePlay() {
        console.log('----------------------------------------');
        console.log('togglePlay() 开始');
        console.log('----------------------------------------');
        console.log('当前状态:');
        console.log('- hasVideoSource:', this.hasVideoSource);
        console.log('- video.paused:', this.video ? this.video.paused : 'N/A');
        
        if (!this.hasVideoSource) {
            console.log('没有视频源，无法播放');
            return;
        }
        
        if (!this.video) {
            console.error('ERROR: video元素不存在');
            return;
        }
        
        if (this.video.paused) {
            console.log('尝试播放...');
            this.video.play()
                .then(() => console.log('播放成功'))
                .catch(err => {
                    console.error('播放失败:', err);
                    alert('播放失败: ' + err.message);
                });
        } else {
            console.log('暂停视频');
            this.video.pause();
        }
        
        console.log('----------------------------------------');
        console.log('togglePlay() 完成');
        console.log('----------------------------------------');
    }
    
    updatePlayButton() {
        console.log('updatePlayButton() 开始');
        console.log('- hasVideoSource:', this.hasVideoSource);
        console.log('- video.paused:', this.video ? this.video.paused : 'N/A');
        
        if (!this.playIcon || !this.pauseIcon || !this.playPauseBtn) {
            console.error('ERROR: 播放按钮元素缺失');
            return;
        }
        
        if (!this.hasVideoSource) {
            console.log('没有视频源 - 显示播放图标（半透明）');
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
            this.playPauseBtn.style.opacity = '0.5';
            this.playPauseBtn.style.cursor = 'not-allowed';
            return;
        }
        
        console.log('有视频源 - 根据状态切换');
        this.playPauseBtn.style.opacity = '1';
        this.playPauseBtn.style.cursor = 'pointer';
        
        if (this.video.paused) {
            console.log('视频已暂停 - 显示播放图标');
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
        } else {
            console.log('视频正在播放 - 显示暂停图标');
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
        }
        
        console.log('updatePlayButton() 完成');
    }
    
    // ============================================================
    // 进度条控制
    // ============================================================
    
    updateProgress() {
        if (!this.video.duration || isNaN(this.video.duration)) return;
        
        const progress = (this.video.currentTime / this.video.duration) * 100;
        if (this.progressFill) {
            this.progressFill.style.width = `${progress}%`;
        }
        this.updateTimeDisplay();
    }
    
    updateTimeDisplay() {
        if (!this.timeDisplay) return;
        
        const formatTime = (seconds) => {
            if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        this.timeDisplay.textContent = `${formatTime(this.video.currentTime)} / ${formatTime(this.video.duration)}`;
    }
    
    seekTo(e) {
        if (!this.video.duration || isNaN(this.video.duration)) return;
        
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        this.video.currentTime = pos * this.video.duration;
        console.log('跳转到:', this.video.currentTime);
    }
    
    // ============================================================
    // 音量控制
    // ============================================================
    
    toggleMute() {
        console.log('toggleMute() 开始');
        console.log('- video.muted:', this.video.muted);
        console.log('- video.volume:', this.video.volume);
        
        if (this.video.muted || this.video.volume === 0) {
            // 取消静音
            this.video.muted = false;
            this.video.volume = this.previousVolume > 0 ? this.previousVolume : 1;
            if (this.volumeSlider) {
                this.volumeSlider.value = this.video.volume;
            }
            console.log('取消静音，音量:', this.video.volume);
        } else {
            // 静音
            this.previousVolume = this.video.volume;
            this.video.muted = true;
            if (this.volumeSlider) {
                this.volumeSlider.value = 0;
            }
            console.log('静音');
        }
        
        this.updateVolumeIcon();
        this.saveState();
        
        console.log('toggleMute() 完成');
    }
    
    setVolume(value) {
        const volume = parseFloat(value);
        console.log('setVolume:', volume);
        
        this.video.volume = volume;
        this.video.muted = volume === 0;
        
        if (volume > 0) {
            this.previousVolume = volume;
        }
        
        if (this.volumeSlider) {
            this.volumeSlider.value = volume;
        }
        
        this.updateVolumeIcon();
    }
    
    updateVolumeIcon() {
        if (!this.volumeHighIcon || !this.volumeMuteIcon) return;
        
        if (this.video.muted || this.video.volume === 0) {
            this.volumeHighIcon.style.display = 'none';
            this.volumeMuteIcon.style.display = 'block';
        } else {
            this.volumeHighIcon.style.display = 'block';
            this.volumeMuteIcon.style.display = 'none';
        }
    }
    
    // ============================================================
    // 倍速控制
    // ============================================================
    
    toggleSpeedDropdown() {
        if (!this.speedDropdown) return;
        
        const isVisible = this.speedDropdown.style.opacity === '1';
        if (isVisible) {
            this.speedDropdown.style.opacity = '0';
            this.speedDropdown.style.visibility = 'hidden';
        } else {
            this.speedDropdown.style.opacity = '1';
            this.speedDropdown.style.visibility = 'visible';
        }
    }
    
    setSpeed(speed) {
        const speedNum = parseFloat(speed);
        console.log('setSpeed:', speedNum);
        
        this.video.playbackRate = speedNum;
        if (this.speedBtn) {
            this.speedBtn.textContent = `${speedNum}x`;
        }
        
        this.speedOptions.forEach(opt => {
            opt.classList.toggle('active', parseFloat(opt.dataset.speed) === speedNum);
        });
        
        if (this.speedDropdown) {
            this.speedDropdown.style.opacity = '0';
            this.speedDropdown.style.visibility = 'hidden';
        }
        
        this.saveState();
    }
    
    // ============================================================
    // 全屏控制
    // ============================================================
    
    toggleFullscreen() {
        console.log('toggleFullscreen() 开始');
        
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            console.log('进入全屏');
            if (this.videoContainer.requestFullscreen) {
                this.videoContainer.requestFullscreen();
            } else if (this.videoContainer.webkitRequestFullscreen) {
                this.videoContainer.webkitRequestFullscreen();
            }
        } else {
            console.log('退出全屏');
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
        
        console.log('toggleFullscreen() 完成');
    }
    
    updateFullscreenButton() {
        const isFullscreen = !!document.fullscreenElement || !!document.webkitFullscreenElement;
        console.log('updateFullscreenButton:', isFullscreen);
        
        if (!this.fullscreenIcon || !this.exitFullscreenIcon) return;
        
        if (isFullscreen) {
            this.fullscreenIcon.style.display = 'none';
            this.exitFullscreenIcon.style.display = 'block';
        } else {
            this.fullscreenIcon.style.display = 'block';
            this.exitFullscreenIcon.style.display = 'none';
        }
    }
    
    // ============================================================
    // 状态保存和恢复（localStorage）
    // ============================================================
    
    saveState() {
        console.log('========================================');
        console.log('saveState() 开始');
        console.log('========================================');
        
        // ========== 关键检查 ==========
        // 只有当有视频源时才保存状态
        if (!this.hasVideoSource) {
            console.log('hasVideoSource = false，不保存状态');
            console.log('========================================');
            console.log('saveState() 完成（未保存）');
            console.log('========================================');
            return;
        }
        
        console.log('hasVideoSource = true，开始保存状态');
        
        try {
            // ========== 构建要保存的状态 ==========
            let videoUrlToSave = '';
            
            // 对于本地文件（blob URL），刷新后无效，所以不保存URL
            // 只保存输入框显示值
            if (this.video.src && !this.video.src.startsWith('blob:')) {
                videoUrlToSave = this.video.src;
            }
            
            const state = {
                // 视频相关
                videoUrl: videoUrlToSave,
                currentTime: this.video.currentTime || 0,
                
                // 音量相关
                volume: this.video.volume,
                muted: this.video.muted,
                
                // 倍速相关
                playbackRate: this.video.playbackRate,
                
                // UI显示相关
                inputUrl: this.videoUrlInput ? this.videoUrlInput.value : '',
                
                // 标记
                savedAt: new Date().toISOString()
            };
            
            console.log('保存的状态:', JSON.stringify(state, null, 2));
            
            // 保存到 localStorage
            localStorage.setItem('videoPlayerState', JSON.stringify(state));
            console.log('已保存到 localStorage');
            
        } catch (e) {
            console.error('保存状态失败:', e);
        }
        
        console.log('========================================');
        console.log('saveState() 完成');
        console.log('========================================');
    }
    
    loadState() {
        console.log('========================================');
        console.log('loadState() 开始');
        console.log('========================================');
        
        try {
            // 从 localStorage 读取
            const stateJson = localStorage.getItem('videoPlayerState');
            
            if (!stateJson) {
                console.log('localStorage 中没有保存的状态');
                console.log('========================================');
                console.log('loadState() 完成（无状态）');
                console.log('========================================');
                return;
            }
            
            const state = JSON.parse(stateJson);
            console.log('加载到的状态:', JSON.stringify(state, null, 2));
            
            // ========== 步骤1：保存播放位置供视频加载后恢复 ==========
            // 因为视频还没加载，无法设置 currentTime
            // 所以先保存到 this.savedPlaybackTime，等 onVideoReady() 中恢复
            if (state.currentTime !== undefined && state.currentTime > 0) {
                this.savedPlaybackTime = state.currentTime;
                console.log('保存播放位置供恢复:', this.savedPlaybackTime);
            } else {
                console.log('没有播放位置需要恢复');
            }
            
            // ========== 步骤2：恢复可以立即设置的状态 ==========
            
            // 恢复音量
            if (state.volume !== undefined) {
                console.log('恢复音量:', state.volume);
                this.video.volume = state.volume;
                if (this.volumeSlider) {
                    this.volumeSlider.value = state.volume;
                }
            }
            
            // 恢复静音状态
            if (state.muted !== undefined) {
                console.log('恢复静音状态:', state.muted);
                this.video.muted = state.muted;
            }
            
            // 恢复倍速
            if (state.playbackRate !== undefined) {
                console.log('恢复倍速:', state.playbackRate);
                this.video.playbackRate = state.playbackRate;
                if (this.speedBtn) {
                    this.speedBtn.textContent = `${state.playbackRate}x`;
                }
                
                // 更新倍速选项高亮
                this.speedOptions.forEach(opt => {
                    opt.classList.toggle('active', parseFloat(opt.dataset.speed) === state.playbackRate);
                });
            }
            
            // 恢复输入框显示值
            if (state.inputUrl) {
                console.log('恢复输入框显示:', state.inputUrl);
                if (this.videoUrlInput) {
                    this.videoUrlInput.value = state.inputUrl;
                }
            }
            
            // ========== 步骤3：恢复视频URL（如果有） ==========
            // 注意：
            // - 网络视频URL：保存了，可以恢复
            // - 本地文件URL：是blob URL，没保存，无法恢复
            
            if (state.videoUrl && state.videoUrl !== '') {
                console.log('有保存的视频URL，尝试恢复:', state.videoUrl);
                this.loadVideo(state.videoUrl, false);
            } else {
                console.log('没有保存的视频URL（可能是本地文件）');
                // 本地文件需要重新拖拽
            }
            
            // ========== 步骤4：更新UI ==========
            this.updateVolumeIcon();
            this.updatePlayButton();  // 这里 hasVideoSource 还是 false，所以会显示半透明
            
        } catch (e) {
            console.error('加载状态失败:', e);
        }
        
        console.log('========================================');
        console.log('loadState() 完成');
        console.log('========================================');
    }
}

// ============================================================
// 页面加载完成后初始化
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('========================================');
    console.log('DOMContentLoaded 事件触发');
    console.log('========================================');
    
    // 检查 localStorage 中是否有保存的状态
    const savedState = localStorage.getItem('videoPlayerState');
    if (savedState) {
        console.log('localStorage 中存在保存的状态:');
        console.log(savedState);
    } else {
        console.log('localStorage 中没有保存的状态');
    }
    
    // 创建播放器实例
    console.log('创建 VideoPlayer 实例...');
    const player = new VideoPlayer();
    
    console.log('========================================');
    console.log('初始化完成！');
    console.log('========================================');
    console.log('提示：');
    console.log('- 可以直接点击"加载"按钮加载测试视频');
    console.log('- 或者输入视频URL后点击加载');
    console.log('- 或者拖拽本地视频文件到播放器区域');
    console.log('========================================');
});
