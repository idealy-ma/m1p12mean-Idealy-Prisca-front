import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/authentification/auth.service';
import { TokenService } from '../../../services/token/token.service';

@Component({
  selector: 'app-mecanicien-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class MecanicienLoginComponent implements OnInit {
  email: string = 'jane.smith@example.com';
  motDePasse: string = 'jane123';
  errorMessage: string = '';
  isLoading = false;

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    // Vérifier si l'utilisateur est déjà connecté avec un token valide
    if (this.authService.isLoggedInWithValidToken()) {
      const role = this.tokenService.getUserRole();
      // Si l'utilisateur est un mécanicien, le rediriger vers la page mécanicien
      if (role === 'mecanicien') {
        this.router.navigate(['/mecanicien']);
      } else if (role) {
        // Sinon, le rediriger vers sa page d'accueil respective
        this.authService.redirectBasedOnRole(role);
      }
    }
  }

  // Fonction de soumission du formulaire de connexion
  onSubmit(): void {
    this.isLoading = true;
    this.authService.login(this.email, this.motDePasse).subscribe(
      (response) => {
        // Vérifier si l'utilisateur est un mécanicien
        const role = this.tokenService.getUserRole();
        this.isLoading = false;
        if (role !== 'mecanicien') {
          this.errorMessage = 'Vous n\'avez pas les droits de mécanicien. Accès refusé.';
          this.tokenService.token = ''; // Effacer le token
          return;
        }

        // Rediriger l'utilisateur vers la page mécanicien
        this.router.navigate(['/mecanicien']);
      },
      (error) => {
        // Afficher un message d'erreur
        this.errorMessage = 'Identifiants invalides. Veuillez réessayer.';
        this.isLoading = false;
      }
    );
  }
} 