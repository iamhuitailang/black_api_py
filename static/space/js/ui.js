const UI = (function() {
    class ControlPanel {
        constructor(earth, starField, lensFlare, controls, storage) {
            this.earth = earth;
            this.starField = starField;
            this.lensFlare = lensFlare;
            this.controls = controls;
            this.storage = storage;
            
            this.initElements();
            this.initEventListeners();
        }

        initElements() {
            this.rotationSpeedSlider = document.getElementById('rotationSpeed');
            this.rotationSpeedValue = document.getElementById('rotationSpeedValue');
            
            this.zoomLevelSlider = document.getElementById('zoomLevel');
            this.zoomLevelValue = document.getElementById('zoomLevelValue');
            
            this.starDensitySlider = document.getElementById('starDensity');
            this.starDensityValue = document.getElementById('starDensityValue');
            
            this.cloudDensitySlider = document.getElementById('cloudDensity');
            this.cloudDensityValue = document.getElementById('cloudDensityValue');
            
            this.autoRotateCheckbox = document.getElementById('autoRotate');
            this.showAtmosphereCheckbox = document.getElementById('showAtmosphere');
            this.showStarsCheckbox = document.getElementById('showStars');
            this.showCloudsCheckbox = document.getElementById('showClouds');
            this.lensFlareCheckbox = document.getElementById('lensFlare');
            
            this.resetViewBtn = document.getElementById('resetView');
            this.saveStateBtn = document.getElementById('saveState');
            this.togglePanelBtn = document.getElementById('togglePanel');
            this.panel = document.getElementById('controlPanel');
        }

        initEventListeners() {
            this.rotationSpeedSlider.addEventListener('input', (e) => {
                const value = e.target.value / 100;
                this.earth.setRotationSpeed(value);
                this.rotationSpeedValue.textContent = value.toFixed(2);
            });

            this.zoomLevelSlider.addEventListener('input', (e) => {
                const value = e.target.value / 100;
                this.controls.setZoomLevel(value);
                this.zoomLevelValue.textContent = value.toFixed(2) + 'x';
            });

            this.starDensitySlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.starField.setStarCount(value);
                this.starDensityValue.textContent = value;
            });

            this.cloudDensitySlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.earth.setCloudDensity(value);
                this.cloudDensityValue.textContent = value + '%';
            });

            this.autoRotateCheckbox.addEventListener('change', (e) => {
                this.earth.setAutoRotate(e.target.checked);
            });

            this.showAtmosphereCheckbox.addEventListener('change', (e) => {
                this.earth.setShowAtmosphere(e.target.checked);
            });

            this.showStarsCheckbox.addEventListener('change', (e) => {
                this.starField.enabled = e.target.checked;
            });

            this.showCloudsCheckbox.addEventListener('change', (e) => {
                this.earth.setShowClouds(e.target.checked);
            });

            this.lensFlareCheckbox.addEventListener('change', (e) => {
                this.lensFlare.setEnabled(e.target.checked);
            });

            this.resetViewBtn.addEventListener('click', () => {
                this.controls.reset();
                this.updateSliderValues();
            });

            this.saveStateBtn.addEventListener('click', () => {
                this.saveCurrentState();
                this.showSaveNotification();
            });

            this.togglePanelBtn.addEventListener('click', () => {
                this.panel.classList.toggle('collapsed');
                this.togglePanelBtn.textContent = this.panel.classList.contains('collapsed') ? '+' : '−';
            });
        }

        loadState(state) {
            if (state.rotationSpeed !== undefined) {
                this.earth.setRotationSpeed(state.rotationSpeed);
                this.rotationSpeedSlider.value = state.rotationSpeed * 100;
                this.rotationSpeedValue.textContent = state.rotationSpeed.toFixed(2);
            }

            if (state.zoomLevel !== undefined) {
                this.controls.setZoomLevel(state.zoomLevel);
                this.zoomLevelSlider.value = state.zoomLevel * 100;
                this.zoomLevelValue.textContent = state.zoomLevel.toFixed(2) + 'x';
            }

            if (state.starDensity !== undefined) {
                this.starField.setStarCount(state.starDensity);
                this.starDensitySlider.value = state.starDensity;
                this.starDensityValue.textContent = state.starDensity;
            }

            if (state.cloudDensity !== undefined) {
                this.earth.setCloudDensity(state.cloudDensity);
                this.cloudDensitySlider.value = state.cloudDensity;
                this.cloudDensityValue.textContent = state.cloudDensity + '%';
            }

            if (state.autoRotate !== undefined) {
                this.earth.setAutoRotate(state.autoRotate);
                this.autoRotateCheckbox.checked = state.autoRotate;
            }

            if (state.showAtmosphere !== undefined) {
                this.earth.setShowAtmosphere(state.showAtmosphere);
                this.showAtmosphereCheckbox.checked = state.showAtmosphere;
            }

            if (state.showStars !== undefined) {
                this.starField.enabled = state.showStars;
                this.showStarsCheckbox.checked = state.showStars;
            }

            if (state.showClouds !== undefined) {
                this.earth.setShowClouds(state.showClouds);
                this.showCloudsCheckbox.checked = state.showClouds;
            }

            if (state.lensFlare !== undefined) {
                this.lensFlare.setEnabled(state.lensFlare);
                this.lensFlareCheckbox.checked = state.lensFlare;
            }

            if (state.cameraAngleX !== undefined || state.cameraAngleY !== undefined) {
                this.controls.setState({
                    angleX: state.cameraAngleX,
                    angleY: state.cameraAngleY,
                    distance: state.cameraDistance,
                    zoomLevel: state.zoomLevel
                });
            }

            if (state.earthRotation !== undefined) {
                this.earth.rotation = state.earthRotation;
            }
        }

        saveCurrentState() {
            const controlState = this.controls.getState();
            const state = {
                rotationSpeed: this.earth.rotationSpeed,
                zoomLevel: this.controls.zoomLevel,
                starDensity: this.starField.starCount,
                cloudDensity: this.earth.cloudDensity,
                autoRotate: this.earth.autoRotate,
                showAtmosphere: this.earth.showAtmosphere,
                showStars: this.starField.enabled,
                showClouds: this.earth.showClouds,
                lensFlare: this.lensFlare.enabled,
                cameraAngleX: controlState.angleX,
                cameraAngleY: controlState.angleY,
                cameraDistance: controlState.distance,
                earthRotation: this.earth.rotation
            };
            this.storage.save(state);
        }

        updateSliderValues() {
            const controlState = this.controls.getState();
            this.zoomLevelSlider.value = controlState.zoomLevel * 100;
            this.zoomLevelValue.textContent = controlState.zoomLevel.toFixed(2) + 'x';
        }

        showSaveNotification() {
            const notification = document.createElement('div');
            notification.textContent = '✓ 状态已保存';
            notification.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(50, 200, 100, 0.9);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10000;
                animation: fadeInOut 2s ease;
            `;
            
            if (!document.getElementById('notificationStyle')) {
                const style = document.createElement('style');
                style.id = 'notificationStyle';
                style.textContent = `
                    @keyframes fadeInOut {
                        0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 2000);
        }
    }

    return ControlPanel;
})();
