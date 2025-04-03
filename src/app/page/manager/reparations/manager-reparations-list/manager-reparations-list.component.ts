import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Reparation, ReparationStatus } from '../../../../models/reparation.model';
import { ReparationService, ApiPaginatedResponse } from '../../../../services/reparation.service';
import { catchError, finalize, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { User } from '../../../../models/user.model';
import { UserService } from '../../../../services/user/user.service';

@Component({
  selector: 'app-manager-reparations-list',
  templateUrl: './manager-reparations-list.component.html',
  styleUrls: ['./manager-reparations-list.component.css']
})
export class ManagerReparationsListComponent implements OnInit, OnDestroy {

  reparations: Reparation[] = [];
  loading: boolean = true;
  error: string | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10; 
  totalItems: number = 0;
  totalPages: number = 1;

  // Tri
  currentSortField: string = 'dateCreationReparation';
  currentSortOrder: 'asc' | 'desc' = 'desc';

  // Filtres
  statusFilter: string = '';
  clientFilter: string = '';
  immatriculationFilter: string = '';
  searchTerm: string = '';

  availableStatuses: string[] = Object.values(ReparationStatus);
  availableClients: User[] = [];

  // Subjects pour les filtres avec debounce
  private searchTermSubject = new Subject<string>();
  private immatFilterSubject = new Subject<string>();
  private destroy$ = new Subject<void>(); // Pour se désabonner proprement

  constructor(
    private reparationService: ReparationService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadReparations();
    this.loadUsersWithClientRole();

    // Configurer le debounce pour le searchTerm
    this.searchTermSubject.pipe(
      debounceTime(400), // Attendre 400ms après la dernière frappe
      distinctUntilChanged(), // N'émettre que si la valeur a changé
      takeUntil(this.destroy$) // Se désabonner à la destruction du composant
    ).subscribe(() => {
      this.applyFilters(); // Appeler applyFilters après debounce
    });

    // Configurer le debounce pour le filtre immatriculation
    this.immatFilterSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Méthode appelée par l'input searchTerm
  onSearchTermChange(term: string): void {
    this.searchTermSubject.next(term);
  }

  // Méthode appelée par l'input immatriculationFilter
  onImmatFilterChange(term: string): void {
    this.immatFilterSubject.next(term);
  }

  loadReparations(): void {
    this.loading = true;
    this.error = null;
    const params: { [key: string]: any } = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortField: this.currentSortField,
      sortOrder: this.currentSortOrder,
      ...(this.statusFilter && { statusReparation: this.statusFilter }),
      ...(this.clientFilter && { client: this.clientFilter }),
      ...(this.immatriculationFilter && { immatriculationFilter: this.immatriculationFilter }),
      ...(this.searchTerm && { searchTerm: this.searchTerm })
    };

    this.reparationService.getAllReparationsForManager(params)
      .pipe(
        catchError(err => {
          console.error('Error loading reparations for manager:', err);
          this.error = err.userMessage || `Erreur lors du chargement des réparations: ${err.message || err}`;
          this.reparations = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.currentPage = 1;
          return of(null);
        }),
        finalize(() => this.loading = false),
        takeUntil(this.destroy$) // S'assurer que les requêtes HTTP sont aussi annulées
      )
      .subscribe((response: ApiPaginatedResponse<Reparation> | null) => {
        if (response && response.success) {
          this.reparations = response.data;
          this.totalItems = response.total ?? 0;
          this.totalPages = response.pagination.totalPages;
          console.log('Manager reparations loaded:', response);
        } else if (response) {
           this.error = response.message || 'Erreur lors de la récupération des réparations.';
           this.reparations = [];
           this.totalItems = 0;
           this.totalPages = 1;
           this.currentPage = 1;
        }
      });
  }

  loadUsersWithClientRole(): void {
    this.userService.getUsersByRole('client')
      .pipe(takeUntil(this.destroy$)) // Annuler aussi cette requête si le composant est détruit
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.availableClients = response.data.sort((a: User, b: User) =>
              (a.nom?.toLowerCase() ?? '').localeCompare(b.nom?.toLowerCase() ?? '')
            );
          }
        },
        error: (err: any) => console.error('Error loading clients for filter:', err)
      });
  }

  // --- Gestion de la Pagination ---
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReparations();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadReparations();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadReparations();
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, this.currentPage + 2);

    if (this.currentPage <= 3) endPage = Math.min(this.totalPages, 5);
    if (this.currentPage >= this.totalPages - 2) startPage = Math.max(1, this.totalPages - 4);

    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  }
  
  // --- Gestion du Tri ---
  changeSort(field: string): void {
    if (this.currentSortField === field) {
      this.currentSortOrder = this.currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortField = field;
      this.currentSortOrder = 'desc';
    }
    this.currentPage = 1;
    this.loadReparations();
  }

  getSortIcon(field: string): string {
    if (this.currentSortField === field) {
      return this.currentSortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
    return 'fas fa-sort';
  }
  
  // --- Gestion des Filtres ---
  applyFilters(): void {
    this.currentPage = 1;
    this.loadReparations();
  }

  resetFilters(): void {
    this.statusFilter = '';
    this.clientFilter = '';
    this.immatriculationFilter = '';
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadReparations();
  }

  // --- Navigation ---
  viewDetails(reparationId: string): void {
    this.router.navigate(['/manager/reparations', reparationId]);
  }
  
  // --- Utilitaires ---
  getStatusClass(status: string): string {
     switch (status) {
      case ReparationStatus.Planifiee: return 'status-planifiee';
      case ReparationStatus.EnCours: return 'status-en-cours';
      case ReparationStatus.EnAttentePieces: return 'status-en-attente';
      case ReparationStatus.Terminee: return 'status-terminee';
      case ReparationStatus.Facturee: return 'status-facturee';
      case ReparationStatus.Annulee: return 'status-annulee';
      default: return 'status-default';
    }
  }

   getStatusLabel(status: string): string {
    return status;
  }
   
} 