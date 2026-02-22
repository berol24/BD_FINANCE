import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { User } from '../../../../core/services/auth.service'
import { PwaService } from '../../../../core/services/pwa.service'
import { I18nService } from '../../../../core/services/i18n.service'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {
  @Input() user: User | null = null
  @Output() logout = new EventEmitter<void>()

  canInstall = false
  currentLanguage: 'fr' | 'en' = 'fr'
  showLanguageMenu = false

  constructor(
    private pwaService: PwaService,
    private router: Router,
    public i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.pwaService.onCanInstallChange((can) => {
      this.canInstall = can
      console.log('[Header] Install button visibility changed:', can)
      if (can) {
        console.log('✅ BOUTON INSTALLER EST VISIBLE')
      } else {
        console.log('❌ Bouton installer caché (déjà installé ou desktop)')
      }
    })
    this.currentLanguage = this.i18nService.getCurrentLanguage()
  }

  onLogout(): void {
    this.logout.emit()
  }

  async onInstall(): Promise<void> {
    await this.pwaService.install()
  }

  onShare(): void {
    this.pwaService.shareApp()
  }

  goToProfile(): void {
    this.router.navigate(['/dashboard/profile'])
  }

  getAvatarInitials(): string {
    if (!this.user) return '?'
    const first = this.user.prenom?.[0] || ''
    const last = this.user.nom?.[0] || ''
    return (first + last).toUpperCase()
  }

  changeLanguage(lang: 'fr' | 'en'): void {
    this.i18nService.setLanguage(lang)
    this.currentLanguage = lang
    this.showLanguageMenu = false
  }
}
