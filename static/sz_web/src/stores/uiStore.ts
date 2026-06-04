import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

const UI_SETTINGS_KEY = 'city_builder_ui_settings';

function loadUISettings() {
  try {
    const raw = localStorage.getItem(UI_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

function saveUISettings(settings: { soundEnabled: boolean; darkMode: boolean; autoSave: boolean }) {
  try {
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) { /* ignore */ }
}

export const useUiStore = defineStore('ui', () => {
  const saved = loadUISettings() as { soundEnabled?: boolean; darkMode?: boolean; autoSave?: boolean } | null;

  const selectedTool = ref<string | null>(null);
  const selectedTile = ref<{ x: number; y: number } | null>(null);
  const showLandmarkModal = ref(false);
  const showPolicyModal = ref(false);
  const showSocialModal = ref(false);
  const showSettingsModal = ref(false);
  const showTutorial = ref(true);
  const mapScale = ref(1);
  const mapOffset = ref({ x: 0, y: 0 });

  const soundEnabled = ref(saved?.soundEnabled ?? true);
  const darkMode = ref(saved?.darkMode ?? true);
  const autoSave = ref(saved?.autoSave ?? true);

  const activeModal = computed(() => {
    if (showLandmarkModal.value) return 'landmark';
    if (showPolicyModal.value) return 'policy';
    if (showSocialModal.value) return 'social';
    if (showSettingsModal.value) return 'settings';
    return null;
  });

  function applyTheme() {
    const root = document.documentElement;
    if (darkMode.value) {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
    }
  }

  function selectTool(tool: string | null) {
    selectedTool.value = selectedTool.value === tool ? null : tool;
    selectedTile.value = null;
  }

  function selectTile(x: number, y: number) {
    selectedTile.value = { x, y };
  }

  function openLandmarkModal() {
    closeAllModals();
    showLandmarkModal.value = true;
  }

  function openPolicyModal() {
    closeAllModals();
    showPolicyModal.value = true;
  }

  function openSocialModal() {
    closeAllModals();
    showSocialModal.value = true;
  }

  function openSettingsModal() {
    closeAllModals();
    showSettingsModal.value = true;
  }

  function closeAllModals() {
    showLandmarkModal.value = false;
    showPolicyModal.value = false;
    showSocialModal.value = false;
    showSettingsModal.value = false;
  }

  function closeTutorial() {
    showTutorial.value = false;
  }

  function setMapScale(scale: number) {
    mapScale.value = Math.max(0.5, Math.min(2, scale));
  }

  function setMapOffset(x: number, y: number) {
    mapOffset.value = { x, y };
  }

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value;
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value;
    applyTheme();
  }

  function toggleAutoSave() {
    autoSave.value = !autoSave.value;
  }

  watch([soundEnabled, darkMode, autoSave], () => {
    saveUISettings({
      soundEnabled: soundEnabled.value,
      darkMode: darkMode.value,
      autoSave: autoSave.value
    });
  });

  applyTheme();

  return {
    selectedTool,
    selectedTile,
    showLandmarkModal,
    showPolicyModal,
    showSocialModal,
    showSettingsModal,
    showTutorial,
    mapScale,
    mapOffset,
    soundEnabled,
    darkMode,
    autoSave,
    activeModal,
    selectTool,
    selectTile,
    openLandmarkModal,
    openPolicyModal,
    openSocialModal,
    openSettingsModal,
    closeAllModals,
    closeTutorial,
    setMapScale,
    setMapOffset,
    toggleSound,
    toggleDarkMode,
    toggleAutoSave,
    applyTheme
  };
});
