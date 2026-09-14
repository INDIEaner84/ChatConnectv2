/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Akira & Cyberpunk Neon Theme Engine
 */

export type AkiraThemeId = 
  | 'akira-red'
  | 'cyber-green'
  | 'neo-cyan'
  | 'kaneda-amber'
  | 'tetsuo-purple'
  | 'solar-light';

export interface ThemeConfig {
  id: AkiraThemeId;
  name: string;
  kanji: string;
  tagline: string;
  mode: 'dark' | 'light';
  primaryColor: string;
  glowColor: string;
  badgeBg: string;
  previewBg: string;
}

export const AKIRA_THEMES: ThemeConfig[] = [
  {
    id: 'akira-red',
    name: 'Akira Capsule Red',
    kanji: 'アキラ // 赤',
    tagline: 'Neo-Tokyo 2088 Canonical Capsule Crimson',
    mode: 'dark',
    primaryColor: '#FF1E44',
    glowColor: 'rgba(255, 30, 68, 0.45)',
    badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    previewBg: 'bg-rose-600'
  },
  {
    id: 'cyber-green',
    name: 'Matrix HUD Green',
    kanji: '電脳 // 緑',
    tagline: 'Tactical Cybernetic Phosphor Emerald',
    mode: 'dark',
    primaryColor: '#00FF66',
    glowColor: 'rgba(0, 255, 102, 0.4)',
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    previewBg: 'bg-emerald-500'
  },
  {
    id: 'neo-cyan',
    name: 'Neo-Tokyo Cyan',
    kanji: 'ネオ東京 // 蒼',
    tagline: 'Holographic High-Voltage Cyber Cyan',
    mode: 'dark',
    primaryColor: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.4)',
    badgeBg: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    previewBg: 'bg-sky-400'
  },
  {
    id: 'kaneda-amber',
    name: 'Kaneda Hazard Gold',
    kanji: '警告 // 金',
    tagline: 'Industrial Heavy Machinery Laser Amber',
    mode: 'dark',
    primaryColor: '#FFB800',
    glowColor: 'rgba(255, 184, 0, 0.45)',
    badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    previewBg: 'bg-amber-500'
  },
  {
    id: 'tetsuo-purple',
    name: 'Tetsuo Psychic Violet',
    kanji: '覚醒 // 紫',
    tagline: 'Ultraviolet Telekinetic Energy Field',
    mode: 'dark',
    primaryColor: '#B026FF',
    glowColor: 'rgba(176, 38, 255, 0.45)',
    badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    previewBg: 'bg-purple-500'
  },
  {
    id: 'solar-light',
    name: 'Solar White Tech',
    kanji: '白夜 // 陽',
    tagline: 'High-Contrast Laboratory Clean HUD',
    mode: 'light',
    primaryColor: '#E11D48',
    glowColor: 'rgba(225, 29, 72, 0.25)',
    badgeBg: 'bg-rose-100 text-rose-700 border-rose-300',
    previewBg: 'bg-slate-200'
  }
];

export function applyThemeToDOM(themeId: AkiraThemeId) {
  const selected = AKIRA_THEMES.find(t => t.id === themeId) || AKIRA_THEMES[0];
  
  // Set data-theme attribute on root
  document.documentElement.setAttribute('data-akira-theme', themeId);
  
  if (selected.mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
