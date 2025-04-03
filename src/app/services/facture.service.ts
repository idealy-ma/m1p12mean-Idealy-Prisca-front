import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Facture, FactureFilters, FactureStats, Transaction, PaymentInfo } from '../models/facture.model';
import { ApiPaginatedResponse } from './reparation.service';

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  private apiUrl = `${environment.apiUrl}/factures`;

  constructor(private http: HttpClient) {
    // Les mocks ne sont plus initialisés
  }

  // --- Méthodes API --- 

  /**
   * Génère une facture pour une réparation terminée via l'API.
   */
  generateFromReparation(reparationId: string): Observable<Facture> {
    const url = `${this.apiUrl}/from-reparation/${reparationId}`;
    console.log(`FactureService: calling API to generate invoice from repair ${reparationId} at ${url}`);
    return this.http.post<{ success: boolean; message: string; data: Facture }>(url, {}).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('FactureService: Invoice generated successfully', response.data);
          return this.parseDatesInFacture(response.data); // Parser les dates
        } else {
          throw new Error(response.message || 'Erreur lors de la génération de la facture.');
        }
      }),
      catchError(this.handleError) 
    );
  }

  /**
   * Récupère la liste des factures depuis l'API (avec filtres et pagination).
   * @param filters Filtres optionnels (statut, dates, client, etc.)
   * @param page Page actuelle (pour pagination)
   * @param limit Nombre d'éléments par page
   * @param sortField Champ de tri
   * @param sortOrder Ordre de tri ('asc' ou 'desc')
   * @returns Observable<ApiPaginatedResponse<Facture>>
   */
  getFactures(
      filters?: FactureFilters, 
      page: number = 1, 
      limit: number = 10, 
      sortField: string = 'dateEmission', 
      sortOrder: 'asc' | 'desc' = 'desc'
    ): Observable<ApiPaginatedResponse<Facture>> { // Retourne une réponse paginée
    
    let params = new HttpParams()
        .set('page', page.toString())
        .set('limit', limit.toString())
        .set('sort', JSON.stringify({ [sortField]: sortOrder === 'desc' ? -1 : 1 }));

    // Ajouter les filtres aux paramètres s'ils sont définis
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                // Convertir les dates en format ISO si nécessaire
                if ((key === 'dateDebut' || key === 'dateFin') && value instanceof Date) {
                    params = params.set(key, value.toISOString());
                } else {
                    params = params.set(key, String(value));
                }
            }
        });
    }

    console.log(`FactureService: fetching invoices from API: ${this.apiUrl} with params:`, params);

    return this.http.get<ApiPaginatedResponse<Facture>>(this.apiUrl, { params }).pipe(
      map(response => {
          if (response && response.success && Array.isArray(response.data)) {
              response.data = response.data.map(fact => this.parseDatesInFacture(fact));
              return response;
          } else {
              console.error('FactureService: Réponse invalide de l\'API pour getFactures', response);
              // Retourner une structure vide mais valide
              return { success: false, count: 0, total: 0, pagination: {page, limit, totalPages: 0}, data: [], message: response?.message || 'Réponse API invalide' };
          }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère une facture par son ID depuis l'API.
   * @param id L'ID de la facture.
   * @returns Observable<Facture>
   */
  getFacture(id: string): Observable<Facture> {
    const url = `${this.apiUrl}/${id}`;
    console.log(`FactureService: fetching invoice ${id} from API: ${url}`);
    return this.http.get<{ success: boolean; data: Facture }>(url).pipe(
      map(response => {
        if (response.success && response.data) {
           return this.parseDatesInFacture(response.data); // Parser les dates
        } else {
           throw new Error(`Facture non trouvée ou réponse invalide (ID: ${id})`);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour une facture via l'API (PUT).
   * @param factureData Les données complètes de la facture à mettre à jour.
   * @returns Observable<Facture> La facture mise à jour.
   */
  updateFacture(factureData: Facture): Observable<Facture> {
     // Assurer que l'ID est présent pour l'URL
    if (!factureData.id) {
      return throwError(() => new Error('ID de facture manquant pour la mise à jour.'));
    }
    const url = `${this.apiUrl}/${factureData.id}`;
    console.log(`FactureService: updating invoice ${factureData.id} via API: ${url}`);
    
    // Envoyer l'objet complet (ou seulement les champs modifiables selon l'API)
    return this.http.put<{ success: boolean; message?: string; data: Facture }>(url, factureData).pipe(
      map(response => {
          if (response.success && response.data) {
              return this.parseDatesInFacture(response.data);
          } else {
              throw new Error(response.message || `Échec de la mise à jour de la facture ${factureData.id}.`);
          }
      }),
      catchError(this.handleError)
    );
  }
  
   /**
   * Met à jour partiellement une facture via l'API (PATCH), ex: changement de statut.
   * @param id L'ID de la facture.
   * @param partialData Un objet contenant les champs à mettre à jour (ex: { statut: 'validee' }).
   * @returns Observable<Facture> La facture mise à jour.
   */
  patchFacture(id: string, partialData: Partial<Facture>): Observable<Facture> {
      const url = `${this.apiUrl}/${id}`;
      console.log(`FactureService: patching invoice ${id} via API: ${url}`);
      return this.http.patch<{ success: boolean; message?: string; data: Facture }>(url, partialData).pipe(
          map(response => {
              if (response.success && response.data) {
                  return this.parseDatesInFacture(response.data);
              } else {
                  throw new Error(response.message || `Échec de la mise à jour partielle de la facture ${id}.`);
              }
          }),
          catchError(this.handleError)
      );
  }

  // --- Implémentations API pour les autres méthodes (à faire) ---

  validateFacture(factureId: string): Observable<Facture> {
    console.warn(`FactureService.validateFacture(${factureId}) APPEL API À IMPLÉMENTER !`);
    // TODO: Appeler PATCH /api/factures/:id avec { statut: 'validee' } ? Ou route dédiée ?
     return this.patchFacture(factureId, { statut: 'validee' } as Partial<Facture>).pipe(
         tap(() => console.log("Utilisation de patchFacture pour valider..."))
     );
  }

  emitFacture(factureId: string): Observable<Facture> {
    console.warn(`FactureService.emitFacture(${factureId}) APPEL API À IMPLÉMENTER !`);
    // TODO: Appeler PATCH /api/factures/:id avec { statut: 'emise' } ? Ou route dédiée ?
    return this.patchFacture(factureId, { statut: 'emise' } as Partial<Facture>).pipe(
        tap(() => console.log("Utilisation de patchFacture pour émettre..."))
    );
  }

  payFacture(factureId: string, paymentInfo: PaymentInfo): Observable<Transaction> {
     // console.warn(`FactureService.payFacture(${factureId}) APPEL API À IMPLÉMENTER !`);
     // Appeler POST /api/factures/:id/transactions
     const url = `${this.apiUrl}/${factureId}/transactions`;
     console.log(`FactureService: adding transaction for invoice ${factureId} via API: ${url}`);
     
     // Envoyer les informations de paiement dans le corps de la requête
     return this.http.post<{ success: boolean; message?: string; data: Transaction }>(url, paymentInfo).pipe(
         map(response => {
             if (response.success && response.data) {
                 // Convertir la date de la transaction retournée
                 if (response.data.date) {
                     response.data.date = new Date(response.data.date);
                 }
                 // Mapper _id vers id si présent
                 if ((response.data as any)._id && !response.data.id) {
                     response.data.id = (response.data as any)._id.toString();
                 }
                 console.log("Transaction added successfully:", response.data);
                 return response.data;
             } else {
                 throw new Error(response.message || `Échec de l\'ajout de la transaction pour la facture ${factureId}.`);
             }
         }),
         catchError(this.handleError)
     );
     // return throwError(() => new Error('payFacture API call not implemented')); 
  }

  cancelFacture(factureId: string, reason: string): Observable<Facture> {
    console.warn(`FactureService.cancelFacture(${factureId}) APPEL API À IMPLÉMENTER !`);
    // TODO: Appeler PATCH /api/factures/:id avec { statut: 'annulee', commentaires: ... } ? Ou route dédiée ?
     return this.patchFacture(factureId, { statut: 'annulee', commentaires: reason } as Partial<Facture>).pipe(
        tap(() => console.log("Utilisation de patchFacture pour annuler..."))
    );
  }

  getStats(): Observable<FactureStats> {
    const url = `${this.apiUrl}/stats/general`;
    console.log(`FactureService: fetching stats from API: ${url}`);
    
    return this.http.get<{ success: boolean; data: FactureStats }>(url).pipe(
        map(response => {
            if (response.success && response.data) {
                console.log("Stats received successfully:", response.data);
                return response.data;
            } else {
                // Si success est faux, l'erreur devrait être gérée par handleError via catchError
                // Mais au cas où, on lance une erreur générique ici.
                throw new Error('Échec de la récupération des statistiques (réponse invalide).');
            }
        }),
        catchError(this.handleError) // handleError gère les erreurs HTTP et les messages d'erreur du backend
    );
  }

  // Méthode de gestion d'erreurs
  private handleError(error: HttpErrorResponse) {
    console.error('FactureService API Error:', error);
    let userMessage = 'Une erreur technique est survenue lors de l\'opération sur la facture.';
    if (error.error instanceof ErrorEvent) {
      userMessage = `Erreur réseau ou client: ${error.error.message}`;
    } else if (error.status === 404) {
      userMessage = 'La ressource demandée (facture ou réparation) n\'a pas été trouvée.';
    } else if (error.status === 400) {
      userMessage = error.error?.message || 'Données invalides pour la facturation.';
    } else if (error.status === 401 || error.status === 403) {
      userMessage = error.error?.message || 'Action non autorisée.';
    } else if (error.status === 409) {
      userMessage = error.error?.message || 'Conflit: la ressource existe déjà ou l\'état ne permet pas l\'action.';
    } else if (error.error && error.error.message) {
      userMessage = error.error.message;
    }
    return throwError(() => new Error(userMessage));
  }
  
  // Helper pour parser les dates ET mapper l'ID
  private parseDatesInFacture(facture: any): Facture {
      if (!facture) return facture;
      
      // Mapper _id vers id si nécessaire
      if (facture._id && !facture.id) {
          facture.id = facture._id.toString(); // Convertir en string est plus sûr
      }

      facture.dateEmission = facture.dateEmission ? new Date(facture.dateEmission) : undefined;
      facture.dateEcheance = facture.dateEcheance ? new Date(facture.dateEcheance) : undefined;
      if (facture.transactions && Array.isArray(facture.transactions)) {
          facture.transactions = facture.transactions.map((tx: any) => {
              tx.date = tx.date ? new Date(tx.date) : undefined;
              // Mapper _id vers id pour les transactions aussi, si besoin
              if (tx._id && !tx.id) {
                   tx.id = tx._id.toString();
              }
              return tx;
          });
      }
      // Convertir aussi createdAt/updatedAt si besoin
      facture.createdAt = facture.createdAt ? new Date(facture.createdAt) : undefined;
      facture.updatedAt = facture.updatedAt ? new Date(facture.updatedAt) : undefined;
      
      // Assurer que les objets populés ont aussi leur ID mappé si nécessaire
      if (facture.client && facture.client._id && !facture.client.id) {
          facture.client.id = facture.client._id.toString();
      }
       if (facture.vehicule && facture.vehicule._id && !facture.vehicule.id) {
          facture.vehicule.id = facture.vehicule._id.toString();
      }
      // Ajouter d'autres si besoin (reparation, devis, creePar...)
       if (facture.reparation && facture.reparation._id && !facture.reparation.id) {
          facture.reparation.id = facture.reparation._id.toString();
      }
       if (facture.devis && facture.devis._id && !facture.devis.id) {
          facture.devis.id = facture.devis._id.toString();
      }

      return facture as Facture;
  }
  
  // Méthode pour initialiser les mocks (commentée)
  /*
  private initMockData() { ... }
  */
} 