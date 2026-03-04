import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private deferredPrompt: any = null
  private canInstallCallback: ((can: boolean) => void)[] = []

  constructor() {
    console.log('🚀 [PWA] PwaService initialized')
    if (typeof window !== 'undefined') {
      console.log('[PWA] Window defined - setting up listeners')
      // Événement standard Android
      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault()
        this.deferredPrompt = e
        console.log('[PWA] beforeinstallprompt captured - Android PWA ready')
        this.notifyCanInstall(true)
      })

      window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed - hiding install button')
        this.notifyCanInstall(false)
        this.deferredPrompt = null
      })

      // Vérifier immédiatement l'installation
      this.checkInstallCapability()
    }
  }

  /** Déterminer si on doit montrer le bouton installer */
  private canShowInstallButton(): boolean {
    // Si déjà installé (mode standalone), ne pas montrer
    if (this.isStandalone()) {
      console.log('[PWA] Already installed - hiding button')
      return false
    }

    // Si mobile, montrer le bouton
    if (this.isSimpleMobile()) {
      console.log('[PWA] Mobile detected - SHOWING install button')
      return true
    }

    console.log('[PWA] Desktop detected - hiding button')
    return false
  }

  /** Simpler method - just check User Agent pour déterminer si c'est CLAIREMENT un mobile */
  private isSimpleMobile(): boolean {
    return /Android|iPhone|iPad|iPod|Mobile|Tablet|webOS|Opera Mini|BlackBerry|IEMobile/i.test(
      navigator.userAgent
    )
  }

  /** Check if already installed in standalone mode */
  private isStandalone(): boolean {
    if (typeof window === 'undefined') return false
    return (
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    )
  }

  /** Vérifier immédiatement la capacité d'installation */
  private checkInstallCapability(): void {
    console.log('[PWA] === Checking Install Capability ===')
    console.log('[PWA] User Agent:', navigator.userAgent)
    console.log('[PWA] Standalone mode:', this.isStandalone())
    console.log('[PWA] Is Mobile:', this.isSimpleMobile())

    // Notifier avec l'état actuel
    const canShow = this.canShowInstallButton()
    console.log('[PWA] Can show button:', canShow)
    this.notifyCanInstall(canShow)
  }

  /** S'abonner aux changements de disponibilité d'installation */
  onCanInstallChange(callback: (can: boolean) => void): void {
    this.canInstallCallback.push(callback)
    // Callback IMMÉDIAT avec l'état actuel
    const canShow = this.canShowInstallButton()
    console.log('[PWA] Callback avec état initial:', canShow)
    callback(canShow)
  }

  /** Notifier tous les subscribers du changement d'état */
  private notifyCanInstall(can: boolean): void {
    console.log('[PWA] notifyCanInstall called:', can)
    this.canInstallCallback.forEach((callback) => {
      try {
        callback(can)
      } catch (error) {
        console.error('[PWA] Error in callback:', error)
      }
    })
  }

  /** Installer l'app */
  async install(): Promise<void> {
    console.log('[PWA] Install clicked')

    // Cas 1: Android avec beforeinstallprompt
    if (this.deferredPrompt) {
      console.log('[PWA] Installing via beforeinstallprompt (Android)')
      try {
        this.deferredPrompt.prompt()
        const { outcome } = await this.deferredPrompt.userChoice
        if (outcome === 'accepted') {
          console.log('[PWA] Installation accepted')
          this.deferredPrompt = null
          this.notifyCanInstall(false)
        }
      } catch (error) {
        console.error('[PWA] Error during installation:', error)
      }
      return
    }

    // Cas 2: iOS - Instructions détaillées
    if (this.isIosDevice()) {
      console.log('[PWA] Installing on iOS - showing instructions')
      const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent)

      const instructions = isSafari
        ? '📱 Installation sur iOS (Safari):\n\n' +
          '1️⃣ Appuyez sur l\'icône de partage 📤\n' +
          '   (en bas de l\'écran, centre)\n\n' +
          '2️⃣ Scrollez et appuyez sur:\n' +
          '   "Sur l\'écran d\'accueil" ➕\n\n' +
          '3️⃣ Appuyez sur "Ajouter" (haut droit)\n\n' +
          '✅ L\'icône BD Finance s\'ajoutera\n' +
          '   à votre écran d\'accueil!'
        : '📱 Installation iOS:\n\n' +
          '⚠️ Ouvrez ce site dans Safari\n' +
          'pour pouvoir l\'installer.\n\n' +
          'Copiez l\'URL et ouvrez dans Safari,\n' +
          'puis suivez les instructions.'

      alert(instructions)
      return
    }

    // Cas 3: Autres navigateurs - essayer navigator.share
    console.log('[PWA] Trying navigator.share fallback')
    alert('Merci de votre intérêt!\n\nPour installer cette app:\n\n' +
          '• Android: Vérifiez les options du navigateur\n' +
          '• iPhone: Utilisez Safari et appuyez sur Partage')
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

  /** Détecter iOS simplement */
  private isIosDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
  }

  /** Enregistrer le service worker */
  installServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
        // Silent fail
      })
    }
  }
}
