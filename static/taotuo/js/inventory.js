const Inventory = (function() {
    let items = [];
    let selectedItem = null;
    let combineMode = false;
    let combineFirstItem = null;
    let maxSlots = 8;
    let onItemSelectCallback = null;
    let onItemUseCallback = null;
    
    function init(callbacks = {}) {
        items = [];
        selectedItem = null;
        combineMode = false;
        combineFirstItem = null;
        onItemSelectCallback = callbacks.onSelect;
        onItemUseCallback = callbacks.onUse;
        render();
    }
    
    function addItem(itemId) {
        if (items.length >= maxSlots) {
            Utils.showMessage('背包已满！', 'warning');
            return false;
        }
        
        const existingItem = items.find(i => i.id === itemId);
        if (existingItem) {
            existingItem.count = (existingItem.count || 1) + 1;
        } else {
            const item = Items.getItem(itemId);
            if (item) {
                items.push({ ...item, count: 1 });
            } else {
                return false;
            }
        }
        
        render();
        return true;
    }
    
    function removeItem(itemId, count = 1) {
        const index = items.findIndex(i => i.id === itemId);
        if (index === -1) return false;
        
        const item = items[index];
        item.count -= count;
        
        if (item.count <= 0) {
            items.splice(index, 1);
            if (selectedItem && selectedItem.id === itemId) {
                selectedItem = null;
            }
        }
        
        render();
        return true;
    }
    
    function hasItem(itemId) {
        return items.some(i => i.id === itemId);
    }
    
    function getItemCount(itemId) {
        const item = items.find(i => i.id === itemId);
        return item ? item.count : 0;
    }
    
    function getItems() {
        return [...items];
    }
    
    function getSelectedItem() {
        return selectedItem;
    }
    
    function selectItem(itemId) {
        if (combineMode) {
            handleCombineSelect(itemId);
            return;
        }
        
        const item = items.find(i => i.id === itemId);
        if (item) {
            if (selectedItem && selectedItem.id === itemId) {
                selectedItem = null;
            } else {
                selectedItem = item;
                if (onItemSelectCallback) {
                    onItemSelectCallback(item);
                }
            }
            render();
        }
    }
    
    function useItem(itemId) {
        const item = items.find(i => i.id === itemId);
        if (!item) return false;
        
        if (onItemUseCallback) {
            return onItemUseCallback(item);
        }
        return false;
    }
    
    function startCombineMode() {
        combineMode = true;
        combineFirstItem = null;
        showCombineIndicator();
        Utils.showMessage('选择第一个要组合的道具', 'info');
    }
    
    function cancelCombineMode() {
        combineMode = false;
        combineFirstItem = null;
        hideCombineIndicator();
        render();
    }
    
    function handleCombineSelect(itemId) {
        const item = items.find(i => i.id === itemId);
        if (!item) return;
        
        if (!combineFirstItem) {
            combineFirstItem = item;
            Utils.showMessage(`已选择 ${item.name}，选择第二个道具`, 'info');
            render();
        } else if (combineFirstItem.id === itemId) {
            combineFirstItem = null;
            Utils.showMessage('取消选择，重新选择第一个道具', 'info');
            render();
        } else {
            tryCombine(combineFirstItem.id, itemId);
        }
    }
    
    function tryCombine(item1Id, item2Id) {
        const result = Items.tryCombine(item1Id, item2Id);
        
        if (result.success) {
            removeItem(item1Id);
            removeItem(item2Id);
            addItem(result.result);
            Utils.showMessage(result.message, 'success');
        } else {
            Utils.showMessage(result.message, 'warning');
        }
        
        cancelCombineMode();
    }
    
    function showCombineIndicator() {
        let indicator = document.querySelector('.combine-mode');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'combine-mode';
            indicator.innerHTML = '🔧 道具组合模式 - 点击道具进行组合';
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'block';
    }
    
    function hideCombineIndicator() {
        const indicator = document.querySelector('.combine-mode');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    function render() {
        const slotsContainer = document.getElementById('inventory-slots');
        if (!slotsContainer) return;
        
        slotsContainer.innerHTML = '';
        
        for (let i = 0; i < maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            
            if (items[i]) {
                const item = items[i];
                slot.textContent = item.icon;
                slot.dataset.itemId = item.id;
                
                if (selectedItem && selectedItem.id === item.id) {
                    slot.classList.add('selected');
                }
                
                if (combineMode && combineFirstItem && combineFirstItem.id === item.id) {
                    slot.classList.add('selected');
                }
                
                if (item.count > 1) {
                    const count = document.createElement('span');
                    count.className = 'item-count';
                    count.textContent = item.count;
                    slot.appendChild(count);
                }
                
                slot.addEventListener('click', () => selectItem(item.id));
            }
            
            slotsContainer.appendChild(slot);
        }
    }
    
    function clear() {
        items = [];
        selectedItem = null;
        combineMode = false;
        combineFirstItem = null;
        hideCombineIndicator();
        render();
    }
    
    function isCombineMode() {
        return combineMode;
    }
    
    function setCallbacks(callbacks) {
        if (callbacks.onSelect) onItemSelectCallback = callbacks.onSelect;
        if (callbacks.onUse) onItemUseCallback = callbacks.onUse;
    }
    
    function getState() {
        return {
            items: items.map(i => ({ id: i.id, count: i.count })),
            selectedItemId: selectedItem ? selectedItem.id : null
        };
    }
    
    function restoreState(state) {
        if (!state) return;
        
        items = [];
        if (state.items) {
            state.items.forEach(savedItem => {
                const item = Items.getItem(savedItem.id);
                if (item) {
                    items.push({ ...item, count: savedItem.count || 1 });
                }
            });
        }
        
        if (state.selectedItemId) {
            selectedItem = items.find(i => i.id === state.selectedItemId) || null;
        } else {
            selectedItem = null;
        }
        
        render();
    }
    
    return {
        init,
        addItem,
        removeItem,
        hasItem,
        getItemCount,
        getItems,
        getSelectedItem,
        selectItem,
        useItem,
        startCombineMode,
        cancelCombineMode,
        render,
        clear,
        isCombineMode,
        setCallbacks,
        getState,
        restoreState
    };
})();
