import type { Decoration, Toy, Activity } from '../types';

export const decorations: Decoration[] = [
  { id: 'flower', name: '小花盆', emoji: '🌸', price: 50, description: '可爱的小花，让园区更美丽', isPurchased: false },
  { id: 'tree', name: '小树', emoji: '🌳', price: 100, description: '绿油油的小树，提供阴凉', isPurchased: false },
  { id: 'swing', name: '秋千', emoji: '🎠', price: 200, description: '小动物们最爱的秋千', isPurchased: false },
  { id: 'balloon', name: '气球', emoji: '🎈', price: 80, description: '彩色气球，增加欢乐气氛', isPurchased: false },
  { id: 'fountain', name: '小喷泉', emoji: '⛲', price: 300, description: '清凉的小喷泉', isPurchased: false },
  { id: 'rainbow', name: '彩虹拱门', emoji: '🌈', price: 500, description: '美丽的彩虹装饰', isPurchased: false },
  { id: 'stars', name: '星星灯', emoji: '✨', price: 150, description: '闪闪发光的星星灯串', isPurchased: false },
  { id: 'mushroom', name: '蘑菇屋', emoji: '🍄', price: 250, description: '可爱的蘑菇小房子', isPurchased: false },
];

export const toys: Toy[] = [
  { id: 'ball', name: '小皮球', emoji: '⚽', price: 30, happinessBonus: 15, energyCost: 10 },
  { id: 'yarn', name: '毛线球', emoji: '🧶', price: 25, happinessBonus: 12, energyCost: 8 },
  { id: 'block', name: '积木', emoji: '🧱', price: 40, happinessBonus: 18, energyCost: 12 },
  { id: 'kite', name: '风筝', emoji: '🪁', price: 50, happinessBonus: 20, energyCost: 15 },
  { id: 'doll', name: '布娃娃', emoji: '🧸', price: 60, happinessBonus: 22, energyCost: 8 },
  { id: 'drum', name: '小鼓', emoji: '🥁', price: 45, happinessBonus: 16, energyCost: 10 },
];

export const activities: Activity[] = [
  { id: 'graduation', name: '成长典礼', emoji: '🎓', description: '为毕业的小动物举办盛大典礼', coinReward: 200, happinessBonus: 30, duration: 10000 },
  { id: 'talent', name: '才艺表演', emoji: '🎭', description: '让小动物们展示才艺', coinReward: 150, happinessBonus: 25, duration: 8000 },
  { id: 'parent', name: '亲子互动', emoji: '👨‍👩‍👧', description: '邀请家长来和小动物互动', coinReward: 180, happinessBonus: 35, duration: 6000 },
  { id: 'party', name: '欢乐派对', emoji: '🎉', description: '举办欢乐的派对活动', coinReward: 120, happinessBonus: 40, duration: 5000 },
];

export const getDecorationById = (id: string): Decoration | undefined => {
  return decorations.find(d => d.id === id);
};

export const getToyById = (id: string): Toy | undefined => {
  return toys.find(t => t.id === id);
};
