import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { TransactionService, Category } from '../../../../core/services/transaction.service'

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = []
  loading = true
  error = ''
  successMessage = ''

  newCategoryName = ''
  searchTerm = ''

  editingCategoryId: number | null = null
  editingCategoryName = ''
  saving = false
  categoryToDelete: Category | null = null
  private returnTo: string | null = null
  private resumeTransaction: 'new' | 'edit' | null = null

  constructor(
    private readonly transactionService: TransactionService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo')
    const resumeTransaction = this.route.snapshot.queryParamMap.get('resumeTransaction')
    this.resumeTransaction = resumeTransaction === 'new' || resumeTransaction === 'edit'
      ? resumeTransaction
      : null
    this.loadCategories()
  }

  get filteredCategories(): Category[] {
    const term = this.normalizeName(this.searchTerm)
    if (!term) return this.categories

    return this.categories.filter((category) =>
      this.normalizeName(category.nom).includes(term)
    )
  }

  get matchedCategoriesForNewName(): Category[] {
    const term = this.normalizeName(this.newCategoryName)
    if (!term) return []

    return this.categories.filter((category) =>
      this.normalizeName(category.nom).includes(term)
    )
  }

  get canCreateCategory(): boolean {
    const normalized = this.normalizeName(this.newCategoryName)
    return !!normalized && !this.categoryExists(normalized)
  }

  get isTransactionReturnFlow(): boolean {
    return !!this.returnTo && !!this.resumeTransaction
  }

  async loadCategories(): Promise<void> {
    try {
      this.loading = true
      this.error = ''
      const res = await this.transactionService.getCategories()
      this.categories = (res.data || [])
        .slice()
        .sort((a: Category, b: Category) => a.nom.localeCompare(b.nom, 'fr'))
    } catch (err) {
      this.error = 'Erreur lors du chargement des categories'
      console.error('Erreur loadCategories:', err)
    } finally {
      this.loading = false
    }
  }

  async addCategory(): Promise<void> {
    const sanitizedName = this.sanitizeName(this.newCategoryName)

    if (!sanitizedName) {
      this.error = 'Veuillez entrer un nom de categorie'
      return
    }

    if (this.categoryExists(this.normalizeName(sanitizedName))) {
      this.error = 'Cette categorie existe deja'
      return
    }

    try {
      this.saving = true
      this.error = ''
      this.successMessage = ''
      await this.transactionService.createCategory({ nom: sanitizedName })
      this.newCategoryName = ''
      await this.loadCategories()

      if (this.returnTo && this.resumeTransaction) {
        this.successMessage = 'Catégorie créée. Retour à la saisie en cours...'
        await this.waitBeforeRedirect()
        await this.router.navigateByUrl(
          `${this.returnTo}?resumeTransaction=${this.resumeTransaction}&returnTo=${encodeURIComponent(this.returnTo)}`
        )
      } else {
        this.successMessage = 'Catégorie créée avec succès.'
      }
    } catch (err: any) {
      this.error = err?.error?.message || 'Erreur lors de la creation de la categorie'
      console.error('Erreur addCategory:', err)
    } finally {
      this.saving = false
    }
  }

  startEdit(category: Category): void {
    this.editingCategoryId = category.id
    this.editingCategoryName = category.nom
    this.error = ''
  }

  cancelEdit(): void {
    this.editingCategoryId = null
    this.editingCategoryName = ''
    this.error = ''
  }

  async saveEdit(categoryId: number): Promise<void> {
    const sanitizedName = this.sanitizeName(this.editingCategoryName)

    if (!sanitizedName) {
      this.error = 'Le nom de categorie est obligatoire'
      return
    }

    if (this.categoryExists(this.normalizeName(sanitizedName), categoryId)) {
      this.error = 'Cette categorie existe deja'
      return
    }

    try {
      this.saving = true
      this.error = ''
      await this.transactionService.updateCategory(categoryId, { nom: sanitizedName })
      this.cancelEdit()
      await this.loadCategories()
    } catch (err: any) {
      this.error = err?.error?.message || 'Erreur lors de la modification de la categorie'
      console.error('Erreur saveEdit:', err)
    } finally {
      this.saving = false
    }
  }

  askDeleteCategory(category: Category): void {
    if (this.saving) return
    this.categoryToDelete = category
  }

  cancelDeleteCategory(): void {
    this.categoryToDelete = null
  }

  async confirmDeleteCategory(): Promise<void> {
    if (!this.categoryToDelete) {
      return
    }

    const categoryId = this.categoryToDelete.id
    try {
      this.saving = true
      this.error = ''
      await this.transactionService.deleteCategory(categoryId)
      this.categoryToDelete = null
      await this.loadCategories()
    } catch (err: any) {
      this.error = err?.error?.message || 'Erreur lors de la suppression de la categorie'
      console.error('Erreur deleteCategory:', err)
    } finally {
      this.saving = false
    }
  }

  goBack(): void {
    if (this.returnTo) {
      void this.router.navigateByUrl(this.returnTo)
      return
    }

    this.router.navigate(['/dashboard'])
  }

  private waitBeforeRedirect(): Promise<void> {
    return new Promise((resolve) => {
      globalThis.setTimeout(() => resolve(), 700)
    })
  }

  private categoryExists(normalizedName: string, excludeId?: number): boolean {
    return this.categories.some((category) => {
      if (excludeId && category.id === excludeId) {
        return false
      }
      return this.normalizeName(category.nom) === normalizedName
    })
  }

  private sanitizeName(value: string): string {
    return value.trim().split(/\s+/).join(' ')
  }

  private normalizeName(value: string): string {
    return this.sanitizeName(value).toLowerCase()
  }
}
