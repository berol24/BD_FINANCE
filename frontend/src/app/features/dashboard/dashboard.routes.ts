import { Routes } from '@angular/router'
import { DashboardComponent } from './pages/dashboard/dashboard.component'
import { ProfileComponent } from './pages/profile/profile.component'

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
  },
  {
    path: 'recettes',
    loadComponent: () => import('./pages/transactions-list/transactions-list.component').then(m => m.TransactionsListComponent),
  },
  {
    path: 'depenses',
    loadComponent: () => import('./pages/transactions-list/transactions-list.component').then(m => m.TransactionsListComponent),
  },
]
