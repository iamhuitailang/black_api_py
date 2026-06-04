import type { Animal, AnimalType, Personality, Talent } from '../types';

const animalTemplates: Array<{
  type: AnimalType;
  emoji: string;
  color: string;
  names: string[];
  personalities: Personality[];
  talents: Talent[];
  favoriteFoods: string[];
}> = [
  {
    type: 'rabbit',
    emoji: '🐰',
    color: '#FFB6C1',
    names: ['雪球', '棉花糖', '毛毛', '小白', '雪球'],
    personalities: ['温柔', '安静', '活泼'],
    talents: ['绘画', '音乐', '全能'],
    favoriteFoods: ['carrot', 'apple', 'cabbage']
  },
  {
    type: 'cat',
    emoji: '🐱',
    color: '#FFA07A',
    names: ['咪咪', '橘橘', '花花', '咪咪子', '小橘'],
    personalities: ['调皮', '好奇', '安静'],
    talents: ['认知', '音乐', '全能'],
    favoriteFoods: ['fish', 'chicken', 'milk']
  },
  {
    type: 'dog',
    emoji: '🐶',
    color: '#DEB887',
    names: ['旺财', '小黄', '豆豆', '阿黄', '毛毛'],
    personalities: ['活泼', '忠诚', '贪吃'],
    talents: ['运动', '全能'],
    favoriteFoods: ['bone', 'beef', 'cookie']
  },
  {
    type: 'bear',
    emoji: '🐻',
    color: '#8B4513',
    names: ['熊熊', '蜂蜜', '棕棕', '憨憨', '小熊'],
    personalities: ['贪吃', '温柔', '安静'],
    talents: ['运动', '绘画', '全能'],
    favoriteFoods: ['honey', 'berry', 'fish']
  },
  {
    type: 'panda',
    emoji: '🐼',
    color: '#2F4F4F',
    names: ['团团', '圆圆', '竹子', '萌萌', '滚滚'],
    personalities: ['安静', '温柔', '贪吃'],
    talents: ['认知', '绘画', '全能'],
    favoriteFoods: ['bamboo', 'apple', 'milk']
  },
  {
    type: 'fox',
    emoji: '🦊',
    color: '#FF6B35',
    names: ['小狐', '灵灵', '火火', '红红', '狐狸'],
    personalities: ['聪明', '好奇', '调皮'],
    talents: ['认知', '音乐', '全能'],
    favoriteFoods: ['chicken', 'berry', 'grape']
  },
  {
    type: 'hamster',
    emoji: '🐹',
    color: '#D2B48C',
    names: ['仓仓', '瓜子', '小球', '胖胖', '米粒'],
    personalities: ['活泼', '贪吃', '好奇'],
    talents: ['运动', '认知'],
    favoriteFoods: ['sunflower', 'cookie', 'apple']
  },
  {
    type: 'penguin',
    emoji: '🐧',
    color: '#4169E1',
    names: ['企企', '鹅鹅', '冰冰', '滑滑', '小企'],
    personalities: ['安静', '温柔', '活泼'],
    talents: ['音乐', '运动', '全能'],
    favoriteFoods: ['fish', 'shrimp', 'squid']
  }
];

export function createAnimal(
  id: string, template?: typeof animalTemplates[0]): Animal {
  const tpl = template || animalTemplates[Math.floor(Math.random() * animalTemplates.length)];
  const name = tpl.names[Math.floor(Math.random() * tpl.names.length)];
  const personality = tpl.personalities[Math.floor(Math.random() * tpl.personalities.length)];
  const talent = tpl.talents[Math.floor(Math.random() * tpl.talents.length)];
  const favoriteFood = tpl.favoriteFoods[Math.floor(Math.random() * tpl.favoriteFoods.length)];

  return {
    id,
    name,
    type: tpl.type,
    emoji: tpl.emoji,
    color: tpl.color,
    level: 1,
    exp: 0,
    maxExp: 100,
    happiness: 80,
    intelligence: 20,
    energy: 100,
    hunger: 80,
    affection: 50,
    personality,
    favoriteFood,
    talent,
    isSleeping: false,
    isGraduated: false,
    lastFed: Date.now(),
    lastPlayed: Date.now(),
    actions: ['跳跃'],
    skills: []
  };
}

export const initialAnimals: Animal[] = [
  createAnimal('animal-1', animalTemplates[0]),
  createAnimal('animal-2', animalTemplates[2]),
  createAnimal('animal-3', animalTemplates[4]),
];

export { animalTemplates };
