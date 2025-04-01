import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Facture, FactureFilters, PaymentInfo } from '../../../../models/facture.model';
import { FactureService } from '../../../../services/facture.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PdfGenerationService } from '../../../../services/pdf-generation.service';

@Component({
  selector: 'app-client-factures-list',
  templateUrl: './client-factures-list.component.html',
  styleUrls: ['./client-factures-list.component.css']
})
export class ClientFacturesListComponent implements OnInit {
  factures: Facture[] = [];
  filteredFactures: Facture[] = [];
  loading: boolean = true;
  error: string | null = null;
  paymentMessage: string | null = null;
  paymentError: string | null = null;
  
  filterForm: FormGroup;
  
  // Pagination (adaptée pour une grille de cartes)
  currentPage: number = 1;
  itemsPerPage: number = 6; // Moins d'items par page pour une grille
  totalItems: number = 0;
  
  // Tri (peut être moins pertinent pour une vue client, mais on garde la base)
  sortField: string = 'dateEmission';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  constructor(
    private factureService: FactureService,
    private router: Router,
    private fb: FormBuilder,
    private pdfGenerationService: PdfGenerationService
  ) {
    this.filterForm = this.fb.group({
      statut: [''],
      dateDebut: [''],
      dateFin: [''],
      recherche: [''] // Recherche simplifiée pour le client
    });
  }

