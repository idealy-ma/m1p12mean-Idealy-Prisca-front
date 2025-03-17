import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Devis } from '../../models/devis.model';
import { ApiConfiguration } from '../api-configuration';

@Injectable({
  providedIn: 'root'
})
export class DevisService {
  private apiUrl: string;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private config: ApiConfiguration,
    private http: HttpClient
  ) {
    this.apiUrl = this.config.rootUrl;
  }

  // Récupérer tous les devis (pour le manager)
  getDevis(page: number = 1, limit: number = 10): Observable<Devis[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<Devis[]>(`${this.apiUrl}/manager/devis`, {
      ...this.httpOptions,
      params
    });
  }
  
  // Récupérer les devis avec filtres
  getDevisWithFilters(filters: {
    status?: string,
    client?: string,
    dateDebut?: string,
    dateFin?: string,
    search?: string,
    page?: number,
    limit?: number,
    sortField?: string,
    sortOrder?: string
    }): Observable<Devis[]> {
    let params = new HttpParams();
    
    // Ajouter tous les filtres non vides aux paramètres
    if (filters.status) params = params.set('status', filters.status);
    if (filters.client) params = params.set('client', filters.client);
    if (filters.dateDebut) params = params.set('dateDebut', filters.dateDebut);
    if (filters.dateFin) params = params.set('dateFin', filters.dateFin);
    if (filters.search) params = params.set('search', filters.search);
    
    // Pagination et tri
    params = params.set('page', (filters.page || 1).toString());
    params = params.set('limit', (filters.limit || 10).toString());
    
    if (filters.sortField) params = params.set('sortField', filters.sortField);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    
    return this.http.get<Devis[]>(`${this.apiUrl}/manager/devis`, {
      ...this.httpOptions,
      params
    });
  }

  // Récupérer un devis par son ID
  getDevisById(id: string): Observable<Devis> {
    return this.http.get<Devis>(`${this.apiUrl}/manager/devis/${id}`, this.httpOptions);
  }

  // Mettre à jour un devis
  updateDevis(id: string, devis: Partial<Devis>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/manager/devis/${id}`, devis, this.httpOptions);
  }
} 