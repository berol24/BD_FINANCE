import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthService } from '../services/auth.service'
import { Router } from '@angular/router'
import { EMPTY, from, switchMap } from 'rxjs'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const router = inject(Router)

  const isAuthRoute =
    req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh')

  if (isAuthRoute) {
    return next(req)
  }

  return from(authService.ensureValidAccessToken()).pipe(
    switchMap((token) => {
      if (!token) {
        authService.logout()
        router.navigate(['/auth/login'])
        return EMPTY
      }

      const authenticatedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })

      return next(authenticatedRequest)
    })
  )
}
