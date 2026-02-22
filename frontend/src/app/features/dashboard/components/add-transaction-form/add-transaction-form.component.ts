import { Component, Output, EventEmitter, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
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
  showNewCategoryForm = false
  newCategoryName = ''
  creatingCategory = false
  private lastEditingId: number | null = null

  constructor(private transactionService: TransactionService) {}

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
    return this.categories.filter((cat) => cat.type === this.type)
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

    const category = this.categories.find((c) => c.id === this.categorie_id)
    if (category) {
      this.type = category.type as 'recette' | 'depense'
    }

    this.lastEditingId = this.editingTransaction.id
  }

  onTypeChange(): void {
    this.categorie_id = 0
    this.showNewCategoryForm = false
  }

  toggleNewCategoryForm(): void {
    this.showNewCategoryForm = !this.showNewCategoryForm
    this.newCategoryName = ''
  }

  async createNewCategory(): Promise<void> {
    if (!this.newCategoryName.trim()) {
      this.error = 'Veuillez entrer un nom de catégorie'
      return
    }

    this.creatingCategory = true
    try {
      const res = await this.transactionService.createCategory({
        nom: this.newCategoryName,
        type: this.type,
      })
      
      // Recharger les catégories
      await this.loadCategories()
      
      // Sélectionner la nouvelle catégorie
      if (res.data?.id) {
        this.categorie_id = res.data.id
      }
      
      this.newCategoryName = ''
      this.showNewCategoryForm = false
    } catch (err: any) {
      this.error = 'Erreur lors de la création de la catégorie'
      console.error('Erreur createCategory:', err)
    } finally {
      this.creatingCategory = false
    }
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
    this.showNewCategoryForm = false
    this.newCategoryName = ''
    this.creatingCategory = false
    this.lastEditingId = null
  }
}
