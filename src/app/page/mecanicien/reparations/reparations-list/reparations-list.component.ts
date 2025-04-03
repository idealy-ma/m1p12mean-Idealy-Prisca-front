import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { EtapeStatus, Reparation, ReparationStatus } from '../../../../models/reparation.model';
import { ReparationService, ApiPagination } from '../../../../services/reparation.service'; // Import ApiPagination

@Component({
  selector: 'app-reparations-list',
  templateUrl: './reparations-list.component.html',
  styleUrls: ['./reparations-list.component.css']
})
export class ReparationsListComponent implements OnInit {
  reparations: Reparation[] = [];
  loading: boolean = true;
  error: string | null = null;

  currentPage: number = 1;
  itemsPerPage: number = 10; // Default items per page
  totalPages: number = 1;
  totalItems: number = 0;
  currentSortField: string = 'dateDebutPrevue'; // Default sort field
  currentSortOrder: 'asc' | 'desc' = 'asc'; // Default sort order
  currentStatusFilter: string = ''; // Empty string means all "en-cours" statuses by default backend logic
  searchTerm: string = ''; // Keep for UI, decide later if backend search is needed
  private searchSubject = new Subject<string>();
  // -------------------------------------

  public ReparationStatus = ReparationStatus;
  public EtapeStatus = EtapeStatus;

  availableStatuses: { value: string, label: string }[] = [
    { value: '', label: 'Tous (En cours)' },
    { value: 'Planifiée', label: 'Planifiée' },
    { value: 'En cours', label: 'En cours' },
    { value: 'En attente pièces', label: 'En attente pièces' },
  ];

  constructor(private router: Router, private reparationService: ReparationService) {}

  ngOnInit(): void {
    this.loadReparations();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      // TODO: Decide if search triggers backend call or stays client-side (for now client-side)
      this.applyClientSideSearch(); // For now, keep client-side search on current page data
    });
  }

  // Load reparations using the service with current state parameters
  loadReparations(): void {
    this.loading = true;
    this.error = null;
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortField: this.currentSortField,
      sortOrder: this.currentSortOrder,
      status: this.currentStatusFilter
      // searchTerm: this.searchTerm // Add if implementing backend search
    };

    this.reparationService.getMecanicienReparations(params)
      .pipe(
        catchError(err => {
          console.error('Error loading reparations:', err);
          // Use userMessage from custom error handling if available
          this.error = err.userMessage || `Erreur lors du chargement des réparations: ${err.message || err}`;
          this.reparations = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.currentPage = 1;
          return of(null); // Return null observable on error
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(response => {
        if (response && response.success) {
          this.reparations = response.data;
          this.totalItems = response.total;
          this.totalPages = response.pagination.totalPages;
          // currentPage is already set before call
          // No need to apply client-side filters anymore
          console.log('Reparations loaded from backend:', response);
        } else if (response) {
           // Handle cases where API returns success:false or unexpected structure
           this.error = response.message || 'Erreur lors de la récupération des réparations.';
           this.reparations = [];
           this.totalItems = 0;
           this.totalPages = 1;
           this.currentPage = 1;
        } 
        // If response is null (due to catchError), error is already set

        // *** APPELER applyClientSideSearch ICI après la mise à jour de this.reparations ***
        this.applyClientSideSearch(); 
      });
  }

  // --- Client-Side Search (Temporary) ---
  filteredReparations: Reparation[] = []; 
  /* Supprimer ou commenter ngOnChanges si ajouté précédemment
  ngOnChanges(): void { 
    this.applyClientSideSearch();
  }
  */
  applyClientSideSearch(): void {
     // Pour tester, commenter la logique de filtrage :
     this.filteredReparations = [...this.reparations]; 
     /* Logique Originale:
     if (!this.searchTerm) {
       this.filteredReparations = [...this.reparations];
       return;
     }
     const searchLower = this.searchTerm.toLowerCase();
     this.filteredReparations = this.reparations.filter(reparation => (
         (reparation.vehicule?.marque?.toLowerCase() || '').includes(searchLower) ||
         (reparation.vehicule?.modele?.toLowerCase() || '').includes(searchLower) ||
         (reparation.vehicule?.immatriculation?.toLowerCase() || '').includes(searchLower) ||
         (reparation.client?.nom?.toLowerCase() || '').includes(searchLower) ||
         (reparation.client?.prenom?.toLowerCase() || '').includes(searchLower) ||
         reparation._id.toLowerCase().includes(searchLower)
     ));
     */
    // Note: Client-side search does NOT affect pagination totals from backend
  }
  onSearchTermChange(term: string): void {
      this.searchSubject.next(term);
  }
  // ----------------------------------------

  onFilterChange(): void {
    this.currentPage = 1; // Reset to first page when filter changes
    this.loadReparations();
  }

  onSortChange(field: string): void {
    if (this.currentSortField === field) {
      this.currentSortOrder = this.currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortField = field;
      this.currentSortOrder = 'asc';
    }
    this.loadReparations();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadReparations();
    }
  }

  onItemsPerPageChange(newLimit: number): void {
      this.itemsPerPage = newLimit;
      this.currentPage = 1; // Reset to page 1
      this.loadReparations();
  }

   // Calculate progress based on etapes status
   calculateProgress(reparation: Reparation): number {
    if (!reparation.etapesSuivi || reparation.etapesSuivi.length === 0) {
      return 0;
    }
    const completedSteps = reparation.etapesSuivi.filter(e => e.status === EtapeStatus.Terminee).length;
    return Math.round((completedSteps / reparation.etapesSuivi.length) * 100);
  }

  // Use imported ReparationStatus enum
  getStatusClass(status: ReparationStatus | string): string {
    switch (status) {
      case ReparationStatus.EnAttentePieces: return 'status-pending';
      case ReparationStatus.EnCours: return 'status-progress';
      case ReparationStatus.Terminee: return 'status-completed';
      case ReparationStatus.Facturee: return 'status-completed';
      case ReparationStatus.Annulee: return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  // Use imported ReparationStatus enum
  getStatusLabel(status: ReparationStatus | string): string {
    switch (status) {
      case ReparationStatus.Planifiee: return 'Planifiée';
      case ReparationStatus.EnCours: return 'En cours';
      case ReparationStatus.EnAttentePieces: return 'En attente pièces';
      case ReparationStatus.Terminee: return 'Terminée';
      case ReparationStatus.Facturee: return 'Facturée';
      case ReparationStatus.Annulee: return 'Annulée';
      default: return status; // Return the raw status if unknown
    }
  }

  viewDetails(id: string): void {
    this.router.navigate(['/mecanicien/reparations', id]);
  }

  // Helper to get the page numbers for pagination control
  getPageNumbers(): (number | string)[] { // Allow string for ellipsis
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    const maxPagesToShow = 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxPagesToShow) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        if (endPage - startPage + 1 < maxPagesToShow) {
            if (currentPage < totalPages / 2) endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
            else startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) pages.push('...');
        }
        for (let i = startPage; i <= endPage; i++) pages.push(i);
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }
    }
    return pages;
  }
} 