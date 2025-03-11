import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConfiguration } from '../api-configuration';
import { BaseService } from '../base-service';
import { catchError, tap } from 'rxjs/operators';
import { TokenService } from '../token/token.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {

  constructor(
    config: ApiConfiguration, 
    http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) {
    super(config, http);
  }

  // Fonction de connexion
  login(email: string, motDePasse: string): Observable<any> {
    const loginData = {
      email,
      motDePasse,
    };

    return this.http.post<any>(`${this.rootUrl}/users/login`, loginData).pipe(
      tap(response => {
        if (response && response.token) {
          // Stocker le token
          this.tokenService.token = response.token;
          
          // Rediriger en fonction du rôle
          const role = this.tokenService.getUserRole();
          this.redirectBasedOnRole(role);
        }
      }),
      catchError((error) => {
        throw error; // Gérer les erreurs si nécessaire
      })
    );
  }

  // Rediriger l'utilisateur en fonction de son rôle
  private redirectBasedOnRole(role: string | null): void {
    if (role === 'client') {
      this.router.navigate(['/']);
    } else if (role === 'manager') {
      this.router.navigate(['/manager']);
    } else if (role === 'mecanicien') {
      this.router.navigate(['/mecanicien']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return !!this.tokenService.token;
  }

  // Se déconnecter
  logout(): void {
    localStorage.removeItem('auth-token');
    this.router.navigate(['/login']);
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.rootUrl}/users/register`, userData);
  }
}