import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user/user.service';

@Component({
  selector: 'app-add-employee',
  templateUrl: './add-employee.component.html',
  styleUrls: ['./add-employee.component.css']
})
export class AddEmployeeComponent implements OnInit {
  employeeForm: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';
  roles: string[] = ['mecanicien', 'manager'];

  constructor(
    private fb: FormBuilder, 
    private userService: UserService
  ) {
    this.employeeForm = this.fb.group({
      nom: ['', [Validators.required]],
      prenom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      role: ['mecanicien', [Validators.required]],
      telephone: [''],
      adresse: ['']
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      const newEmployee: User = this.employeeForm.value;
      
      this.userService.createEmployee(newEmployee).subscribe({
        next: (response) => {
          this.successMessage = 'Employé créé avec succès !';
          this.errorMessage = '';
          this.employeeForm.reset();
          // Remettre le rôle par défaut à mecanicien
          this.employeeForm.get('role')?.setValue('mecanicien');
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erreur lors de la création de l\'employé';
          this.successMessage = '';
          console.error(error);
        }
      });
    } else {
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
      this.markFormGroupTouched(this.employeeForm);
    }
  }

  // Marquer tous les champs comme touchés pour afficher les validations
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
} 