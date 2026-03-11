import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, ActivatedRoute } from '@angular/router'
import { TransactionService, Category } from '../../../../core/services/transaction.service'
import { AuthService } from '../../../../core/services/auth.service'

interface AddTransactionDraft {
  returnTo: string
  data: {
    type: 'recette' | 'depense'
    amount: number
    categoryId: number
    description: string
  }
}

const ADD_TRANSACTION_DRAFT_KEY = 'standalone-transaction-draft'

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
    private readonly transactionService: TransactionService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.type = params['type'] === 'depense' ? 'depense' : 'recette'
      void this.initialize()
    })
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

  goToCategories(): void {
    const currentPath = this.getCurrentPath()
    const draft: AddTransactionDraft = {
      returnTo: currentPath,
      data: {
        type: this.type,
        amount: this.amount,
        categoryId: this.categoryId,
        description: this.description,
      },
    }

    sessionStorage.setItem(ADD_TRANSACTION_DRAFT_KEY, JSON.stringify(draft))

    this.router.navigate(['/dashboard/categories'], {
      queryParams: {
        returnTo: currentPath,
        resumeTransaction: 'new',
      },
    })
  }

  private restoreDraftIfNeeded(): void {
    const rawDraft = sessionStorage.getItem(ADD_TRANSACTION_DRAFT_KEY)

    if (!rawDraft) {
      return
    }

    try {
      const draft = JSON.parse(rawDraft) as AddTransactionDraft

      if (draft.returnTo !== this.getCurrentPath()) {
        return
      }

      this.type = draft.data.type
      this.amount = draft.data.amount
      this.categoryId = draft.data.categoryId
      this.description = draft.data.description
      sessionStorage.removeItem(ADD_TRANSACTION_DRAFT_KEY)
    } catch {
      sessionStorage.removeItem(ADD_TRANSACTION_DRAFT_KEY)
    }
  }

  private getCurrentPath(): string {
    return this.router.url.split('?')[0]
  }

  private async initialize(): Promise<void> {
    await this.loadCategories()
    this.restoreDraftIfNeeded()
  }
}
