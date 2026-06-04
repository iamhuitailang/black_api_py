import { exportGameState } from './storage';

export function generateShareLink(state: unknown): string {
  const encoded = exportGameState(state);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?city=${encodeURIComponent(encoded)}`;
}

export function getShareFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const city = params.get('city');
  return city ? decodeURIComponent(city) : null;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.error('Failed to copy:', e);
    return false;
  }
}

export async function shareWebAPI(title: string, text: string, url: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (e) {
      console.error('Failed to share:', e);
      return false;
    }
  }
  return false;
}

export function downloadGameState(state: unknown, filename: string = 'my_city.json'): void {
  const dataStr = JSON.stringify(state, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function inviteFriendMessage(cityName: string, shareUrl: string): string {
  return `🏙️ 来看看我的城市"${cityName}"！\n点击链接参观：${shareUrl}\n-- 来自城市建设游戏`;
}
