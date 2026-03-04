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

  private canShowInstallButton(): boolean {
    return !this.isStandalone() && this.isMobile()
  }

  private checkInstallCapability(): void {
    // Vérifier display mode standalone (déjà installé)
    if (this.isStandalone()) {
      console.log('[PWA] App already installed in standalone mode')
      this.notifyCanInstall(false)
      return
    }

    // Détecter le type d'appareil
    const isMobileDevice = this.isMobile()
    const isIOSMobile = this.isIos()
    
    console.log('[PWA] Device detection:')
    console.log('  - Is Mobile:', isMobileDevice)
    console.log('  - Is iOS:', isIOSMobile)
    console.log('  - User Agent:', navigator.userAgent)
    console.log('  - Is Standalone:', this.isStandalone())
    
    // Sur mobile (iOS ou Android), toujours montrer le bouton
    if (this.canShowInstallButton()) {
      console.log('✅ [PWA] Mobile detected - SHOWING install button')
      this.notifyCanInstall(true)
      return
    }

    // Sur desktop: ne pas montrer
    console.log('❌ [PWA] Desktop detected - hiding install button')
    this.notifyCanInstall(false)
  }

  private isIos(): boolean {
    const ua = navigator.userAgent
    const classicIOS = /iPad|iPhone|iPod/.test(ua)
    const iPadOSDesktopUA = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
    return classicIOS || iPadOSDesktopUA
  }

  private isTouchDevice(): boolean {
    return navigator.maxTouchPoints > 0 || 'ontouchstart' in window
  }

  private isMobile(): boolean {
    const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    return uaMobile || this.isIos() || this.isTouchDevice()
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
    const canInstall = this.canShowInstallButton()
    console.log('[PWA] Initial canInstall state:', canInstall)
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

    // Cas iOS - Instructions détaillées
    if (this.isIOSDevice) {
      const instructions = this.isIos() && /Safari/.test(navigator.userAgent)
        ? '📱 Installation sur iOS (Safari):\n\n' +
          '1️⃣ Appuyez sur l\'icône de partage 📤\n' +
          '   (en bas de l\'écran, au centre)\n\n' +
          '2️⃣ Faites défiler et touchez\n' +
          '   "Sur l\'écran d\'accueil" ➕\n\n' +
          '3️⃣ Touchez "Ajouter" en haut à droite\n\n' +
          '✅ L\'icône BD Finance apparaîtra\n' +
          '   sur votre écran d\'accueil!'
        : '📱 Installation sur iOS:\n\n' +
          '⚠️ Veuillez ouvrir ce site dans Safari\n' +
          'pour pouvoir l\'installer.\n\n' +
          'Copiez l\'URL et ouvrez-la dans Safari,\n' +
          'puis suivez les instructions d\'installation.'
      
      alert(instructions)
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
