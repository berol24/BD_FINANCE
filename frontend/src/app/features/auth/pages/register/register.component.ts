import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { AuthService } from '../../../../core/services/auth.service'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  nom = ''
  prenom = ''
  email = ''
  password = ''
  confirmPassword = ''
  showPassword = false
  showConfirmPassword = false
  loading = false
  error = ''

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async register(): Promise<void> {
    if (!this.nom || !this.prenom || !this.email || !this.password || !this.confirmPassword) {
      this.error = 'Veuillez remplir tous les champs'
      return
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas'
      return
    }

    this.loading = true
    this.error = ''

    try {
      await this.authService.register(this.nom, this.prenom, this.email, this.password, this.confirmPassword)
      this.router.navigate(['/auth/login'])
    } catch (err: any) {
      this.error = err.error?.message || 'Erreur lors de l\'inscription'
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
