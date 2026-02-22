import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthService } from '../services/auth.service'
import { Router } from '@angular/router'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const router = inject(Router)
  const token = authService.getAccessToken()

  // Vérifier si le token est expiré
  if (authService.isTokenExpired()) {
    authService.logout()
    router.navigate(['/auth/login'])
    return next(req)
  }

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  return next(req)
}
