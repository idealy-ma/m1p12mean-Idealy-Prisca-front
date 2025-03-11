import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authentification/auth.service';

@Component({
  selector: 'app-inscription',
  templateUrl: './inscription.component.html',
  styleUrls: ['./inscription.component.css']
})
export class InscriptionComponent {

  registerForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      adresse: [''],
      telephone: [''],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmMotDePasse: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  // Vérifie si le mot de passe et la confirmation sont identiques
  passwordMatchValidator(group: FormGroup) {
    return group.get('motDePasse')?.value === group.get('confirmMotDePasse')?.value
      ? null : { notMatching: true };
  }

  // Fonction de soumission du formulaire
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires correctement.';
      return;
    }

    const { confirmMotDePasse, ...userData } = this.registerForm.value; // Supprime confirmMotDePasse

    this.authService.register(userData).subscribe(
      (response) => {
        console.log('Inscription réussie', response);
        this.router.navigate(['/login']); // Redirige vers la page de connexion
      },
      (error) => {
        this.errorMessage = 'Erreur lors de l\'inscription. Veuillez réessayer.';
      }
    );
  }

}
