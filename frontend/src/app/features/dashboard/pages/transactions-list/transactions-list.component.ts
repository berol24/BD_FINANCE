import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { Subscription } from 'rxjs'
import { AuthService, User } from '../../../../core/services/auth.service'
import { TransactionService, Category, Transaction } from '../../../../core/services/transaction.service'
import { PdfService } from '../../../../core/services/pdf.service'
import { CurrencyService } from '../../../../core/services/currency.service'
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

interface MonthOption {
  key: string
  label: string
}

interface MonthlyBarData {
  month: string
  label: string
  recettes: number
  depenses: number
  solde: number
}

const TRANSACTION_FORM_DRAFT_KEY = 'transaction-form-draft'
const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
]

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AddTransactionFormComponent],
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.scss'],
})
export class TransactionsListComponent implements OnInit, AfterViewInit, OnDestroy {
  user: User | null = null
  categories: Category[] = []
  allTransactions: Transaction[] = []
  filteredTransactions: Transaction[] = []
  loading = true
  Math = Math

  totalAmount = 0
  availableMonths: MonthOption[] = []
  categoriesAmount: CategoryAmount[] = []
  paginationPages: { page?: number; isEllipsis: boolean }[] = []

  private categoryById = new Map<number, Category>()
  private routeSub?: Subscription
  private searchDebounceTimer?: ReturnType<typeof setTimeout>
  private chartUpdateTimer?: ReturnType<typeof setTimeout>
  private destroyed = false

