import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html'
})
export class App {
  private static readonly THEME_KEY = 'app-theme';
  private document = inject(DOCUMENT);
  private router = inject(Router);

  protected readonly title = signal('TaskGroup');
  protected readonly theme = signal<'light' | 'dark'>(App.loadTheme());
  protected readonly currentUrl = signal(this.router.url);
  protected readonly isLandingRoute = computed(() => {
    const url = this.currentUrl();
    return url === '' || url === '/' || url === '/#';
  });

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

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
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
