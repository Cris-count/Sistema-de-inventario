import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'inventario-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Modo visual actual (panel + login usan CSS vars; landing/register usan clase `dark` en <html>). */
  readonly mode = signal<ThemeMode>('dark');

  /** Llamar desde APP_INITIALIZER para aplicar tema antes del primer pintado. */
  hydrate(): void {
    const initial = this.readInitial();
    this.mode.set(initial);
    this.applyToDocument(initial);
  }

  private readInitial(): ThemeMode {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return 'dark';
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  setMode(next: ThemeMode): void {
    this.mode.set(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
    }
    this.applyToDocument(next);
  }

  toggle(): void {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }

  private applyToDocument(mode: ThemeMode): void {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.dataset['theme'] = mode;
    root.classList.toggle('dark', mode === 'dark');
    root.style.colorScheme = mode === 'dark' ? 'dark' : 'light';
  }
}
