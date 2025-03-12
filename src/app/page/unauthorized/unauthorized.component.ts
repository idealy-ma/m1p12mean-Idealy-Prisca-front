import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../../services/token/token.service';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.css']
})
export class UnauthorizedComponent {
  userRole: string | null = null;

  constructor(private router: Router, private tokenService: TokenService) {
    this.userRole = this.tokenService.getUserRole();
  }

  // Rediriger vers la page d'accueil correspondant au rôle de l'utilisateur
  goToHomePage(): void {
    if (this.userRole === 'client') {
      this.router.navigate(['/']);
    } else if (this.userRole === 'manager') {
      this.router.navigate(['/manager']);
    } else if (this.userRole === 'mecanicien') {
      this.router.navigate(['/mecanicien']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Rediriger vers la page de login
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
