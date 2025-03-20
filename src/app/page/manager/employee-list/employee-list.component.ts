import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user/user.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  employees: User[] = [];
  filterForm: FormGroup;
  isLoading: boolean = false;
  
  // Options pour le filtrage
  roleOptions = [
    { value: '', label: 'Tous les rôles' },
    { value: 'manager', label: 'Manager' },
    { value: 'mecanicien', label: 'Mécanicien' }
  ];
  
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'true', label: 'Actif' },
    { value: 'false', label: 'Inactif' }
  ];
  
  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  totalItems: number = 0;
  itemsPerPage: number = 10;
  
  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      nom: [''],
      prenom: [''],
      role: [''],
      estActif: ['']
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    
    // Appliquer les filtres automatiquement lorsqu'ils changent
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1; // Retour à la première page lors d'un filtrage
        this.loadEmployees();
      });
  }
  
  loadEmployees(): void {
    this.isLoading = true;
    const filters = this.filterForm.value;    
    
    this.userService.getEmployees(filters, this.currentPage, this.itemsPerPage)
      .subscribe({
        next: (response) => {
          this.employees = response.data;
          this.currentPage = response.currentPage;
          this.totalPages = response.totalPages;
          this.totalItems = response.totalItems;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des employés', error);
          this.isLoading = false;
        }
      });
  }
  
  // Pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadEmployees();
    }
  }
  
  // Réinitialiser les filtres
  resetFilters(): void {
    this.filterForm.reset({
      nom: '',
      prenom: '',
      role: '',
      estActif: ''
    });
    this.currentPage = 1;
    this.loadEmployees();
  }
  
  // Changer le statut d'activation d'un employé
  toggleEmployeeStatus(employee: User): void {
    if (!employee._id) return;
    
    const newStatus = !employee.estActif;
    this.userService.toggleEmployeeStatus(employee._id, newStatus)
      .subscribe({
        next: () => {
          // Mettre à jour l'employé dans la liste
          employee.estActif = newStatus;
        },
        error: (error) => {
          console.error(`Erreur lors de la modification du statut de l'employé`, error);
        }
      });
  }
  
  // Aller à la page d'ajout d'employé
  addEmployee(): void {
    this.router.navigate(['/manager/employee']);
  }
} 