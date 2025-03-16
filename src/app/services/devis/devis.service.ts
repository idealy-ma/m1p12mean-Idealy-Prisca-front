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
  getDevis(page: number = 1, limit: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/manager/devis`, {
      ...this.httpOptions,
      params
    });
  }

  // Récupérer un devis par son ID
  getDevisById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/manager/devis/${id}`, this.httpOptions);
  }

  // Mettre à jour un devis
  updateDevis(id: string, devis: Partial<Devis>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/manager/devis/${id}`, devis, this.httpOptions);
  }
} 