import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/authentification/auth.service';
import { TokenService } from '../../../services/token/token.service';

@Component({
  selector: 'app-manager-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class ManagerLoginComponent {
  email: string = '';
  motDePasse: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router, private tokenService: TokenService) {}

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