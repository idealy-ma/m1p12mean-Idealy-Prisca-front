import { Component, OnInit } from '@angular/core';
import { Devis } from '../../../models/devis.model';
import { DevisService } from '../../../services/devis/devis.service';

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
  loading: boolean = false;
  error: string | null = null;
  pagination: Pagination | null = null;
  currentPage: number = 1;

  constructor(private devisService: DevisService) { }

  ngOnInit(): void {
    this.loadDevis();
  }

  loadDevis(page: number = 1): void {
    this.loading = true;
    this.error = null;
    
    this.devisService.getDevis(page).subscribe({
      next: (response: any) => {
        if (response && response.success && Array.isArray(response.data)) {
          this.devis = response.data;
          this.pagination = response.pagination;
        } else {
          console.error('Données invalides :', response);
          this.devis = [];
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
    this.loadDevis(page);
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
} 