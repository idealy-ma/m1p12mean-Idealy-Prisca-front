import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText: string;
  type?: 'danger' | 'warning' | 'info';
}

export interface ConfirmationState {
  show: boolean;
  data?: ConfirmationDialogData;
  resolve?: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private confirmationSubject = new BehaviorSubject<ConfirmationState>({ show: false });
  
  constructor() { }
  
  /**
   * Affiche un dialogue de confirmation et retourne une promesse
   * qui sera résolue avec la réponse de l'utilisateur (true/false)
   */
  confirm(data: ConfirmationDialogData): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.confirmationSubject.next({
        show: true,
        data,
        resolve
      });
    });
  }
  
  /**
   * Confirme le dialogue (l'utilisateur a cliqué sur "Confirmer")
   */
  confirmDialog(): void {
    const state = this.confirmationSubject.getValue();
    if (state.resolve) {
      state.resolve(true);
    }
    this.hideDialog();
  }
  
  /**
   * Annule le dialogue (l'utilisateur a cliqué sur "Annuler")
   */
  cancelDialog(): void {
    const state = this.confirmationSubject.getValue();
    if (state.resolve) {
      state.resolve(false);
    }
    this.hideDialog();
  }
  
  /**
   * Masque le dialogue de confirmation
   */
  private hideDialog(): void {
    this.confirmationSubject.next({ show: false });
  }
  
  /**
   * Retourne un observable pour suivre l'état du dialogue
   */
  getConfirmationState(): Observable<ConfirmationState> {
    return this.confirmationSubject.asObservable();
  }
} 