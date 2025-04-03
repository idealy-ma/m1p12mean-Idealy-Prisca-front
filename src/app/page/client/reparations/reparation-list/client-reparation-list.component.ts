import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReparationService, ApiPaginatedResponse } from '../../../../services/reparation.service';
import { Reparation, ReparationStatus } from '../../../../models/reparation.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-reparation-list',
  templateUrl: './client-reparation-list.component.html',
  styleUrls: ['./client-reparation-list.component.css'],
})
export class ClientReparationListComponent implements OnInit {
  reparations: Reparation[] = [];
  loading: boolean = true;
  error: string | null = null;
  searchTerm: string = '';
  statusFilter: ReparationStatus | 'tous' = 'tous';
  sortField: string = 'dateCreationReparation';
  sortOrder: 'asc' | 'desc' = 'desc';

  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;
  totalPages: number = 0;

  constructor(
    private router: Router,
    private reparationService: ReparationService
  ) { }

  ngOnInit(): void {
    this.loadReparations();
  }

  loadReparations(): void {
    this.loading = true;
    this.error = null;

    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
    };

    if (this.statusFilter !== 'tous') {
      params.statusReparation = this.statusFilter;
    }

    this.reparationService.getClientReparations(params).subscribe({
      next: (response: ApiPaginatedResponse<Reparation>) => {
        this.reparations = response.data;
        this.totalItems = response.total;
        this.totalPages = response.pagination.totalPages;
        this.currentPage = response.pagination.page;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des réparations client:', err);
        this.error = err.message || 'Impossible de charger les réparations.';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReparations();
    }
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadReparations();
  }

  applySort(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    this.currentPage = 1;
    this.loadReparations();
  }

  applySearch(): void {
    this.currentPage = 1;
    this.loadReparations();
  }

  viewReparationDetails(id: string): void {
    this.router.navigate(['/client/reparations', id]);
  }

  getStatusLabel(status: ReparationStatus | undefined): string {
    if (!status) {
      return 'Inconnu';
    }
    return status as string;
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'fa-sort';
    }
    return this.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }
} 