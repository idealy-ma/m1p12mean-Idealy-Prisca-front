import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConfiguration } from '../api-configuration';
import { BaseService } from '../base-service';
import { catchError } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {

  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  // Fonction de connexion
  login(email: string, motDePasse: string): Observable<any> {
    const loginData = {
      email,
      motDePasse,
    };

    return this.http.post<any>(`${this.rootUrl}/users/login`, loginData).pipe(
      catchError((error) => {
        throw error; // Gérer les erreurs si nécessaire
      })
    );
  }

  // Stocker le token dans le localStorage
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  // Récupérer le token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Se déconnecter
  logout(): void {
    localStorage.removeItem('auth_token');
  }
}