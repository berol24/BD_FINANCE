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
}
