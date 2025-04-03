import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Facture, FactureFilters, FactureStats } from '../../../../models/facture.model';
import { FactureService } from '../../../../services/facture.service';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-manager-factures-list',
  templateUrl: './manager-factures-list.component.html',
  styleUrls: ['./manager-factures-list.component.css']
})
export class ManagerFacturesListComponent implements OnInit {
  factures: Facture[] = [];
  filteredFactures: Facture[] = [];
  loading: boolean = true;
  error: string | null = null;
  stats: FactureStats | null = null;
  
  filterForm: FormGroup;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  
  // Tri
  sortField: string = 'dateEmission';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  constructor(
    private factureService: FactureService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      statut: [''],
      dateDebut: [''],
      dateFin: [''],
      recherche: [''],
      montantMin: [''],
      montantMax: ['']
    });
  }

  ngOnInit(): void {
    this.loadFactures();
    this.loadStats();
    
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFiltersAndSort(); // Appliquer filtres ET tri
    });
  }
  
  loadFactures(): void {
    this.loading = true;
    this.factureService.getFactures().subscribe({
      next: (data) => {
        this.factures = data.data;
        this.applyFiltersAndSort(); // Appliquer les filtres et le tri initiaux
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des factures: ' + err.message;
        this.loading = false;
      }
    });
  }
  
  loadStats(): void {
    this.factureService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des statistiques:', err);
      }
    });
  }
  
  applyFiltersAndSort(): void {
    const filters: FactureFilters = this.filterForm.value;
    let result = [...this.factures];
    
    // Filtrage
    if (filters.statut) {
      result = result.filter(f => f.statut === filters.statut);
    }
    if (filters.dateDebut) {
      const dateDebut = new Date(filters.dateDebut);
      result = result.filter(f => new Date(f.dateEmission) >= dateDebut);
    }
    if (filters.dateFin) {
      const dateFin = new Date(filters.dateFin);
      result = result.filter(f => new Date(f.dateEmission) <= dateFin);
    }
    if (filters.montantMin && filters.montantMin !== '') {
      result = result.filter(f => f.montantTTC >= parseFloat(filters.montantMin as string));
    }
    if (filters.montantMax && filters.montantMax !== '') {
      result = result.filter(f => f.montantTTC <= parseFloat(filters.montantMax as string));
    }
    if (filters.recherche) {
      const search = filters.recherche.toLowerCase();
      result = result.filter(f => 
        f.numeroFacture.toLowerCase().includes(search) ||
        f.client.nom.toLowerCase().includes(search) ||
        f.client.prenom.toLowerCase().includes(search) ||
        f.vehicule.immatriculation.toLowerCase().includes(search) ||
        f.vehicule.marque.toLowerCase().includes(search) ||
        f.vehicule.modele.toLowerCase().includes(search)
      );
    }
    
    // Tri
    this.filteredFactures = this.sortFactures(result);
    this.totalItems = this.filteredFactures.length;
    this.currentPage = 1; // Revenir à la première page après filtrage/tri
  }
  
  resetFilters(): void {
    this.filterForm.reset({
      statut: '',
      dateDebut: '',
      dateFin: '',
      recherche: '',
      montantMin: '',
      montantMax: ''
    });
    // applyFiltersAndSort() est déjà appelé par valueChanges
  }
  
  sortFactures(factures: Facture[]): Facture[] {
    return factures.sort((a, b) => {
      let valA: any;
      let valB: any;

      // Gérer les clés imbriquées pour le tri (ex: 'client.nom')
      if (this.sortField.includes('.')) {
        const keys = this.sortField.split('.');
        valA = a[keys[0] as keyof Facture] ? (a[keys[0] as keyof Facture] as any)[keys[1]] : null;
        valB = b[keys[0] as keyof Facture] ? (b[keys[0] as keyof Facture] as any)[keys[1]] : null;
      } else {
        valA = a[this.sortField as keyof Facture];
        valB = b[this.sortField as keyof Facture];
      }
      
      // Conversion en minuscules pour les chaînes
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      // Gérer les dates
      if (this.sortField === 'dateEmission' || this.sortField === 'dateEcheance') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      
      // Comparaison
      const comparison = valA < valB ? -1 : (valA > valB ? 1 : 0);
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
  
  changeSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc'; // Par défaut en descendant pour les nouvelles colonnes
    }
    
    this.applyFiltersAndSort(); // Réappliquer le tri
  }
  
  // Pagination
  changePage(page: number): void {
    this.currentPage = page;
  }
  
  get paginatedFactures(): Facture[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredFactures.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
  
  // Navigation
  viewFactureDetails(factureId: string): void {
    this.router.navigate(['/manager/factures', factureId]);
  }
  
  // Actions
  validateFacture(factureId: string, event: Event): void {
    event.stopPropagation();
    this.factureService.validateFacture(factureId).subscribe({
      next: (updatedFacture) => {
        this.updateFactureInList(updatedFacture);
      },
      error: (err) => {
        console.error('Erreur lors de la validation de la facture:', err);
        // Afficher un message d'erreur (Snackbar/Toast)
      }
    });
  }
  
  emitFacture(factureId: string, event: Event): void {
    event.stopPropagation();
    this.factureService.emitFacture(factureId).subscribe({
      next: (updatedFacture) => {
        this.updateFactureInList(updatedFacture);
      },
      error: (err) => {
        console.error('Erreur lors de l\'émission de la facture:', err);
        // Afficher un message d'erreur
      }
    });
  }

  // Mettre à jour une facture dans les listes locales
  private updateFactureInList(updatedFacture: Facture): void {
    const indexFactures = this.factures.findIndex(f => f.id === updatedFacture.id);
    if (indexFactures !== -1) {
      this.factures[indexFactures] = updatedFacture;
    }
    // Il faut aussi potentiellement mettre à jour filteredFactures ou relancer le filtrage/tri
    this.applyFiltersAndSort(); 
  }
  
  // Formatage et utilitaires
  getStatusClass(status: string): string {
    const statusMap: {[key: string]: string} = {
      'brouillon': 'status-draft',
      'validee': 'status-validated',
      'emise': 'status-issued',
      'payee': 'status-paid',
      'partiellement_payee': 'status-partial',
      'annulee': 'status-cancelled',
      'en_retard': 'status-late'
    };
    return statusMap[status] || 'status-default';
  }
  
  getStatusLabel(status: string): string {
    const statusMap: {[key: string]: string} = {
      'brouillon': 'Brouillon',
      'validee': 'Validée',
      'emise': 'Émise',
      'payee': 'Payée',
      'partiellement_payee': 'Partielle',
      'annulee': 'Annulée',
      'en_retard': 'En retard'
    };
    return statusMap[status] || status;
  }
  
  formatDate(date: Date | string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
  
  formatMontant(montant: number): string {
    if (montant == null) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
  }
}
