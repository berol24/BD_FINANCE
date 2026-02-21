import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, ActivatedRoute } from '@angular/router'
import { TransactionService, Category } from '../../../../core/services/transaction.service'
import { AuthService } from '../../../../core/services/auth.service'

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-transaction.component.html',
})
export class AddTransactionComponent implements OnInit {
  type: 'recette' | 'depense' = 'recette'
  amount = 0
  categoryId = 0
  description = ''
  categories: Category[] = []
  loading = false
  error = ''

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe((params) => {
      this.type = params['type'] === 'depense' ? 'depense' : 'recette'
    })
    await this.loadCategories()
  }

  async loadCategories(): Promise<void> {
    try {
      const res = await this.transactionService.getCategories(this.type)
      this.categories = res.data || []
    } catch (err) {
      this.error = 'Erreur lors du chargement des catégories'
      console.error('Erreur loadCategories:', err)
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.amount || !this.categoryId) {
      this.error = 'Veuillez remplir tous les champs'
      return
    }

    this.loading = true
    this.error = ''

    try {
      const currentUser = this.authService.getCurrentUser()
      if (!currentUser) {
        this.error = 'Utilisateur non authentifié'
        return
      }

      await this.transactionService.createTransaction({
        amount: this.amount,
        type: this.type,
        categoryId: this.categoryId,
        description: this.description,
        createdAt: new Date().toISOString(),
      })

      this.router.navigate(['/dashboard'])
    } catch (err: any) {
      this.error = err?.message || 'Erreur lors de la création'
    } finally {
      this.loading = false
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard'])
  }
}
