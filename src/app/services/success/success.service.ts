import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SuccessState {
  show: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuccessService {
  private successSubject = new BehaviorSubject<SuccessState>({ show: false, message: '' });
  
  constructor() { }

  /**
   * Affiche un message de succès
   * @param message Le message de succès à afficher
   */
  showSuccess(message: string): void {
    this.successSubject.next({ show: true, message });
    
    // Masquer automatiquement le message après 5 secondes
    setTimeout(() => {
      this.hideSuccess();
    }, 5000);
  }

  /**
   * Masque le message de succès
   */
  hideSuccess(): void {
    this.successSubject.next({ show: false, message: '' });
  }

  /**
   * Retourne un observable pour suivre l'état des messages de succès
   */
  getSuccessState(): Observable<SuccessState> {
    return this.successSubject.asObservable();
  }
} 