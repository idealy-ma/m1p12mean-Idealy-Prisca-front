import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Vehicule } from '../../../models/vehicule.model';
import { VehiculeService } from '../../../services/vehicules/vehicule.service';
import { DevisService } from '../../../services/devis/devis.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-devis-request',
  templateUrl: './devis-request.component.html',
  styleUrls: ['./devis-request.component.css']
})
export class DevisRequestComponent implements OnInit {
  vehiculeList: Vehicule[] = [];
  vehiculeForm: FormGroup;
  devisForm: FormGroup;
  isNewVehicule = false;
  selectedRequestType: 'problem' | 'services' = 'problem';
  includeProblem = true; // Par défaut, inclure la section problème
  includeServices = false; // Par défaut, ne pas inclure la section services
  isLoading = false;
  hasError = false;
  errorMessage = '';
  isSuccess = false;
  isProgressBarSticky = false;
  
  commonProblems = [
    { id: 'battery', label: 'Batterie', selected: false },
    { id: 'engine', label: 'Moteur', selected: false },
    { id: 'brakes', label: 'Freinage', selected: false },
    { id: 'suspension', label: 'Suspension', selected: false },
    { id: 'transmission', label: 'Transmission', selected: false },
    { id: 'electrical', label: 'Système électrique', selected: false },
    { id: 'cooling', label: 'Système de refroidissement', selected: false },
  ];
  
  availableServices = [
    { id: 'oil', label: 'Vidange', selected: false, price: 50 },
    { id: 'tires', label: 'Changement de pneus', selected: false, price: 200 },
    { id: 'filters', label: 'Changement de filtres', selected: false, price: 30 },
    { id: 'brakes', label: 'Entretien des freins', selected: false, price: 120 },
    { id: 'ac', label: 'Entretien climatisation', selected: false, price: 80 },
    { id: 'battery', label: 'Remplacement batterie', selected: false, price: 100 },
  ];
  
  servicePacks = [
    { 
      id: 'basic', 
      label: 'Pack entretien basique', 
      services: ['oil', 'filters'],
      price: 70, // Discount applied
      selected: false
    },
    { 
      id: 'complete', 
      label: 'Pack entretien complet', 
      services: ['oil', 'filters', 'brakes'],
      price: 180, // Discount applied
      selected: false
    },
  ];

