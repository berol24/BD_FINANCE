import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'

export type Language = 'fr' | 'en'

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private currentLanguage = new BehaviorSubject<Language>(this.getStoredLanguage())

  private translations = {
    fr: {
      'dashboard.addTransaction': 'Nouvelle transaction',
      'dashboard.editTransaction': 'Modifier la transaction',
      'dashboard.recettes': 'Recettes',
      'dashboard.depenses': 'Dépenses',
      'dashboard.solde': 'Solde',
      'dashboard.updateSuccess': 'Transaction mise à jour avec succès',
      'dashboard.deleteConfirm': 'Êtes-vous sûr de vouloir supprimer cette transaction ?',
      'dashboard.seeMore': 'Voir plus',
      'profile.title': 'Mon Profil',
      'profile.edit': 'Modifier',
      'profile.save': 'Enregistrer',
      'profile.cancel': 'Annuler',
      'profile.changePassword': 'Changer le mot de passe',
      'profile.name': 'Nom',
      'profile.firstName': 'Prénom',
      'profile.email': 'Email',
      'profile.currentPassword': 'Mot de passe actuel',
      'profile.newPassword': 'Nouveau mot de passe',
      'profile.confirmPassword': 'Confirmer le mot de passe',
      'profile.updateSuccess': 'Profil mis à jour avec succès',
      'share.title': 'Partager',
      'share.description': 'Partagez BD Finance avec vos amis!',
      'install.title': 'Installer',
      'install.description': 'Installer l\'application sur votre téléphone',
      'logout': 'Déconnexion',
      'login': 'Se connecter',
      'register': 'S\'inscrire',
      'search': 'Rechercher',
      'filter': 'Filtrer',
      'sort': 'Trier',
      'date': 'Date',
      'price': 'Prix',
      'category': 'Catégorie',
      'download': 'Télécharger',
      'language': 'Langue',
      'report': 'Rapport',
      'period': 'Période',
      'analytics': 'Analytiques',
    },
    en: {
      'dashboard.addTransaction': 'Add Transaction',
      'dashboard.editTransaction': 'Edit Transaction',
      'dashboard.recettes': 'Income',
      'dashboard.depenses': 'Expenses',
      'dashboard.solde': 'Balance',
      'dashboard.updateSuccess': 'Transaction updated successfully',
      'dashboard.deleteConfirm': 'Are you sure you want to delete this transaction?',
      'dashboard.seeMore': 'See more',
      'profile.title': 'My Profile',
      'profile.edit': 'Edit',
      'profile.save': 'Save',
      'profile.cancel': 'Cancel',
      'profile.changePassword': 'Change Password',
      'profile.name': 'Last Name',
      'profile.firstName': 'First Name',
      'profile.email': 'Email',
      'profile.currentPassword': 'Current Password',
      'profile.newPassword': 'New Password',
      'profile.confirmPassword': 'Confirm Password',
      'profile.updateSuccess': 'Profile updated successfully',
      'share.title': 'Share',
      'share.description': 'Share BD Finance with your friends!',
      'install.title': 'Install',
      'install.description': 'Install the app on your phone',
      'logout': 'Logout',
      'login': 'Login',
      'register': 'Register',
      'search': 'Search',
      'filter': 'Filter',
      'sort': 'Sort',
      'date': 'Date',
      'price': 'Price',
      'category': 'Category',
      'download': 'Download',
      'language': 'Language',
      'report': 'Report',
      'period': 'Period',
      'analytics': 'Analytics',
    },
  }

  readonly currentLanguage$ = this.currentLanguage.asObservable()

  constructor() {
    this.setLanguage(this.currentLanguage.value)
  }

  private getStoredLanguage(): Language {
    const stored = localStorage.getItem('language')
    return (stored === 'en' ? 'en' : 'fr') as Language
  }

  setLanguage(lang: Language): void {
    localStorage.setItem('language', lang)
    this.currentLanguage.next(lang)
    document.documentElement.lang = lang
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage.value
  }

  translate(key: string, params?: any): string {
    const lang = this.currentLanguage.value
    let value = this.translations[lang][key as keyof typeof this.translations['fr']] || key

    if (params) {
      Object.keys(params).forEach((param) => {
        value = value.replace(`{{${param}}}`, params[param])
      })
    }

    return value
  }

  t(key: string, params?: any): string {
    return this.translate(key, params)
  }

  getLanguages(): Language[] {
    return ['fr', 'en']
  }
}
