import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { Transaction, Category } from '../../../../core/services/transaction.service'
import { CurrencyService } from '../../../../core/services/currency.service'
import Chart from 'chart.js/auto'

interface MonthSummary {
  key: string
  label: string
  shortLabel: string
  recettes: number
  depenses: number
  solde: number
}

type ChartView = 'bar' | 'doughnut'

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
})
export class ChartComponent implements OnChanges, OnDestroy {
  @Input() transactions: Transaction[] = []
  @Input() categories: Category[] = []

  constructor(public readonly currency: CurrencyService) {}

  @ViewChild('mainCanvas') set mainCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.mainCanvas = ref
    if (ref && this.months.length > 0) {
      setTimeout(() => this.renderChart(), 0)
    }
  }

  private mainCanvas?: ElementRef<HTMLCanvasElement>
  months: MonthSummary[] = []
  selectedMonthKey = ''
  chartView: ChartView = 'bar'
  private chart?: Chart

  get selectedMonth(): MonthSummary | null {
    return this.months.find((m) => m.key === this.selectedMonthKey) ?? null
  }

  get hasData(): boolean {
    return this.months.length > 0
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions'] || changes['categories']) {
      this.rebuildMonths()
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy()
  }

  selectMonth(key: string): void {
    if (this.selectedMonthKey === key) return
    this.selectedMonthKey = key
    this.renderChart()
  }

  setChartView(view: ChartView): void {
    if (this.chartView === view) return
    this.chartView = view
    this.renderChart()
  }

  getBarHeight(value: number, max: number): number {
    if (max <= 0) return 8
    return Math.max(8, Math.round((value / max) * 100))
  }

  private rebuildMonths(): void {
    const data = new Map<string, { recettes: number; depenses: number }>()

    this.transactions.forEach((t) => {
      const date = new Date(t.date || '')
      if (Number.isNaN(date.getTime())) return

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!data.has(key)) {
        data.set(key, { recettes: 0, depenses: 0 })
      }

      const amount = (t.quantite ?? 0) * (t.prix_unitaire ?? 0)
      const entry = data.get(key)!
      if (t.type === 'recette') {
        entry.recettes += amount
      } else if (t.type === 'depense') {
        entry.depenses += amount
      }
    })

    this.months = Array.from(data.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, values]) => ({
        key,
        label: new Date(`${key}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        shortLabel: new Date(`${key}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'short' }),
        recettes: values.recettes,
        depenses: values.depenses,
        solde: values.recettes - values.depenses,
      }))

    if (this.months.length === 0) {
      this.selectedMonthKey = ''
      this.chart?.destroy()
      this.chart = undefined
      return
    }

    const stillValid = this.months.some((m) => m.key === this.selectedMonthKey)
    if (!stillValid) {
      this.selectedMonthKey = this.months[this.months.length - 1].key
    }

    setTimeout(() => this.renderChart(), 0)
  }

  private renderChart(): void {
    if (!this.mainCanvas?.nativeElement || this.months.length === 0) return

    this.chart?.destroy()

    const ctx = this.mainCanvas.nativeElement.getContext('2d')
    if (!ctx) return

    if (this.chartView === 'bar') {
      this.chart = this.createBarChart(ctx)
    } else {
      this.chart = this.createDoughnutChart(ctx)
    }
  }

  private createBarChart(ctx: CanvasRenderingContext2D): Chart {
    const months = this.months
    const selectedIndex = months.findIndex((m) => m.key === this.selectedMonthKey)

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months.map((m) => m.shortLabel),
        datasets: [
          {
            label: 'Recettes',
            data: months.map((m) => m.recettes),
            backgroundColor: months.map((_, i) =>
              i === selectedIndex ? 'rgba(16, 185, 129, 0.95)' : 'rgba(16, 185, 129, 0.55)'
            ),
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'Dépenses',
            data: months.map((m) => m.depenses),
            backgroundColor: months.map((_, i) =>
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
            const month = months[elements[0].index]
            if (month) this.selectMonth(month.key)
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true, font: { weight: 'bold' } },
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${(context.parsed.y ?? 0).toFixed(2)} ${this.currency.symbol}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (value) => `${value} ${this.currency.symbol}` },
            grid: { color: 'rgba(148, 163, 184, 0.2)' },
          },
          x: { grid: { display: false } },
        },
      },
    })
  }

  private createDoughnutChart(ctx: CanvasRenderingContext2D): Chart {
    const month = this.selectedMonth
    const categoryData = this.getCategoryBreakdownForMonth(month?.key ?? '')

    if (categoryData.length > 0) {
      return new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: categoryData.map((c) => c.label),
          datasets: [
            {
              data: categoryData.map((c) => c.amount),
              backgroundColor: categoryData.map((c) => c.color),
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        },
        options: this.doughnutOptions('Répartition par catégorie'),
      })
    }

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Recettes', 'Dépenses'],
        datasets: [
          {
            data: [month?.recettes ?? 0, month?.depenses ?? 0],
            backgroundColor: ['#10b981', '#ef4444'],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: this.doughnutOptions('Recettes vs Dépenses'),
    })
  }

  private doughnutOptions(title: string): Chart['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 14, weight: 'bold' },
          color: '#1e293b',
        },
        legend: {
          position: 'right',
          labels: { usePointStyle: true, font: { weight: 'bold' } },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Number(context.parsed) || 0
              const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0)
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
              return `${context.label}: ${value.toFixed(2)} ${this.currency.symbol} (${pct}%)`
            },
          },
        },
      },
    }
  }

  private getCategoryBreakdownForMonth(monthKey: string): { label: string; amount: number; color: string }[] {
    if (!monthKey) return []

    const colors = [
      '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
    ]
    const map = new Map<number, number>()

    this.transactions
      .filter((t) => {
        const date = new Date(t.date || '')
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        return key === monthKey
      })
      .forEach((t) => {
        const current = map.get(t.categorie_id) ?? 0
        map.set(t.categorie_id, current + (t.quantite ?? 0) * (t.prix_unitaire ?? 0))
      })

    return Array.from(map.entries())
      .map(([id, amount], index) => ({
        label: this.categories.find((c) => c.id === id)?.nom ?? `Catégorie ${id}`,
        amount,
        color: colors[index % colors.length],
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }
}
