import { Component, Output, EventEmitter, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { TransactionService, Category, Transaction } from '../../../../core/services/transaction.service'

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
  selector: 'app-add-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-transaction-form.component.html',
})
export class AddTransactionFormComponent implements OnInit, OnChanges {
  @Output() success = new EventEmitter<void>()
  @Output() formCancel = new EventEmitter<void>()
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
    private readonly transactionService: TransactionService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    void this.initialize()
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
    const currentPath = this.getCurrentPath()
    const draft: TransactionFormDraft = {
      returnTo: currentPath,
      mode: this.editingTransaction ? 'edit' : 'new',
      transactionId: this.editingTransaction?.id ?? null,
      data: {
        type: this.type,
        designation: this.designation,
        quantite: this.quantite,
        prix_unitaire: this.prix_unitaire,
        categorie_id: this.categorie_id,
        date: this.date,
      },
    }

    sessionStorage.setItem(TRANSACTION_FORM_DRAFT_KEY, JSON.stringify(draft))

    this.router.navigate(['/dashboard/categories'], {
      queryParams: {
        returnTo: currentPath,
        resumeTransaction: draft.mode,
      },
    })
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
        this.formCancel.emit()
      }
    } catch (err: any) {
      this.error = err?.message || 'Erreur lors de la création'
    } finally {
      this.loading = false
    }
  }

  onCancel(): void {
    this.resetForm()
    this.formCancel.emit()
  }

  private async initialize(): Promise<void> {
    await this.loadCategories()
    this.applyEditingTransactionIfNeeded(true)
    this.restoreDraftIfNeeded()
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

  private restoreDraftIfNeeded(): void {
    if (this.editingTransaction) {
      return
    }

    const draft = this.readDraft()
    if (draft?.mode !== 'new' || draft.returnTo !== this.getCurrentPath()) {
      return
    }

    this.type = draft.data.type
    this.designation = draft.data.designation
    this.quantite = draft.data.quantite
    this.prix_unitaire = draft.data.prix_unitaire
    this.categorie_id = draft.data.categorie_id
    this.date = draft.data.date

    sessionStorage.removeItem(TRANSACTION_FORM_DRAFT_KEY)
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

  private getCurrentPath(): string {
    return this.router.url.split('?')[0]
  }
}
