(function() {
    const API_BASE = '/api';

    const ORE_CONFIG = {
        copper_ore: { name: '铜矿', product: '铜锭', minTemp: 400, maxTemp: 600, smeltTime: 3, icon: '🪨' },
        iron_ore: { name: '铁矿', product: '铁锭', minTemp: 800, maxTemp: 1200, smeltTime: 5, icon: '⛏️' },
        mithril_ore: { name: '秘银矿', product: '秘银条', minTemp: 1400, maxTemp: 1700, smeltTime: 8, icon: '💎' },
    };

    const FUEL_CONFIG = {
        charcoal: { name: '木炭', heat: 50, icon: '🪵' },
        coal: { name: '煤炭', heat: 120, icon: '🏗️' },
        magic_crystal: { name: '魔力晶', heat: 300, icon: '🔮' },
    };

    const QUALITY_ORDER = ['传说', '史诗', '稀有', '普通'];

    const BASE_TEMPS = [200, 520, 840, 1160, 1480, 1800];

    let game = {
        started: false,
        playerName: '',
        timeRemaining: 900,
        score: 0,
        furnace: [],
        inventory: { '铜锭': 0, '铁锭': 0, '秘银条': 0 },
        forgeSlots: [null, null],
        forgedEquipment: [],
        coolingDown: false,
        cooldownEndTime: null,
        recipes: [],
    };

    let gameTimer = null;
    let coolTimer = null;
    let smeltTimers = {};

    function initFurnace() {
        game.furnace = BASE_TEMPS.map((temp, i) => ({
            layer: i,
            temp: temp,
            baseTemp: temp,
            ore: null,
            smelting: false,
            smeltProgress: 0,
            smeltDuration: 0,
            lastFuel: null,
        }));
    }

    function showToast(message, type) {
        type = type || 'info';
        var container = document.getElementById('toast-container');
        var toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 3000);
    }

    function formatTime(seconds) {
        var m = Math.floor(seconds / 60);
        var s = Math.floor(seconds % 60);
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    function getTempColor(temp) {
        if (temp < 500) return 'var(--temp-blue)';
        if (temp < 800) return 'var(--temp-yellow)';
        if (temp < 1200) return 'var(--temp-orange)';
        if (temp < 1500) return 'var(--temp-red)';
        return 'var(--temp-white)';
    }

    function getTempPercent(temp) {
        return Math.max(0, Math.min(100, ((temp - 200) / (1800 - 200)) * 100));
    }

    function updateFurnaceUI() {
        var layers = document.querySelectorAll('.furnace-layer');
        layers.forEach(function(layerEl) {
            var idx = parseInt(layerEl.getAttribute('data-layer'));
            var f = game.furnace[idx];
            if (!f) return;

            var tempEl = layerEl.querySelector('.layer-temp');
            var fillEl = layerEl.querySelector('.temp-fill');
            var markerEl = layerEl.querySelector('.temp-marker');
            var rangeEl = layerEl.querySelector('.temp-range-indicator');
            var oreZone = layerEl.querySelector('.ore-slot .drop-zone');
            var fuelZone = layerEl.querySelector('.fuel-slot .drop-zone');
            var progressEl = layerEl.querySelector('.smelt-progress');
            var barEl = layerEl.querySelector('.smelt-bar');
            var textEl = layerEl.querySelector('.smelt-text');

            tempEl.textContent = Math.round(f.temp) + '℃';
            tempEl.style.color = getTempColor(f.temp);

            var pct = getTempPercent(f.temp);
            fillEl.style.height = pct + '%';
            fillEl.style.background = 'linear-gradient(to top, ' + getTempColor(Math.max(200, f.temp - 200)) + ', ' + getTempColor(f.temp) + ')';

            markerEl.style.bottom = pct + '%';

            if (f.ore) {
                var oreConf = ORE_CONFIG[f.ore];
                var minPct = getTempPercent(oreConf.minTemp);
                var maxPct = getTempPercent(oreConf.maxTemp);
                rangeEl.style.bottom = minPct + '%';
                rangeEl.style.height = (maxPct - minPct) + '%';
                rangeEl.classList.add('active');

                if (f.temp >= oreConf.minTemp && f.temp <= oreConf.maxTemp) {
                    rangeEl.style.background = 'rgba(46, 204, 113, 0.3)';
                    rangeEl.style.borderColor = 'rgba(46, 204, 113, 0.6)';
                } else {
                    rangeEl.style.background = 'rgba(231, 76, 60, 0.3)';
                    rangeEl.style.borderColor = 'rgba(231, 76, 60, 0.6)';
                }

                oreZone.textContent = oreConf.icon + ' ' + oreConf.name;
                oreZone.classList.add('has-item');
            } else {
                rangeEl.classList.remove('active');
                oreZone.textContent = '拖入矿石';
                oreZone.classList.remove('has-item');
            }

            if (f.lastFuel) {
                fuelZone.textContent = '🔥 ' + f.lastFuel;
                fuelZone.classList.add('has-item');
            } else {
                fuelZone.textContent = '拖入燃料';
                fuelZone.classList.remove('has-item');
            }

            if (f.smelting) {
                progressEl.classList.add('active');
                barEl.style.width = f.smeltProgress + '%';
                textEl.textContent = Math.ceil(f.smeltDuration * (1 - f.smeltProgress / 100)) + '秒';
                layerEl.classList.add('smelting');
            } else {
                progressEl.classList.remove('active');
                layerEl.classList.remove('smelting');
            }
        });
    }

    function updateInventoryUI() {
        var items = document.querySelectorAll('.inventory-item');
        items.forEach(function(item) {
            var metal = item.getAttribute('data-metal');
            var countEl = item.querySelector('.metal-count');
            var count = game.inventory[metal] || 0;
            countEl.textContent = count;
            if (count > 0) {
                item.classList.remove('empty');
                item.setAttribute('draggable', 'true');
            } else {
                item.classList.add('empty');
                item.removeAttribute('draggable');
            }
        });
    }

    function updateForgeSlotsUI() {
        var slots = document.querySelectorAll('.forge-drop-zone');
        slots.forEach(function(slot, idx) {
            var metal = game.forgeSlots[idx];
            if (metal) {
                slot.textContent = metal;
                slot.classList.add('has-item');
            } else {
                slot.textContent = '拖入金属';
                slot.classList.remove('has-item');
            }
        });

        var forgeBtn = document.getElementById('forge-btn');
        if (game.forgeSlots[0] && game.forgeSlots[1] && game.started) {
            forgeBtn.removeAttribute('disabled');
        } else {
            forgeBtn.setAttribute('disabled', 'true');
        }
    }

    function updateEquipmentUI() {
        var list = document.getElementById('equipment-list');
        list.innerHTML = '';
        game.forgedEquipment.forEach(function(eq) {
            var card = document.createElement('div');
            card.className = 'equipment-card';
            card.innerHTML =
                '<span class="equipment-name">' + eq.name + '</span>' +
                '<span class="equipment-quality ' + eq.quality + '">' + eq.quality + '</span>' +
                '<span class="equipment-score">+' + eq.score + '分</span>';
            list.appendChild(card);
        });
    }

    function updateStatsUI() {
        document.getElementById('timer').textContent = formatTime(game.timeRemaining);
        document.getElementById('score').textContent = game.score;
    }

    function updateAllUI() {
        updateFurnaceUI();
        updateInventoryUI();
        updateForgeSlotsUI();
        updateEquipmentUI();
        updateStatsUI();
    }

    function startGame() {
        var nameInput = document.getElementById('player-name');
        var name = nameInput.value.trim();
        if (!name) {
            showToast('请输入玩家名', 'warning');
            nameInput.focus();
            return;
        }

        game.playerName = name;
        game.started = true;
        game.timeRemaining = 900;
        game.score = 0;
        game.inventory = { '铜锭': 0, '铁锭': 0, '秘银条': 0 };
        game.forgeSlots = [null, null];
        game.forgedEquipment = [];
        game.coolingDown = false;
        game.cooldownEndTime = null;

        initFurnace();

        for (var key in smeltTimers) {
            clearInterval(smeltTimers[key]);
        }
        smeltTimers = {};

        document.getElementById('start-btn').setAttribute('disabled', 'true');
        document.getElementById('cooldown-btn').removeAttribute('disabled');
        nameInput.setAttribute('disabled', 'true');

        fetch(API_BASE + '/alchemy/game/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_name: name }),
        }).catch(function() {});

        updateAllUI();
        showToast('游戏开始！15分钟倒计时', 'success');

        gameTimer = setInterval(gameLoop, 1000);
        coolTimer = setInterval(coolFurnace, 10000);
    }

    function gameLoop() {
        if (!game.started) return;

        game.timeRemaining--;
        if (game.timeRemaining <= 0) {
            game.timeRemaining = 0;
            endGame();
            return;
        }

        if (game.coolingDown && game.cooldownEndTime && Date.now() >= game.cooldownEndTime) {
            game.furnace.forEach(function(f) {
                f.temp = Math.max(200, f.temp - 100);
            });
            game.coolingDown = false;
            game.cooldownEndTime = null;
            document.getElementById('cooldown-btn').textContent = '❄️ 冷却熔炉 (30秒)';
            document.getElementById('cooldown-btn').removeAttribute('disabled');
            showToast('冷却完成！所有层降温100℃', 'info');
        }

        updateAllUI();
    }

    function coolFurnace() {
        if (!game.started) return;

        game.furnace.forEach(function(f) {
            f.temp = Math.max(200, f.temp - 30);
        });
        updateFurnaceUI();
    }

    function endGame() {
        game.started = false;
        clearInterval(gameTimer);
        clearInterval(coolTimer);
        for (var key in smeltTimers) {
            clearInterval(smeltTimers[key]);
        }
        smeltTimers = {};

        document.getElementById('start-btn').removeAttribute('disabled');
        document.getElementById('cooldown-btn').setAttribute('disabled', 'true');
        document.getElementById('player-name').removeAttribute('disabled');

        var details = JSON.stringify(game.forgedEquipment);

        fetch(API_BASE + '/alchemy/game/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: game.playerName,
                score: game.score,
                details: details,
            }),
        }).catch(function() {});

        var modal = document.getElementById('game-over-modal');
        document.getElementById('final-score').textContent = game.score + ' 分';
        var eqHtml = '';
        game.forgedEquipment.forEach(function(eq) {
            eqHtml += '<div class="equipment-card" style="display:inline-flex;margin:4px;">' +
                '<span class="equipment-name">' + eq.name + '</span>' +
                '<span class="equipment-quality ' + eq.quality + '">' + eq.quality + '</span>' +
                '<span class="equipment-score">+' + eq.score + '分</span></div>';
        });
        document.getElementById('final-equipment').innerHTML = eqHtml;
        modal.classList.add('active');

        updateAllUI();
    }

    function addOreToLayer(layerIdx, oreType) {
        var f = game.furnace[layerIdx];
        if (!f || !game.started) return;
        if (f.smelting) {
            showToast('该层正在炼制中，无法放置矿石', 'warning');
            return;
        }
        if (f.ore) {
            showToast('该层已有矿石', 'warning');
            return;
        }

        f.ore = oreType;
        showToast(ORE_CONFIG[oreType].name + ' 已放入第' + (layerIdx + 1) + '层', 'info');
        updateFurnaceUI();
    }

    function addFuelToLayer(layerIdx, fuelType) {
        var f = game.furnace[layerIdx];
        if (!f || !game.started) return;

        var heat = FUEL_CONFIG[fuelType].heat;
        f.temp = Math.min(1800, f.temp + heat);
        f.lastFuel = FUEL_CONFIG[fuelType].name;
        showToast(FUEL_CONFIG[fuelType].name + ' +' + heat + '℃ → ' + Math.round(f.temp) + '℃', 'info');

        if (!f.smelting) {
            checkAndStartSmelt(layerIdx);
        }
        updateFurnaceUI();
    }

    function checkAndStartSmelt(layerIdx) {
        var f = game.furnace[layerIdx];
        if (!f || !f.ore || f.smelting) return;

        var oreConf = ORE_CONFIG[f.ore];
        if (f.temp >= oreConf.minTemp && f.temp <= oreConf.maxTemp) {
            startSmelting(layerIdx);
        } else if (f.temp > oreConf.maxTemp) {
            burnOre(layerIdx);
        }
    }

    function startSmelting(layerIdx) {
        var f = game.furnace[layerIdx];
        var oreConf = ORE_CONFIG[f.ore];
        f.smelting = true;
        f.smeltProgress = 0;
        f.smeltDuration = oreConf.smeltTime;

        showToast(oreConf.name + '开始炼制！' + oreConf.smeltTime + '秒后完成', 'success');

        var startTime = Date.now();
        var totalMs = oreConf.smeltTime * 1000;

        smeltTimers[layerIdx] = setInterval(function() {
            if (!game.started) {
                clearInterval(smeltTimers[layerIdx]);
                return;
            }

            var elapsed = Date.now() - startTime;
            f.smeltProgress = Math.min(100, (elapsed / totalMs) * 100);

            if (f.temp < oreConf.minTemp || f.temp > oreConf.maxTemp) {
                clearInterval(smeltTimers[layerIdx]);
                burnOre(layerIdx);
                return;
            }

            if (elapsed >= totalMs) {
                clearInterval(smeltTimers[layerIdx]);
                completeSmelting(layerIdx);
            }

            updateFurnaceUI();
        }, 100);
    }

    function burnOre(layerIdx) {
        var f = game.furnace[layerIdx];
        var oreConf = ORE_CONFIG[f.ore];
        game.score = Math.max(0, game.score - 20);

        showToast(oreConf.name + '被烧毁了！-20分', 'error');

        f.ore = null;
        f.smelting = false;
        f.smeltProgress = 0;
        f.lastFuel = null;

        updateAllUI();
    }

    function completeSmelting(layerIdx) {
        var f = game.furnace[layerIdx];
        var oreConf = ORE_CONFIG[f.ore];
        var product = oreConf.product;

        game.inventory[product] = (game.inventory[product] || 0) + 1;
        showToast('成功炼制 ' + product + '！', 'success');

        f.ore = null;
        f.smelting = false;
        f.smeltProgress = 0;
        f.lastFuel = null;

        updateAllUI();
    }

    function startCooldown() {
        if (!game.started || game.coolingDown) return;

        game.coolingDown = true;
        game.cooldownEndTime = Date.now() + 30000;

        var btn = document.getElementById('cooldown-btn');
        btn.setAttribute('disabled', 'true');

        var cooldownInterval = setInterval(function() {
            if (!game.coolingDown || !game.started) {
                clearInterval(cooldownInterval);
                return;
            }
            var remaining = Math.ceil((game.cooldownEndTime - Date.now()) / 1000);
            if (remaining > 0) {
                btn.textContent = '❄️ 冷却中... ' + remaining + '秒';
            }
        }, 500);

        showToast('熔炉冷却中...30秒后所有层降温100℃', 'info');
        updateFurnaceUI();
    }

    async function forgeEquipment() {
        var mat1 = game.forgeSlots[0];
        var mat2 = game.forgeSlots[1];
        if (!mat1 || !mat2) return;

        var forgeTemp = parseInt(document.getElementById('forge-temp-slider').value);

        try {
            var response = await fetch(API_BASE + '/alchemy/forging/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    material_1: mat1,
                    material_2: mat2,
                    forging_temp: forgeTemp,
                }),
            });
            var result = await response.json();

            if (result.code !== 0) {
                showToast(result.message, 'error');
                return;
            }

            var data = result.data;

            game.inventory[mat1]--;
            game.inventory[mat2]--;
            if (game.inventory[mat1] < 0) game.inventory[mat1] = 0;
            if (game.inventory[mat2] < 0) game.inventory[mat2] = 0;

            game.score += data.final_score;
            game.forgedEquipment.push({
                name: data.equipment_name,
                quality: data.quality,
                score: data.final_score,
                deviation: data.deviation,
            });

            game.forgeSlots = [null, null];

            showToast('锻造成功：' + data.equipment_name + ' [' + data.quality + '] +' + data.final_score + '分', 'success');
            updateAllUI();

        } catch (e) {
            showToast('锻造请求失败', 'error');
        }
    }

    function loadLeaderboard() {
        fetch(API_BASE + '/alchemy/leaderboard/get?limit=20')
            .then(function(r) { return r.json(); })
            .then(function(result) {
                var list = document.getElementById('leaderboard-list');
                list.innerHTML = '';
                if (result.code === 0 && result.data) {
                    result.data.forEach(function(item, idx) {
                        var row = document.createElement('div');
                        row.className = 'leaderboard-row';
                        row.innerHTML =
                            '<span class="leaderboard-rank">' + (idx + 1) + '</span>' +
                            '<span class="leaderboard-name">' + item.player_name + '</span>' +
                            '<span class="leaderboard-score">' + item.score + '分</span>';
                        list.appendChild(row);
                    });
                }
                document.getElementById('leaderboard-modal').classList.add('active');
            })
            .catch(function() {
                showToast('加载排行榜失败', 'error');
            });
    }

    function loadRecipes() {
        fetch(API_BASE + '/alchemy/recipe/get')
            .then(function(r) { return r.json(); })
            .then(function(result) {
                if (result.code === 0 && result.data) {
                    game.recipes = result.data;
                }
            })
            .catch(function() {});
    }

    function setupDragAndDrop() {
        var materialItems = document.querySelectorAll('.material-item');
        materialItems.forEach(function(item) {
            item.addEventListener('dragstart', function(e) {
                if (!game.started) {
                    e.preventDefault();
                    showToast('请先开始游戏', 'warning');
                    return;
                }
                var type = item.getAttribute('data-type');
                var category = item.getAttribute('data-category');
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: type, category: category }));
                e.dataTransfer.effectAllowed = 'copy';
                item.classList.add('dragging');
            });
            item.addEventListener('dragend', function() {
                item.classList.remove('dragging');
            });
        });

        var inventoryItems = document.querySelectorAll('.inventory-item');
        inventoryItems.forEach(function(item) {
            item.addEventListener('dragstart', function(e) {
                if (!game.started) {
                    e.preventDefault();
                    return;
                }
                var metal = item.getAttribute('data-metal');
                if (!game.inventory[metal] || game.inventory[metal] <= 0) {
                    e.preventDefault();
                    showToast('库存不足', 'warning');
                    return;
                }
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: metal, category: 'metal' }));
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        var dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach(function(zone) {
            zone.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                zone.classList.add('drag-hover');
            });
            zone.addEventListener('dragleave', function() {
                zone.classList.remove('drag-hover');
            });
            zone.addEventListener('drop', function(e) {
                e.preventDefault();
                zone.classList.remove('drag-hover');
                try {
                    var data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    var accept = zone.getAttribute('data-accept');
                    var layerEl = zone.closest('.furnace-layer');
                    var layerIdx = parseInt(layerEl.getAttribute('data-layer'));

                    if (accept === 'ore' && data.category === 'ore') {
                        addOreToLayer(layerIdx, data.type);
                    } else if (accept === 'fuel' && data.category === 'fuel') {
                        addFuelToLayer(layerIdx, data.type);
                    }
                } catch (err) {}
            });
        });

        var furnaceLayers = document.querySelectorAll('.furnace-layer');
        furnaceLayers.forEach(function(layerEl) {
            layerEl.addEventListener('dragover', function(e) {
                e.preventDefault();
                layerEl.classList.add('drag-over');
            });
            layerEl.addEventListener('dragleave', function() {
                layerEl.classList.remove('drag-over');
            });
            layerEl.addEventListener('drop', function(e) {
                e.preventDefault();
                layerEl.classList.remove('drag-over');
                try {
                    var data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    var layerIdx = parseInt(layerEl.getAttribute('data-layer'));

                    if (data.category === 'ore') {
                        addOreToLayer(layerIdx, data.type);
                    } else if (data.category === 'fuel') {
                        addFuelToLayer(layerIdx, data.type);
                    }
                } catch (err) {}
            });

            var oreZone = layerEl.querySelector('.ore-slot .drop-zone');
            if (oreZone) {
                oreZone.addEventListener('dblclick', function() {
                    var layerIdx = parseInt(layerEl.getAttribute('data-layer'));
                    var f = game.furnace[layerIdx];
                    if (f && f.ore && !f.smelting) {
                        showToast(ORE_CONFIG[f.ore].name + ' 已移除', 'info');
                        f.ore = null;
                        updateFurnaceUI();
                    }
                });
            }
        });

        var forgeDropZones = document.querySelectorAll('.forge-drop-zone');
        forgeDropZones.forEach(function(zone, idx) {
            zone.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                zone.classList.add('drag-hover');
            });
            zone.addEventListener('dragleave', function() {
                zone.classList.remove('drag-hover');
            });
            zone.addEventListener('drop', function(e) {
                e.preventDefault();
                zone.classList.remove('drag-hover');
                try {
                    var data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (data.category === 'metal') {
                        game.forgeSlots[idx] = data.type;
                        updateForgeSlotsUI();
                    }
                } catch (err) {}
            });
        });

        var forgeSlots = document.querySelectorAll('.forge-drop-zone');
        forgeSlots.forEach(function(slot, idx) {
            slot.addEventListener('dblclick', function() {
                game.forgeSlots[idx] = null;
                updateForgeSlotsUI();
            });
        });
    }

    function init() {
        initFurnace();
        setupDragAndDrop();
        loadRecipes();

        document.getElementById('start-btn').addEventListener('click', startGame);
        document.getElementById('cooldown-btn').addEventListener('click', startCooldown);
        document.getElementById('forge-btn').addEventListener('click', forgeEquipment);

        document.getElementById('forge-temp-slider').addEventListener('input', function() {
            document.getElementById('forge-temp-value').textContent = this.value;
        });

        document.getElementById('close-leaderboard').addEventListener('click', function() {
            document.getElementById('leaderboard-modal').classList.remove('active');
        });

        document.getElementById('view-leaderboard-btn').addEventListener('click', function() {
            document.getElementById('game-over-modal').classList.remove('active');
            loadLeaderboard();
        });

        document.getElementById('play-again-btn').addEventListener('click', function() {
            document.getElementById('game-over-modal').classList.remove('active');
            document.getElementById('player-name').value = game.playerName;
        });

        updateAllUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
