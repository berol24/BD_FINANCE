import { Component, Output, EventEmitter, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { TransactionService, Category, Transaction } from '../../../../core/services/transaction.service'

@Component({
  selector: 'app-add-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-transaction-form.component.html',
})
export class AddTransactionFormComponent implements OnInit, OnChanges {
  @Output() success = new EventEmitter<void>()
  @Output() cancel = new EventEmitter<void>()
  @Input() editingTransaction: Transaction | null = null

  type: 'recette' | 'depense' = 'recette'
  designation = ''
  quantite = 0
  prix_unitaire = 0
  categorie_id = 0
  date = new Date().toISOString().split('T')[0]
  categories: Category[] = []
  loading = false
  error = ''
  private lastEditingId: number | null = null

  constructor(
    private transactionService: TransactionService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCategories()
    this.applyEditingTransactionIfNeeded(true)
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingTransaction']) {
      this.applyEditingTransactionIfNeeded(true)
    }
  }

  get filteredCategories(): Category[] {
    return this.categories
  }

  async loadCategories(): Promise<void> {
    try {
      const res = await this.transactionService.getCategories()
      this.categories = res.data || []
      this.applyEditingTransactionIfNeeded(false)
    } catch (err) {
      this.error = 'Erreur lors du chargement des catégories'
      console.error('Erreur loadCategories:', err)
    }
  }

  private applyEditingTransactionIfNeeded(force: boolean): void {
    if (!this.editingTransaction) {
      return
    }

    if (!force && this.lastEditingId === this.editingTransaction.id) {
      return
    }

    this.designation = this.editingTransaction.designation
    this.quantite = this.editingTransaction.quantite
    this.prix_unitaire = this.editingTransaction.prix_unitaire
    this.categorie_id = this.editingTransaction.categorie_id
    this.date = this.editingTransaction.date.split('T')[0]
    this.type = this.editingTransaction.type

    this.lastEditingId = this.editingTransaction.id
  }

  onTypeChange(): void {
    this.error = ''
  }

  goToCategories(): void {
    this.router.navigate(['/dashboard/categories'])
  }

  async onSubmit(): Promise<void> {
    if (!this.designation || !this.quantite || !this.prix_unitaire || !this.categorie_id) {
      this.error = 'Veuillez remplir tous les champs obligatoires'
      return
    }

    this.loading = true
    this.error = ''

    try {
      const payload = {
        designation: this.designation,
        quantite: this.quantite,
        prix_unitaire: this.prix_unitaire,
        categorie_id: this.categorie_id,
        type: this.type,
        date: this.date + 'T00:00:00',
      }

      if (this.editingTransaction) {
        // Éditer la transaction existante
        await this.transactionService.updateTransaction(this.editingTransaction.id, payload)
      } else {
        // Créer une nouvelle transaction
        await this.transactionService.createTransaction(payload)
      }

      this.resetForm()
      this.success.emit()

      if (this.editingTransaction) {
        this.cancel.emit()
      }
    } catch (err: any) {
      this.error = err?.message || 'Erreur lors de la création'
    } finally {
      this.loading = false
    }
  }

  onCancel(): void {
    this.resetForm()
    this.cancel.emit()
  }

  private resetForm(): void {
    this.designation = ''
    this.quantite = 0
    this.prix_unitaire = 0
    this.categorie_id = 0
    this.date = new Date().toISOString().split('T')[0]
    this.type = 'recette'
    this.error = ''
    this.lastEditingId = null
  }
}
