import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ErrorState {
  show: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorSubject = new BehaviorSubject<ErrorState>({ show: false, message: '' });
  
  constructor() { }

  /**
   * Affiche un message d'erreur
   * @param message Le message d'erreur à afficher
   */
  showError(message: string): void {
    this.errorSubject.next({ show: true, message });
  }

  /**
   * Masque le message d'erreur
   */
  hideError(): void {
    this.errorSubject.next({ show: false, message: '' });
  }

  /**
   * Retourne un observable pour suivre l'état des erreurs
   */
  getErrorState(): Observable<ErrorState> {
    return this.errorSubject.asObservable();
  }
} 