  ngOnInit(): void {
    this.loadFactures();
    
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFiltersAndSort();
    });
  }
  
  loadFactures(): void {
    this.loading = true;
    // !! IMPORTANT: En production, il faudra un endpoint API 
    // qui retourne UNIQUEMENT les factures du client connecté.
    // Ici, on simule en prenant tout et en filtrant (potentiellement) plus tard.
    this.factureService.getFactures().subscribe({
      next: (data) => {
        // Filtrer pour ne garder que les factures visibles par le client
        this.factures = data.filter(f => f.statut !== 'brouillon' && f.statut !== 'validee');
        this.applyFiltersAndSort(); // Appliquer filtres/tri initiaux
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de vos factures: ' + err.message;
        this.loading = false;
      }
    });
  }
  
  applyFiltersAndSort(): void {
    const filters: FactureFilters = this.filterForm.value;
    let result = [...this.factures]; // Utiliser les factures déjà pré-filtrées
    
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
    if (filters.recherche) {
      const search = filters.recherche.toLowerCase();
      result = result.filter(f => 
        f.numeroFacture.toLowerCase().includes(search) ||
        f.vehicule.immatriculation.toLowerCase().includes(search) ||
        f.vehicule.marque.toLowerCase().includes(search) ||
        f.vehicule.modele.toLowerCase().includes(search)
      );
    }
    
    // Tri
    this.filteredFactures = this.sortFactures(result);
    this.totalItems = this.filteredFactures.length;
    this.currentPage = 1;
  }
  
  resetFilters(): void {
    this.filterForm.reset({
      statut: '',
      dateDebut: '',
      dateFin: '',
      recherche: ''
    });
    // applyFiltersAndSort est appelé via valueChanges
  }
  
  sortFactures(factures: Facture[]): Facture[] {
    return factures.sort((a, b) => {
      let valA: any = a[this.sortField as keyof Facture];
      let valB: any = b[this.sortField as keyof Facture];
      
      if (this.sortField === 'dateEmission' || this.sortField === 'dateEcheance') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      
      const comparison = valA < valB ? -1 : (valA > valB ? 1 : 0);
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
  
  // Le tri via clic sur colonne n'est pas utilisé dans la vue client actuelle (cartes)
  // Mais on garde la logique si besoin futur.
  
  // Pagination
  changePage(page: number): void {
    this.currentPage = page;
    window.scrollTo(0, 0); // Remonter en haut de page lors du changement
  }
  
  get paginatedFactures(): Facture[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredFactures.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
  
  getPageNumbers(): number[] {
    const totalP = this.totalPages;
    const currentP = this.currentPage;
    const maxPagesToShow = 5;
    const pages: number[] = [];

    if (totalP <= maxPagesToShow) {
      for (let i = 1; i <= totalP; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentP - Math.floor((maxPagesToShow - 3) / 2));
      let end = Math.min(totalP - 1, currentP + Math.ceil((maxPagesToShow - 3) / 2));

      if (currentP <= Math.ceil(maxPagesToShow / 2)) {
        end = maxPagesToShow - 2;
      }
      if (currentP >= totalP - Math.floor(maxPagesToShow / 2)) {
        start = totalP - maxPagesToShow + 3;
      }

      if (start > 2) {
        pages.push(-1); // Ellipsis
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalP - 1) {
        pages.push(-1); // Ellipsis
      }
      pages.push(totalP);
    }
    return pages;
  }

  // Navigation
  viewFactureDetails(factureId: string): void {
    this.router.navigate(['/client/factures', factureId]);
  }
  
  // Formatage et utilitaires
  getStatusClass(status: string): string {
    const statusMap: {[key: string]: string} = {
      'emise': 'status-issued', // À payer
      'payee': 'status-paid',
      'partiellement_payee': 'status-partial',
      'annulee': 'status-cancelled',
      'en_retard': 'status-late'
    };
    // Si la facture est 'emise' et en retard, on priorise le style 'en_retard'
    const facture = this.factures.find(f => f.statut === status); // Attention, pas idéal si plusieurs factures ont le même statut
    if(status === 'emise' && facture && this.isPastDue(facture)) {
        return 'status-late';
    }
    return statusMap[status] || 'status-default';
  }
  
  getStatusLabel(status: string): string {
    const statusMap: {[key: string]: string} = {
      'emise': 'À payer',
      'payee': 'Payée',
      'partiellement_payee': 'Part. payée',
      'annulee': 'Annulée',
      'en_retard': 'En retard' // Ce label est utilisé si getStatusClass retourne 'status-late'
    };
    // Le statut affiché peut différer de la classe si 'en_retard' est priorisé
     const facture = this.factures.find(f => f.statut === status);
     if(status === 'emise' && facture && this.isPastDue(facture)) {
        return 'En retard';
    }
    return statusMap[status] || status;
  }
  
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
  
  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
  }
  
  isPastDue(facture: Facture): boolean {
    if (facture.statut === 'payee' || facture.statut === 'annulee') {
      return false;
    }
    const now = new Date();
    const echeance = new Date(facture.dateEcheance);
    // Mettre l'heure à 00:00:00 pour comparer uniquement les jours
    now.setHours(0, 0, 0, 0);
    echeance.setHours(0, 0, 0, 0);
    return now > echeance;
  }
  
  canPayOnline(facture: Facture): boolean {
    // Le paiement n'est possible que si elle est émise (ou partiellement payée/en retard)
    return facture.statut === 'emise' || facture.statut === 'partiellement_payee' || (facture.statut !== 'payee' && facture.statut !== 'annulee' && this.isPastDue(facture));
  }
  
  /**
   * Finds the corresponding invoice and calls the PDF generation service.
   * Stops event propagation to prevent card click navigation.
   * @param factureId The ID of the invoice to download.
   * @param event The click event.
   */
  downloadPDF(factureId: string, event: Event): void {
    event.stopPropagation(); // Empêcher la navigation au clic sur la carte

    // Find the full invoice object in the currently displayed list
    const facture = this.filteredFactures.find(f => f.id === factureId);

    if (facture) {
      this.pdfGenerationService.generateFacturePdf(facture);
    } else {
      console.error(`Facture with ID ${factureId} not found in the list for PDF generation.`);
      // Optionally show a user-friendly error message
    }
  }

  /**
   * Simulates paying the full remaining amount for a given invoice.
   * Stops event propagation to prevent card click navigation.
   * @param factureId The ID of the invoice to simulate payment for.
   * @param event The click event.
   */
  payInvoice(factureId: string, event: Event): void {
    event.stopPropagation();

    this.paymentMessage = null;
    this.paymentError = null;
    // We don't set global loading here, maybe just disable the specific button?
    // Or show a spinner on the specific card? For simplicity, no loading indicator for now.

    const facture = this.filteredFactures.find(f => f.id === factureId);

    if (!facture) {
      this.paymentError = `Facture ${factureId} non trouvée pour le paiement.`;
      return;
    }

    const remainingDue = this.calculateRemainingDue(facture);

    if (remainingDue <= 0) {
      this.paymentError = `La facture ${facture.numeroFacture} est déjà payée.`;
      return;
    }

    const paymentInfo: PaymentInfo = {
      montant: remainingDue,
      modePaiement: 'en_ligne', // Use a valid mode
      reference: `SIM_LIST_${Date.now()}`
    };

    console.log('Simulating payment from list for facture:', factureId, ' Amount: ', remainingDue);

    this.factureService.payFacture(factureId, paymentInfo).subscribe({
      next: (transaction) => {
        console.log('Simulated payment successful from list, transaction:', transaction);
        this.paymentMessage = `Paiement simulé pour la facture ${facture.numeroFacture} (${this.formatMontant(remainingDue)}) effectué.`;
        // Reload the entire list to reflect changes
        // A more optimized approach could update only the specific card data
        this.loadFactures(); 
      },
      error: (err) => {
        console.error('Error during simulated payment from list:', err);
        this.paymentError = `Erreur lors du paiement simulé de la facture ${facture.numeroFacture}: ${err.message || 'Erreur inconnue'}`;
        // Potentially re-enable button if it was disabled
      }
    });
  }

  // --- Add Helper method needed by payInvoice ---

  private calculateRemainingDue(facture: Facture | null): number {
    if (!facture || facture.statut === 'payee' || facture.statut === 'annulee') {
      return 0;
    }
    // Ensure transactions array exists before filtering/reducing
    const totalPaid = (facture.transactions || []) 
                      .filter(t => t.statut === 'validee')
                      .reduce((sum, t) => sum + t.montant, 0);
    return Math.max(0, facture.montantTTC - totalPaid);
  }

  // isPastDue is already defined earlier in the class
  
}
