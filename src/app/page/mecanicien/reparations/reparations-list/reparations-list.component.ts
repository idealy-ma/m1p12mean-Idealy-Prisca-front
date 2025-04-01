import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// Import necessary models, enums, and the service
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { EtapeStatus, Reparation, ReparationStatus } from '../../../../models/reparation.model';
import { ReparationService } from '../../../../services/reparation.service';

@Component({
  selector: 'app-reparations-list',
  templateUrl: './reparations-list.component.html',
  styleUrls: ['./reparations-list.component.css']
})
export class ReparationsListComponent implements OnInit {
  // Use imported types
  reparations: Reparation[] = [];
  filteredReparations: Reparation[] = [];
  loading: boolean = true;
  error: string | null = null;
  filterStatus: string = 'tous'; // Keep 'tous' or use ReparationStatus values
  filterDate: string = 'tous';
  searchTerm: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 8; // Adjusted for potentially better layout
  totalPages: number = 1;
  totalItems: number = 0;

  // Make enums accessible in template
  public ReparationStatus = ReparationStatus;
  public EtapeStatus = EtapeStatus;

  // Inject ReparationService
  constructor(private router: Router, private reparationService: ReparationService) {}

  ngOnInit(): void {
    this.loadReparations();
  }

  // Load reparations using the service
  loadReparations(): void {
    this.loading = true;
    this.error = null;
    this.reparationService.getReparations()
      .pipe(
        catchError(err => {
          console.error('Error loading reparations:', err);
          this.error = `Erreur lors du chargement des réparations: ${err.message || err}`;
          return of([]); // Return empty array on error
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(reparations => {
        this.reparations = reparations;
        this.applyFilters(); // Apply initial filters (or lack thereof)
      });
  }

  applyFilters(): void {
    let tempReparations = [...this.reparations];

    // Filtre par statut
    if (this.filterStatus !== 'tous') {
      tempReparations = tempReparations.filter(reparation => reparation.status === this.filterStatus);
    }

    // Filtre par date (using dateCreation now as dateDebut might be undefined)
    if (this.filterDate !== 'tous') {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      tempReparations = tempReparations.filter(reparation => {
          const reparationDate = reparation.dateCreation; // Use dateCreation
          if (!reparationDate) return false; // Skip if no creation date

          const repDateOnly = new Date(reparationDate);
          repDateOnly.setHours(0, 0, 0, 0);

          const diffTime = today.getTime() - repDateOnly.getTime();
          const diffDays = diffTime / (1000 * 60 * 60 * 24);

          switch (this.filterDate) {
            case 'aujourdhui':
              return diffDays >= 0 && diffDays < 1;
            case 'semaine':
              return diffDays >= 0 && diffDays < 7;
            case 'mois':
               // Check if the date is within the last 30 days from today
               return diffDays >= 0 && diffDays < 30;
          }
          return true; // Should not happen if filterDate is valid
      });
    }

    // Recherche (Adjust based on available fields in Reparation model)
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      tempReparations = tempReparations.filter(reparation => (
          reparation.vehicule.marque.toLowerCase().includes(searchLower) ||
          reparation.vehicule.modele.toLowerCase().includes(searchLower) ||
          reparation.vehicule.immatriculation.toLowerCase().includes(searchLower) ||
          reparation.client.nom.toLowerCase().includes(searchLower) ||
          reparation.client.prenom.toLowerCase().includes(searchLower) ||
          reparation._id.toLowerCase().includes(searchLower) // Allow searching by ID
          // Add other searchable fields if needed, e.g., telephone
          // (reparation.client.telephone?.includes(searchLower) ?? false)
      ));
    }

    this.filteredReparations = tempReparations;
    this.totalItems = this.filteredReparations.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    // Ensure current page is valid after filtering
    if(this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
        this.currentPage = 1;
    }
  }

  get paginatedReparations(): Reparation[] {
    if (!this.filteredReparations) return [];
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredReparations.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

   // Calculate progress based on etapes status
   calculateProgress(reparation: Reparation): number {
    if (!reparation.etapes || reparation.etapes.length === 0) {
      return 0;
    }
    const completedSteps = reparation.etapes.filter(e => e.status === EtapeStatus.Terminee).length;
    return Math.round((completedSteps / reparation.etapes.length) * 100);
  }

  // Use imported ReparationStatus enum
  getStatusClass(status: ReparationStatus | string): string {
    switch (status) {
      case ReparationStatus.EnAttenteValidation: return 'status-pending';
      case ReparationStatus.Validee: return 'status-validated';
      case ReparationStatus.EnCours: return 'status-progress';
      case ReparationStatus.EnPause: return 'status-paused';
      case ReparationStatus.Terminee: return 'status-completed';
      case ReparationStatus.Annulee: return 'status-cancelled';
      case ReparationStatus.Refusee: return 'status-refused';
      default: return 'status-unknown';
    }
  }

  // Use imported ReparationStatus enum
  getStatusLabel(status: ReparationStatus | string): string {
    switch (status) {
      case ReparationStatus.EnAttenteValidation: return 'En attente validation';
      case ReparationStatus.Validee: return 'Validée';
      case ReparationStatus.EnCours: return 'En cours';
      case ReparationStatus.EnPause: return 'En pause';
      case ReparationStatus.Terminee: return 'Terminée';
      case ReparationStatus.Annulee: return 'Annulée';
      case ReparationStatus.Refusee: return 'Refusée';
      default: return status; // Return the raw status if unknown
    }
  }

  viewDetails(id: string): void {
    this.router.navigate(['/mecanicien/reparations', id]);
  }

  // Helper to get the page numbers for pagination control
  getPageNumbers(): number[] {
      const totalPages = this.totalPages;
      const currentPage = this.currentPage;
      const maxPagesToShow = 5;
      const pages: number[] = [];

      if (totalPages <= maxPagesToShow) {
          // Show all pages
          for (let i = 1; i <= totalPages; i++) {
              pages.push(i);
          }
      } else {
          // Show ellipsis
          let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
          let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

          // Adjust if we are near the beginning or end
          if (endPage - startPage + 1 < maxPagesToShow) {
              if (currentPage < totalPages / 2) {
                  endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
              } else {
                  startPage = Math.max(1, endPage - maxPagesToShow + 1);
              }
          }

          if (startPage > 1) {
              pages.push(1);
              if (startPage > 2) {
                  pages.push(-1); // Ellipsis marker
              }
          }

          for (let i = startPage; i <= endPage; i++) {
              pages.push(i);
          }

          if (endPage < totalPages) {
              if (endPage < totalPages - 1) {
                  pages.push(-1); // Ellipsis marker
              }
              pages.push(totalPages);
          }
      }
      return pages;
  }
} 