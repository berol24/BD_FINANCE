import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { AuthService } from '../../../../core/services/auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email = ''
  password = ''
  loading = false
  error = ''

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async login(): Promise<void> {
    if (!this.email || !this.password) {
      this.error = 'Veuillez remplir tous les champs'
      return
    }

    this.loading = true
    this.error = ''

    try {
      await this.authService.login(this.email, this.password)
      this.router.navigate(['/dashboard'])
    } catch (err: any) {
      this.error = err.error?.message || 'Erreur de connexion'
    } finally {
      this.loading = false
    }
  }
}
