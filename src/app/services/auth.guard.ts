import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './authentification/auth.service';
import { TokenService } from './token/token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Vérifier si l'utilisateur est déjà connecté
    if (this.authService.isLoggedIn() && this.tokenService.isTokenValid()) {
      // Rediriger vers la page d'accueil en fonction du rôle
      const role = this.tokenService.getUserRole();
      if (role === 'client') {
        this.router.navigate(['/']);
      } else if (role === 'manager') {
        this.router.navigate(['/manager']);
      } else if (role === 'mecanicien') {
        this.router.navigate(['/mecanicien']);
      }
      return false;
    }
    
    // Si l'utilisateur n'est pas connecté, autoriser l'accès à la page de login
    return true;
  }
} 