  @ViewChild('donutCanvas') set donutCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.donutCanvas = ref
    if (ref && !this.loading) this.scheduleChartUpdate()
  }
  @ViewChild('barCanvas') set barCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.barCanvas = ref
    if (ref && !this.loading) this.scheduleChartUpdate()
  }
  private donutCanvas?: ElementRef<HTMLCanvasElement>
  private barCanvas?: ElementRef<HTMLCanvasElement>
  donutChart?: Chart
  barChart?: Chart

  searchTerm = ''
  selectedCategory = '0'
  startDate = ''
  endDate = ''
  selectedMonthKey = ''
  sortBy: 'date' | 'price' | 'name' = 'date'
  sortOrder: 'asc' | 'desc' = 'desc'

  transactionType: 'recette' | 'depense' | 'all' = 'recette'
  pageTitle = ''
  editingTransaction: Transaction | null = null

  itemsPerPage = 10
  currentPage = 1
  paginatedTransactions: Transaction[] = []
  totalPages = 0

  constructor(
    private readonly authService: AuthService,
    private readonly transactionService: TransactionService,
    private readonly pdfService: PdfService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    public readonly currency: CurrencyService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.url.subscribe((url) => {
      const path = url[0]?.path || ''
      if (path === 'recettes') {
        this.transactionType = 'recette'
        this.pageTitle = 'Mes Recettes'
      } else if (path === 'depenses') {
        this.transactionType = 'depense'
        this.pageTitle = 'Mes Dépenses'
      } else {
        this.transactionType = 'all'
        this.pageTitle = 'Toutes les Transactions'
      }
      this.restoreTransactionDraftIfNeeded()
      void this.loadData()
    })
  }

  ngAfterViewInit(): void {
    this.scheduleChartUpdate()
  }

  ngOnDestroy(): void {
    this.destroyed = true
    this.routeSub?.unsubscribe()
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer)
    if (this.chartUpdateTimer) clearTimeout(this.chartUpdateTimer)
    this.donutChart?.destroy()
    this.barChart?.destroy()
  }

  trackByTransactionId(_index: number, transaction: Transaction): number {
    return transaction.id
  }

  trackByCategoryId(_index: number, cat: { id: number }): number {
    return cat.id
  }

  trackByMonthKey(_index: number, month: MonthOption): string {
    return month.key
  }

  private scheduleChartUpdate(): void {
    if (this.chartUpdateTimer) clearTimeout(this.chartUpdateTimer)
    this.chartUpdateTimer = setTimeout(() => {
      if (!this.loading && !this.destroyed) {
        this.updateCharts()
      }
    }, 120)
  }

  async loadData(): Promise<void> {
    try {
      this.loading = true
      this.user = this.authService.getCurrentUser()

      const typeParam = this.transactionType === 'all' ? undefined : this.transactionType
      const [categoriesRes, transactionsRes] = await Promise.all([
        this.transactionService.getCategories(),
        this.transactionService.getTransactions(typeParam),
      ])

      this.categories = categoriesRes.data || []
      this.categoryById = new Map(this.categories.map((c) => [Number(c.id), c]))

      const raw = (transactionsRes.data || []) as Transaction[]
      this.allTransactions =
        this.transactionType === 'all'
          ? raw.filter((t) => t.type === 'recette' || t.type === 'depense')
          : raw.filter((t) => t.type === this.transactionType)

      this.rebuildAvailableMonths()
      this.applyFilters(false)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      this.loading = false
      this.scheduleChartUpdate()
    }
  }

  onSearchChange(): void {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer)
    this.searchDebounceTimer = setTimeout(() => this.applyFilters(false), 200)
  }

  onCategoryChange(): void {
    this.applyFilters(false)
  }

  onDateChange(): void {
    this.selectedMonthKey = ''
    this.applyFilters(false)
  }

  onItemsPerPageChange(): void {
    this.itemsPerPage = Number(this.itemsPerPage) || 10
    this.currentPage = 1
    this.updatePagination()
  }

  applyFilters(syncMonthDates = true): void {
    if (syncMonthDates && this.selectedMonthKey) {
      this.applyMonthDates()
    }

    const search = this.searchTerm.trim().toLowerCase()
    const categoryId = this.selectedCategory !== '0' ? Number.parseInt(this.selectedCategory, 10) : null
    const startMs = this.startDate ? this.parseLocalDateStart(this.startDate) : null
    const endMs = this.endDate ? this.parseLocalDateEnd(this.endDate) : null

    let filtered = this.allTransactions.filter((t) => {
      if (search) {
        const designation = (t.designation || '').toLowerCase()
        if (!designation.includes(search)) return false
      }

      if (categoryId !== null && Number(t.categorie_id) !== categoryId) {
        return false
      }

      if (startMs !== null || endMs !== null) {
        const txMs = this.parseTransactionDateMs(t.date)
        if (Number.isNaN(txMs)) return false
        if (startMs !== null && txMs < startMs) return false
        if (endMs !== null && txMs > endMs) return false
      }

      return true
    })

    filtered = this.sortTransactions(filtered)

    this.filteredTransactions = filtered
    this.totalAmount = filtered.reduce((sum, t) => sum + this.getSignedAmount(t), 0)
    this.categoriesAmount = this.calculateCategoriesAmount()
    this.currentPage = 1
    this.updatePagination()
    this.scheduleChartUpdate()
  }

  private sortTransactions(transactions: Transaction[]): Transaction[] {
    const sorted = [...transactions]
    const order = this.sortOrder === 'asc' ? 1 : -1

    sorted.sort((a, b) => {
      let cmp = 0
      if (this.sortBy === 'date') {
        cmp = this.parseTransactionDateMs(a.date) - this.parseTransactionDateMs(b.date)
      } else if (this.sortBy === 'price') {
        cmp = this.getSignedAmount(a) - this.getSignedAmount(b)
      } else {
        cmp = (a.designation || '').localeCompare(b.designation || '', 'fr', { sensitivity: 'base' })
      }
      return cmp * order
    })

    return sorted
  }

  private updatePagination(): void {
    const perPage = Number(this.itemsPerPage) || 10
    this.itemsPerPage = perPage
    this.totalPages = Math.max(1, Math.ceil(this.filteredTransactions.length / perPage))
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages
    }
    const start = (this.currentPage - 1) * perPage
    this.paginatedTransactions = this.filteredTransactions.slice(start, start + perPage)
    this.paginationPages = this.buildPaginationPages()
  }

  private rebuildAvailableMonths(): void {
    const keys = new Set<string>()
    for (const t of this.allTransactions) {
      const key = this.getMonthKey(t.date)
      if (key) keys.add(key)
    }
    this.availableMonths = Array.from(keys)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => ({
        key,
        label: new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        }),
      }))
  }

  selectMonth(key: string): void {
    if (this.selectedMonthKey === key) {
      this.selectedMonthKey = ''
      this.startDate = ''
      this.endDate = ''
    } else {
      this.selectedMonthKey = key
      this.applyMonthDates()
    }
    this.applyFilters(false)
  }

  private applyMonthDates(): void {
    if (!this.selectedMonthKey) return
    const [year, month] = this.selectedMonthKey.split('-').map(Number)
    const lastDay = new Date(year, month, 0).getDate()
    this.startDate = `${this.selectedMonthKey}-01`
    this.endDate = `${this.selectedMonthKey}-${String(lastDay).padStart(2, '0')}`
  }

  updateCharts(): void {
    if (!this.donutCanvas?.nativeElement || !this.barCanvas?.nativeElement) {
      return
    }
    this.updateDonutChart()
    this.updateBarChart()
  }

  calculateCategoriesAmount(): CategoryAmount[] {
    const categoryMap = new Map<number, { nom: string; montant: number; id: number }>()

    for (const t of this.filteredTransactions) {
      const catId = Number(t.categorie_id)
      const cat = this.categoryById.get(catId)
      if (!cat) continue

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { nom: cat.nom, montant: 0, id: catId })
      }
      categoryMap.get(catId)!.montant += this.getSignedAmount(t)
    }

    return Array.from(categoryMap.values())
      .map((item, index) => ({
        ...item,
        couleur: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => Math.abs(b.montant) - Math.abs(a.montant))
  }

  updateDonutChart(): void {
    if (!this.donutCanvas) return

    const ctx = this.donutCanvas.nativeElement.getContext('2d')
    if (!ctx) return

    let labels: string[]
    let data: number[]
    let colors: string[]

    if (this.categoriesAmount.length > 0) {
      labels = this.categoriesAmount.map((c) => c.nom)
      data = this.categoriesAmount.map((c) => Math.abs(c.montant))
      colors = this.categoriesAmount.map((c) => c.couleur)
    } else {
      let recettes = 0
      let depenses = 0
      for (const t of this.filteredTransactions) {
        if (t.type === 'recette') recettes += this.getAbsoluteAmount(t)
        else depenses += this.getAbsoluteAmount(t)
      }
      labels = ['Recettes', 'Dépenses']
      data = [recettes, depenses]
      colors = ['#10b981', '#ef4444']
    }

    if (this.donutChart) {
      this.donutChart.data.labels = labels
      this.donutChart.data.datasets[0].data = data
      this.donutChart.data.datasets[0].backgroundColor = colors
      this.donutChart.update('none')
      return
    }

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
  }

  private getDonutOptions(): Chart['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
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
              return `${label}: ${value.toFixed(2)} ${this.currency.symbol}`
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
    this.applyFilters(false)
  }

  toggleSort(field: 'date' | 'price' | 'name'): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortBy = field
      this.sortOrder = 'desc'
    }
    this.applyFilters(false)
  }

  downloadPdf(): void {
    let totalRecettes = 0
    let totalDepenses = 0

    for (const t of this.filteredTransactions) {
      if (t.type === 'recette') totalRecettes += this.getAbsoluteAmount(t)
      else if (t.type === 'depense') totalDepenses += this.getAbsoluteAmount(t)
    }

    this.pdfService.generateSimplePdfReport(
      `${this.user?.prenom} ${this.user?.nom}`,
      this.user?.email || '',
      this.startDate || new Date().toISOString().split('T')[0],
      this.endDate || new Date().toISOString().split('T')[0],
      this.filteredTransactions,
      totalRecettes,
      totalDepenses,
      totalRecettes - totalDepenses,
      this.categoriesAmount
    )
  }

  goBack(): void {
    this.router.navigate(['/dashboard'])
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.updatePagination()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
      this.updatePagination()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  get getSortIcon(): string {
    return this.sortOrder === 'asc' ? '↑' : '↓'
  }

  getCategoryName(categoryId: number): string {
    return this.categoryById.get(Number(categoryId))?.nom || '-'
  }

  getTransactionSign(transaction: Transaction): string {
    return this.getSignedAmount(transaction) >= 0 ? '+' : '-'
  }

  isPositiveTransaction(transaction: Transaction): boolean {
    return this.getSignedAmount(transaction) >= 0
  }

  private buildPaginationPages(): { page?: number; isEllipsis: boolean }[] {
    const pages: { page?: number; isEllipsis: boolean }[] = []
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
    this.updatePagination()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async deleteTransaction(transactionId: number): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) return
    try {
      await this.transactionService.deleteTransaction(transactionId)
      await this.loadData()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  editTransaction(transaction: Transaction): void {
    this.editingTransaction = transaction
  }

  async onEditSuccess(): Promise<void> {
    this.editingTransaction = null
    await this.loadData()
  }

  onEditCancel(): void {
    this.editingTransaction = null
  }

  private getBarChartMonthlyData(): MonthlyBarData[] {
    let source = this.allTransactions

    const search = this.searchTerm.trim().toLowerCase()
    if (search) {
      source = source.filter((t) => (t.designation || '').toLowerCase().includes(search))
    }

    if (this.selectedCategory !== '0') {
      const categoryId = Number.parseInt(this.selectedCategory, 10)
      source = source.filter((t) => Number(t.categorie_id) === categoryId)
    }

    return this.buildMonthlyData(source)
  }

  private buildMonthlyData(transactions: Transaction[]): MonthlyBarData[] {
    const monthlyMap = new Map<string, { recettes: number; depenses: number }>()

    for (const t of transactions) {
      const month = this.getMonthKey(t.date)
      if (!month) continue

      const amount = this.getAbsoluteAmount(t)
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { recettes: 0, depenses: 0 })
      }

      const item = monthlyMap.get(month)!
      if (t.type === 'recette') item.recettes += amount
      else item.depenses += amount
    }

    return Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => {
        const [year, mon] = month.split('-').map(Number)
        return {
          month,
          label: new Date(year, mon - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          recettes: data.recettes,
          depenses: data.depenses,
          solde: data.recettes - data.depenses,
        }
      })
  }

  updateBarChart(): void {
    if (!this.barCanvas) return

    const monthlyData = this.getBarChartMonthlyData()
    const labels = monthlyData.map((d) => d.label)
    const recettesData = monthlyData.map((d) => d.recettes)
    const depensesData = monthlyData.map((d) => d.depenses)
    const selectedIndex = monthlyData.findIndex((d) => d.month === this.selectedMonthKey)

    const recettesColors = monthlyData.map((_, i) =>
      i === selectedIndex ? 'rgba(16, 185, 129, 0.95)' : 'rgba(16, 185, 129, 0.55)'
    )
    const depensesColors = monthlyData.map((_, i) =>
      i === selectedIndex ? 'rgba(239, 68, 68, 0.95)' : 'rgba(239, 68, 68, 0.55)'
    )

    const ctx = this.barCanvas.nativeElement.getContext('2d')
    if (!ctx) return

    if (this.barChart) {
      this.barChart.data.labels = labels
      this.barChart.data.datasets[0].data = recettesData
      this.barChart.data.datasets[0].backgroundColor = recettesColors
      this.barChart.data.datasets[1].data = depensesData
      this.barChart.data.datasets[1].backgroundColor = depensesColors
      ;(this.barChart.options as any)._monthlyData = monthlyData
      this.barChart.update('none')
      return
    }

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Recettes',
            data: recettesData,
            backgroundColor: recettesColors,
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'Dépenses',
            data: depensesData,
            backgroundColor: depensesColors,
            borderColor: '#ef4444',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        onClick: (_event, elements) => {
          if (elements.length === 0) return
          const chart = this.barChart
          const data = (chart?.options as any)?._monthlyData as MonthlyBarData[] | undefined
          const month = data?.[elements[0].index]
          if (month) this.selectMonth(month.month)
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
              label: (context) => `${context.dataset.label}: ${(context.parsed.y ?? 0).toFixed(2)} ${this.currency.symbol}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value} ${this.currency.symbol}`,
            },
            grid: { color: 'rgba(148, 163, 184, 0.2)' },
          },
          x: { grid: { display: false } },
        },
      },
    })
    ;(this.barChart.options as any)._monthlyData = monthlyData
  }

  getAbsoluteAmount(transaction: Transaction): number {
    return Math.abs(Number(transaction.quantite) * Number(transaction.prix_unitaire))
  }

  getSignedAmount(transaction: Transaction): number {
    const amount = this.getAbsoluteAmount(transaction)
    return transaction.type === 'depense' ? -amount : amount
  }

  getAmountClass(amount: number): string {
    return amount >= 0 ? 'text-emerald-600' : 'text-slate-700'
  }

  getCategoryPercent(montant: number): number {
    if (this.totalAmount === 0) return 0
    return (montant / this.totalAmount) * 100
  }

  /** Parse YYYY-MM-DD as local midnight to avoid UTC timezone shifts. */
  private parseLocalDateStart(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
  }

  private parseLocalDateEnd(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
  }

  private parseTransactionDateMs(dateStr: string): number {
    if (!dateStr) return Number.NaN
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return this.parseLocalDateStart(dateStr)
    }
    const datePart = dateStr.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const timePart = dateStr.includes('T') ? dateStr.slice(11) : ''
      if (!timePart || timePart.startsWith('00:00')) {
        return this.parseLocalDateStart(datePart)
      }
    }
    return new Date(dateStr).getTime()
  }

  private getMonthKey(dateStr: string): string | null {
    const ms = this.parseTransactionDateMs(dateStr)
    if (Number.isNaN(ms)) return null
    const date = new Date(ms)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
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
    if (!rawDraft) return null

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
