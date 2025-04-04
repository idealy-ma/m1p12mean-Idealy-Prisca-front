import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Reparation, EtapeReparation, CommentaireEtape, PhotoReparation, ReparationStatus, EtapeStatus } from '../models/reparation.model';
import { environment } from '../../environments/environment';

// Define interface for paginated response (similar to backend structure)
// Consider moving this to a shared models file (e.g., api-response.model.ts) if used elsewhere
export interface ApiPagination {
  page: number;
  limit: number;
  totalPages: number;
  total?: number; // Backend might send total count here too
  hasNext?: boolean; // Optional
  hasPrev?: boolean; // Optional
}

export interface ApiPaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  pagination: ApiPagination;
  data: T[];
  message?: string; // Optional message
}

@Injectable({
  providedIn: 'root'
})
export class ReparationService {

  private apiUrl = `${environment.apiUrl}`;
  private mecanicienApiUrl = `${this.apiUrl}/mecanicien`; // Specific route base for mechanic

  constructor(private http: HttpClient) { }

  /**
   * Récupère les réparations "en cours" assignées au mécanicien connecté (avec pagination).
   */
  getMecanicienReparations(params: {
    page?: number,
    limit?: number,
    sortField?: string,
    sortOrder?: 'asc' | 'desc',
    status?: string // Specific status filter
  }): Observable<ApiPaginatedResponse<Reparation>> {
    const url = `${this.mecanicienApiUrl}/reparations/en-cours`;
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.status) httpParams = httpParams.set('status', params.status);

    if (params.sortField && params.sortOrder) {
      const sort: { [key: string]: number } = {};
      sort[params.sortField] = params.sortOrder === 'desc' ? -1 : 1;
      httpParams = httpParams.set('sort', JSON.stringify(sort));
    }

    console.log(`ReparationService: fetching mechanic reparations from API: ${url} with params`, httpParams);

