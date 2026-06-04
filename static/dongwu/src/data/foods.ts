import type { Food } from '../types';

export const foods: Food[] = [
  { id: 'carrot', name: '胡萝卜', emoji: '🥕', category: 'vegetable', price: 10, hungerRestore: 25, happinessBonus: 5 },
  { id: 'apple', name: '苹果', emoji: '🍎', category: 'fruit', price: 15, hungerRestore: 20, happinessBonus: 10 },
  { id: 'banana', name: '香蕉', emoji: '🍌', category: 'fruit', price: 12, hungerRestore: 22, happinessBonus: 8 },
  { id: 'grape', name: '葡萄', emoji: '🍇', category: 'fruit', price: 18, hungerRestore: 18, happinessBonus: 12 },
  { id: 'berry', name: '草莓', emoji: '🍓', category: 'fruit', price: 20, hungerRestore: 20, happinessBonus: 15 },
  { id: 'milk', name: '牛奶', emoji: '🥛', category: 'dairy', price: 15, hungerRestore: 25, happinessBonus: 8 },
  { id: 'cheese', name: '奶酪', emoji: '🧀', category: 'dairy', price: 25, hungerRestore: 30, happinessBonus: 15 },
  { id: 'yogurt', name: '酸奶', emoji: '🥛', category: 'dairy', price: 20, hungerRestore: 25, happinessBonus: 12 },
  { id: 'fish', name: '小鱼', emoji: '🐟', category: 'meat', price: 30, hungerRestore: 35, happinessBonus: 10 },
  { id: 'chicken', name: '鸡肉', emoji: '🍗', category: 'meat', price: 35, hungerRestore: 40, happinessBonus: 12 },
  { id: 'beef', name: '牛肉', emoji: '🥩', category: 'meat', price: 40, hungerRestore: 45, happinessBonus: 15 },
  { id: 'bone', name: '骨头', emoji: '🦴', category: 'meat', price: 20, hungerRestore: 30, happinessBonus: 18 },
  { id: 'honey', name: '蜂蜜', emoji: '🍯', category: 'snack', price: 35, hungerRestore: 20, happinessBonus: 25 },
  { id: 'cookie', name: '小饼干', emoji: '🍪', category: 'snack', price: 25, hungerRestore: 15, happinessBonus: 20 },
  { id: 'cake', name: '小蛋糕', emoji: '🍰', category: 'snack', price: 45, hungerRestore: 25, happinessBonus: 30 },
  { id: 'candy', name: '糖果', emoji: '🍬', category: 'snack', price: 15, hungerRestore: 10, happinessBonus: 22 },
  { id: 'sunflower', name: '瓜子', emoji: '🌻', category: 'snack', price: 12, hungerRestore: 15, happinessBonus: 10 },
  { id: 'bamboo', name: '竹笋', emoji: '🎋', category: 'vegetable', price: 25, hungerRestore: 35, happinessBonus: 8 },
  { id: 'cabbage', name: '卷心菜', emoji: '🥬', category: 'vegetable', price: 10, hungerRestore: 20, happinessBonus: 5 },
  { id: 'shrimp', name: '小虾', emoji: '🦐', category: 'meat', price: 35, hungerRestore: 35, happinessBonus: 15 },
];

export const getFoodById = (id: string): Food | undefined => {
  return foods.find(f => f.id === id);
};
