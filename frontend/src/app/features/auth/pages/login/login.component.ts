import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { AuthService } from '../../../../core/services/auth.service'
import { I18nPipe } from '../../../../core/pipes/i18n.pipe'
import { I18nService } from '../../../../core/services/i18n.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, I18nPipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email = ''
  password = ''
  showPassword = false
  loading = false
  error = ''

  constructor(
    private authService: AuthService,
    private router: Router,
    private i18nService: I18nService
  ) {}

  async login(): Promise<void> {
    if (!this.email || !this.password) {
      this.error = this.i18nService.t('auth.fillAllFields')
      return
    }

    this.loading = true
    this.error = ''

    try {
      await this.authService.login(this.email, this.password)
      this.router.navigate(['/dashboard'])
    } catch (err: any) {
      this.error = err.error?.message || this.i18nService.t('auth.loginError')
    } finally {
      this.loading = false
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }
}
