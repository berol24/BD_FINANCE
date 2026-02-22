import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterModule } from '@angular/router'
import { AuthService, User } from '../../../../core/services/auth.service'
import { TransactionService, Category, Transaction } from '../../../../core/services/transaction.service'
import { HeaderComponent } from '../../components/header/header.component'
import { StatsComponent } from '../../components/stats/stats.component'
import { ChartComponent } from '../../components/chart/chart.component'
import { TransactionTableComponent } from '../../components/transaction-table/transaction-table.component'
import { AddTransactionFormComponent } from '../../components/add-transaction-form/add-transaction-form.component'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    StatsComponent,
    ChartComponent,
    TransactionTableComponent,
    AddTransactionFormComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  user: User | null = null
  categories: Category[] = []
  transactions: Transaction[] = []
  recettes: Transaction[] = []
  depenses: Transaction[] = []
  loading = true
  editingTransaction: Transaction | null = null

  totalRecettes = 0
  totalDepenses = 0
  solde = 0

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData()
  }

  async loadData(): Promise<void> {
    try {
      this.loading = true
      this.user = this.authService.getCurrentUser()

      const profileRes = await this.transactionService.getProfile()
      this.user = profileRes.user || profileRes.data?.user

      const categoriesRes = await this.transactionService.getCategories()
      this.categories = categoriesRes.data || []

      const transactionsRes = await this.transactionService.getTransactions()
      this.transactions = transactionsRes.data || []

      // Séparer par type de catégorie
      this.recettes = this.transactions.filter((t) => {
        const cat = this.categories.find((c) => c.id === t.categorie_id)
        return cat?.type === 'recette'
      })

      this.depenses = this.transactions.filter((t) => {
        const cat = this.categories.find((c) => c.id === t.categorie_id)
        return cat?.type === 'depense'
      })

      // Calculer les totaux (quantite * prix_unitaire)
      this.totalRecettes = this.recettes.reduce((sum, t) => sum + t.quantite * t.prix_unitaire, 0)
      this.totalDepenses = this.depenses.reduce((sum, t) => sum + t.quantite * t.prix_unitaire, 0)
      this.solde = this.totalRecettes - this.totalDepenses
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      this.loading = false
    }
  }

  async onDeleteTransaction(transactionId: number): Promise<void> {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      try {
        await this.transactionService.deleteTransaction(transactionId)
        await this.loadData()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        alert('Erreur lors de la suppression')
      }
    }
  }

  async onTransactionAdded(): Promise<void> {
    await this.loadData()
  }

  onEditTransaction(transaction: Transaction): void {
    this.editingTransaction = transaction
  }

  async onEditSuccess(): Promise<void> {
    this.editingTransaction = null
    await this.loadData()
  }

  onEditCancel(): void {
    this.editingTransaction = null
  }

  logout(): void {
    this.authService.logout()
    this.router.navigate(['/auth/login'])
  }
}
