import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReparationService, ApiPagination, ApiPaginatedResponse } from '../../../../services/reparation.service';
import { Reparation } from '../../../../models/reparation.model';

@Component({
  selector: 'app-historique-reparations',
  templateUrl: './historique-reparations.component.html',
  styleUrls: ['./historique-reparations.component.css']
})
export class HistoriqueReparationsComponent implements OnInit {

  reparations: Reparation[] = [];
  pagination: ApiPagination | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  // Pagination and Sorting parameters
  currentPage: number = 1;
  itemsPerPage: number = 10; // Or load from a config/preference
  sortField: string = 'dateFinReelle'; // Default sort
  sortOrder: 'asc' | 'desc' = 'desc'; // Default order

  // Filter parameters
  searchTerm: string = '';
  dateDebut: string = ''; // Format YYYY-MM-DD for input type="date"
  dateFin: string = '';   // Format YYYY-MM-DD

  constructor(
    private reparationService: ReparationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadHistorique(this.currentPage);
  }

  loadHistorique(page: number): void {
    this.isLoading = true;
    this.error = null;
    this.currentPage = page; // Update current page

    const params: any = { // Using any for simplicity or define a specific interface
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortField: this.sortField,
      sortOrder: this.sortOrder
    };

    // Add filters to params only if they have a value
    if (this.searchTerm.trim()) {
      params.searchTerm = this.searchTerm.trim();
    }
    if (this.dateDebut) {
      params.dateDebut = this.dateDebut;
    }
    if (this.dateFin) {
      params.dateFin = this.dateFin;
    }

    this.reparationService.getMecanicienHistory(params).subscribe({
      next: (response: ApiPaginatedResponse<Reparation>) => {
        if (response && response.success) {
          this.reparations = response.data;
          this.pagination = response.pagination;
        } else {
          // Handle API error indicated by success: false
          this.error = response?.message || 'Erreur lors de la récupération de l\'historique.';
          this.reparations = [];
          this.pagination = null;
        }
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Erreur lors du chargement de l\'historique:', err);
        // Use the user-friendly message from the service's error handler
        this.error = err.message || 'Une erreur technique est survenue.';
        this.reparations = [];
        this.pagination = null;
        this.isLoading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    if (newPage > 0 && (!this.pagination || newPage <= this.pagination.totalPages)) {
      this.loadHistorique(newPage);
    }
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      // Toggle order if same field
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // Change field, reset order to default (e.g., 'asc' or 'desc' depending on field)
      this.sortField = field;
      this.sortOrder = 'desc'; // Default to descending for new field, adjust as needed
    }
    // Reload data from page 1 with new sorting
    this.loadHistorique(1);
  }

  applyFilters(): void {
    // Always go back to page 1 when applying new filters
    this.loadHistorique(1);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.loadHistorique(1); // Reload data from page 1 without filters
  }

  onSearchEnter(): void {
      this.applyFilters();
  }

  // Method to navigate to repair details
  viewDetails(reparationId: string): void {
    if (reparationId) {
      // Navigate to the detail page route, adjust route as necessary
      this.router.navigate(['/mecanicien/reparations', reparationId]);
    } else {
      console.error('Tentative de navigation vers les détails sans ID de réparation.');
    }
  }

  // Helper to get sort icon (optional for UI)
  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'fas fa-sort'; // Default icon
    }
    return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }
}
