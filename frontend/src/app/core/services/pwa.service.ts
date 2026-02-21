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
    }
  }

  onCanInstallChange(callback: (can: boolean) => void): void {
    this.canInstallCallback.push(callback)
  }

  private notifyCanInstall(can: boolean): void {
    this.canInstallCallback.forEach((callback) => callback(can))
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) {
      return
    }

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
  }
}
