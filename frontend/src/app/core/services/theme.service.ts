import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  darkMode = signal<boolean>(true);

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme !== 'light';
    this.darkMode.set(isDark);
    this.applyTheme(isDark);
  }

  toggleTheme() {
    const nextState = !this.darkMode();
    this.darkMode.set(nextState);
    localStorage.setItem('theme', nextState ? 'dark' : 'light');
    this.applyTheme(nextState);
  }

  private applyTheme(isDark: boolean) {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }
}
