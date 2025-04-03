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
  isUpdatingStatus: boolean = false;
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

    const formData = this.factureForm.getRawValue(); 

    // 1. Créer l'objet de base à partir des données du formulaire
    const updatedFactureData: any = { // Utiliser any temporairement pour flexibilité
      ...formData
    };

    // 2. Remplacer les objets par les IDs ou null
    updatedFactureData.client = formData.client?.id || null;
    updatedFactureData.vehicule = formData.vehicule?.id || null;
    updatedFactureData.devis = formData.devisId || null; // Utiliser la valeur de devisId du form
    updatedFactureData.validePar = formData.validePar || null; // Mettre null si vide

    // 3. Nettoyer l'objet remise
    if (updatedFactureData.remise && typeof updatedFactureData.remise === 'object') {
        updatedFactureData.remise.montant = Number(updatedFactureData.remise.montant) || 0;
        updatedFactureData.remise.description = updatedFactureData.remise.description || '';
    } else {
        updatedFactureData.remise = { montant: 0, description: '' }; 
    }

    // 4. Supprimer les champs non pertinents ou non modifiables pour l'update
    delete updatedFactureData.numeroFacture; // Non modifiable
    delete updatedFactureData.creePar; // Non modifiable
    delete updatedFactureData.reparationId; // La référence à la réparation ne change pas
    delete updatedFactureData.devisId; // On a déjà mis sa valeur dans .devis
    delete updatedFactureData.transactions; // Non modifiable via ce formulaire
    delete updatedFactureData.montantHT; // Calculé par le backend
    delete updatedFactureData.montantTVA; // Calculé par le backend
    delete updatedFactureData.montantTTC; // Calculé par le backend
    // Les champs client et vehicule contiennent maintenant l'ID ou null.
    
    // IMPORTANT: Le backend (FactureService.update via .save()) 
    // doit ignorer les champs client, vehicule, reparation dans les données reçues,
    // car on ne modifie pas ces références lors de la sauvegarde d'un brouillon.
    // La logique actuelle dans FactureService.update le fait déjà.

    console.log("Envoi de la facture mise à jour (nettoyée) pour sauvegarde:", updatedFactureData);
    this.isUpdatingStatus = true; 
    this.error = null;

    // Envoyer l'objet nettoyé. Caster en Facture si nécessaire.
    console.log(updatedFactureData);
    
    this.factureService.updateFacture(updatedFactureData as Facture).subscribe({ 
      next: (savedFacture) => {
        // Log pour vérifier la réponse du backend
        console.log("Facture reçue après sauvegarde (savedFacture):", savedFacture);

        // Mettre à jour avec les données retournées (qui incluent les totaux recalculés)
        this.facture = savedFacture;
        this.initializeForm(savedFacture);
        this.isEditing = false;
        this.isUpdatingStatus = false;
        alert('Facture mise à jour avec succès.');
      },
      error: (err) => {
        console.error('Erreur lors de la sauvegarde:', err);
        this.isUpdatingStatus = false;
        this.error = `Erreur sauvegarde: ${err.message}`;
        alert(`Erreur lors de la sauvegarde: ${err.message}`); 
      }
    });
  }

  validateFacture(): void {
    if (this.isEditing || this.isUpdatingStatus) return;
    if (!this.facture) return;
    
    this.isUpdatingStatus = true;
    this.error = null;

    this.factureService.validateFacture(this.facture.id).subscribe({
      next: (updatedFacture) => {
        this.facture = updatedFacture;
        this.factureForm.patchValue({statut: updatedFacture.statut});
        this.isUpdatingStatus = false;
        alert('Facture validée avec succès.');
      },
      error: (err) => {
        console.error('Erreur lors de la validation:', err);
        this.error = `Erreur validation: ${err.message}`;
        this.isUpdatingStatus = false;
        alert(`Erreur lors de la validation: ${err.message}`);
      }
    });
  }

  emitFacture(): void {
    if (this.isEditing || this.isUpdatingStatus) return;
    if (!this.facture) return;
    
    this.isUpdatingStatus = true;
    this.error = null;

    this.factureService.emitFacture(this.facture.id).subscribe({
      next: (updatedFacture) => {
        this.facture = updatedFacture;
        this.factureForm.patchValue({statut: updatedFacture.statut});
        this.isUpdatingStatus = false;
        alert('Facture émise avec succès.');
      },
      error: (err) => {
        console.error('Erreur lors de l\'émission:', err);
        this.error = `Erreur émission: ${err.message}`;
        this.isUpdatingStatus = false;
        alert(`Erreur lors de l\'émission: ${err.message}`);
      }
    });
  }

  cancelFacture(): void {
    if (this.isEditing || this.isUpdatingStatus) return;
    if (!this.facture || this.facture.statut === 'annulee' || this.facture.statut === 'payee') return;
    
    const reason = prompt("Veuillez indiquer la raison de l\'annulation :");
    if (reason === null) {
      return;
    }
    if (reason.trim() === '') {
      alert("La raison de l\'annulation ne peut pas être vide.");
      return;
    }

    this.isUpdatingStatus = true;
    this.error = null;

    this.factureService.cancelFacture(this.facture.id, reason).subscribe({
      next: (updatedFacture) => {
        this.facture = updatedFacture;
        this.factureForm.patchValue({statut: updatedFacture.statut, commentaires: updatedFacture.commentaires});
        this.isUpdatingStatus = false;
        alert('Facture annulée avec succès.');
      },
      error: (err) => {
        console.error('Erreur lors de l\'annulation:', err);
        this.error = `Erreur annulation: ${err.message}`;
        this.isUpdatingStatus = false;
        alert(`Erreur lors de l\'annulation: ${err.message}`);
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
    const labelMap: {[key: string]: string} = {
      'brouillon': 'Brouillon',
      'validee': 'Validée',
      'emise': 'Émise',
      'payee': 'Payée',
      'partiellement_payee': 'Partiellement Payée',
      'annulee': 'Annulée',
      'en_retard': 'En Retard'
    };
    return labelMap[status] || status;
  }
  
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return 'Date invalide';
    }
  }
  
  formatMontant(montant: number | undefined | null): string {
    if (montant === null || montant === undefined) return '-';
    return montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  }

  formatTransactionStatus(status: string | undefined): string {
    if (!status) return '-';
    const txStatusMap: {[key: string]: string} = {
      'en_attente': 'En attente',
      'validee': 'Validée',
      'rejetee': 'Rejetée',
      'remboursee': 'Remboursée'
    };
    return txStatusMap[status] || status;
  }
}
