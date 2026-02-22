import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../environments/environment'

const API_BASE_URL = environment.apiBaseUrl

export interface Category {
  id: number
  user_id: number
  nom: string
  type: string
}

export interface Transaction {
  id: number
  user_id: number
  date: string
  designation: string
  quantite: number
  prix_unitaire: number
  categorie_id: number
}

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  constructor(private http: HttpClient) {}

  async getCategories(type?: string): Promise<any> {
    let url = `${API_BASE_URL}/categories`
    if (type) {
      url += `?type=${type}`
    }
    return await this.http.get<any>(url).toPromise() as any
  }

  async getTransactions(type?: string): Promise<any> {
    let url = `${API_BASE_URL}/transactions`
    if (type) {
      url += `?type=${type}`
    }
    return await this.http.get<any>(url).toPromise() as any
  }

  async getProfile(): Promise<any> {
    return await this.http.get(`${API_BASE_URL}/profile`).toPromise()
  }

  async createTransaction(data: any): Promise<any> {
    return await this.http.post(`${API_BASE_URL}/transactions`, data).toPromise()
  }

  async updateTransaction(id: number, data: any): Promise<any> {
    return await this.http.put(`${API_BASE_URL}/transactions/${id}`, data).toPromise()
  }

  async deleteTransaction(id: number): Promise<any> {
    return await this.http.delete(`${API_BASE_URL}/transactions/${id}`).toPromise()
  }

  async createCategory(data: any): Promise<any> {
    return await this.http.post(`${API_BASE_URL}/categories`, data).toPromise()
  }

  async updateCategory(id: number, data: any): Promise<any> {
    return await this.http.put(`${API_BASE_URL}/categories/${id}`, data).toPromise()
  }

  async deleteCategory(id: number): Promise<any> {
    return await this.http.delete(`${API_BASE_URL}/categories/${id}`).toPromise()
  }

  async updateProfile(data: any): Promise<any> {
    return await this.http.put(`${API_BASE_URL}/profile`, data).toPromise()
  }

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<any> {
    return await this.http.post(`${API_BASE_URL}/change-password`, data).toPromise()
  }

  async getTransactionsByPeriod(startDate: string, endDate: string, type?: string): Promise<any> {
    let url = `${API_BASE_URL}/transactions?startDate=${startDate}&endDate=${endDate}`
    if (type) {
      url += `&type=${type}`
    }
    return await this.http.get<any>(url).toPromise() as any
  }

  async getChartData(months: number = 12): Promise<any> {
    return await this.http.get(`${API_BASE_URL}/chart-data?months=${months}`).toPromise()
  }
}
