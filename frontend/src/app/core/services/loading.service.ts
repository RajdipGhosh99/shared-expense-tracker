import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private activeRequests = 0;
  private debounceTimer: any = null;

  // Reactive signal watched by UI components
  readonly isLoading = signal<boolean>(false);

  startLoading() {
    this.activeRequests += 1;
    if (this.activeRequests === 1) {
      // Debounce by 80ms to prevent quick micro-flickering on super fast cached calls
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        if (this.activeRequests > 0) {
          this.isLoading.set(true);
        }
      }, 80);
    }
  }

  stopLoading() {
    if (this.activeRequests > 0) {
      this.activeRequests -= 1;
    }
    if (this.activeRequests === 0) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      this.isLoading.set(false);
    }
  }
}
