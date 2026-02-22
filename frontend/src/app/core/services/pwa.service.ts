import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private deferredPrompt: any = null
  private canInstallCallback: ((can: boolean) => void)[] = []
  private isIOSDevice: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      // Détection iOS
      this.isIOSDevice = this.isIos()
      
      // Événement standard Android
      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault()
        this.deferredPrompt = e
        this.notifyCanInstall(true)
      })

      window.addEventListener('appinstalled', () => {
        this.notifyCanInstall(false)
        this.deferredPrompt = null
      })

      // Vérifier immédiatement si c'est un mobile capable
      this.checkInstallCapability()
    }
  }

  private checkInstallCapability(): void {
    // Vérifier display mode standalone (déjà installé)
    if (this.isStandalone()) {
      console.log('[PWA] App already installed')
      this.notifyCanInstall(false)
      return
    }

    // EN LOCAL & MOBILE: Montrer le bouton sur tout mobile (iOS et Android)
    // This allows testing the UI on localhost
    const isMobileDevice = this.isMobile()
    console.log('[PWA] Is mobile:', isMobileDevice, '| User Agent:', navigator.userAgent)
    
    if (isMobileDevice) {
      console.log('[PWA] Mobile detected - showing install button')
      this.notifyCanInstall(true)
      return
    }

    // Sur desktop: ne pas montrer
    console.log('[PWA] Desktop detected - hiding install button')
    this.notifyCanInstall(false)
  }

  private isIos(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !navigator.userAgent.includes('CriOS')
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  private isPwaCapable(): boolean {
    return 'serviceWorker' in navigator
  }

  private isStandalone(): boolean {
    return (window.navigator as any).standalone === true || 
           window.matchMedia('(display-mode: standalone)').matches
  }

  onCanInstallChange(callback: (can: boolean) => void): void {
    this.canInstallCallback.push(callback)
    // Callback immédiat avec l'état actuel
    const canInstall = !this.isStandalone() && this.isMobile()
    callback(canInstall)
  }

  private notifyCanInstall(can: boolean): void {
    this.canInstallCallback.forEach((callback) => callback(can))
  }

  async install(): Promise<void> {
    // Cas Android avec beforeinstallprompt
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
    if (this.isIOSDevice) {
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
