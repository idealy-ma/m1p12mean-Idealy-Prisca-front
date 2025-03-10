import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authentification/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent{
  email: string = '';
  motDePasse: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  // Fonction de soumission du formulaire de connexion
  onSubmit(): void {
    this.authService.login(this.email, this.motDePasse).subscribe(
      (response) => {
        // Enregistrer le token dans le localStorage
        this.authService.setToken(response.token);

        // Rediriger l'utilisateur vers la page d'accueil ou tableau de bord
        this.router.navigate(['/accueil']);
      },
      (error) => {
        // Afficher un message d'erreur
        this.errorMessage = 'Identifiants invalides. Veuillez réessayer.';
      }
    );
  }
}