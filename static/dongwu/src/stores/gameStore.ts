import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Animal, Course, Food, Weather, TimeOfDay } from '../types';
import { initialAnimals, createAnimal, animalTemplates } from '../data/animals';
import { foods, getFoodById } from '../data/foods';
import { courses, talentBonus } from '../data/courses';
import { activities } from '../data/decorations';

const STORAGE_KEY = 'animal-kindergarten-game';

function loadFromStorage(): any {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveToStorage(state: any): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

function getRandomWeather(): Weather {
  const weathers: Weather[] = ['sunny', 'sunny', 'sunny', 'cloudy', 'rainy'];
  return weathers[Math.floor(Math.random() * weathers.length)];
}

export const useGameStore = defineStore('game', () => {
  const savedData = loadFromStorage();

  const coins = ref(savedData?.coins ?? 500);
  const day = ref(savedData?.day ?? 1);
  const timeOfDay = ref<TimeOfDay>(savedData?.timeOfDay ?? 'morning');
  const weather = ref<Weather>(savedData?.weather ?? getRandomWeather());
  const animals = ref<Animal[]>(savedData?.animals ?? initialAnimals);
  const inventory = ref<Record<string, number>>(savedData?.inventory ?? getInitialInventory());
  const decorations = ref<string[]>(savedData?.decorations ?? []);
  const toys = ref<string[]>(savedData?.toys ?? []);
  const totalGraduated = ref(savedData?.totalGraduated ?? 0);
  const gameStartTime = ref(savedData?.gameStartTime ?? Date.now());
  const selectedAnimalId = ref<string | null>(null);
  const isDoingActivity = ref(false);
  const currentActivity = ref<string | null>(null);
  const notifications = ref<Array<{ id: number; message: string; type: string }>>([]);

  function getInitialInventory(): Record<string, number> {
    const inv: Record<string, number> = {};
    foods.slice(0, 6).forEach(f => {
      inv[f.id] = 5;
    });
    return inv;
  }

  const selectedAnimal = computed(() => {
    return animals.value.find(a => a.id === selectedAnimalId.value) || null;
  });

  const activeAnimals = computed(() => {
    return animals.value.filter(a => !a.isGraduated);
  });

  const graduatedAnimals = computed(() => {
    return animals.value.filter(a => a.isGraduated);
  });

  function addNotification(message: string, type: 'success' | 'info' | 'warning' = 'info') {
    const id = Date.now();
    notifications.value.push({ id, message, type });
    setTimeout(() => {
      notifications.value = notifications.value.filter(n => n.id !== id);
    }, 3000);
  }

  function selectAnimal(id: string | null) {
    selectedAnimalId.value = id;
  }

  function feedAnimal(animalId: string, foodId: string) {
    const animal = animals.value.find(a => a.id === animalId);
    const food = getFoodById(foodId);
    
    if (!animal || !food) return false;
    if ((inventory.value[foodId] ?? 0) <= 0) {
      addNotification('食物不足！', 'warning');
      return false;
    }
    if (animal.isSleeping) {
      addNotification(`${animal.name}正在睡觉呢~`, 'info');
      return false;
    }

    inventory.value[foodId]--;
    
    let happinessBonus = food.happinessBonus;
    if (animal.favoriteFood === foodId) {
      happinessBonus *= 2;
      addNotification(`${animal.name}最喜欢${food.name}了！好感度大幅提升！`, 'success');
    }
    
    animal.hunger = Math.min(100, animal.hunger + food.hungerRestore);
    animal.happiness = Math.min(100, animal.happiness + happinessBonus);
    animal.affection = Math.min(100, animal.affection + 3);
    animal.lastFed = Date.now();

    const tip = Math.floor(Math.random() * 10) + 5;
    coins.value += tip;
    addNotification(`喂食成功！家长给了 ${tip} 金币小费~`, 'success');

    return true;
  }

  function attendClass(animalId: string, courseId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const animal = animals.value.find(a => a.id === animalId);
      const course = courses.find(c => c.id === courseId);
      
      if (!animal || !course) {
        resolve(false);
        return;
      }
      if (animal.energy < course.energyCost) {
        addNotification(`${animal.name}太累了，需要休息！`, 'warning');
        resolve(false);
        return;
      }
      if (animal.level < course.minLevel) {
        addNotification(`需要等级 ${course.minLevel} 才能上这门课！`, 'warning');
        resolve(false);
        return;
      }
      if (animal.isSleeping) {
        addNotification(`${animal.name}正在睡觉呢~`, 'info');
        resolve(false);
        return;
      }

      isDoingActivity.value = true;
      currentActivity.value = courseId;

      setTimeout(() => {
        let expGain = course.expGain;
        let intGain = course.intelligenceGain;
        let happyChange = course.happinessChange;

        const talentType = talentBonus[animal.talent];
        if (talentType === 'all' || talentType === course.type) {
          expGain = Math.floor(expGain * 1.5);
          intGain = Math.floor(intGain * 1.5);
          addNotification(`${animal.talent}天赋发挥作用！学习效果提升50%！`, 'success');
        }

        if (weather.value === 'sunny') {
          expGain = Math.floor(expGain * 1.2);
        }

        animal.energy -= course.energyCost;
        animal.exp += expGain;
        animal.intelligence = Math.min(100, animal.intelligence + intGain);
        animal.happiness = Math.max(0, Math.min(100, animal.happiness + happyChange));

        if (animal.exp >= animal.maxExp) {
          levelUpAnimal(animal);
        }

        isDoingActivity.value = false;
        currentActivity.value = null;
        addNotification(`${animal.name}完成了${course.name}！经验+${expGain}`, 'success');

        checkGraduation(animal);
        resolve(true);
      }, course.duration);
    });
  }

  function levelUpAnimal(animal: Animal) {
    animal.level++;
    animal.exp -= animal.maxExp;
    animal.maxExp = Math.floor(animal.maxExp * 1.3);
    animal.happiness = Math.min(100, animal.happiness + 20);
    animal.energy = Math.min(100, animal.energy + 30);

    const newActions = ['翻滚', '转圈', '打招呼', '唱歌', '跳舞'];
    if (animal.actions.length < newActions.length + 1) {
      const newAction = newActions[animal.actions.length - 1];
      if (newAction) {
        animal.actions.push(newAction);
        addNotification(`${animal.name}学会了新动作：${newAction}！`, 'success');
      }
    }

    const coinReward = animal.level * 20;
    coins.value += coinReward;
    addNotification(`🎉 ${animal.name}升级到 Lv.${animal.level}！获得 ${coinReward} 金币！`, 'success');
  }

  function checkGraduation(animal: Animal) {
    if (animal.level >= 10 && animal.intelligence >= 80 && animal.happiness >= 70) {
      animal.isGraduated = true;
      totalGraduated.value++;
      const reward = 500 + animal.level * 50;
      coins.value += reward;
      addNotification(`🎓 ${animal.name}毕业啦！获得 ${reward} 金币奖励！`, 'success');
    }
  }

  function playWithAnimal(animalId: string) {
    const animal = animals.value.find(a => a.id === animalId);
    if (!animal) return false;
    if (animal.energy < 10) {
      addNotification(`${animal.name}太累了，需要休息！`, 'warning');
      return false;
    }
    if (animal.isSleeping) {
      addNotification(`${animal.name}正在睡觉呢~`, 'info');
      return false;
    }

    animal.energy -= 10;
    animal.happiness = Math.min(100, animal.happiness + 15);
    animal.affection = Math.min(100, animal.affection + 5);
    animal.lastPlayed = Date.now();
    animal.hunger = Math.max(0, animal.hunger - 5);

    addNotification(`和${animal.name}玩耍了一会儿~`, 'success');
    return true;
  }

  function putAnimalToSleep(animalId: string) {
    const animal = animals.value.find(a => a.id === animalId);
    if (!animal) return;
    animal.isSleeping = true;
    addNotification(`${animal.name}睡着了... 💤`, 'info');
    
    setTimeout(() => {
      animal.isSleeping = false;
      animal.energy = Math.min(100, animal.energy + 40);
      animal.happiness = Math.min(100, animal.happiness + 10);
      addNotification(`${animal.name}睡醒了！精力恢复~ ☀️`, 'success');
    }, 5000);
  }

  function buyItem(itemType: 'food' | 'decoration' | 'toy', itemId: string, price: number): boolean {
    if (coins.value < price) {
      addNotification('金币不足！', 'warning');
      return false;
    }

    coins.value -= price;

    if (itemType === 'food') {
      inventory.value[itemId] = (inventory.value[itemId] ?? 0) + 1;
      const food = getFoodById(itemId);
      addNotification(`购买了 ${food?.name}！`, 'success');
    } else if (itemType === 'decoration') {
      if (!decorations.value.includes(itemId)) {
        decorations.value.push(itemId);
      }
      addNotification('购买了新装饰！', 'success');
    } else if (itemType === 'toy') {
      if (!toys.value.includes(itemId)) {
        toys.value.push(itemId);
      }
      addNotification('购买了新玩具！', 'success');
    }

    return true;
  }

  function holdActivity(activityId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const activity = activities.find(a => a.id === activityId);
      if (!activity) {
        resolve(false);
        return;
      }

      isDoingActivity.value = true;
      currentActivity.value = activityId;

      setTimeout(() => {
        coins.value += activity.coinReward;
        activeAnimals.value.forEach(animal => {
          animal.happiness = Math.min(100, animal.happiness + activity.happinessBonus);
        });
        isDoingActivity.value = false;
        currentActivity.value = null;
        addNotification(`🎉 ${activity.name}圆满结束！获得 ${activity.coinReward} 金币！`, 'success');
        resolve(true);
      }, activity.duration);
    });
  }

  function advanceTime() {
    if (timeOfDay.value === 'morning') {
      timeOfDay.value = 'afternoon';
    } else if (timeOfDay.value === 'afternoon') {
      timeOfDay.value = 'evening';
    } else {
      timeOfDay.value = 'morning';
      day.value++;
      weather.value = getRandomWeather();
      
      activeAnimals.value.forEach(animal => {
        animal.hunger = Math.max(0, animal.hunger - 15);
        animal.energy = Math.min(100, animal.energy + 20);
      });

      if (Math.random() < 0.3 && activeAnimals.value.length < 6) {
        const newId = `animal-${Date.now()}`;
        const newAnimal = createAnimal(newId);
        animals.value.push(newAnimal);
        addNotification(`🎊 新同学 ${newAnimal.name} 来幼儿园啦！`, 'success');
      }

      addNotification(`第 ${day.value} 天开始了！`, 'info');
    }
  }

  function resetGame() {
    coins.value = 500;
    day.value = 1;
    timeOfDay.value = 'morning';
    weather.value = getRandomWeather();
    animals.value = initialAnimals.map((a, i) => createAnimal(`animal-${i + 1}`, animalTemplates.find(t => t.type === a.type)));
    inventory.value = getInitialInventory();
    decorations.value = [];
    toys.value = [];
    totalGraduated.value = 0;
    gameStartTime.value = Date.now();
    localStorage.removeItem(STORAGE_KEY);
    addNotification('游戏已重置！', 'info');
  }

  const stateToSave = computed(() => ({
    coins: coins.value,
    day: day.value,
    timeOfDay: timeOfDay.value,
    weather: weather.value,
    animals: animals.value,
    inventory: inventory.value,
    decorations: decorations.value,
    toys: toys.value,
    totalGraduated: totalGraduated.value,
    gameStartTime: gameStartTime.value,
    lastSave: Date.now(),
  }));

  watch(stateToSave, (newState) => {
    saveToStorage(newState);
  }, { deep: true });

  setInterval(() => {
    saveToStorage(stateToSave.value);
  }, 30000);

  return {
    coins,
    day,
    timeOfDay,
    weather,
    animals,
    inventory,
    decorations,
    toys,
    totalGraduated,
    gameStartTime,
    selectedAnimalId,
    selectedAnimal,
    activeAnimals,
    graduatedAnimals,
    isDoingActivity,
    currentActivity,
    notifications,
    selectAnimal,
    feedAnimal,
    attendClass,
    playWithAnimal,
    putAnimalToSleep,
    buyItem,
    holdActivity,
    advanceTime,
    resetGame,
    addNotification,
  };
});
