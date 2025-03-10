import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConfiguration } from '../api-configuration';
import { BaseService } from '../base-service';
import { catchError } from 'rxjs/operators';
import { TokenService } from '../token/token.service';
@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {

  constructor(config: ApiConfiguration, http: HttpClient,private tokenService : TokenService) {
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

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return !!this.tokenService.token;
  }

  // Se déconnecter
  logout(): void {
    localStorage.removeItem('auth_token');
  }
}