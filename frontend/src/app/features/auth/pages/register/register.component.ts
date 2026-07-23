import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { AuthService } from '../../../../core/services/auth.service'
import { I18nPipe } from '../../../../core/pipes/i18n.pipe'
import { I18nService } from '../../../../core/services/i18n.service'
import { COUNTRIES, Country, findCountry } from '../../../../core/data/countries'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, I18nPipe],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  nom = ''
  prenom = ''
  email = ''
  password = ''
  confirmPassword = ''
  pays = ''
  showPassword = false
  showConfirmPassword = false
  loading = false
  error = ''
  countries = COUNTRIES

  constructor(
    private authService: AuthService,
    private router: Router,
    private i18nService: I18nService
  ) {}

  get selectedCountry(): Country | undefined {
    return findCountry(this.pays)
  }

  async register(): Promise<void> {
    if (!this.nom || !this.prenom || !this.email || !this.password || !this.confirmPassword || !this.pays) {
      this.error = this.i18nService.t('auth.fillAllFields')
      return
    }

    if (this.password !== this.confirmPassword) {
      this.error = this.i18nService.t('auth.passwordMismatch')
      return
    }

    this.loading = true
    this.error = ''

    try {
      await this.authService.register(
        this.nom,
        this.prenom,
        this.email,
        this.password,
        this.confirmPassword,
        this.pays
      )
      this.router.navigate(['/auth/login'])
    } catch (err: any) {
      this.error = err.error?.message || this.i18nService.t('auth.registerError')
    } finally {
      this.loading = false
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword
  }
}
