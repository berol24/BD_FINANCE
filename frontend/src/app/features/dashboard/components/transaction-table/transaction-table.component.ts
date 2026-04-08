import { Component, Input, Output, EventEmitter } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Transaction, Category } from '../../../../core/services/transaction.service'

@Component({
  selector: 'app-transaction-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-table.component.html',
})
export class TransactionTableComponent {
  @Input() title = ''
  @Input() transactions: Transaction[] = []
  @Input() categories: Category[] = []
  @Output() delete = new EventEmitter<number>()
  @Output() edit = new EventEmitter<Transaction>()

  getCategoryName(categorie_id: number): string {
    const category = this.categories.find((c) => c.id === categorie_id)
    return category?.nom || 'Sans catégorie'
  }

  get displayedTransactions(): Transaction[] {
    return this.transactions.slice(0, 5)
  }

  getAbsoluteAmount(transaction: Transaction): number {
    return Math.abs(transaction.quantite * transaction.prix_unitaire)
  }

  getTransactionSign(transaction: Transaction): string {
    return transaction.type === 'depense' ? '-' : '+'
  }

  getAmountClass(transaction: Transaction): string {
    return transaction.type === 'depense' ? 'text-slate-700' : 'text-emerald-600'
  }

  onDelete(transactionId: number): void {
    this.delete.emit(transactionId)
  }

  onEdit(transaction: Transaction): void {
    this.edit.emit(transaction)
  }
}

