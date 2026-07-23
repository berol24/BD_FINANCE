import { Injectable } from '@angular/core'
import { AuthService } from './auth.service'
import { COUNTRIES, findCountry, getCurrencySymbol } from '../data/countries'

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  constructor(private authService: AuthService) {}

  /** Code ISO de la devise (ex: EUR, XAF) */
  get code(): string {
    return this.authService.getCurrentUser()?.devise || 'EUR'
  }

  /** Symbole affiché (ex: €, FCFA) */
  get symbol(): string {
    return getCurrencySymbol(this.code)
  }

  /** Code pays de l'utilisateur (ex: CM, FR) */
  get countryCode(): string {
    return this.authService.getCurrentUser()?.pays || 'FR'
  }

  get countryName(): string {
    return findCountry(this.countryCode)?.name || ''
  }

  get countries() {
    return COUNTRIES
  }
}
