import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private deferredPrompt: any = null
  private canInstallCallback: ((can: boolean) => void)[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault()
        this.deferredPrompt = e
        this.notifyCanInstall(true)
      })

      window.addEventListener('appinstalled', () => {
        this.notifyCanInstall(false)
        this.deferredPrompt = null
      })

      // Check iOS
      if (this.isIos() && this.isPwaCapable()) {
        this.notifyCanInstall(true)
      }
    }
  }

  private isIos(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !navigator.userAgent.includes('CriOS')
  }

  private isPwaCapable(): boolean {
    return 'serviceWorker' in navigator
  }

  onCanInstallChange(callback: (can: boolean) => void): void {
    this.canInstallCallback.push(callback)
    callback(this.deferredPrompt !== null || (this.isIos() && this.isPwaCapable()))
  }

  private notifyCanInstall(can: boolean): void {
    this.canInstallCallback.forEach((callback) => callback(can))
  }

  async install(): Promise<void> {
    // Cas Android
    if (this.deferredPrompt) {
      try {
        this.deferredPrompt.prompt()
        const { outcome } = await this.deferredPrompt.userChoice
        if (outcome === 'accepted') {
          this.deferredPrompt = null
          this.notifyCanInstall(false)
        }
      } catch (error) {
        console.error('Erreur installation PWA:', error)
      }
      return
    }

    // Cas iOS
    if (this.isIos()) {
      alert(
        'Pour installer l\'application sur iOS:\n\n' +
          '1. Appuyez sur le bouton de partage (deux flèches)\n' +
          '2. Sélectionnez "Sur l\'écran d\'accueil"\n' +
          '3. Appuyez sur "Ajouter"\n\n' +
          'L\'application sera ensuite accessible depuis votre écran d\'accueil.'
      )
      return
    }

    alert('La fonctionnalité d\'installation n\'est pas disponible sur votre navigateur.')
  }

  shareApp(): void {
    const title = 'BD Finance'
    const text = 'Gérez vos finances intelligemment avec BD Finance!'
    const url = window.location.origin

    if (navigator.share) {
      navigator.share({
        title,
        text,
        url,
      }).catch(() => {
        // Silently fail
      })
    } else {
      // Fallback - copy to clipboard
      const fullText = `${text}\n${url}`
      if (navigator.clipboard) {
        navigator.clipboard.writeText(fullText).then(() => {
          alert('Lien copié! Vous pouvez maintenant le partager.')
        })
      } else {
        alert(`Partagez ceci: ${fullText}`)
      }
    }
  }

  installServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
        // Silent fail
      })
    }
  }
}
