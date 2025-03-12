import { Injectable } from '@angular/core';
import {JwtHelperService} from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  set token(token: string) {
    localStorage.setItem('auth-token', token);
  }

  get token() {
    return localStorage.getItem('auth-token') as string;
  }

  isTokenValid() {
    const token = this.token;
    if (!token) {
      return false;
    }
    // decode the token
    const jwtHelper = new JwtHelperService();
    // check expiry date
    const isTokenExpired = jwtHelper.isTokenExpired(token);
    if (isTokenExpired) {
      localStorage.clear();
      return false;
    }
    return true;
  }

  isTokenNotValid() {
    return !this.isTokenValid();
  }

  // Récupérer le rôle de l'utilisateur à partir du token
  getUserRole(): string | null {
    if (!this.isTokenValid()) {
      return null;
    }
    
    const jwtHelper = new JwtHelperService();
    const decodedToken = jwtHelper.decodeToken(this.token);
    
    return decodedToken?.role || null;
  }

  // Vérifier si l'utilisateur a un rôle spécifique
  hasRole(requiredRole: string): boolean {
    const userRole = this.getUserRole();
    return userRole === requiredRole;
  }
}
