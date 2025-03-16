import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Devis } from '../../../models/devis.model';
import { DevisService } from '../../../services/devis/devis.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

@Component({
  selector: 'app-devis-list',
  templateUrl: './devis-list.component.html',
  styleUrls: ['./devis-list.component.css']
})
export class DevisListComponent implements OnInit {
  devis: Devis[] = [];
  filteredDevis: Devis[] = [];
  loading: boolean = false;
  error: string | null = null;
  pagination: Pagination | null = null;
  currentPage: number = 1;
  
  // Filtres
  filterForm: FormGroup;
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'accepte', label: 'Accepté' },
    { value: 'refuse', label: 'Refusé' }
  ];
  clients: { id: string, nom: string, prenom: string }[] = [];

  constructor(
    private devisService: DevisService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      client: [''],
      dateDebut: [''],
      dateFin: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadDevisWithFilters();
    
    // S'abonner aux changements du formulaire avec un délai pour éviter trop de requêtes
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500), // Attendre 500ms après le dernier changement
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(() => {
        this.currentPage = 1; // Réinitialiser à la première page lors d'un changement de filtre
        this.loadDevisWithFilters();
      });
  }

  loadDevis(page: number = 1): void {
    this.loading = true;
    this.error = null;
    
    this.devisService.getDevis(page).subscribe({
      next: (response: any) => {
        if (response && response.success && Array.isArray(response.data)) {
          this.devis = response.data;
          this.filteredDevis = [...this.devis]; // Copie initiale pour les filtres
          this.pagination = response.pagination;
          
          // Extraire la liste des clients uniques pour le filtre
          this.extractUniqueClients();
        } else {
          console.error('Données invalides :', response);
          this.devis = [];
          this.filteredDevis = [];
          this.error = 'Format de données invalide';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des devis', err);
        this.error = 'Erreur lors du chargement des devis';
        this.loading = false;
      }
    });
  }

  loadDevisWithFilters(): void {
    this.loading = true;
    this.error = null;
    
    const filters = {
      ...this.filterForm.value,
      page: this.currentPage,
      limit: 10 // Vous pouvez ajuster cette valeur ou la rendre configurable
    };
    
    this.devisService.getDevisWithFilters(filters).subscribe({
      next: (response: any) => {
        if (response && response.success && Array.isArray(response.data)) {
          this.filteredDevis = response.data;
          this.pagination = response.pagination;
          
          // Si c'est la première charge ou si les filtres sont réinitialisés, extraire les clients
          if (!this.clients.length || 
              (!filters.status && !filters.client && !filters.dateDebut && 
               !filters.dateFin && !filters.search)) {
            this.extractUniqueClients(response.data);
          }
        } else {
          console.error('Données invalides :', response);
          this.filteredDevis = [];
          this.error = 'Format de données invalide';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des devis', err);
        this.error = 'Erreur lors du chargement des devis';
        this.loading = false;
      }
    });
  }

  changePage(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) {
      return;
    }
    this.currentPage = page;
    this.loadDevisWithFilters();
  }

  getPageNumbers(): number[] {
    if (!this.pagination) {
      return [];
    }
    
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.page;
    
    // Si moins de 6 pages, afficher toutes les pages
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Sinon, afficher les pages autour de la page courante
    let startPage = Math.max(currentPage - 2, 1);
    let endPage = Math.min(startPage + 4, totalPages);
    
    // Ajuster si on est proche de la fin
    if (endPage === totalPages) {
      startPage = Math.max(endPage - 4, 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }
  
  // Extraire la liste des clients uniques pour le filtre
  extractUniqueClients(devisList: Devis[] = this.filteredDevis): void {
    const uniqueClientsMap = new Map();
    
    devisList.forEach(devis => {
      if (devis.client && devis.client._id) {
        uniqueClientsMap.set(devis.client._id, {
          id: devis.client._id,
          nom: devis.client.nom,
          prenom: devis.client.prenom
        });
      }
    });
    
    this.clients = Array.from(uniqueClientsMap.values());
  }
  
  // Réinitialiser les filtres
  resetFilters(): void {
    this.filterForm.reset({
      status: '',
      client: '',
      dateDebut: '',
      dateFin: '',
      search: ''
    });
    // Le changement de valeur du formulaire déclenchera automatiquement loadDevisWithFilters()
  }
} 