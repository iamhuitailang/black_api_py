import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ShopItem } from '@/types/game';
import { CHARACTERS, ITEM_PRICES, ITEM_NAMES, ITEM_DESCRIPTIONS } from '@/utils/constants';
import { useGameStore } from './gameStore';

export const useShopStore = defineStore('shop', () => {
  const gameStore = useGameStore();

  const shopItems = ref<ShopItem[]>([
    { id: 'health', name: ITEM_NAMES.health, type: 'item', price: ITEM_PRICES.health, description: ITEM_DESCRIPTIONS.health, owned: false, icon: '❤️' },
    { id: 'invincible', name: ITEM_NAMES.invincible, type: 'item', price: ITEM_PRICES.invincible, description: ITEM_DESCRIPTIONS.invincible, owned: false, icon: '⭐' },
    { id: 'speed', name: ITEM_NAMES.speed, type: 'item', price: ITEM_PRICES.speed, description: ITEM_DESCRIPTIONS.speed, owned: false, icon: '👟' },
    { id: 'power', name: ITEM_NAMES.power, type: 'item', price: ITEM_PRICES.power, description: ITEM_DESCRIPTIONS.power, owned: false, icon: '💪' },
    { id: 'shield', name: ITEM_NAMES.shield, type: 'item', price: ITEM_PRICES.shield, description: ITEM_DESCRIPTIONS.shield, owned: false, icon: '🛡️' },
    { id: 'ninja', name: CHARACTERS.ninja.name, type: 'character', price: CHARACTERS.ninja.price || 500, description: CHARACTERS.ninja.description, owned: false, icon: '🥷' },
    { id: 'knight', name: CHARACTERS.knight.name, type: 'character', price: CHARACTERS.knight.price || 800, description: CHARACTERS.knight.description, owned: false, icon: '🛡️' },
    { id: 'mage', name: CHARACTERS.mage.name, type: 'character', price: CHARACTERS.mage.price || 1000, description: CHARACTERS.mage.description, owned: false, icon: '🧙' }
  ]);

  const itemInventory = computed(() => {
    return shopItems.value.filter(item => 
      item.type === 'item' && gameStore.inventory.includes(item.id)
    );
  });

  const characterShopItems = computed(() => {
    return shopItems.value.filter(item => item.type === 'character').map(item => ({
      ...item,
      owned: gameStore.unlockedCharacters.includes(item.id)
    }));
  });

  const consumableShopItems = computed(() => {
    return shopItems.value.filter(item => item.type === 'item');
  });

  function purchaseItem(itemId: string): { success: boolean; message: string } {
    const item = shopItems.value.find(i => i.id === itemId);
    if (!item) return { success: false, message: '商品不存在' };

    if (item.type === 'character') {
      if (gameStore.unlockedCharacters.includes(itemId)) {
        return { success: false, message: '已拥有该角色' };
      }
      if (gameStore.spendCoins(item.price)) {
        gameStore.unlockCharacter(itemId);
        return { success: true, message: `成功解锁 ${item.name}！` };
      }
      return { success: false, message: '金币不足' };
    } else {
      if (gameStore.spendCoins(item.price)) {
        gameStore.addToInventory(itemId);
        return { success: true, message: `成功购买 ${item.name}！` };
      }
      return { success: false, message: '金币不足' };
    }
  }

  function useItem(itemId: string): { success: boolean; message: string; effect?: string } {
    const item = shopItems.value.find(i => i.id === itemId);
    if (!item || item.type !== 'item') return { success: false, message: '道具不存在' };

    if (gameStore.removeFromInventory(itemId)) {
      return { success: true, message: `使用了 ${item.name}`, effect: itemId };
    }
    return { success: false, message: '没有该道具' };
  }

  function isItemOwned(itemId: string): boolean {
    const item = shopItems.value.find(i => i.id === itemId);
    if (!item) return false;
    if (item.type === 'character') {
      return gameStore.unlockedCharacters.includes(itemId);
    }
    return gameStore.inventory.includes(itemId);
  }

  function getItemCount(itemId: string): number {
    return gameStore.inventory.filter(id => id === itemId).length;
  }

  function canAfford(price: number): boolean {
    return gameStore.totalCoins >= price;
  }

  return {
    shopItems,
    itemInventory,
    characterShopItems,
    consumableShopItems,
    purchaseItem,
    useItem,
    isItemOwned,
    getItemCount,
    canAfford
  };
});
