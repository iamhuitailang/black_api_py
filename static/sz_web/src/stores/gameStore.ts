import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  MAP_SIZE,
  INITIAL_MAP_SIZE,
  DEVELOPMENT_STAGES,
  BUILDING_TYPES,
  LANDMARKS,
  POLICIES,
  type TileData
} from '../utils/constants';
import { saveGameState, loadGameState, importGameState } from '../utils/storage';
import { getShareFromUrl } from '../utils/share';
import { playBuildSound, playDemolishSound, playSuccessSound, playErrorSound } from '../utils/sounds';
import { useUiStore } from './uiStore';

export const useGameStore = defineStore('game', () => {
  const cityName = ref('我的城市');
  const developmentStage = ref<keyof typeof DEVELOPMENT_STAGES>('village');
  const day = ref(1);
  const isPaused = ref(false);
  const gameSpeed = ref(1);

  const resources = ref({
    money: 10000,
    population: 0,
    happiness: 70,
    electricity: 0,
    maxElectricity: 0,
    water: 0,
    maxWater: 0
  });

  const mapSize = ref(INITIAL_MAP_SIZE);
  const requestFitMap = ref(0);

  const map = ref<TileData[][]>(
    Array(mapSize.value).fill(null).map(() =>
      Array(mapSize.value).fill(null).map(() => ({
        type: 'grass',
        zone: null,
        building: null,
        level: 0
      }))
    )
  );

  const landmarks = ref<string[]>([]);
  const activePolicies = ref<string[]>([]);
  const notifications = ref<Array<{ id: number; message: string; type: string }>>([]);

  let notificationId = 0;

  const currentStage = computed(() => DEVELOPMENT_STAGES[developmentStage.value]);

  const unlockedBuildings = computed(() => {
    const unlocked: string[] = [];
    for (const [stageKey, stage] of Object.entries(DEVELOPMENT_STAGES)) {
      unlocked.push(...stage.unlocks);
      if (stageKey === developmentStage.value) break;
    }
    return unlocked;
  });

  const unlockedLandmarks = computed(() => {
    return Object.entries(LANDMARKS)
      .filter(([_, landmark]) => {
        const stageOrder = ['village', 'town', 'city', 'metropolis'];
        const currentIdx = stageOrder.indexOf(developmentStage.value);
        const unlockIdx = stageOrder.indexOf(landmark.unlockStage);
        return currentIdx >= unlockIdx;
      })
      .map(([key]) => key);
  });

  function addNotification(message: string, type: string = 'info') {
    const id = notificationId++;
    notifications.value.push({ id, message, type });
    const uiStore = useUiStore();
    if (uiStore.soundEnabled) {
      if (type === 'success' && message.includes('建造完成')) {
        playBuildSound();
      } else if (type === 'success') {
        playSuccessSound();
      } else if (type === 'error') {
        playErrorSound();
      }
    }
    setTimeout(() => {
      const idx = notifications.value.findIndex(n => n.id === id);
      if (idx > -1) notifications.value.splice(idx, 1);
    }, 4000);
  }

  function calculateResources() {
    let totalPop = 0;
    let totalTax = 0;
    let totalElectricity = 0;
    let totalWater = 0;
    let totalMaintenance = 0;
    let happinessBonus = 0;
    let serviceCount = 0;

    for (let y = 0; y < mapSize.value; y++) {
      for (let x = 0; x < mapSize.value; x++) {
        const tile = map.value[y][x];
        if (tile.building) {
          const building = BUILDING_TYPES[tile.building];
          if (building) {
            if (building.populationCapacity) totalPop += building.populationCapacity;
            if (building.taxIncome) totalTax += building.taxIncome;
            if (building.electricityOutput) totalElectricity += building.electricityOutput;
            if (building.waterOutput) totalWater += building.waterOutput;
            if (building.maintenanceCost) totalMaintenance += building.maintenanceCost;
            if (building.happinessEffect) {
              happinessBonus += building.happinessEffect;
              serviceCount++;
            }
          }
        }
      }
    }

    landmarks.value.forEach(key => {
      const landmark = LANDMARKS[key];
      if (landmark) {
        happinessBonus += landmark.happinessEffect;
        if (landmark.taxBonus) totalTax += landmark.taxBonus;
      }
    });

    let taxMultiplier = 1;
    let maintenanceMultiplier = 1;
    let happinessPolicyBonus = 0;

    activePolicies.value.forEach(key => {
      const policy = POLICIES[key];
      if (policy?.effect) {
        if (policy.effect.taxMultiplier) taxMultiplier *= policy.effect.taxMultiplier;
        if (policy.effect.maintenanceMultiplier) maintenanceMultiplier *= policy.effect.maintenanceMultiplier;
        if (policy.effect.happinessBonus) happinessPolicyBonus += policy.effect.happinessBonus;
        if (policy.effect.landmarkMultiplier && landmarks.value.length > 0) {
          totalTax *= policy.effect.landmarkMultiplier;
        }
      }
    });

    resources.value.maxElectricity = totalElectricity;
    resources.value.maxWater = totalWater;
    resources.value.population = Math.min(totalPop, currentStage.value.maxPopulation);

    const avgHappiness = serviceCount > 0 ? happinessBonus / serviceCount : 0;
    const baseHappiness = 50;
    const electricityPenalty = totalElectricity < totalPop * 0.5 ? 15 : 0;
    const waterPenalty = totalWater < totalPop * 0.5 ? 15 : 0;
    resources.value.happiness = Math.max(0, Math.min(100,
      baseHappiness + avgHappiness + happinessPolicyBonus - electricityPenalty - waterPenalty
    ));

    return {
      tax: Math.floor(totalTax * taxMultiplier),
      maintenance: Math.floor(totalMaintenance * maintenanceMultiplier)
    };
  }

  function gameTick() {
    if (isPaused.value) return;

    const { tax, maintenance } = calculateResources();
    const netIncome = tax - maintenance;
    resources.value.money += netIncome;

    const maxPop = currentStage.value.maxPopulation;
    if (resources.value.population < maxPop && resources.value.happiness > 40) {
      let totalHousing = 0;
      for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
          const tile = map.value[y][x];
          if (tile.building) {
            const building = BUILDING_TYPES[tile.building];
            if (building?.populationCapacity) totalHousing += building.populationCapacity;
          }
        }
      }

      const housingCapacity = Math.min(totalHousing, maxPop);

      if (resources.value.population === 0 && housingCapacity > 0) {
        const baseImmigrants = Math.max(1, Math.floor(housingCapacity * 0.05));
        resources.value.population = Math.min(baseImmigrants, housingCapacity);
      } else if (resources.value.population < housingCapacity) {
        const growthRate = 0.02 * (resources.value.happiness / 50);
        let popGrowthMultiplier = 1;
        activePolicies.value.forEach(key => {
          const policy = POLICIES[key];
          if (policy?.effect?.populationGrowthMultiplier) {
            popGrowthMultiplier *= policy.effect.populationGrowthMultiplier;
          }
        });
        const growthAmount = Math.max(1, Math.floor(resources.value.population * growthRate * popGrowthMultiplier));
        resources.value.population = Math.min(resources.value.population + growthAmount, housingCapacity);
      }
    }

    checkDevelopmentStage();
    day.value++;
  }

  function checkDevelopmentStage() {
    const stages = ['village', 'town', 'city', 'metropolis'] as const;
    const currentIdx = stages.indexOf(developmentStage.value);

    for (let i = stages.length - 1; i > currentIdx; i--) {
      const stage = DEVELOPMENT_STAGES[stages[i]];
      if (resources.value.population >= stage.minPopulation) {
        developmentStage.value = stages[i];
        addNotification(`🎉 恭喜！城市已发展为「${stage.name}」！解锁了新建筑！`, 'success');
        break;
      }
    }
  }

  function placeBuilding(x: number, y: number, buildingType: string): boolean {
    const building = BUILDING_TYPES[buildingType];
    if (!building) return false;

    if (!unlockedBuildings.value.includes(buildingType)) {
      addNotification('❌ 该建筑尚未解锁', 'error');
      return false;
    }

    if (resources.value.money < building.cost) {
      addNotification('❌ 金币不足', 'error');
      return false;
    }

    const tile = map.value[y][x];
    if (tile.type !== 'grass' && tile.building) {
      addNotification('❌ 该位置已有建筑', 'error');
      return false;
    }

    resources.value.money -= building.cost;
    map.value[y][x] = {
      type: 'building',
      zone: building.category === 'zone' ? buildingType : null,
      building: buildingType,
      level: 1
    };

    addNotification(`✅ ${building.name} 建造完成`, 'success');
    calculateResources();
    return true;
  }

  function demolishBuilding(x: number, y: number): boolean {
    const tile = map.value[y][x];
    if (!tile.building) return false;

    const building = BUILDING_TYPES[tile.building];
    const landmark = LANDMARKS[tile.building];
    const uiStore = useUiStore();

    if (building) {
      resources.value.money += Math.floor(building.cost * 0.5);
      addNotification(`🔨 ${building.name} 已拆除，返还 ${Math.floor(building.cost * 0.5)} 金币`, 'info');
      if (uiStore.soundEnabled) playDemolishSound();
    } else if (landmark) {
      resources.value.money += Math.floor(landmark.cost * 0.3);
      const idx = landmarks.value.indexOf(tile.building);
      if (idx > -1) landmarks.value.splice(idx, 1);
      addNotification(`🔨 ${landmark.name} 已拆除，返还 ${Math.floor(landmark.cost * 0.3)} 金币`, 'warning');
      if (uiStore.soundEnabled) playDemolishSound();
    }

    map.value[y][x] = {
      type: 'grass',
      zone: null,
      building: null,
      level: 0
    };

    calculateResources();
    return true;
  }

  function placeLandmarkOnMap(landmarkKey: string): boolean {
    const centerX = Math.floor(mapSize.value / 2);
    const centerY = Math.floor(mapSize.value / 2);
    for (let radius = 0; radius < Math.floor(mapSize.value / 2); radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const x = centerX + dx;
          const y = centerY + dy;
          if (x >= 0 && x < mapSize.value && y >= 0 && y < mapSize.value) {
            const tile = map.value[y][x];
            if (tile.type === 'grass' && !tile.building) {
              map.value[y][x] = {
                type: 'landmark',
                zone: null,
                building: landmarkKey,
                level: 1
              };
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  function ensureLandmarksOnMap() {
    landmarks.value.forEach(key => {
      let found = false;
      for (let y = 0; y < mapSize.value; y++) {
        for (let x = 0; x < mapSize.value; x++) {
          if (map.value[y][x].building === key) {
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) {
        placeLandmarkOnMap(key);
      }
    });
  }

  function buildLandmark(landmarkKey: string): boolean {
    const landmark = LANDMARKS[landmarkKey];
    if (!landmark) return false;

    if (!unlockedLandmarks.value.includes(landmarkKey)) {
      addNotification('❌ 该地标尚未解锁', 'error');
      return false;
    }

    if (landmarks.value.includes(landmarkKey)) {
      addNotification('❌ 该地标已建造', 'error');
      return false;
    }

    if (resources.value.money < landmark.cost) {
      addNotification('❌ 金币不足', 'error');
      return false;
    }

    if (!placeLandmarkOnMap(landmarkKey)) {
      addNotification('❌ 地图上没有空位放置地标', 'error');
      return false;
    }

    resources.value.money -= landmark.cost;
    landmarks.value.push(landmarkKey);
    addNotification(`🏛️ ${landmark.name} 建造完成！城市形象大幅提升！`, 'success');
    calculateResources();
    return true;
  }

  function expandMap(): boolean {
    if (mapSize.value >= MAP_SIZE) {
      addNotification('❌ 地图已达最大尺寸', 'error');
      return false;
    }
    const expandCost = (mapSize.value - INITIAL_MAP_SIZE + 1) * 5000;
    if (resources.value.money < expandCost) {
      addNotification(`❌ 扩建需要 💰${expandCost}`, 'error');
      return false;
    }
    resources.value.money -= expandCost;
    const oldSize = mapSize.value;
    mapSize.value = Math.min(mapSize.value + 5, MAP_SIZE);
    const currentMap = map.value;
    const newMap: TileData[][] = [];
    for (let y = 0; y < mapSize.value; y++) {
      const row: TileData[] = [];
      for (let x = 0; x < mapSize.value; x++) {
        if (y < oldSize && x < oldSize) {
          row.push(currentMap[y][x]);
        } else {
          row.push({ type: 'grass', zone: null, building: null, level: 0 });
        }
      }
      newMap.push(row);
    }
    map.value = newMap;
    addNotification(`🗺️ 地图已扩建至 ${mapSize.value}x${mapSize.value}`, 'success');
    return true;
  }

  function togglePolicy(policyKey: string): boolean {
    const policy = POLICIES[policyKey];
    if (!policy) return false;

    const isActive = activePolicies.value.includes(policyKey);

    if (isActive) {
      activePolicies.value = activePolicies.value.filter(p => p !== policyKey);
      addNotification(`📋 ${policy.name} 已停用`, 'info');
    } else {
      if (resources.value.money < policy.cost) {
        addNotification('❌ 金币不足', 'error');
        return false;
      }
      resources.value.money -= policy.cost;
      activePolicies.value.push(policyKey);
      addNotification(`📋 ${policy.name} 已启用`, 'success');
    }

    calculateResources();
    return true;
  }

  function saveGame(silent: boolean = false) {
    const state = {
      cityName: cityName.value,
      developmentStage: developmentStage.value,
      day: day.value,
      isPaused: isPaused.value,
      gameSpeed: gameSpeed.value,
      resources: resources.value,
      map: map.value,
      mapSize: mapSize.value,
      landmarks: landmarks.value,
      activePolicies: activePolicies.value
    };
    saveGameState(state);
    if (!silent) {
      addNotification('💾 游戏已保存', 'success');
    }
  }

  function loadGame() {
    const state = loadGameState<{
      cityName: string;
      developmentStage: keyof typeof DEVELOPMENT_STAGES;
      day: number;
      isPaused: boolean;
      gameSpeed: number;
      resources: typeof resources.value;
      map: typeof map.value;
      mapSize: number;
      landmarks: string[];
      activePolicies: string[];
    }>();

    if (state) {
      cityName.value = state.cityName;
      developmentStage.value = state.developmentStage;
      day.value = state.day;
      isPaused.value = state.isPaused ?? false;
      gameSpeed.value = state.gameSpeed ?? 1;
      resources.value = state.resources;
      map.value = state.map;
      mapSize.value = state.mapSize ?? INITIAL_MAP_SIZE;
      landmarks.value = state.landmarks;
      activePolicies.value = state.activePolicies;
      calculateResources();
      ensureLandmarksOnMap();
      addNotification('📂 游戏已加载', 'success');
      return true;
    }
    return false;
  }

  function loadFromShare() {
    const shared = getShareFromUrl();
    if (shared) {
      const state = importGameState(shared) as {
        cityName: string;
        developmentStage: keyof typeof DEVELOPMENT_STAGES;
        day: number;
        resources: typeof resources.value;
        map: typeof map.value;
        mapSize: number;
        landmarks: string[];
        activePolicies: string[];
      } | null;

      if (state) {
        cityName.value = state.cityName;
        developmentStage.value = state.developmentStage;
        day.value = state.day;
        resources.value = state.resources;
        map.value = state.map;
        mapSize.value = state.mapSize ?? INITIAL_MAP_SIZE;
        landmarks.value = state.landmarks;
      activePolicies.value = state.activePolicies;
      isPaused.value = true;
      calculateResources();
      ensureLandmarksOnMap();
      addNotification('👀 正在查看好友的城市', 'info');
        return true;
      }
    }
    return false;
  }

  function resetGame() {
    cityName.value = '我的城市';
    developmentStage.value = 'village';
    day.value = 1;
    isPaused.value = false;
    gameSpeed.value = 1;
    mapSize.value = INITIAL_MAP_SIZE;
    resources.value = {
      money: 10000,
      population: 0,
      happiness: 70,
      electricity: 0,
      maxElectricity: 0,
      water: 0,
      maxWater: 0
    };
    map.value = Array(mapSize.value).fill(null).map(() =>
      Array(mapSize.value).fill(null).map(() => ({
        type: 'grass',
        zone: null,
        building: null,
        level: 0
      }))
    );
    landmarks.value = [];
    activePolicies.value = [];
    addNotification('🔄 游戏已重置', 'info');
  }

  function getGameState() {
    return {
      cityName: cityName.value,
      developmentStage: developmentStage.value,
      day: day.value,
      isPaused: isPaused.value,
      gameSpeed: gameSpeed.value,
      resources: resources.value,
      map: map.value,
      mapSize: mapSize.value,
      landmarks: landmarks.value,
      activePolicies: activePolicies.value
    };
  }

  return {
    cityName,
    developmentStage,
    day,
    isPaused,
    gameSpeed,
    resources,
    map,
    mapSize,
    requestFitMap,
    landmarks,
    activePolicies,
    notifications,
    currentStage,
    unlockedBuildings,
    unlockedLandmarks,
    placeBuilding,
    demolishBuilding,
    buildLandmark,
    expandMap,
    togglePolicy,
    gameTick,
    calculateResources,
    saveGame,
    loadGame,
    loadFromShare,
    resetGame,
    getGameState,
    addNotification
  };
});
