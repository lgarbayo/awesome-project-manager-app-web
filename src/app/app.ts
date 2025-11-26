import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html'
})
export class App {
  private static readonly THEME_KEY = 'app-theme';
  private document = inject(DOCUMENT);

  protected readonly title = signal('TaskGroup');
  protected readonly theme = signal<'light' | 'dark'>(App.loadTheme());

  constructor() {
    effect(() => {
      const currentTheme = this.theme();
      this.document.documentElement.setAttribute('data-theme', currentTheme);
      try {
        localStorage.setItem(App.THEME_KEY, currentTheme);
      } catch (err) {
        console.warn('Unable to store theme preference', err);
      }
    });
  }

  toggleTheme(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
  }

  private static loadTheme(): 'light' | 'dark' {
    try {
      const value = localStorage.getItem(App.THEME_KEY);
      if (value === 'dark' || value === 'light') {
        return value;
      }
    } catch {
      // ignore storage errors
    }
    return 'light';
  }
}
