import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './authentification/auth.service';
import { TokenService } from './token/token.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService, 
    private tokenService: TokenService, 
    private router: Router
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Récupérer le rôle requis depuis les données de la route
    const requiredRole = next.data['role'] as string;
    
    // Vérifier si l'utilisateur est connecté
    if (!this.authService.isLoggedIn()) {
      // Rediriger vers la page de login spécifique en fonction du rôle requis
      if (requiredRole === 'manager') {
        this.router.navigate(['/manager/login']);
      } else if (requiredRole === 'mecanicien') {
        this.router.navigate(['/mecanicien/login']);
      } else {
        this.router.navigate(['/login']);
      }
      return false;
    }
    
    // Vérifier si l'utilisateur a le rôle requis
    if (!requiredRole || this.tokenService.hasRole(requiredRole)) {
      return true;
    } else {
      // Rediriger vers la page 401 (non autorisé)
      this.router.navigate(['/unauthorized']);
      return false;
    }
  }
} 