  constructor(
    private fb: FormBuilder,
    private vehiculeService: VehiculeService,
    private devisService: DevisService,
    private router: Router
  ) {
    this.vehiculeForm = this.fb.group({
      vehiculeId: ['', Validators.required],
      marque: [''],
      modele: [''],
      immatricule: [''],
      carburant: ['']
    });
    
    this.devisForm = this.fb.group({
      requestType: ['problem', Validators.required],
      description: [''],
      preferredDate: [null],
      photoUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadVehicules();
    this.vehiculeForm.get('vehiculeId')?.valueChanges.subscribe(value => {
      this.isNewVehicule = value === 'new';
      
      if (this.isNewVehicule) {
        this.vehiculeForm.get('marque')?.setValidators([Validators.required]);
        this.vehiculeForm.get('modele')?.setValidators([Validators.required]);
        this.vehiculeForm.get('immatricule')?.setValidators([Validators.required]);
        this.vehiculeForm.get('carburant')?.setValidators([Validators.required]);
      } else {
        this.vehiculeForm.get('marque')?.clearValidators();
        this.vehiculeForm.get('modele')?.clearValidators();
        this.vehiculeForm.get('immatricule')?.clearValidators();
        this.vehiculeForm.get('carburant')?.clearValidators();
      }
      
      this.vehiculeForm.get('marque')?.updateValueAndValidity();
      this.vehiculeForm.get('modele')?.updateValueAndValidity();
      this.vehiculeForm.get('immatricule')?.updateValueAndValidity();
      this.vehiculeForm.get('carburant')?.updateValueAndValidity();
    });
    
    // Mise à jour des validateurs en fonction des types de demande sélectionnés
    this.updateFormValidators();
  }

  loadVehicules(): void {
    this.isLoading = true;
    console.log('Début du chargement des véhicules...');
    this.vehiculeService.getVehicules().subscribe({
      next: (response: any) => {
        console.log('Véhicules reçus :', response);
        // Extraire le tableau de véhicules du champ 'data' de la réponse
        this.vehiculeList = response.data || [];
        this.isLoading = false;
        
        // Add "Add new vehicle" option
        if (this.vehiculeList.length === 0) {
          console.log('Aucun véhicule trouvé, passage en mode création');
          // If no vehicles, default to adding a new one
          this.vehiculeForm.patchValue({ vehiculeId: 'new' });
          this.isNewVehicule = true;
        } else {
          console.log(`${this.vehiculeList.length} véhicules chargés avec succès`);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Erreur lors du chargement des véhicules. Veuillez réessayer.';
        console.error('Erreur détaillée lors du chargement des véhicules:', error);
      }
    });
  }

  // Méthode pour récupérer le véhicule sélectionné
  getSelectedVehicule(): Vehicule | undefined {
    const vehiculeId = this.vehiculeForm.get('vehiculeId')?.value;
    if (!vehiculeId || vehiculeId === 'new') {
      return undefined;
    }
    
    return this.vehiculeList.find(v => v._id === vehiculeId);
  }
  
  // Méthode pour obtenir la marque du véhicule sélectionné
  getSelectedVehiculeMarque(): string {
    const vehicule = this.getSelectedVehicule();
    return vehicule?.marque || '';
  }
  
  // Méthode pour obtenir le modèle du véhicule sélectionné
  getSelectedVehiculeModele(): string {
    const vehicule = this.getSelectedVehicule();
    return vehicule?.modele || '';
  }
  
  // Méthode pour obtenir l'immatriculation du véhicule sélectionné
  getSelectedVehiculeImmatricule(): string {
    const vehicule = this.getSelectedVehicule();
    return vehicule?.immatricule || '';
  }
  
  // Méthode pour obtenir le label d'un service par son ID
  getServiceLabelById(serviceId: string): string {
    const service = this.availableServices.find(s => s.id === serviceId);
    return service?.label || '';
  }
  
  // Méthode pour faciliter l'accès aux contrôles du formulaire
  getDescriptionControl(): FormControl {
    return this.devisForm.get('description') as FormControl;
  }
  
  getPreferredDateControl(): FormControl {
    return this.devisForm.get('preferredDate') as FormControl;
  }

  toggleProblem(problem: any): void {
    problem.selected = !problem.selected;
    
    // Update description if problem is selected
    if (problem.selected) {
      const currentDescription = this.devisForm.get('description')?.value || '';
      if (currentDescription) {
        this.devisForm.patchValue({
          description: currentDescription + `\n- ${problem.label}`
        });
      } else {
        this.devisForm.patchValue({
          description: `- ${problem.label}`
        });
      }
    }
  }

  toggleService(service: any): void {
    service.selected = !service.selected;
    
    // Services are independent from packs now
  }

  togglePack(pack: any): void {
    pack.selected = !pack.selected;
    
    // Packs are independent from services and can be selected multiple at once
    // No need to select/deselect related services or other packs
  }

  calculateTotalPrice(): number {
    let total = 0;
    
    // Add prices of all selected packs
    this.servicePacks.forEach(pack => {
      if (pack.selected) {
        total += pack.price;
      }
    });
    
    // Add prices of all selected services
    this.availableServices.forEach(service => {
      if (service.selected) {
        total += service.price;
      }
    });
    
    return total;
  }

  getSelectedServicesDescription(): string {
    const selectedItems: string[] = [];
    
    // Add selected services
    this.availableServices
      .filter(service => service.selected)
      .forEach(service => selectedItems.push(service.label));
    
    // Add selected packs
    this.servicePacks
      .filter(pack => pack.selected)
      .forEach(pack => selectedItems.push(`Pack ${pack.label}`));
    
    return selectedItems.join(', ');
  }

  // Méthode pour activer/désactiver la section problème
  toggleIncludeProblem(): void {
    this.includeProblem = !this.includeProblem;
    
    // Si aucune option n'est sélectionnée, on force au moins une option
    if (!this.includeProblem && !this.includeServices) {
      this.includeServices = true;
    }
    
    this.updateFormValidators();
  }
  
  // Méthode pour activer/désactiver la section services
  toggleIncludeServices(): void {
    this.includeServices = !this.includeServices;
    
    // Si aucune option n'est sélectionnée, on force au moins une option
    if (!this.includeProblem && !this.includeServices) {
      this.includeProblem = true;
    }
    
    this.updateFormValidators();
  }
  
  // Mise à jour des validateurs en fonction des types de demande sélectionnés
  updateFormValidators(): void {
    if (this.includeProblem) {
      this.devisForm.get('description')?.setValidators([Validators.required]);
    } else {
      this.devisForm.get('description')?.clearValidators();
    }
    
    this.devisForm.get('description')?.updateValueAndValidity();
  }

  async submitDevis(): Promise<void> {
    if (!this.validateForms()) {
      return;
    }
    
    this.isLoading = true;
    let vehiculeId = this.vehiculeForm.get('vehiculeId')?.value;
    
    try {
      // If it's a new vehicle, create it first
      if (this.isNewVehicule) {
        const newVehicule: Vehicule = {
          marque: this.vehiculeForm.get('marque')?.value,
          modele: this.vehiculeForm.get('modele')?.value,
          immatricule: this.vehiculeForm.get('immatricule')?.value,
          carburant: this.vehiculeForm.get('carburant')?.value
        };
        
        // Create vehicle first using firstValueFrom instead of toPromise
        const createdVehicule = await firstValueFrom(this.vehiculeService.createVehicule(newVehicule));
        if (createdVehicule?._id) {
          vehiculeId = createdVehicule._id;
        } else {
          throw new Error('La création du véhicule a échoué');
        }
      }
      
      // Prepare devis data
      const devisData: any = {
        vehiculeId: vehiculeId,
        hasProblem: this.includeProblem,
        hasServices: this.includeServices
      };
      
      // Add problem-specific fields if included
      if (this.includeProblem) {
        devisData.description = this.devisForm.get('description')?.value;
        devisData.preferredDate = this.devisForm.get('preferredDate')?.value;
        devisData.photoUrl = this.devisForm.get('photoUrl')?.value;
      }
      
      // Add services-specific fields if included
      if (this.includeServices) {
        devisData.selectedServices = this.availableServices
          .filter(service => service.selected)
          .map(service => service.id);
        
        devisData.selectedPacks = this.servicePacks
          .filter(pack => pack.selected)
          .map(pack => pack.id);
        devisData.montantEstime = this.calculateTotalPrice();
      }
      
      // Submit the devis
      await firstValueFrom(this.devisService.createDevis(devisData));
      
      this.isSuccess = true;
      this.isLoading = false;
      
      // Redirect to dashboard after a successful submission
      setTimeout(() => {
        this.router.navigate(['/client/']);
      }, 2000);
      
    } catch (error) {
      this.isLoading = false;
      this.hasError = true;
      this.errorMessage = 'Erreur lors de la soumission du devis. Veuillez réessayer.';
      console.error('Error submitting devis', error);
    }
  }
  
  private validateForms(): boolean {
    // Validate vehicle form
    if (this.vehiculeForm.invalid) {
      this.hasError = true;
      this.errorMessage = 'Veuillez sélectionner ou renseigner un véhicule correctement.';
      return false;
    }
    
    // Validate devis form based on request types
    if (this.includeProblem) {
      if (!this.devisForm.get('description')?.value) {
        this.hasError = true;
        this.errorMessage = 'Veuillez décrire votre problème.';
        return false;
      }
    }
    
    if (this.includeServices) {
      // Validate services
      const hasSelectedService = this.availableServices.some(service => service.selected);
      if (!hasSelectedService) {
        this.hasError = true;
        this.errorMessage = 'Veuillez sélectionner au moins un service.';
        return false;
      }
    }
    
    return true;
  }

  resetError(): void {
    this.hasError = false;
    this.errorMessage = '';
  }

  // Méthode pour obtenir l'icône appropriée pour chaque problème
  getProblemIcon(problem: any): string {
    // Si le problème est sélectionné, afficher une icône de vérification
    if (problem.selected) {
      return 'fa-check-circle';
    }
    
    // Sinon, retourner une icône spécifique en fonction du type de problème
    switch (problem.id) {
      case 'battery':
        return 'fa-car-battery';
      case 'engine':
        return 'fa-cogs';
      case 'brakes':
        return 'fa-brake-warning';
      case 'suspension':
        return 'fa-car-side';
      case 'transmission':
        return 'fa-cog';
      case 'electrical':
        return 'fa-bolt';
      case 'cooling':
        return 'fa-temperature-low';
      default:
        return 'fa-wrench';
    }
  }

  toggleVehiculeSelection(vehiculeId: string | undefined): void {
    if (!vehiculeId) return; // Ignorer si l'ID est undefined
    
    const currentSelection = this.vehiculeForm.get('vehiculeId')?.value;
    
    if (currentSelection === vehiculeId) {
      // Si le même véhicule est cliqué à nouveau, le désélectionner
      this.vehiculeForm.patchValue({vehiculeId: ''});
    } else {
      // Sinon, sélectionner le nouveau véhicule
      this.vehiculeForm.patchValue({vehiculeId: vehiculeId});
      this.isNewVehicule = vehiculeId === 'new';
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Obtenir la position de défilement
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // Vérifier si la barre doit être sticky (après avoir défilé au-delà de 20px)
    this.isProgressBarSticky = scrollPosition > 20;
    
    // Mettre à jour le style CSS pour ajuster la position du récapitulatif
    const progressBar = document.querySelector('.progress-indicator');
    if (progressBar && this.isProgressBarSticky) {
      const progressBarHeight = progressBar.clientHeight;
      const style = document.createElement('style');
      style.innerHTML = `
        .progress-indicator.sticky ~ .devis-layout .summary-sidebar {
          top: calc(2rem + ${progressBarHeight}px + 20px);
        }
      `;
      
      // Supprimer l'ancien style s'il existe
      const oldStyle = document.getElementById('progress-style');
      if (oldStyle) {
        oldStyle.remove();
      }
      
      // Ajouter le nouveau style
      style.id = 'progress-style';
      document.head.appendChild(style);
    }
  }
} 