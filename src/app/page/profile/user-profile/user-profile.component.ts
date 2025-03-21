import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../services/user/user.service';
import { User } from '../../../models/user.model';
import { ErrorService } from '../../../services/error/error.service';
import { SuccessService } from '../../../services/success/success.service';
import { TokenService } from '../../../services/token/token.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  userProfile: User | null = null;
  loading = false;
  passwordLoading = false;
  showPasswordForm = false;
  
  // Rôle de l'utilisateur
  userRole: string | null = null;
  
  // Couleurs spécifiques aux rôles
  themeColors = {
    client: {
      primary: '#27ae60', // Vert
      secondary: '#2ecc71',
      accent: '#e8f5e9'
    },
    manager: {
      primary: '#3498db', // Bleu
      secondary: '#2980b9',
      accent: '#e3f2fd'
    },
    mecanicien: {
      primary: '#e74c3c', // Rouge
      secondary: '#c0392b',
      accent: '#ffebee'
    }
  };
  
  // Couleurs par défaut (au cas où le rôle n'est pas reconnu)
  currentTheme = {
    primary: '#3498db',
    secondary: '#2980b9',
    accent: '#e3f2fd'
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private errorService: ErrorService,
    private successService: SuccessService,
    private tokenService: TokenService
  ) {
    this.profileForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: [{value: '', disabled: true}], // L'email ne peut pas être modifié
      telephone: [''],
      adresse: ['']
    });

    this.passwordForm = this.fb.group({
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmMotDePasse: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
    
    // Récupérer le rôle de l'utilisateur et définir le thème correspondant
    this.userRole = this.tokenService.getUserRole();
    if (this.userRole && this.themeColors[this.userRole as keyof typeof this.themeColors]) {
      this.currentTheme = this.themeColors[this.userRole as keyof typeof this.themeColors];
    }
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.userService.getUserProfile().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.userProfile = response.data;
          // Pré-remplir le formulaire avec les données actuelles
          this.profileForm.patchValue({
            nom: this.userProfile?.nom || '',
            prenom: this.userProfile?.prenom || '',
            email: this.userProfile?.email || '',
            telephone: this.userProfile?.telephone || '',
            adresse: this.userProfile?.adresse || ''
          });
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorService.showError('Erreur lors du chargement du profil: ' + error.message);
        this.loading = false;
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.profileForm.controls).forEach(key => {
        const control = this.profileForm.get(key);
        if (control) control.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const profileData = {
      nom: this.profileForm.value.nom,
      prenom: this.profileForm.value.prenom,
      telephone: this.profileForm.value.telephone,
      adresse: this.profileForm.value.adresse
    };

    this.userService.updateUserProfile(profileData).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.successService.showSuccess('Profil mis à jour avec succès');
          this.loadUserProfile(); // Recharger le profil pour afficher les données mises à jour
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorService.showError('Erreur lors de la mise à jour du profil: ' + error.message);
        this.loading = false;
      }
    });
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.passwordForm.controls).forEach(key => {
        const control = this.passwordForm.get(key);
        if (control) control.markAsTouched();
      });
      return;
    }

    this.passwordLoading = true;
    const passwordData = {
      motDePasse: this.passwordForm.value.motDePasse
    };

    this.userService.updateUserProfile(passwordData).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.successService.showSuccess('Mot de passe mis à jour avec succès');
          this.passwordForm.reset();
          this.showPasswordForm = false;
        }
        this.passwordLoading = false;
      },
      error: (error) => {
        this.errorService.showError('Erreur lors de la mise à jour du mot de passe: ' + error.message);
        this.passwordLoading = false;
      }
    });
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm.reset();
    }
  }

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  passwordMatchValidator(form: FormGroup): {[key: string]: boolean} | null {
    const motDePasse = form.get('motDePasse')?.value;
    const confirmMotDePasse = form.get('confirmMotDePasse')?.value;
    
    if (motDePasse !== confirmMotDePasse) {
      form.get('confirmMotDePasse')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    
    return null;
  }
}
