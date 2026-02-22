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
    localStorage.removeItem('user')
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken')
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  /**
   * Vérifie si le JWT est expiré
   */
  isTokenExpired(): boolean {
    const token = this.getAccessToken()
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
