import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment'; // Ajustez le chemin si nécessaire

// --- Interfaces pour typer les données reçues du backend ---

// Réponse générique de l'API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Données pour le CA Total
export interface CaTotalData {
  totalCA: number;
}

// Données pour le CA par Type
export interface CaParTypeData {
  type: string;
  totalCA: number;
}

// Données pour les Statuts Devis
export interface StatutsDevisData {
  detailsParStatut: Array<{ statut: string; count: number }>;
  totalDevis: number;
  devisAcceptes: number;
  tauxAcceptation: number;
}


@Injectable({
  providedIn: 'root'
})
export class StatistiqueService {

  private apiUrl = `${environment.apiUrl}/stats`; // Base URL pour les stats

  constructor(private http: HttpClient) { }

  /**
   * Récupère le chiffre d'affaires total sur la période.
   * @param dateDebut Date de début (YYYY-MM-DD)
   * @param dateFin Date de fin (YYYY-MM-DD)
   */
  getChiffreAffairesTotal(dateDebut: string, dateFin: string): Observable<CaTotalData> {
    const url = `${this.apiUrl}/chiffre-affaires`;
    let params = new HttpParams();
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin) params = params.set('dateFin', dateFin);

    console.log(`StatistiqueService: fetching CA Total from ${url} with params`, params);

    return this.http.get<ApiResponse<CaTotalData>>(url, { params }).pipe(
      map(response => {
        if (response && response.success) {
          return response.data;
        } else {
          throw new Error(response?.message || 'Erreur API non spécifiée pour CA Total.');
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère le chiffre d'affaires par type de service/ligne sur la période.
   * @param dateDebut Date de début (YYYY-MM-DD)
   * @param dateFin Date de fin (YYYY-MM-DD)
   */
  getChiffreAffairesParType(dateDebut: string, dateFin: string): Observable<CaParTypeData[]> {
    const url = `${this.apiUrl}/ca-par-type`;
    let params = new HttpParams();
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin) params = params.set('dateFin', dateFin);

    console.log(`StatistiqueService: fetching CA par Type from ${url} with params`, params);

    return this.http.get<ApiResponse<CaParTypeData[]>>(url, { params }).pipe(
      map(response => {
        if (response && response.success) {
          return response.data || []; // Retourne un tableau vide si data est null/undefined
        } else {
          throw new Error(response?.message || 'Erreur API non spécifiée pour CA par Type.');
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques sur les statuts des devis sur la période.
   * @param dateDebut Date de début (YYYY-MM-DD)
   * @param dateFin Date de fin (YYYY-MM-DD)
   */
  getStatutsDevis(dateDebut: string, dateFin: string): Observable<StatutsDevisData> {
    const url = `${this.apiUrl}/statuts-devis`;
    let params = new HttpParams();
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin) params = params.set('dateFin', dateFin);

    console.log(`StatistiqueService: fetching Statuts Devis from ${url} with params`, params);

    return this.http.get<ApiResponse<StatutsDevisData>>(url, { params }).pipe(
      map(response => {
        if (response && response.success) {
          // Retourner une structure par défaut si data est vide (au cas où le backend ne le ferait pas)
          return response.data || { detailsParStatut: [], totalDevis: 0, devisAcceptes: 0, tauxAcceptation: 0 };
        } else {
          throw new Error(response?.message || 'Erreur API non spécifiée pour Statuts Devis.');
        }
      }),
      catchError(this.handleError)
    );
  }


  /**
   * Gestionnaire d'erreurs HTTP simple.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue!';
    let userFriendlyMessage = 'Impossible de récupérer les statistiques. Veuillez réessayer plus tard.';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau
      errorMessage = `Erreur: ${error.error.message}`;
      userFriendlyMessage = 'Erreur réseau ou navigateur. Vérifiez votre connexion.';
    } else {
      // Le backend a retourné un code d'erreur
      errorMessage = `Code ${error.status}: ${error.message}`;
      if (error.error && error.error.message) {
        // Utiliser le message d'erreur du backend s'il est fourni
        userFriendlyMessage = error.error.message;
        errorMessage += ` - API Msg: ${userFriendlyMessage}`;
      } else if (error.status === 401 || error.status === 403) {
          userFriendlyMessage = "Accès non autorisé.";
      } else if (error.status === 404) {
           userFriendlyMessage = "Endpoint statistique non trouvé.";
      }
    }

    console.error('StatistiqueService Error:', errorMessage);
    // Renvoyer une erreur observable avec un message pour l'utilisateur
    return throwError(() => new Error(userFriendlyMessage));
  }

}

