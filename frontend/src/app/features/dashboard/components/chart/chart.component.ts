import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Transaction, Category } from '../../../../core/services/transaction.service'

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
})
export class ChartComponent {
  @Input() transactions: Transaction[] = []
  @Input() categories: Category[] = []

  get chartData(): { label: string; recettes: number; depenses: number }[] {
    const data: Record<string, { recettes: number; depenses: number }> = {}

    this.transactions.forEach((t) => {
      const date = new Date(t.date || '')
      const month = date.toLocaleString('fr-FR', { month: 'short' })

      if (!data[month]) {
        data[month] = { recettes: 0, depenses: 0 }
      }

      // Déterminer le type directement depuis la transaction
      const montant = t.quantite * t.prix_unitaire

      if (t.type === 'recette') {
        data[month].recettes += montant
      } else if (t.type === 'depense') {
        data[month].depenses += montant
      }
    })

    return Object.entries(data).map(([label, values]) => ({
      label,
      ...values,
    }))
  }
}