    return this.http.get<ApiPaginatedResponse<Reparation>>(url, { params: httpParams }).pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          // Ensure the data array is parsed correctly
          response.data = response.data.map(rep => this.parseDatesInReparation(rep));
          return response;
        } else {
          console.error('ReparationService: Réponse inattendue de l\'API pour getMecanicienReparations:', response);
          // Return a structure consistent with the expected type but indicating failure/empty data
          return { 
            success: false, 
            count: 0, 
            total: 0, 
            pagination: { page: params.page || 1, limit: params.limit || 10, totalPages: 0 }, 
            data: [],
            message: response?.message || 'Réponse invalide de l\'API' 
          };
        }
      }),
      tap(response => console.log(`ReparationService: fetched ${response.data.length}/${response.total} mechanic reparations from API`)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les réparations pour le client connecté (avec pagination/filtrage).
   */
  getClientReparations(params: {
    page?: number,
    limit?: number,
    sortField?: string,
    sortOrder?: 'asc' | 'desc',
    statusReparation?: string // Specific status filter
  }): Observable<ApiPaginatedResponse<Reparation>> {
    const url = `${this.apiUrl}/client/reparations`; // Endpoint spécifique au client
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.statusReparation) httpParams = httpParams.set('statusReparation', params.statusReparation);

    if (params.sortField && params.sortOrder) {
      // Le backend attend un objet JSON pour le tri, mais ici on envoie field et order séparés
      // Le ClientController s'attend à sortField et sortOrder directement
      httpParams = httpParams.set('sortField', params.sortField);
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    console.log(`ReparationService: fetching client reparations from API: ${url} with params`, httpParams);

    return this.http.get<ApiPaginatedResponse<Reparation>>(url, { params: httpParams }).pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          response.data = response.data.map(rep => this.parseDatesInReparation(rep));
          return response;
        } else {
          console.error('ReparationService: Réponse inattendue de l\'API pour getClientReparations:', response);
          return { 
            success: false, 
            count: 0, 
            total: 0, 
            pagination: { page: params.page || 1, limit: params.limit || 10, totalPages: 0 }, 
            data: [],
            message: response?.message || 'Réponse invalide de l\'API' 
          };
        }
      }),
      tap(response => console.log(`ReparationService: fetched ${response.data.length}/${response.total} client reparations from API`)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère toutes les réparations (Appel API réel mais potentiellement limité).
   * @deprecated Use specific methods with pagination/filtering like getMecanicienReparations instead.
   * TODO: Ajouter filtres, pagination côté API et l'utiliser ici.
   */
  getReparations(): Observable<Reparation[]> {
    console.warn('ReparationService: getReparations() is deprecated and likely inefficient. Use a specific method with backend pagination/filtering.');
    const url = `${this.apiUrl}/reparations`; // Assumes a general endpoint exists
    console.log('ReparationService: fetching all reparations from API');
    // Adapting to expect a paginated response even if API doesn't fully support it yet
    return this.http.get<ApiPaginatedResponse<Reparation>>(url).pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          return response.data.map(rep => this.parseDatesInReparation(rep));
        } else {
          console.error('ReparationService: Réponse inattendue de l\'API pour getReparations:', response);
          return [];
        }
      }),
      tap(data => console.log(`ReparationService: fetched ${data.length} reparations from API (potentially incomplete)`)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère une réparation par son ID depuis l'API backend.
   */
  getReparationById(id: string): Observable<Reparation> {
    const url = `${this.apiUrl}/reparations/${id}`;
    console.log(`ReparationService: fetching reparation by id ${id} from API: ${url}`);

    return this.http.get<{ success: boolean, data: Reparation }>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.parseDatesInReparation(response.data);
        } else {
          console.error(`ReparationService: API returned success=false or no data for id ${id}`, response);
          throw new HttpErrorResponse({ 
            error: { message: `Réparation non trouvée ou réponse invalide de l'API (id: ${id})`}, 
            status: 404 
          });
        }
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération de la réparation:', error);
        if (error instanceof HttpErrorResponse) {
          if (error.status === 400) {
            return throwError(() => new Error('ID de réparation invalide'));
          } else if (error.status === 403) {
            return throwError(() => new Error('Accès non autorisé à cette réparation'));
          } else if (error.status === 404) {
            return throwError(() => new Error('Réparation non trouvée'));
          }
        }
        return throwError(() => new Error('Une erreur est survenue lors de la récupération de la réparation'));
      }),
      tap(data => console.log(`ReparationService: fetched reparation ${data?._id} from API`))
    );
  }

  /**
   * Met à jour le statut global d'une réparation.
   */
  updateReparationStatus(id: string, status: ReparationStatus, dateFinReelle?: Date): Observable<Reparation> {
    const url = `${this.apiUrl}/reparations/${id}/status`;
    console.log(`ReparationService: updating global status for reparation ${id} to ${status} via API: ${url}`);
    
    const body: any = { status };
    if (dateFinReelle) {
      // S'assurer que la date est bien envoyée si elle existe
      body.dateFinReelle = dateFinReelle.toISOString(); 
    }
    
    // Utiliser PATCH
    return this.http.patch<{ success: boolean, message: string, data: Reparation }>(url, body).pipe(
      map(response => {
        if (response.success && response.data) {
          // Parser les dates de la réparation retournée
          return this.parseDatesInReparation(response.data);
        } else {
          console.error('ReparationService: API returned success=false or no data for updateReparationStatus', response);
          throw new HttpErrorResponse({ 
            error: { message: response.message || 'Échec de la mise à jour du statut.' }, 
            status: 400 // Ou autre code d'erreur approprié
          });
        }
      }),
      catchError(this.handleError) // Utiliser le gestionnaire d'erreurs global
    );
  }

  /**
   * Met à jour le statut d'une étape spécifique d'une réparation.
   */
  updateStepStatus(reparationId: string, etapeId: string, status: EtapeStatus, dateFin?: Date): Observable<EtapeReparation> {
    const url = `${this.apiUrl}/reparations/${reparationId}/etapes/${etapeId}/status`;
    console.log(`ReparationService: updating step status ${etapeId} for reparation ${reparationId} to ${status} via API: ${url}`);
    
    const body: any = { status };
    if (dateFin) {
      body.dateFin = dateFin.toISOString(); // Envoyer la date au format ISO
    }
    
    // Utiliser PATCH
    return this.http.patch<{ success: boolean, message: string, data: EtapeReparation }>(url, body).pipe(
      map(response => {
        if (response.success && response.data) {
          // Parser les dates éventuelles dans la réponse de l'étape
          return this.parseDatesInEtape(response.data);
        } else {
          console.error('ReparationService: API returned success=false or no data for updateStepStatus', response);
          throw new HttpErrorResponse({ 
            error: { message: response.message || 'Échec de la mise à jour du statut de l\'étape.' }, 
            status: 400 // Ou autre code d'erreur approprié
          });
        }
      }),
      catchError(this.handleError) // Utiliser le gestionnaire d'erreurs global
    );
  }

  /**
   * Ajoute un commentaire à une étape spécifique.
   */
  addCommentToStep(reparationId: string, etapeId: string, message: string): Observable<EtapeReparation> {
    const url = `${this.apiUrl}/reparations/${reparationId}/etapes/${etapeId}/commentaires`;
    console.log(`ReparationService: adding comment to step ${etapeId} for reparation ${reparationId} via API: ${url}`);

    const body = { message: message }; // Le backend attend un objet avec une clé "message"

    return this.http.post<{ success: boolean, message: string, data: EtapeReparation }>(url, body).pipe(
      map(response => {
        if (response.success && response.data) {
          // Parser les dates de l'étape retournée (y compris pour le nouveau commentaire)
          return this.parseDatesInEtape(response.data);
        } else {
          console.error('ReparationService: API returned success=false or no data for addCommentToStep', response);
          throw new HttpErrorResponse({ 
            error: { message: response.message || 'Échec de l\'ajout du commentaire.' }, 
            status: 400 // Ou autre code d'erreur approprié
          });
        }
      }),
      catchError(this.handleError) // Utiliser le gestionnaire d'erreurs global
    );
  }

  /**
   * Ajoute les métadonnées d'une photo (URL) à une réparation.
   */
  addPhotoToReparation(reparationId: string, photoData: { url: string, description: string, etapeAssociee?: string }): Observable<PhotoReparation> {
    const url = `${this.apiUrl}/reparations/${reparationId}/photos`;
    console.log(`ReparationService: adding photo metadata for reparation ${reparationId} via API: ${url}`);

    // Envoyer directement l'objet photoData en JSON
    return this.http.post<{ success: boolean, message: string, data: PhotoReparation }>(url, photoData).pipe(
      map(response => {
        if (response.success && response.data) {
          // Parser les dates de la photo retournée
          return this.parseDatesInPhoto(response.data);
        } else {
          console.error('ReparationService: API returned success=false or no data for addPhotoToReparation', response);
          throw new HttpErrorResponse({ 
            error: { message: response.message || 'Échec de l\'ajout des informations de la photo.' }, 
            status: 400 // Ou autre code d'erreur approprié
          });
        }
      }),
      catchError(this.handleError)
    );
  }

  // --- Fonctions utilitaires pour parser les dates --- //

  private parseDatesInReparation(reparation: any): Reparation {
    if (!reparation || typeof reparation !== 'object') {
      console.warn('parseDatesInReparation received invalid input:', reparation);
      return reparation;
    }
    const repCopy = { ...reparation };
    const dateFieldsReparation = ['dateCreation', 'dateDebutPrevue', 'dateFinPrevue', 'dateDebutReelle', 'dateFinReelle', 'dateCreationReparation', 'createdAt', 'updatedAt'];
    dateFieldsReparation.forEach(field => {
      if (repCopy[field] && typeof repCopy[field] === 'string') repCopy[field] = new Date(repCopy[field]);
    });
    if (repCopy.etapesSuivi && Array.isArray(repCopy.etapesSuivi)) {
      repCopy.etapesSuivi = repCopy.etapesSuivi.map((etape: any) => this.parseDatesInEtape(etape));
    }
    if (repCopy.photos && Array.isArray(repCopy.photos)) {
      repCopy.photos = repCopy.photos.map((photo: any) => this.parseDatesInPhoto(photo));
    }
    if (repCopy.notesInternes && Array.isArray(repCopy.notesInternes)) {
      repCopy.notesInternes = repCopy.notesInternes.map((note: any) => this.parseDatesInNote(note));
    }
    if (repCopy.devisOrigine && typeof repCopy.devisOrigine === 'object'){
      if(repCopy.devisOrigine.dateCreation && typeof repCopy.devisOrigine.dateCreation === 'string') repCopy.devisOrigine.dateCreation = new Date(repCopy.devisOrigine.dateCreation);
    }
    return repCopy as Reparation;
  }

  private parseDatesInEtape(etape: any): EtapeReparation {
    if (!etape || typeof etape !== 'object') return etape;
    const etapeCopy = { ...etape };
    const dateFieldsEtape = ['dateDebut', 'dateFin', 'createdAt', 'updatedAt'];
    dateFieldsEtape.forEach(field => {
      if (etapeCopy[field] && typeof etapeCopy[field] === 'string') etapeCopy[field] = new Date(etapeCopy[field]);
    });
    if (etapeCopy.commentaires && Array.isArray(etapeCopy.commentaires)) {
      etapeCopy.commentaires = etapeCopy.commentaires.map((com: any) => this.parseDatesInCommentaire(com));
    }
    return etapeCopy as EtapeReparation;
  }

  private parseDatesInCommentaire(commentaire: any): CommentaireEtape {
    if (!commentaire || typeof commentaire !== 'object') return commentaire;
    const comCopy = { ...commentaire };
    if (comCopy.date && typeof comCopy.date === 'string') comCopy.date = new Date(comCopy.date);
    return comCopy as CommentaireEtape;
  }

  private parseDatesInPhoto(photo: any): PhotoReparation {
    if (!photo || typeof photo !== 'object') return photo;
    const photoCopy = { ...photo };
    if (photoCopy.dateAjout && typeof photoCopy.dateAjout === 'string') photoCopy.dateAjout = new Date(photoCopy.dateAjout);
    return photoCopy as PhotoReparation;
  }

  private parseDatesInNote(note: any): any {
    if (!note || typeof note !== 'object') return note;
    const noteCopy = { ...note };
    if (noteCopy.date && typeof noteCopy.date === 'string') noteCopy.date = new Date(noteCopy.date);
    return noteCopy;
  }

  /**
   * Gestionnaire d'erreurs HTTP simple.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue!';
    let userFriendlyMessage = 'Impossible de traiter votre demande. Veuillez réessayer plus tard.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau ou client: ${error.error.message}`;
      userFriendlyMessage = 'Problème de réseau ou du navigateur. Vérifiez votre connexion.';
    } else {
      errorMessage = `Code ${error.status}: ${error.message || 'Erreur serveur'}`;
      if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage += ` - API Msg: ${error.error.message}`;
        if (error.status === 403) {
          userFriendlyMessage = error.error.message || 'Accès non autorisé.';
        } else if (error.status === 404) {
          userFriendlyMessage = error.error.message || 'Ressource non trouvée.';
        } else if (error.status === 400) {
          userFriendlyMessage = error.error.message || 'Données invalides.';
        }
      }
    }

    console.error('ReparationService Error:', errorMessage);
    return throwError(() => new Error(userFriendlyMessage));
  }

  /**
   * Récupère TOUTES les réparations pour le manager (utilise l'endpoint général GET /reparations).
   * @param params - Paramètres de pagination, tri et filtres.
   */
  getAllReparationsForManager(params: {
    page?: number,
    limit?: number,
    sortField?: string,
    sortOrder?: 'asc' | 'desc',
    [key: string]: any; // Pour les filtres dynamiques (ex: statusReparation, client)
  }): Observable<ApiPaginatedResponse<Reparation>> {
    const url = `${this.apiUrl}/reparations`; // Endpoint général, protégé côté backend pour les managers
    let httpParams = new HttpParams();

    // Pagination
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    // Tri
    if (params.sortField && params.sortOrder) {
      // Spécifier le type de l'objet pour résoudre l'erreur linter
      const sort: { [key: string]: number } = {};
      sort[params.sortField] = params.sortOrder === 'desc' ? -1 : 1;
      // Envoyer comme chaîne JSON, comme attendu par le backend
      httpParams = httpParams.set('sort', JSON.stringify(sort));
    }

    // Filtres dynamiques (exclure les paramètres de pagination/tri déjà gérés)
    for (const key in params) {
      if (key !== 'page' && key !== 'limit' && key !== 'sortField' && key !== 'sortOrder' && params[key]) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    }

    console.log(`ReparationService: fetching ALL reparations for manager from API: ${url} with params`, httpParams);

    return this.http.get<ApiPaginatedResponse<Reparation>>(url, { params: httpParams }).pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          response.data = response.data.map(rep => this.parseDatesInReparation(rep));
          return response;
        } else {
          console.error('ReparationService: Réponse inattendue de l\'API pour getAllReparationsForManager:', response);
          return { 
            success: false, 
            count: 0, 
            total: 0, 
            pagination: { page: params.page || 1, limit: params.limit || 10, totalPages: 0 }, 
            data: [],
            message: response?.message || 'Réponse invalide de l\'API' 
          };
        }
      }),
      tap(response => console.log(`ReparationService: fetched ${response.data.length}/${response.total} total reparations for manager`)),
      catchError(this.handleError) // Utiliser le gestionnaire d'erreurs existant
    );
  }

  /**
   * Récupère l'historique des réparations (terminées, facturées, annulées) 
   * assignées au mécanicien connecté (avec pagination ET FILTRES).
   */
  getMecanicienHistory(params: {
    page?: number,
    limit?: number,
    sortField?: string,
    sortOrder?: 'asc' | 'desc',
    searchTerm?: string,
    dateDebut?: string,
    dateFin?: string
  }): Observable<ApiPaginatedResponse<Reparation>> {
    const url = `${this.mecanicienApiUrl}/history`;
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    if (params.sortField && params.sortOrder) {
      httpParams = httpParams.set('sortField', params.sortField);
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    } else {
      httpParams = httpParams.set('sortField', 'dateFinReelle');
      httpParams = httpParams.set('sortOrder', 'desc');
    }

    if (params.searchTerm && params.searchTerm.trim() !== '') {
      httpParams = httpParams.set('searchTerm', params.searchTerm.trim());
    }
    if (params.dateDebut) {
      httpParams = httpParams.set('dateDebut', params.dateDebut);
    }
    if (params.dateFin) {
      httpParams = httpParams.set('dateFin', params.dateFin);
    }

    console.log(`ReparationService: fetching mechanic HISTORY from API: ${url} with params`, httpParams);

    return this.http.get<ApiPaginatedResponse<Reparation>>(url, { params: httpParams }).pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          response.data = response.data.map(rep => this.parseDatesInReparation(rep));
          return response;
        } else {
          console.error('ReparationService: Réponse inattendue de l\'API pour getMecanicienHistory:', response);
          return { 
            success: false, 
            count: 0, 
            total: 0, 
            pagination: { page: params.page || 1, limit: params.limit || 10, totalPages: 0 }, 
            data: [],
            message: response?.message || 'Réponse invalide de l\'API' 
          };
        }
      }),
      tap(response => console.log(`ReparationService: fetched ${response.data.length}/${response.total} mechanic history reparations from API`)),
      catchError(this.handleError)
    );
  }
} 
