import { Component, OnDestroy, OnInit } from '@angular/core'
import { Router, RouterOutlet } from '@angular/router'
import { PwaButtonComponent } from './app-pwa-button.component'
import { AuthService } from './core/services/auth.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PwaButtonComponent],
  template: `
    <app-pwa-button></app-pwa-button>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  private tokenWatcherId: number | null = null

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // Check token expiry regularly so users are logged out right when it expires.
    this.tokenWatcherId = window.setInterval(() => {
      const accessToken = this.authService.getAccessToken()
      if (!accessToken) {
        return
      }

      if (!this.authService.isTokenExpired(accessToken)) {
        return
      }

      this.authService.logout()
      if (!this.router.url.startsWith('/auth/')) {
        this.router.navigate(['/auth/login'])
      }
    }, 15000)
  }

  ngOnDestroy(): void {
    if (this.tokenWatcherId !== null) {
      window.clearInterval(this.tokenWatcherId)
    }
  }
}
