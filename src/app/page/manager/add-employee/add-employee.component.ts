import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user/user.service';
import { ErrorService } from '../../../services/error/error.service';
import { SuccessService } from '../../../services/success/success.service';

@Component({
  selector: 'app-add-employee',
  templateUrl: './add-employee.component.html',
  styleUrls: ['./add-employee.component.css']
})
export class AddEmployeeComponent implements OnInit {
  employeeForm: FormGroup;
  roles: string[] = ['mecanicien', 'manager'];

  constructor(
    private fb: FormBuilder, 
    private userService: UserService,
    private errorService: ErrorService,
    private successService: SuccessService
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
          this.successService.showSuccess('Employé créé avec succès !');
          this.employeeForm.reset();
          // Remettre le rôle par défaut à mecanicien
          this.employeeForm.get('role')?.setValue('mecanicien');
        },
        error: (error) => {
          this.errorService.showError(error.error?.message || 'Erreur lors de la création de l\'employé');
          console.error(error);
        }
      });
    } else {
      this.errorService.showError('Veuillez corriger les erreurs dans le formulaire.');
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