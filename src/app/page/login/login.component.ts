import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authentification/auth.service';
import { TokenService } from '../../services/token/token.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent{
  email: string = '';
  motDePasse: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router, private tokenSevrice: TokenService) {}

  // Fonction de soumission du formulaire de connexion
  onSubmit(): void {
    this.authService.login(this.email, this.motDePasse).subscribe(
      (response) => {
        // Enregistrer le token dans le localStorage
        this.tokenSevrice.token=response.token;

        // Rediriger l'utilisateur vers la page d'accueil ou tableau de bord
        this.router.navigate(['/accueil']);
      },
      (error) => {
        // Afficher un message d'erreur
        this.errorMessage = 'Identifiants invalides. Veuillez réessayer.';
      }
    );
  }
  goToRegister(): void {
    this.router.navigate(['/register']); // Redirige vers la page d'inscription
  }
}