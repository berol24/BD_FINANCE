import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../environments/environment'

export interface User {
  id: number
  nom: string
  prenom: string
  email: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface JwtPayload {
  exp?: number
  iat?: number
  [key: string]: any
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  async login(email: string, password: string): Promise<AuthResponse | undefined> {
    const response = await this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password })
      .toPromise()
    
    if (response) {
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  }

  async register(nom: string, prenom: string, email: string, password: string, confirmPassword: string): Promise<any> {
    return await this.http
      .post(`${environment.apiBaseUrl}/auth/register`, {
        nom,
        prenom,
        email,
        password,
        confirmPassword,
        createdAt: new Date(),
      })
      .toPromise()
  }

  logout(): void {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  isLoggedIn(): boolean {
    const accessToken = this.getAccessToken()
    if (!accessToken) {
      return false
    }

    if (!this.isTokenExpired(accessToken)) {
      return true
    }

    return !!this.getRefreshToken()
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken')
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  /**
   * Vérifie si le JWT est expiré
   */
  isTokenExpired(token: string | null = this.getAccessToken()): boolean {
    if (!token) return true

    try {
      const payload = this.decodeToken(token)
      if (!payload.exp) return true

      const expirationTime = payload.exp * 1000
      const currentTime = Date.now()
      return currentTime >= expirationTime
    } catch {
      return true
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      console.warn('⚠️ Aucun refresh token disponible')
      return null
    }

    try {
      console.log('🔄 Tentative de rafraîchissement du token...')
      const response = await this.http
        .post<{ accessToken: string; refreshToken: string }>(`${environment.apiBaseUrl}/auth/refresh`, {
          refreshToken,
        })
        .toPromise()

      if (!response?.accessToken) {
        console.error('❌ Pas de access token dans la réponse du refresh')
        return null
      }

      localStorage.setItem('accessToken', response.accessToken)
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken)
      }

      console.log('✅ Token rafraîchi avec succès')
      return response.accessToken
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement du token:', error)
      return null
    }
  }

  async ensureValidAccessToken(): Promise<string | null> {
    const accessToken = this.getAccessToken()
    if (!accessToken) {
      console.warn('⚠️ Aucun access token trouvé')
      return null
    }

    if (!this.isTokenExpired(accessToken)) {
      console.log('✅ Access token valide')
      return accessToken
    }

    console.warn('⚠️ Access token expiré, tentative de rafraîchissement...')
    const newAccessToken = await this.refreshAccessToken()
    if (newAccessToken) {
      console.log('✅ Token rafraîchi avec succès')
      return newAccessToken
    }

    console.error('❌ Échec du rafraîchissement du token, déconnexion')
    this.logout()
    return null
  }

  /**
   * Décode un JWT manuellement
   */
  private decodeToken(token: string): JwtPayload {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch {
      return {}
    }
  }
}
