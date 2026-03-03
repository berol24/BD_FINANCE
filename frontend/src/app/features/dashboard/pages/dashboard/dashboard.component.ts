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
  recettesPreview: Transaction[] = []
  depensesPreview: Transaction[] = []
  loading = true
  editingTransaction: Transaction | null = null
  showNewTransactionModal = false

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

      // Charger le profil
      try {
        const profileRes = await this.transactionService.getProfile()
        this.user = profileRes.user || profileRes.data?.user
        console.log('✅ Profil chargé:', this.user)
      } catch (error) {
        console.error('❌ Erreur chargement profil:', error)
      }

      // Charger les catégories
      try {
        const categoriesRes = await this.transactionService.getCategories()
        this.categories = categoriesRes.data || []
        console.log('✅ Catégories chargées:', this.categories.length)
      } catch (error) {
        console.error('❌ Erreur chargement catégories:', error)
        this.categories = []
      }

      // Charger les transactions (le plus important!)
      try {
        const transactionsRes = await this.transactionService.getTransactions()
        this.transactions = transactionsRes.data || []
        console.log('✅ Transactions chargées:', this.transactions.length)
        
        // Debug: afficher les 3 premières transactions pour voir leur structure
        if (this.transactions.length > 0) {
          console.log('🔍 Première transaction complète:', JSON.stringify(this.transactions[0], null, 2))
          console.log('🔍 Clés disponibles:', Object.keys(this.transactions[0]))
          console.log('🔍 Types détectés:', [...new Set(this.transactions.map(t => t.type))])
        }

        // Séparer par type de transaction
        this.recettes = this.transactions.filter((t) => t.type === 'recette')
        this.depenses = this.transactions.filter((t) => t.type === 'depense')

        console.log('📊 Recettes:', this.recettes.length, '| Dépenses:', this.depenses.length)

        // Limiter à 5 pour l'aperçu
        this.recettesPreview = this.recettes.slice(0, 5)
        this.depensesPreview = this.depenses.slice(0, 5)

        // Calculer les totaux (quantite * prix_unitaire)
        this.totalRecettes = this.recettes.reduce((sum, t) => sum + t.quantite * t.prix_unitaire, 0)
        this.totalDepenses = this.depenses.reduce((sum, t) => sum + t.quantite * t.prix_unitaire, 0)
        this.solde = this.totalRecettes - this.totalDepenses

        console.log('💰 Total Recettes:', this.totalRecettes, '| Total Dépenses:', this.totalDepenses, '| Solde:', this.solde)
      } catch (error) {
        console.error('❌ Erreur chargement transactions:', error)
        this.transactions = []
        this.recettes = []
        this.depenses = []
        this.recettesPreview = []
        this.depensesPreview = []
      }
    } catch (error) {
      console.error('❌ Erreur générale lors du chargement des données:', error)
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
    this.showNewTransactionModal = false
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

  openNewTransactionModal(): void {
    this.showNewTransactionModal = true
  }

  closeNewTransactionModal(): void {
    this.showNewTransactionModal = false
  }

  goToRecettes(): void {
    this.router.navigate(['/dashboard/recettes'])
  }

  goToDepenses(): void {
    this.router.navigate(['/dashboard/depenses'])
  }

  goToAllTransactions(): void {
    this.router.navigate(['/dashboard/transactions'])
  }

  logout(): void {
    this.authService.logout()
    this.router.navigate(['/auth/login'])
  }
}
