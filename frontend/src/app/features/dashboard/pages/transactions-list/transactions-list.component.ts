import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { AuthService, User } from '../../../../core/services/auth.service'
import { TransactionService, Category, Transaction } from '../../../../core/services/transaction.service'
import { PdfService } from '../../../../core/services/pdf.service'

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.scss'],
})
export class TransactionsListComponent implements OnInit {
  user: User | null = null
  categories: Category[] = []
  allTransactions: Transaction[] = []
  filteredTransactions: Transaction[] = []
  loading = true
  Math = Math // Expose Math to template

  // Filtres
  searchTerm = ''
  selectedCategory = '0'
  startDate = ''
  endDate = ''
  sortBy: 'date' | 'price' | 'name' = 'date'
  sortOrder: 'asc' | 'desc' = 'desc'

  // Type de transaction
  transactionType: 'recette' | 'depense' = 'recette'
  pageTitle = ''

  // Pagination
  itemsPerPage = 10
  currentPage = 1

  get paginatedTransactions(): Transaction[] {
    const start = (this.currentPage - 1) * this.itemsPerPage
    return this.filteredTransactions.slice(start, start + this.itemsPerPage)
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTransactions.length / this.itemsPerPage)
  }

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private pdfService: PdfService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe((url) => {
      const path = url[0]?.path || ''
      this.transactionType = path === 'recettes' ? 'recette' : 'depense'
      this.pageTitle = path === 'recettes' ? 'Mes Recettes' : 'Mes Dépenses'
      this.loadData()
    })
  }

  async loadData(): Promise<void> {
    try {
      this.loading = true
      this.user = this.authService.getCurrentUser()

      const categoriesRes = await this.transactionService.getCategories()
      this.categories = categoriesRes.data || []

      const transactionsRes = await this.transactionService.getTransactions()
      this.allTransactions = transactionsRes.data || []

      // Filtrer par type
      this.allTransactions = this.allTransactions.filter((t) => {
        const cat = this.categories.find((c) => c.id === t.categorie_id)
        return cat?.type === this.transactionType
      })

      this.applyFilters()
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      this.loading = false
    }
  }

  applyFilters(): void {
    let filtered = [...this.allTransactions]

    // Recherche
    if (this.searchTerm) {
      filtered = filtered.filter((t) => t.designation.toLowerCase().includes(this.searchTerm.toLowerCase()))
    }

    // Catégorie
    if (this.selectedCategory !== '0') {
      filtered = filtered.filter((t) => t.categorie_id === parseInt(this.selectedCategory))
    }

    // Dates
    if (this.startDate) {
      filtered = filtered.filter((t) => new Date(t.date) >= new Date(this.startDate))
    }
    if (this.endDate) {
      const endDateObj = new Date(this.endDate)
      endDateObj.setHours(23, 59, 59, 999)
      filtered = filtered.filter((t) => new Date(t.date) <= endDateObj)
    }

    // Tri
    filtered.sort((a, b) => {
      let aVal: any
      let bVal: any

      if (this.sortBy === 'date') {
        aVal = new Date(a.date).getTime()
        bVal = new Date(b.date).getTime()
      } else if (this.sortBy === 'price') {
        aVal = a.quantite * a.prix_unitaire
        bVal = b.quantite * b.prix_unitaire
      } else {
        aVal = a.designation.toLowerCase()
        bVal = b.designation.toLowerCase()
      }

      if (this.sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })

    this.filteredTransactions = filtered
    this.currentPage = 1
  }

  resetFilters(): void {
    this.searchTerm = ''
    this.selectedCategory = '0'
    this.startDate = ''
    this.endDate = ''
    this.sortBy = 'date'
    this.sortOrder = 'desc'
    this.applyFilters()
  }

  toggleSort(field: 'date' | 'price' | 'name'): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortBy = field
      this.sortOrder = 'desc'
    }
    this.applyFilters()
  }

  getFilteredCategories(): Category[] {
    return this.categories.filter((cat) => cat.type === this.transactionType)
  }

  downloadPdf(): void {
    const totalAmount = this.filteredTransactions.reduce((sum, t) => sum + t.quantite * t.prix_unitaire, 0)

    this.pdfService.generateSimplePdfReport(
      `${this.user?.prenom} ${this.user?.nom}`,
      this.user?.email || '',
      this.startDate || new Date().toISOString().split('T')[0],
      this.endDate || new Date().toISOString().split('T')[0],
      this.filteredTransactions,
      this.transactionType === 'recette' ? totalAmount : 0,
      this.transactionType === 'depense' ? totalAmount : 0,
      0
    )
  }

  goBack(): void {
    this.router.navigate(['/dashboard'])
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  get getSortIcon(): string {
    return this.sortOrder === 'asc' ? '↑' : '↓'
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find(c => c.id === categoryId)?.nom || '-'
  }

  getPaginationPages(): any[] {
    const pages: any[] = []
    for (let i = 1; i <= this.totalPages; i++) {
      if (i <= 5 || Math.abs(i - this.currentPage) <= 1 || i > this.totalPages - 2) {
        pages.push({ page: i, isEllipsis: false })
      } else if (pages[pages.length - 1]?.isEllipsis === false) {
        pages.push({ isEllipsis: true })
      }
    }
    return pages
  }

  goToPage(page: number): void {
    this.currentPage = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  getTotalAmount(): number {
    return this.filteredTransactions.reduce((sum, t) => sum + t.quantite * t.prix_unitaire, 0)
  }
}
