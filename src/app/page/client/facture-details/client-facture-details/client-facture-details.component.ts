import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Facture } from '../../../../models/facture.model';
import { FactureService } from '../../../../services/facture.service';
import { Location } from '@angular/common';
// Remove pdfmake imports, they are now in the service
// import * as pdfMake from "pdfmake/build/pdfmake";
// import * as pdfFonts from 'pdfmake/build/vfs_fonts'; 
// (pdfMake as any).vfs = pdfFonts.vfs;

// Import the new service
import { PdfGenerationService } from '../../../../services/pdf-generation.service';

@Component({
  selector: 'app-client-facture-details',
  templateUrl: './client-facture-details.component.html',
  styleUrls: ['./client-facture-details.component.css']
})
export class ClientFactureDetailsComponent implements OnInit {
  facture: Facture | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private factureService: FactureService,
    private location: Location,
    private pdfGenerationService: PdfGenerationService // Inject the service
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadFacture(id);
    } else {
      this.error = 'ID de facture manquant dans l\'URL.';
      this.loading = false;
    }
  }

  loadFacture(id: string): void {
    this.loading = true;
    this.factureService.getFacture(id).subscribe({
      next: (data) => {
        // Vérifier si la facture est accessible au client (normalement géré par l'API)
        if (data.statut === 'brouillon' || data.statut === 'validee') {
           this.error = 'Cette facture n\'est pas accessible.';
           this.facture = null;
        } else {
          this.facture = data;
          this.error = null;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = `Erreur lors du chargement de la facture ${id}: ${err.message}`;
        this.loading = false;
      }
    });
  }

  payOnline(): void {
    if (!this.facture) return;
    console.log('Tentative de paiement en ligne pour facture:', this.facture.id);
    // Logique future : ouvrir une modale de paiement, rediriger vers une page de paiement...
    alert('Fonctionnalité de paiement en ligne à implémenter.');
  }

  downloadPDF(): void {
    if (!this.facture) {
      console.error("Facture data not loaded, cannot generate PDF.");
      // Optionally show a user-friendly error
      return;
    }
    // Call the service to generate the PDF
    this.pdfGenerationService.generateFacturePdf(this.facture);
  }

  goBack(): void {
    this.location.back();
  }

  // --- Helpers --- 
  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-default';
    const isLate = this.facture ? this.isPastDue(this.facture) : false;
     if ((status === 'emise' || status === 'partiellement_payee') && isLate) {
      return 'status-late';
    }
    const statusMap: {[key: string]: string} = {
      'emise': 'status-issued', 
      'payee': 'status-paid',
      'partiellement_payee': 'status-partial',
      'annulee': 'status-cancelled'
      // Brouillon/Validée ne sont pas montrés au client
    };
    return statusMap[status] || 'status-default';
  }
  
  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Inconnu';
    const isLate = this.facture ? this.isPastDue(this.facture) : false;
    if ((status === 'emise' || status === 'partiellement_payee') && isLate) {
      return 'En retard';
    }
    const statusMap: {[key: string]: string} = {
      'emise': 'À payer',
      'payee': 'Payée',
      'partiellement_payee': 'Partiellement payée',
      'annulee': 'Annulée'
    };
    return statusMap[status] || status;
  }
  
  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  
  formatMontant(montant: number | undefined): string {
    if (montant == null) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
  }

  isPastDue(facture: Facture): boolean {
    if (!facture || facture.statut === 'payee' || facture.statut === 'annulee') {
      return false;
    }
    const now = new Date();
    const echeance = new Date(facture.dateEcheance);
    now.setHours(0, 0, 0, 0);
    echeance.setHours(0, 0, 0, 0);
    return now > echeance;
  }

  canPayOnline(facture: Facture | null): boolean {
    if (!facture) return false;
    const isLate = this.isPastDue(facture);
    return facture.statut === 'emise' || facture.statut === 'partiellement_payee' || ((facture.statut !== 'payee' && facture.statut !== 'annulee') && isLate);
  }

  calculateRemainingDue(facture: Facture | null): number {
    if (!facture || facture.statut === 'payee' || facture.statut === 'annulee') {
      return 0;
    }
    const totalPaid = (facture.transactions || []) // Add safety check
                      .filter(t => t.statut === 'validee')
                      .reduce((sum, t) => sum + t.montant, 0);
    return Math.max(0, facture.montantTTC - totalPaid);
  }
}
