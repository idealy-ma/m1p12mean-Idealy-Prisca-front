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
    // Vérifier si l'utilisateur est connecté
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Récupérer le rôle requis depuis les données de la route
    const requiredRole = next.data['role'] as string;
    
    // Vérifier si l'utilisateur a le rôle requis
    if (!requiredRole || this.tokenService.hasRole(requiredRole)) {
      return true;
    } else {
      // Rediriger vers la page appropriée en fonction du rôle de l'utilisateur
      const userRole = this.tokenService.getUserRole();
      if (userRole === 'client') {
        this.router.navigate(['/']);
      } else if (userRole === 'manager') {
        this.router.navigate(['/manager']);
      } else if (userRole === 'mecanicien') {
        this.router.navigate(['/mecanicien']);
      } else {
        this.router.navigate(['/login']);
      }
      return false;
    }
  }
} 