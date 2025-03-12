import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/authentification/auth.service';
import { TokenService } from '../../../services/token/token.service';

@Component({
  selector: 'app-manager-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class ManagerLoginComponent implements OnInit {
  email: string = '';
  motDePasse: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    // Vérifier si l'utilisateur est déjà connecté avec un token valide
    if (this.authService.isLoggedInWithValidToken()) {
      const role = this.tokenService.getUserRole();
      // Si l'utilisateur est un manager, le rediriger vers la page manager
      if (role === 'manager') {
        this.router.navigate(['/manager']);
      } else if (role) {
        // Sinon, le rediriger vers sa page d'accueil respective
        this.authService.redirectBasedOnRole(role);
      }
    }
  }

  // Fonction de soumission du formulaire de connexion
  onSubmit(): void {
    this.authService.login(this.email, this.motDePasse).subscribe(
      (response) => {
        // Vérifier si l'utilisateur est un manager
        const role = this.tokenService.getUserRole();
        if (role !== 'manager') {
          this.errorMessage = 'Vous n\'avez pas les droits de manager. Accès refusé.';
          this.tokenService.token = ''; // Effacer le token
          return;
        }

        // Rediriger l'utilisateur vers la page manager
        this.router.navigate(['/manager']);
      },
      (error) => {
        // Afficher un message d'erreur
        this.errorMessage = 'Identifiants invalides. Veuillez réessayer.';
      }
    );
  }
} 