import { Injectable } from '@angular/core';
import { Facture } from '../models/facture.model';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Assign VFS fonts for pdfmake
(pdfMake as any).vfs = pdfFonts.vfs;

@Injectable({
  providedIn: 'root'
})
export class PdfGenerationService {

  constructor() { }

  /**
   * Generates and downloads a PDF for the given invoice.
   * @param facture The invoice object to generate PDF for.
   */
  generateFacturePdf(facture: Facture): void {
    if (!facture) {
      console.error('Cannot generate PDF: Facture object is null or undefined.');
      return;
    }

    try {
      const docDefinition = this.buildFactureDocDefinition(facture);
      const fileName = `Facture_${facture.numeroFacture}.pdf`;
      pdfMake.createPdf(docDefinition).download(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Optionally, display an error message to the user via a snackbar/toast service
    }
  }

  // --- Private Helper Methods for PDF Content ---

  private buildFactureDocDefinition(facture: Facture): any {
    // This is where the large docDefinition object from the component will go
    return {
      content: [
         // --- Header ---
         { text: `Facture N° ${facture.numeroFacture}`, style: 'header' },
         { text: `Statut: ${this.getStatusLabel(facture)}`, style: ['status', this.getStatusPdfStyle(facture)] }, // Dynamic style
         { text: `Date d'émission: ${this.formatDate(facture.dateEmission)}` },
         { text: `Date d'échéance: ${this.formatDate(facture.dateEcheance)}` },
         { text: ' ' }, // Space

         // --- Client/Vehicle/Garage Info ---
         {
          columns: [
            { // Vehicle Column
              width: '*',
              text: [
                { text: 'Véhicule\n', style: 'subheader' },
                `${facture.vehicule.marque} ${facture.vehicule.modele}\n`,
                `Immatriculation: ${facture.vehicule.immatriculation}`
              ]
            },
            { // Garage Column
              width: '*',
              text: [
                { text: 'Votre Garage\n', style: 'subheader' },
                'Garage V. Parrot\n', // Replace with actual data if available dynamically
                '12 Rue de la Réparation\n',
                '31000 Toulouse, France\n',
                'Téléphone: 05 61 23 45 67'
              ]
            }
          ]
        },
        { text: ' ' },

         // --- Lines Table ---
         {
          style: 'tableExample',
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'], // Column widths
            body: [
              // Table Header
              [{ text: 'Désignation', style: 'tableHeader' }, { text: 'Qté', style: 'tableHeader', alignment: 'center' }, { text: 'Prix Unit. HT', style: 'tableHeader', alignment: 'right' }, { text: 'Montant HT', style: 'tableHeader', alignment: 'right' }],
              // Invoice Lines (Loop)
              ...facture.lignesFacture.map(ligne => [
                `${ligne.designation}${ligne.reference ? ' (Réf: ' + ligne.reference + ')' : ''}`,
                { text: ligne.quantite, alignment: 'center' },
                { text: this.formatMontant(ligne.prixUnitaireHT), alignment: 'right' },
                { text: this.formatMontant(ligne.montantHT), alignment: 'right' }
              ])
            ]
          },
          layout: 'lightHorizontalLines' // Table style
        },
        { text: ' ' },

         // --- Totals ---
         {
          columns: [
            { width: '*', text: '' }, // Empty column to push right
            {
              width: 'auto',
              style: 'totalsTable',
              table: {
                body: [
                  ['Total HT:', { text: this.formatMontant(facture.montantHT), alignment: 'right' }],
                  ['Montant TVA (20%):', { text: this.formatMontant(facture.montantTVA), alignment: 'right' }],
                  // Add discount if exists
                  ...(facture.remise ? [['Remise:', { text: `- ${this.formatMontant(facture.remise.montant)}`, alignment: 'right', color: 'red' }]] : []),
                  [{ text: 'Total TTC:', style: 'bold' }, { text: this.formatMontant(facture.montantTTC), alignment: 'right', style: 'bold' }],
                   // Add partial payments / remaining due
                   ...(facture.statut === 'partiellement_payee' ? [['Montant Payé:', { text: this.formatMontant(facture.montantTTC - this.calculateRemainingDue(facture)), alignment: 'right', color: 'green' }]] : []),
                   ...(this.canPayOnline(facture) && this.calculateRemainingDue(facture) > 0 ? [['Reste à payer:', { text: this.formatMontant(this.calculateRemainingDue(facture)), alignment: 'right', style: 'bold' }]] : [])
                ]
              },
              layout: 'noBorders'
            }
          ]
        },
         { text: ' ' },

          // --- Transactions if exist ---
        ...(facture.transactions && facture.transactions.length > 0 ? [
          { text: 'Vos paiements effectués', style: 'subheader' },
          {
              style: 'tableExample',
              table: {
                  headerRows: 1,
                  widths: ['auto', '*', 'auto', 'auto'],
                  body: [
                      [{ text: 'Date', style: 'tableHeader' }, { text: 'Mode', style: 'tableHeader' }, { text: 'Référence', style: 'tableHeader' }, { text: 'Montant', style: 'tableHeader', alignment: 'right' }],
                      ...facture.transactions.filter(t => t.statut === 'validee').map(tx => [
                          this.formatDate(tx.date),
                          tx.modePaiement,
                          tx.reference || '-',
                          { text: this.formatMontant(tx.montant), alignment: 'right' }
                      ])
                  ]
              },
              layout: 'lightHorizontalLines'
          },
           { text: ' ' }
        ] : []),

         // --- Footer ---
         { text: 'Merci de votre confiance.', alignment: 'center', italics: true, margin: [0, 20, 0, 0] },
      ],
      styles: {
         header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        tableExample: { margin: [0, 5, 0, 15] },
        tableHeader: { bold: true, fontSize: 11, color: 'black' },
        totalsTable: { margin: [0, 10, 0, 0] },
        bold: { bold: true },
        status: { bold: true, margin: [0, 5, 0, 10] },
        'status-issued': { color: 'orange' },
        'status-paid': { color: 'green' },
        'status-partial': { color: 'blue' },
        'status-cancelled': { color: 'grey' },
        'status-late': { color: 'red' }
      },
      defaultStyle: {
        fontSize: 10
      }
    };
  }

