import type { Skin } from '../types';
import { SKINS } from '../config';

export class SkinManager {
  private skins: readonly Skin[];
  private unlockedSkins: Set<string>;
  private selectedSkinId: string;

  constructor() {
    this.skins = SKINS;
    this.unlockedSkins = new Set(['default']);
    this.selectedSkinId = 'default';
  }

  getAllSkins(): Skin[] {
    return [...this.skins];
  }

  getSelectedSkin(): Skin | undefined {
    return this.skins.find(s => s.id === this.selectedSkinId);
  }

  getSelectedSkinId(): string {
    return this.selectedSkinId;
  }

  setSelectedSkin(skinId: string): boolean {
    if (this.unlockedSkins.has(skinId)) {
      this.selectedSkinId = skinId;
      return true;
    }
    return false;
  }

  isUnlocked(skinId: string): boolean {
    return this.unlockedSkins.has(skinId);
  }

  checkUnlocks(totalScore: number): string[] {
    const newlyUnlocked: string[] = [];
    
    for (const skin of this.skins) {
      if (totalScore >= skin.unlockScore && !this.unlockedSkins.has(skin.id)) {
        this.unlockedSkins.add(skin.id);
        newlyUnlocked.push(skin.id);
      }
    }
    
    return newlyUnlocked;
  }

  getUnlockedSkins(): string[] {
    return Array.from(this.unlockedSkins);
  }

  setUnlockedSkins(skins: string[]): void {
    this.unlockedSkins = new Set(skins);
  }

  loadState(savedSkin: string, unlockedSkins: string[]): void {
    this.unlockedSkins = new Set(unlockedSkins);
    if (this.unlockedSkins.has(savedSkin)) {
      this.selectedSkinId = savedSkin;
    }
  }
}
