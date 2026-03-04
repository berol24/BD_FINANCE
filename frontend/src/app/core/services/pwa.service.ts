import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private deferredPrompt: any = null
  private canInstallCallback: ((can: boolean) => void)[] = []

  constructor() {
    if (typeof window !== 'undefined') {
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

      // Vérifier immédiatement l'installation
      this.checkInstallCapability()
    }
  }

  /** Déterminer si on doit montrer le bouton installer */
  private canShowInstallButton(): boolean {
    // Si déjà installé (mode standalone), ne pas montrer
    if (this.isStandalone()) {
      return false
    }

    // Si mobile, montrer le bouton
    if (this.isSimpleMobile()) {
      return true
    }

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
    // Notifier avec l'état actuel
    const canShow = this.canShowInstallButton()
    this.notifyCanInstall(canShow)
  }

  /** S'abonner aux changements de disponibilité d'installation */
  onCanInstallChange(callback: (can: boolean) => void): void {
    this.canInstallCallback.push(callback)
    // Callback IMMÉDIAT avec l'état actuel
    const canShow = this.canShowInstallButton()
    callback(canShow)
  }

  /** Notifier tous les subscribers du changement d'état */
  private notifyCanInstall(can: boolean): void {
    this.canInstallCallback.forEach((callback) => {
      try {
        callback(can)
      } catch (error) {
        console.error('❌ [PWA] Erreur lors de l\'exécution du callback')
      }
    })
  }

  /** Installer l'app */
  async install(): Promise<void> {
    // Cas 1: Android avec beforeinstallprompt
    if (this.deferredPrompt) {
      try {
        this.deferredPrompt.prompt()
        const { outcome } = await this.deferredPrompt.userChoice
        if (outcome === 'accepted') {
          this.deferredPrompt = null
          this.notifyCanInstall(false)
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'installation')
      }
      return
    }

    // Cas 2: iOS - Instructions détaillées
    if (this.isIosDevice()) {
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
    alert('Merci de votre intérêt!\n\nPour installer cette app:\n\n' + +
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
