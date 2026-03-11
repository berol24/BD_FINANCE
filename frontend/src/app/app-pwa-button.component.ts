import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PwaService } from './core/services/pwa.service'

@Component({
  selector: 'app-pwa-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- PWA Install Banner - Top of page -->
    <div
      *ngIf="canInstall && showBanner"
      class="fixed top-0 left-0 right-0 z-[1000] bg-gradient-to-r from-emerald-500 via-emerald-600 to-cyan-600 shadow-2xl animate-in slide-in-from-top duration-300"
    >
      <div class="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
        <!-- Left: Icon + Text -->
        <div class="flex items-center gap-2 sm:gap-3 flex-1">
          <div class="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg flex-shrink-0">
            <svg
              class="w-5 h-5 sm:w-6 sm:h-6 text-white animate-bounce"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8" />
              <path d="M7 20h10" />
              <path d="M12 16v4" />
              <path d="M12 12l-3 3h6z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-white font-bold text-xs sm:text-sm">Installer BD Finance</h3>
            <p class="text-emerald-100 text-xs hidden sm:block">Accédez à votre app en un clic depuis l'écran d'accueil</p>
          </div>
        </div>

        <!-- Right: Buttons -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            (click)="onInstall()"
            class="px-3 sm:px-6 py-2 bg-white hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 font-bold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-xs sm:text-sm whitespace-nowrap"
            title="Installer l'application sur votre appareil"
          >
            Installer
          </button>
          <button
            (click)="dismissBanner()"
            class="px-2 sm:px-3 py-2 hover:bg-white/10 rounded-lg transition-all duration-200 text-white hover:text-emerald-100"
            title="Fermer"
          >
            <svg
              class="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideInFromTop {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    :host ::ng-deep .animate-in.slide-in-from-top {
      animation: slideInFromTop 0.3s ease-out;
    }
  `],
})
export class PwaButtonComponent implements OnInit {
  canInstall = false
  showBanner = true

  constructor(private pwaService: PwaService) {}

  ngOnInit(): void {
    // Check if banner was dismissed in this session
    const isDismissed = localStorage.getItem('pwa_banner_dismissed_session') === 'true'
    this.showBanner = !isDismissed
    
    this.pwaService.onCanInstallChange((can: boolean) => {
      this.canInstall = can
    })
  }

  async onInstall(): Promise<void> {
    await this.pwaService.install()
  }

  dismissBanner(): void {
    this.showBanner = false
    // Hide for this session only (clears when page refreshes)
    localStorage.setItem('pwa_banner_dismissed_session', 'true')
  }
}