  // --- Private Formatting and Logic Helpers (copied and adapted) ---

  private getStatusLabel(facture: Facture): string {
    const status = facture.statut;
    if (!status) return 'Inconnu';
    const isLate = this.isPastDue(facture);
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

  private getStatusPdfStyle(facture: Facture): string {
    const status = facture.statut;
    if (!status) return '';
    const isLate = this.isPastDue(facture);
    if ((status === 'emise' || status === 'partiellement_payee') && isLate) {
      return 'status-late';
    }
    const statusMap: {[key: string]: string} = {
      'emise': 'status-issued',
      'payee': 'status-paid',
      'partiellement_payee': 'status-partial',
      'annulee': 'status-cancelled'
    };
    return statusMap[status] || '';
  }

  private formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    // Consistent date formatting for PDF
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private formatMontant(montant: number | undefined): string {
    if (montant == null) return '-';
    // Ensure consistent currency formatting
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
  }

  private isPastDue(facture: Facture): boolean {
    if (!facture || facture.statut === 'payee' || facture.statut === 'annulee') {
      return false;
    }
    const now = new Date();
    const echeance = new Date(facture.dateEcheance);
    now.setHours(0, 0, 0, 0);
    echeance.setHours(0, 0, 0, 0);
    return now > echeance;
  }

  private canPayOnline(facture: Facture): boolean {
     // This helper might not be directly needed for PDF generation itself,
     // but is used by calculateRemainingDue logic indirectly via template logic previously.
     // Keep it for consistency with copied logic for now.
    if (!facture) return false;
    const isLate = this.isPastDue(facture);
    return facture.statut === 'emise' || facture.statut === 'partiellement_payee' || ((facture.statut !== 'payee' && facture.statut !== 'annulee') && isLate);
  }

  private calculateRemainingDue(facture: Facture): number {
    if (!facture || facture.statut === 'payee' || facture.statut === 'annulee') {
      return 0;
    }
    const totalPaid = (facture.transactions || []) // Add safety check for transactions array
                      .filter(t => t.statut === 'validee')
                      .reduce((sum, t) => sum + t.montant, 0);
    return Math.max(0, facture.montantTTC - totalPaid);
  }

} 