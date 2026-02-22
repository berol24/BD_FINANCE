import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { AuthService, User } from '../../../../core/services/auth.service'
import { TransactionService } from '../../../../core/services/transaction.service'

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  user: User | null = null
  editMode = false
  passwordEditMode = false
  loading = false
  successMessage = ''
  errorMessage = ''

  // Édition profil
  nom = ''
  prenom = ''
  email = ''

  // Édition mot de passe
  currentPassword = ''
  newPassword = ''
  confirmPassword = ''
  showCurrentPassword = false
  showNewPassword = false
  showConfirmPassword = false

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile()
  }

  async loadProfile(): Promise<void> {
    try {
      this.user = this.authService.getCurrentUser()
      if (!this.user) {
        this.router.navigate(['/auth/login'])
        return
      }

      const profile = await this.transactionService.getProfile()
      this.user = profile.data?.user || profile.user
      this.authService.getCurrentUser() // Update local storage

      this.nom = this.user?.nom || ''
      this.prenom = this.user?.prenom || ''
      this.email = this.user?.email || ''
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
      this.errorMessage = 'Erreur lors du chargement du profil'
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode
    if (!this.editMode) {
      this.resetProfileForm()
    }
  }

  togglePasswordEditMode(): void {
    this.passwordEditMode = !this.passwordEditMode
    if (!this.passwordEditMode) {
      this.resetPasswordForm()
    }
  }

  private resetProfileForm(): void {
    this.nom = this.user?.nom || ''
    this.prenom = this.user?.prenom || ''
    this.email = this.user?.email || ''
    this.errorMessage = ''
    this.successMessage = ''
  }

  private resetPasswordForm(): void {
    this.currentPassword = ''
    this.newPassword = ''
    this.confirmPassword = ''
    this.errorMessage = ''
    this.successMessage = ''
  }

  async saveProfile(): Promise<void> {
    if (!this.nom || !this.prenom || !this.email) {
      this.errorMessage = 'Veuillez remplir tous les champs'
      return
    }

    this.loading = true
    try {
      await this.transactionService.updateProfile({
        nom: this.nom,
        prenom: this.prenom,
        email: this.email,
      })

      // Update current user in auth service
      this.user = { ...this.user!, nom: this.nom, prenom: this.prenom, email: this.email }
      localStorage.setItem('user', JSON.stringify(this.user))

      this.editMode = false
      this.successMessage = 'Profil mis à jour avec succès'
      setTimeout(() => {
        this.successMessage = ''
      }, 3000)
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Erreur lors de la mise à jour du profil'
    } finally {
      this.loading = false
    }
  }

  async changePassword(): Promise<void> {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs'
      return
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les nouveaux mots de passe ne correspondent pas'
      return
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      return
    }

    this.loading = true
    try {
      await this.transactionService.changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword,
      })

      this.passwordEditMode = false
      this.resetPasswordForm()
      this.successMessage = 'Mot de passe changé avec succès'
      setTimeout(() => {
        this.successMessage = ''
      }, 3000)
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Erreur lors du changement du mot de passe'
    } finally {
      this.loading = false
    }
  }

  getAvatarInitials(): string {
    if (!this.user) return '?'
    const first = this.user.prenom?.[0] || ''
    const last = this.user.nom?.[0] || ''
    return (first + last).toUpperCase()
  }

  goBack(): void {
    this.router.navigate(['/dashboard'])
  }
}
