import { Routes } from '@angular/router'
import { authGuard } from '../../core/guards/auth.guard'
import { AddTransactionComponent } from './pages/add-transaction/add-transaction.component'

export const transactionRoutes: Routes = [
  {
    path: 'add/:type',
    component: AddTransactionComponent,
    canActivate: [authGuard],
  },
]
