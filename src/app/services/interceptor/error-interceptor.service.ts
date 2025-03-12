import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from '../error/error.service';

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

@Injectable()
export class ErrorInterceptorService implements HttpInterceptor {

  constructor(private errorService: ErrorService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Une erreur est survenue';
        
        // Gestion des erreurs HTTP
        if (error.error instanceof ErrorEvent) {
          // Erreur côté client
          errorMessage = `Erreur: ${error.error.message}`;
        } else {
          // Erreur côté serveur
          if (error.error && typeof error.error === 'object') {
            const apiResponse = error.error as ApiResponse;
            
            // Vérifier si la réponse contient le format attendu (success: false, message: string)
            if (apiResponse.success === false && apiResponse.message) {
              errorMessage = apiResponse.message;
            } else {
              // Utiliser le message d'erreur HTTP standard
              errorMessage = `Erreur ${error.status}: ${error.statusText || 'Erreur inconnue'}`;
            }
          } else {
            // Utiliser le message d'erreur HTTP standard
            errorMessage = `Erreur ${error.status}: ${error.statusText || 'Erreur inconnue'}`;
          }
        }
        
        // Afficher le message d'erreur
        this.errorService.showError(errorMessage);
        
        // Propager l'erreur
        return throwError(() => error);
      })
    );
  }
} 