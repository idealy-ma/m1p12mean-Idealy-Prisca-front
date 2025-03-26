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
  selector: 'app-client-devis-list',
  templateUrl: './devis-list.component.html',
  styleUrls: ['./devis-list.component.css']
})
export class ClientDevisListComponent implements OnInit {
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

  constructor(
    private devisService: DevisService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      status: [''],
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

  loadClientDevis(page: number = 1): void {
    this.loading = true;
    this.error = null;
    
    this.devisService.getClientDevis().subscribe({
      next: (response: any) => {
        if (response && response.success && Array.isArray(response.data)) {
          this.devis = response.data;
          this.filteredDevis = [...this.devis]; // Copie initiale pour les filtres
          this.pagination = response.pagination;
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
    
    // Pour les clients, nous utilisons l'endpoint client/devis
    // et appliquons les filtres côté client après réception des données
    this.devisService.getClientDevis().subscribe({
      next: (response: any) => {
        if (response && response.success && Array.isArray(response.data)) {
          this.devis = response.data;
          this.applyFilters();
          this.pagination = response.pagination;
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
  
  // Appliquer les filtres côté client
  applyFilters(): void {
    const filters = this.filterForm.value;
    let result = [...this.devis];
    
    // Filtre par statut
    if (filters.status) {
      result = result.filter(devis => devis.status === filters.status);
    }
    
    // Filtre par date de début
    if (filters.dateDebut) {
      const dateDebut = new Date(filters.dateDebut);
      result = result.filter(devis => {
        if (devis.dateCreation) {
          const devisDate = new Date(devis.dateCreation);
          return devisDate >= dateDebut;
        }
        return false;
      });
    }
    
    // Filtre par date de fin
    if (filters.dateFin) {
      const dateFin = new Date(filters.dateFin);
      dateFin.setHours(23, 59, 59); // Définir à la fin de la journée
      result = result.filter(devis => {
        if (devis.dateCreation) {
          const devisDate = new Date(devis.dateCreation);
          return devisDate <= dateFin;
        }
        return false;
      });
    }
    
    // Filtre par recherche texte
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(devis => {
        return (
          (devis.description && devis.description.toLowerCase().includes(searchLower)) ||
          (devis.vehicule && 
           ((devis.vehicule.marque && devis.vehicule.marque.toLowerCase().includes(searchLower)) ||
            (devis.vehicule.modele && devis.vehicule.modele.toLowerCase().includes(searchLower)) ||
            (devis.vehicule.immatricule && devis.vehicule.immatricule.toLowerCase().includes(searchLower))))
        );
      });
    }
    
    this.filteredDevis = result;
    
    // Gérer la pagination côté client
    this.handleClientSidePagination();
  }
  
  // Gérer la pagination côté client
  handleClientSidePagination(): void {
    const limit = 10; // Nombre d'éléments par page
    const totalItems = this.filteredDevis.length;
    const totalPages = Math.ceil(totalItems / limit);
    
    // Créer l'objet pagination
    this.pagination = {
      total: totalItems,
      page: this.currentPage,
      limit: limit,
      totalPages: totalPages,
      hasNext: this.currentPage < totalPages,
      hasPrev: this.currentPage > 1
    };
    
    // Filtrer les éléments pour la page courante
    const startIndex = (this.currentPage - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalItems);
    this.filteredDevis = this.filteredDevis.slice(startIndex, endIndex);
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
  
  // Réinitialiser les filtres
  resetFilters(): void {
    this.filterForm.reset({
      status: '',
      dateDebut: '',
      dateFin: '',
      search: ''
    });
    // Le changement de valeur du formulaire déclenchera automatiquement loadDevisWithFilters()
  }
  
  // Méthodes pour les actions sur les devis
  accepterDevis(devisId: string): void {
    this.devisService.updateDevis(devisId, { status: 'accepte' }).subscribe({
      next: (response) => {
        // Recharger les devis après la mise à jour
        this.loadDevisWithFilters();
      },
      error: (err) => {
        console.error('Erreur lors de l\'acceptation du devis', err);
        this.error = 'Erreur lors de l\'acceptation du devis';
      }
    });
  }
  
  refuserDevis(devisId: string): void {
    this.devisService.updateDevis(devisId, { status: 'refuse' }).subscribe({
      next: (response) => {
        // Recharger les devis après la mise à jour
        this.loadDevisWithFilters();
      },
      error: (err) => {
        console.error('Erreur lors du refus du devis', err);
        this.error = 'Erreur lors du refus du devis';
      }
    });
  }
} 