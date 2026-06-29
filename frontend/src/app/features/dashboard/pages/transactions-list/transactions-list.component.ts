import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { AuthService, User } from '../../../../core/services/auth.service'
import { TransactionService, Category, Transaction } from '../../../../core/services/transaction.service'
import { PdfService } from '../../../../core/services/pdf.service'
import { AddTransactionFormComponent } from '../../components/add-transaction-form/add-transaction-form.component'
import Chart from 'chart.js/auto'

interface CategoryAmount {
  nom: string
  montant: number
  id: number
  couleur: string
}

interface TransactionFormDraft {
  returnTo: string
  mode: 'new' | 'edit'
  transactionId: number | null
  data: {
    type: 'recette' | 'depense'
    designation: string
    quantite: number
    prix_unitaire: number
    categorie_id: number
    date: string
  }
}

const TRANSACTION_FORM_DRAFT_KEY = 'transaction-form-draft'

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AddTransactionFormComponent],
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.scss'],
})
export class TransactionsListComponent implements OnInit, AfterViewInit {
  user: User | null = null
  categories: Category[] = []
  allTransactions: Transaction[] = []
  filteredTransactions: Transaction[] = []
  loading = true
  Math = Math

  // Charts
  @ViewChild('donutCanvas') set donutCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.donutCanvas = ref
    if (ref) this.scheduleChartUpdate()
  }
  @ViewChild('barCanvas') set barCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.barCanvas = ref
    if (ref) this.scheduleChartUpdate()
  }
  private donutCanvas?: ElementRef<HTMLCanvasElement>
  private barCanvas?: ElementRef<HTMLCanvasElement>
  donutChart?: Chart
  barChart?: Chart
  categoriesAmount: CategoryAmount[] = []
  private chartUpdateTimer?: ReturnType<typeof setTimeout>

  // Filtres
  searchTerm = ''
  selectedCategory = '0'
  startDate = ''
  endDate = ''
  selectedMonthKey = ''
  sortBy: 'date' | 'price' | 'name' = 'date'
  sortOrder: 'asc' | 'desc' = 'desc'

  // Type de transaction
  transactionType: 'recette' | 'depense' | 'all' = 'recette'
  pageTitle = ''
  editingTransaction: Transaction | null = null

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
    private readonly authService: AuthService,
    private readonly transactionService: TransactionService,
    private readonly pdfService: PdfService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe((url) => {
      const path = url[0]?.path || ''
      if (path === 'recettes') {
        this.transactionType = 'recette'
        this.pageTitle = 'Mes Recettes'
      } else if (path === 'depenses') {
        this.transactionType = 'depense'
        this.pageTitle = 'Mes Dépenses'
      } else {
        // Afficher les deux types ensemble (transactions)
        this.transactionType = 'all' as any
        this.pageTitle = 'Toutes les Transactions'
      }
      this.restoreTransactionDraftIfNeeded()
      this.loadData()
    })
  }

  ngAfterViewInit(): void {
    this.scheduleChartUpdate()
  }

  private scheduleChartUpdate(): void {
    if (this.chartUpdateTimer) {
      clearTimeout(this.chartUpdateTimer)
    }
    this.chartUpdateTimer = setTimeout(() => {
      if (!this.loading) {
        this.updateCharts()
      }
    }, 50)
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
      if (this.transactionType === 'all') {
        // Afficher tous les types
        this.allTransactions = this.allTransactions.filter((t) => t.type === 'recette' || t.type === 'depense')
      } else {
        // Filtrer par type spécifique
        this.allTransactions = this.allTransactions.filter((t) => t.type === this.transactionType)
      }

      this.applyFilters()
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      this.loading = false
      this.scheduleChartUpdate()
    }
  }

  applyFilters(syncMonthDates = true): void {
    if (syncMonthDates) {
      this.applyMonthDates()
    }

    let filtered = [...this.allTransactions]

    // Recherche
    if (this.searchTerm) {
      filtered = filtered.filter((t) => t.designation.toLowerCase().includes(this.searchTerm.toLowerCase()))
    }

    // Catégorie
    if (this.selectedCategory !== '0') {
      filtered = filtered.filter((t) => t.categorie_id === Number.parseInt(this.selectedCategory, 10))
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
        aVal = this.getSignedAmount(a)
        bVal = this.getSignedAmount(b)
      } else {
        aVal = a.designation.toLowerCase()
        bVal = b.designation.toLowerCase()
      }

      if (this.sortOrder === 'asc') {
        if (aVal > bVal) {
          return 1
        }

        if (aVal < bVal) {
          return -1
        }

        return 0
      }

      if (aVal < bVal) {
        return 1
      }

      if (aVal > bVal) {
        return -1
      }

      return 0
    })

    this.filteredTransactions = filtered
    this.currentPage = 1
    this.scheduleChartUpdate()
  }

  get availableMonths(): { key: string; label: string }[] {
    const keys = new Set<string>()
    this.allTransactions.forEach((t) => {
      const date = new Date(t.date)
      if (!Number.isNaN(date.getTime())) {
        keys.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
      }
    })
    return Array.from(keys)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => ({
        key,
        label: new Date(`${key}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      }))
  }

  selectMonth(key: string): void {
    if (this.selectedMonthKey === key) {
      this.selectedMonthKey = ''
      this.startDate = ''
      this.endDate = ''
    } else {
      this.selectedMonthKey = key
      const [year, month] = key.split('-')
      const lastDay = new Date(Number(year), Number(month), 0).getDate()
      this.startDate = `${key}-01`
      this.endDate = `${key}-${String(lastDay).padStart(2, '0')}`
    }
    this.applyFilters(false)
  }

  private applyMonthDates(): void {
    if (!this.selectedMonthKey) return
    const [year, month] = this.selectedMonthKey.split('-')
    const lastDay = new Date(Number(year), Number(month), 0).getDate()
    this.startDate = `${this.selectedMonthKey}-01`
    this.endDate = `${this.selectedMonthKey}-${String(lastDay).padStart(2, '0')}`
  }

  updateCharts(): void {
    if (!this.donutCanvas?.nativeElement || !this.barCanvas?.nativeElement) {
      return
    }

    this.categoriesAmount = this.calculateCategoriesAmount()
    this.updateDonutChart()
    this.updateLineChart()
  }

  calculateCategoriesAmount(): CategoryAmount[] {
    const categoryMap = new Map<number, { nom: string; montant: number; id: number }>()
    const colors = [
      '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'
    ]

    this.filteredTransactions.forEach((t) => {
      const cat = this.categories.find((c) => c.id === t.categorie_id)
      if (cat) {
        if (!categoryMap.has(cat.id)) {
          categoryMap.set(cat.id, { nom: cat.nom, montant: 0, id: cat.id })
        }
        const item = categoryMap.get(cat.id)!
        item.montant += this.getSignedAmount(t)
      }
    })

    return Array.from(categoryMap.values())
      .map((item, index) => ({
        ...item,
        couleur: colors[index % colors.length],
      }))
      .sort((a, b) => b.montant - a.montant)
  }

  updateDonutChart(): void {
    if (!this.donutCanvas) return

    if (this.donutChart) {
      this.donutChart.destroy()
    }

    const ctx = this.donutCanvas.nativeElement.getContext('2d')
    if (!ctx) return

    if (this.categoriesAmount.length > 0) {
      const labels = this.categoriesAmount.map((c) => c.nom)
      const data = this.categoriesAmount.map((c) => Math.abs(c.montant))
      const colors = this.categoriesAmount.map((c) => c.couleur)

      this.donutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: colors,
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        },
        options: this.getDonutOptions(),
      })
      return
    }

    let recettes = 0
    let depenses = 0
    this.filteredTransactions.forEach((t) => {
      if (t.type === 'recette') recettes += this.getAbsoluteAmount(t)
      else depenses += this.getAbsoluteAmount(t)
    })

    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Recettes', 'Dépenses'],
        datasets: [
          {
            data: [recettes, depenses],
            backgroundColor: ['#10b981', '#ef4444'],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: this.getDonutOptions(),
    })
  }

  private getDonutOptions(): Chart['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { size: 13, weight: 'bold' as const },
            color: '#1f2937',
            padding: 15,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const value = context.parsed || 0
              return `${label}: ${value.toFixed(2)} €`
            },
          },
        },
      },
    }
  }

  resetFilters(): void {
    this.searchTerm = ''
    this.selectedCategory = '0'
    this.startDate = ''
    this.endDate = ''
    this.selectedMonthKey = ''
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
    return this.categories
  }

  downloadPdf(): void {
    // Calculer les vrais totaux recettes et dépenses
    let totalRecettes = 0
    let totalDepenses = 0

    this.filteredTransactions.forEach((t) => {
      if (t.type === 'recette') {
        totalRecettes += this.getAbsoluteAmount(t)
      } else if (t.type === 'depense') {
        totalDepenses += this.getAbsoluteAmount(t)
      }
    })

    const solde = totalRecettes - totalDepenses

    this.pdfService.generateSimplePdfReport(
      `${this.user?.prenom} ${this.user?.nom}`,
      this.user?.email || '',
      this.startDate || new Date().toISOString().split('T')[0],
      this.endDate || new Date().toISOString().split('T')[0],
      this.filteredTransactions,
      totalRecettes,
      totalDepenses,
      solde,
      this.categoriesAmount
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
    return this.categories.find((c) => c.id === categoryId)?.nom || '-'
  }

  getTransactionSign(transaction: Transaction): string {
    return this.getSignedAmount(transaction) >= 0 ? '+' : '-'
  }

  isPositiveTransaction(transaction: Transaction): boolean {
    return this.getSignedAmount(transaction) >= 0
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
    return this.filteredTransactions.reduce((sum, t) => sum + this.getSignedAmount(t), 0)
  }

  async deleteTransaction(transactionId: number): Promise<void> {
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

  async editTransaction(transaction: Transaction): Promise<void> {
    this.editingTransaction = transaction
  }

  async onEditSuccess(): Promise<void> {
    this.editingTransaction = null
    await this.loadData()
  }

  onEditCancel(): void {
    this.editingTransaction = null
  }

  getMonthlyData(): any[] {
    return this.buildMonthlyData(this.filteredTransactions)
  }

  getBarChartMonthlyData(): any[] {
    let source = [...this.allTransactions]

    if (this.searchTerm) {
      source = source.filter((t) => t.designation.toLowerCase().includes(this.searchTerm.toLowerCase()))
    }

    if (this.selectedCategory !== '0') {
      source = source.filter((t) => t.categorie_id === Number.parseInt(this.selectedCategory, 10))
    }

    return this.buildMonthlyData(source)
  }

  private buildMonthlyData(transactions: Transaction[]): any[] {
    const monthlyMap = new Map<string, { recettes: number; depenses: number }>()

    transactions.forEach((t) => {
      const date = new Date(t.date)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const amount = this.getAbsoluteAmount(t)

      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { recettes: 0, depenses: 0 })
      }

      const item = monthlyMap.get(month)!
      if (t.type === 'recette') {
        item.recettes += amount
      } else {
        item.depenses += amount
      }
    })

    return Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        label: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        recettes: data.recettes,
        depenses: data.depenses,
        solde: data.recettes - data.depenses,
      }))
  }

  updateLineChart(): void {
    if (!this.barCanvas) return

    const monthlyData = this.getBarChartMonthlyData()
    const labels = monthlyData.map((d) => d.label)
    const recettesData = monthlyData.map((d) => d.recettes)
    const depensesData = monthlyData.map((d) => d.depenses)
    const selectedIndex = monthlyData.findIndex((d) => d.month === this.selectedMonthKey)

    if (this.barChart) {
      this.barChart.destroy()
    }

    const ctx = this.barCanvas.nativeElement.getContext('2d')
    if (!ctx) return

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Recettes',
            data: recettesData,
            backgroundColor: monthlyData.map((_, i) =>
              i === selectedIndex ? 'rgba(16, 185, 129, 0.95)' : 'rgba(16, 185, 129, 0.55)'
            ),
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'Dépenses',
            data: depensesData,
            backgroundColor: monthlyData.map((_, i) =>
              i === selectedIndex ? 'rgba(239, 68, 68, 0.95)' : 'rgba(239, 68, 68, 0.55)'
            ),
            borderColor: '#ef4444',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index
            const month = monthlyData[index]
            if (month) {
              this.selectMonth(month.month)
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: { size: 13, weight: 'bold' as const },
              color: '#1f2937',
              padding: 15,
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${(context.parsed.y ?? 0).toFixed(2)} €`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value} €`,
            },
            grid: { color: 'rgba(148, 163, 184, 0.2)' },
          },
          x: { grid: { display: false } },
        },
      },
    })
  }

  getAbsoluteAmount(transaction: Transaction): number {
    return Math.abs(transaction.quantite * transaction.prix_unitaire)
  }

  getSignedAmount(transaction: Transaction): number {
    const amount = this.getAbsoluteAmount(transaction)
    return transaction.type === 'depense' ? -amount : amount
  }

  getAmountClass(amount: number): string {
    return amount >= 0 ? 'text-emerald-600' : 'text-slate-700'
  }

  private restoreTransactionDraftIfNeeded(): void {
    const currentPath = this.getCurrentPath()
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo')
    const resumeTransaction = this.route.snapshot.queryParamMap.get('resumeTransaction')

    if (returnTo !== currentPath || resumeTransaction !== 'edit') {
      return
    }

    const draft = this.readDraft()
    if (draft?.mode !== 'edit' || draft.returnTo !== currentPath) {
      this.clearResumeQueryParams()
      return
    }

    this.editingTransaction = {
      id: draft.transactionId ?? 0,
      user_id: this.user?.id ?? 0,
      date: `${draft.data.date}T00:00:00`,
      type: draft.data.type,
      designation: draft.data.designation,
      quantite: draft.data.quantite,
      prix_unitaire: draft.data.prix_unitaire,
      categorie_id: draft.data.categorie_id,
    }

    sessionStorage.removeItem(TRANSACTION_FORM_DRAFT_KEY)
    this.clearResumeQueryParams()
  }

  private readDraft(): TransactionFormDraft | null {
    const rawDraft = sessionStorage.getItem(TRANSACTION_FORM_DRAFT_KEY)

    if (!rawDraft) {
      return null
    }

    try {
      return JSON.parse(rawDraft) as TransactionFormDraft
    } catch {
      sessionStorage.removeItem(TRANSACTION_FORM_DRAFT_KEY)
      return null
    }
  }

  private clearResumeQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        resumeTransaction: null,
        returnTo: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }

  private getCurrentPath(): string {
    return this.router.url.split('?')[0]
  }
}