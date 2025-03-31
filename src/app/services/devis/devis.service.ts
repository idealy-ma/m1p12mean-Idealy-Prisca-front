import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Devis, DevisDTO, mapDevisDTOToDevis } from '../../models/devis.model';
import { ApiResponse, ApiPaginatedResponse, ApiPagination } from '../../models/api-response.model';
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
  getDevis(page: number = 1, limit: number = 10): Observable<{
    devis: Devis[],
    pagination: ApiPagination
  }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiPaginatedResponse<DevisDTO>>(`${this.apiUrl}/manager/devis`, {
      ...this.httpOptions,
      params
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            devis: response.data.map(devisDTO => mapDevisDTOToDevis(devisDTO)),
            pagination: response.pagination
          };
        }
        return {
          devis: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        };
      })
    );
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
    }): Observable<{
      devis: Devis[],
      pagination: ApiPagination
    }> {
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
    
    return this.http.get<ApiPaginatedResponse<DevisDTO>>(`${this.apiUrl}/manager/devis`, {
      ...this.httpOptions,
      params
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            devis: response.data.map(devisDTO => mapDevisDTOToDevis(devisDTO)),
            pagination: response.pagination
          };
        }
        return {
          devis: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        };
      })
    );
  }

  // Récupérer un devis par son ID
  getDevisById(id: string): Observable<ApiResponse<Devis>> {
    return this.http.get<ApiResponse<DevisDTO>>(`${this.apiUrl}/manager/devis/${id}`, this.httpOptions)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return {
              success: response.success,
              message: response.message,
              data: mapDevisDTOToDevis(response.data)
            };
          }
          return response as ApiResponse<Devis>;
        })
      );
  }

  // Mettre à jour un devis
  updateDevis(id: string, devis: Partial<Devis>): Observable<ApiResponse<Devis>> {
    return this.http.put<ApiResponse<DevisDTO>>(`${this.apiUrl}/manager/devis/${id}`, devis, this.httpOptions)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return {
              success: response.success,
              message: response.message,
              data: mapDevisDTOToDevis(response.data)
            };
          }
          return response as ApiResponse<Devis>;
        })
      );
  }
  
  // Créer un nouveau devis (pour le client)
  createDevis(devisData: any): Observable<Devis> {
    return this.http.post<ApiResponse<DevisDTO>>(`${this.apiUrl}/client/devis`, devisData, this.httpOptions)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return mapDevisDTOToDevis(response.data);
          }
          throw new Error(response.message || 'Erreur lors de la création du devis');
        })
      );
  }
  
  // Récupérer les devis d'un client
  getClientDevis(): Observable<Devis[]> {
    return this.http.get<ApiPaginatedResponse<DevisDTO>>(`${this.apiUrl}/client/devis`, this.httpOptions)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(devisDTO => mapDevisDTOToDevis(devisDTO));
          }
          return [];
        })
      );
  }
  
  // Récupérer un devis client par son ID
  getClientDevisById(id: string): Observable<ApiResponse<Devis>> {
    return this.http.get<ApiResponse<DevisDTO>>(`${this.apiUrl}/client/devis/${id}`, this.httpOptions)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return {
              success: response.success,
              message: response.message,
              data: mapDevisDTOToDevis(response.data)
            };
          }
          return response as ApiResponse<Devis>;
        })
      );
  }
  
  // Récupérer tous les services disponibles
  getServices(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/client/services`, this.httpOptions);
  }
  
  // Récupérer tous les packs de services disponibles
  getServicePacks(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/client/servicePacks`, this.httpOptions);
  }
  
  // Envoyer un devis au client
  sendDevisToClient(id: string, devisData: any): Observable<ApiResponse<Devis>> {
    return this.http.post<ApiResponse<DevisDTO>>(`${this.apiUrl}/manager/devis/${id}/finaliser`, devisData, this.httpOptions)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return {
              success: response.success,
              message: response.message,
              data: mapDevisDTOToDevis(response.data)
            };
          }
          return response as ApiResponse<Devis>;
        })
      );
  }

  // Accepter un devis (pour le client)
  acceptDevis(id: string): Observable<ApiResponse<Devis>> {
    return this.http.post<ApiResponse<DevisDTO>>(`${this.apiUrl}/client/devis/${id}/accept`, {}, this.httpOptions)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return {
              success: response.success,
              message: response.message,
              data: mapDevisDTOToDevis(response.data)
            };
          }
          return response as ApiResponse<Devis>;
        })
      );
  }

  // Refuser un devis (pour le client)
  declineDevis(id: string): Observable<ApiResponse<Devis>> {
    return this.http.post<ApiResponse<DevisDTO>>(`${this.apiUrl}/client/devis/${id}/decline`, {}, this.httpOptions)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return {
              success: response.success,
              message: response.message,
              data: mapDevisDTOToDevis(response.data)
            };
          }
          return response as ApiResponse<Devis>;
        })
      );
  }
} 