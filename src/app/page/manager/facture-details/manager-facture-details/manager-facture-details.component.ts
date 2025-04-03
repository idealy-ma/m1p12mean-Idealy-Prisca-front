import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Facture, LigneFacture, Transaction } from '../../../../models/facture.model';
import { FactureService } from '../../../../services/facture.service';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { PdfGenerationService } from '../../../../services/pdf-generation.service';

@Component({
  selector: 'app-manager-facture-details',
  templateUrl: './manager-facture-details.component.html',
  styleUrls: ['./manager-facture-details.component.css']
})
export class ManagerFactureDetailsComponent implements OnInit {
  facture: Facture | null = null;
  loading: boolean = true;
  error: string | null = null;
  
  isEditing: boolean = false;
  factureForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private factureService: FactureService,
    private location: Location,
    private fb: FormBuilder,
    private pdfGenerationService: PdfGenerationService
  ) {
    this.factureForm = this.fb.group({
      id: [''],
      numeroFacture: [''],
      dateEmission: ['', Validators.required],
      dateEcheance: ['', Validators.required],
      client: this.fb.group({
        id: [''], nom: [''], prenom: [''], email: [''], telephone: [''], adresse: ['']
      }),
      vehicule: this.fb.group({
        id: [''], marque: [''], modele: [''], immatriculation: [''], annee: [''], kilometrage: ['']
      }),
      reparationId: [''],
      devisId: [''],
      lignesFacture: this.fb.array([]),
      montantHT: [{value: 0, disabled: true}],
      montantTVA: [{value: 0, disabled: true}],
      montantTTC: [{value: 0, disabled: true}],
      remise: this.fb.group({
        montant: [0],
        pourcentage: [null],
        description: ['']
      }),
      statut: [''],
      transactions: [[]],
      commentaires: [''],
      delaiPaiement: [30, Validators.required],
      creePar: [''],
      validePar: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadFacture(id);
    } else {
      this.error = 'ID de facture manquant dans l\'URL.';
      this.loading = false;
    }
    
    this.lignesFacture.valueChanges.subscribe(() => {
      if(this.isEditing) {
        this.recalculateTotals();
      }
    });
  }

  get lignesFacture(): FormArray {
    return this.factureForm.get('lignesFacture') as FormArray;
  }

  loadFacture(id: string): void {
    this.loading = true;
    this.factureService.getFacture(id).subscribe({
      next: (data) => {
        this.facture = data;
        this.initializeForm(data);
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        this.error = `Erreur lors du chargement de la facture ${id}: ${err.message}`;
        this.loading = false;
      }
    });
  }

  initializeForm(facture: Facture): void {
    this.factureForm.patchValue(facture);
    this.lignesFacture.clear();
    facture.lignesFacture.forEach(ligne => {
      this.lignesFacture.push(this.createLigneFactureGroup(ligne));
    });
    this.recalculateTotals();
  }

  createLigneFactureGroup(ligne?: LigneFacture): FormGroup {
    return this.fb.group({
      id: [ligne?.id || 'temp-' + Date.now()],
      designation: [ligne?.designation || '', Validators.required],
      quantite: [ligne?.quantite || 1, [Validators.required, Validators.min(0)]],
      prixUnitaireHT: [ligne?.prixUnitaireHT || 0, [Validators.required, Validators.min(0)]],
      tauxTVA: [ligne?.tauxTVA || 20],
      montantHT: [{value: ligne?.montantHT || 0, disabled: true}],
      montantTVA: [{value: ligne?.montantTVA || 0, disabled: true}],
      montantTTC: [{value: ligne?.montantTTC || 0, disabled: true}],
      type: [ligne?.type || 'main_oeuvre', Validators.required],
      reference: [ligne?.reference || '']
    });
  }

  addLigneFacture(): void {
    this.lignesFacture.push(this.createLigneFactureGroup());
    this.recalculateTotals();
  }

  removeLigneFacture(index: number): void {
    this.lignesFacture.removeAt(index);
    this.recalculateTotals();
  }

  recalculateTotals(): void {
    let totalHT = 0;
    let totalTVA = 0;
    
    this.lignesFacture.controls.forEach(group => {
      const quantite = group.get('quantite')?.value || 0;
      const prixUnitaireHT = group.get('prixUnitaireHT')?.value || 0;
      const tauxTVA = group.get('tauxTVA')?.value || 0;
      
      const ligneHT = quantite * prixUnitaireHT;
      const ligneTVA = ligneHT * (tauxTVA / 100);
      const ligneTTC = ligneHT + ligneTVA;
      
      group.get('montantHT')?.setValue(ligneHT, { emitEvent: false });
      group.get('montantTVA')?.setValue(ligneTVA, { emitEvent: false });
      group.get('montantTTC')?.setValue(ligneTTC, { emitEvent: false });
      
      totalHT += ligneHT;
      totalTVA += ligneTVA;
    });
    
    const remise = this.factureForm.get('remise.montant')?.value || 0;
    const totalTTC = totalHT + totalTVA - remise;
    
    this.factureForm.get('montantHT')?.setValue(totalHT, { emitEvent: false });
    this.factureForm.get('montantTVA')?.setValue(totalTVA, { emitEvent: false });
    this.factureForm.get('montantTTC')?.setValue(totalTTC, { emitEvent: false });
  }

  enableEditing(): void {
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
    if (this.facture) {
      this.initializeForm(this.facture);
    }
  }

  saveChanges(): void {
    if (this.factureForm.invalid) {
      console.error("Formulaire invalide:", this.factureForm.errors);
      this.factureForm.markAllAsTouched(); 
      return;
    }
    
    if (!this.facture) return;

    const updatedFactureData = this.factureForm.getRawValue() as Facture;
    
    updatedFactureData.transactions = this.facture.transactions;

    console.log("Envoi de la facture mise à jour:", updatedFactureData);

    this.factureService.updateFacture(updatedFactureData).subscribe({
      next: (savedFacture) => {
        this.facture = savedFacture;
        this.initializeForm(savedFacture);
        this.isEditing = false;
      },
      error: (err) => {
        console.error('Erreur lors de la sauvegarde:', err);
      }
    });
  }

  validateFacture(): void {
    if (this.isEditing) return;
    if (!this.facture) return;
    this.factureService.validateFacture(this.facture.id).subscribe({
      next: (updatedFacture) => {
        this.facture = updatedFacture;
      },
      error: (err) => {
        console.error('Erreur lors de la validation:', err);
      }
    });
  }

  emitFacture(): void {
    if (this.isEditing) return;
    if (!this.facture) return;
    this.factureService.emitFacture(this.facture.id).subscribe({
      next: (updatedFacture) => {
        this.facture = updatedFacture;
      },
      error: (err) => {
        console.error('Erreur lors de l\'émission:', err);
      }
    });
  }

  downloadPDF(): void {
    if (!this.facture) {
      console.error("Facture data not loaded, cannot generate PDF.");
      return;
    }
    this.pdfGenerationService.generateFacturePdf(this.facture);
  }

  goBack(): void {
    this.location.back();
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-default';
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
  
  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Inconnu';
    const statusMap: {[key: string]: string} = {
      'brouillon': 'Brouillon',
      'validee': 'Validée',
      'emise': 'Émise',
      'payee': 'Payée',
      'partiellement_payee': 'Partiellement payée',
      'annulee': 'Annulée',
      'en_retard': 'En retard'
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

  formatTransactionStatus(status: string | undefined): string {
    if (!status) return 'Inconnu';
    const statusMap: {[key: string]: string} = {
      'en_attente': 'En attente',
      'validee': 'Validée',
      'rejetee': 'Rejetée',
      'remboursee': 'Remboursée'
    };
    return statusMap[status] || status;
  }
}
