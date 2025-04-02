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
      const sort = { [params.sortField]: params.sortOrder === 'desc' ? -1 : 1 };
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
  getReparationById(id: string): Observable<Reparation | undefined> {
    const url = `${this.apiUrl}/${id}`;
    console.log(`ReparationService: fetching reparation by id ${id} from API: ${url}`);

    return this.http.get<{ success: boolean, data: Reparation }>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.parseDatesInReparation(response.data);
        } else {
          console.error(`ReparationService: API returned success=false or no data for id ${id}`, response);
          throw new HttpErrorResponse({ error: { message: `Réparation non trouvée ou réponse invalide de l'API (id: ${id})`}, status: 404 });
        }
      }),
      tap(data => console.log(`ReparationService: fetched reparation ${data?._id} from API`)),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour le statut global d'une réparation (Exemple - à implémenter avec API).
   * TODO: Remplacer par un appel API réel (PATCH ou PUT).
   */
  updateReparationStatus(id: string, status: ReparationStatus, dateFinReelle?: Date): Observable<Reparation> {
    console.warn(`ReparationService: updateReparationStatus(${id}, ${status}) called - NO API CALL IMPLEMENTED YET.`);
    const url = `${this.apiUrl}/${id}/status`;
    return throwError(() => new Error('Fonctionnalité updateReparationStatus non implémentée'));
  }

  /**
   * Met à jour le statut d'une étape spécifique d'une réparation (Exemple - à implémenter avec API).
   * TODO: Remplacer par un appel API réel (PATCH ou PUT).
   */
  updateStepStatus(reparationId: string, etapeId: string, status: EtapeStatus, dateFin?: Date): Observable<EtapeReparation> {
    console.warn(`ReparationService: updateStepStatus(${reparationId}, ${etapeId}, ${status}) called - NO API CALL IMPLEMENTED YET.`);
    const url = `${this.apiUrl}/${reparationId}/etapes/${etapeId}/status`;
    return throwError(() => new Error('Fonctionnalité updateStepStatus non implémentée'));
  }

  /**
   * Ajoute un commentaire à une étape spécifique (Exemple - à implémenter avec API).
   * TODO: Remplacer par un appel API réel (POST).
   */
  addCommentToStep(reparationId: string, etapeId: string, message: string): Observable<EtapeReparation> {
    console.warn(`ReparationService: addCommentToStep(${reparationId}, ${etapeId}) called - NO API CALL IMPLEMENTED YET.`);
    const url = `${this.apiUrl}/${reparationId}/etapes/${etapeId}/commentaires`;
    return throwError(() => new Error('Fonctionnalité addCommentToStep non implémentée'));
  }

  /**
   * Ajoute une photo à une réparation (Exemple - à implémenter avec API).
   * TODO: Remplacer par un appel API réel (POST) et gérer l'upload (potentiellement FormData).
   */
  addPhotoToReparation(reparationId: string, photoData: FormData): Observable<PhotoReparation> {
    console.warn(`ReparationService: addPhotoToReparation(${reparationId}) called - NO API CALL IMPLEMENTED YET.`);
    const url = `${this.apiUrl}/${reparationId}/photos`;
    return throwError(() => new Error('Fonctionnalité addPhotoToReparation non implémentée'));
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
        } else {
          userFriendlyMessage = error.error.message || 'Erreur serveur inattendue.';
        }
      } else if (typeof error.error === 'string'){
        errorMessage += ` - API Body: ${error.error}`;
      }
    }
    console.error('Erreur API complète:', errorMessage, error);

    return throwError(() => ({ 
      userMessage: userFriendlyMessage,
      developerMessage: errorMessage,
      status: error.status,
      errorBody: error.error
    }));
  }
} 