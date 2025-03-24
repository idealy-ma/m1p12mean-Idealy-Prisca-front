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
    
    this.devisForm.get('requestType')?.valueChanges.subscribe(value => {
      this.selectedRequestType = value;
      
      if (value === 'problem') {
        this.devisForm.get('description')?.setValidators([Validators.required]);
      } else {
        // For services, we'll validate later that at least one service is selected
        this.devisForm.get('description')?.clearValidators();
      }
      
      this.devisForm.get('description')?.updateValueAndValidity();
    });
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
    
    // If a service is selected, deselect related packs
    if (service.selected) {
      this.servicePacks.forEach(pack => {
        if (pack.services.includes(service.id)) {
          // Check if all services in the pack are selected
          const allSelected = pack.services.every(sId => 
            this.availableServices.find(s => s.id === sId)?.selected
          );
          
          if (!allSelected) {
            pack.selected = false;
          }
        }
      });
    }
  }

  togglePack(pack: any): void {
    pack.selected = !pack.selected;
    
    // If a pack is selected, select all its services
    if (pack.selected) {
      pack.services.forEach((serviceId: string) => {
        const service = this.availableServices.find(s => s.id === serviceId);
        if (service) {
          service.selected = true;
        }
      });
      
      // Deselect other packs
      this.servicePacks.forEach(p => {
        if (p.id !== pack.id) {
          p.selected = false;
        }
      });
    } else {
      // If pack is deselected, keep services selected
    }
  }

  calculateTotalPrice(): number {
    let total = 0;
    
    // If a pack is selected, use its price
    const selectedPack = this.servicePacks.find(p => p.selected);
    if (selectedPack) {
      total = selectedPack.price;
      
      // Add prices of services not in the pack
      this.availableServices.forEach(service => {
        if (service.selected && !selectedPack.services.includes(service.id)) {
          total += service.price;
        }
      });
    } else {
      // Otherwise add up all selected services
      this.availableServices.forEach(service => {
        if (service.selected) {
          total += service.price;
        }
      });
    }
    
    return total;
  }

  getSelectedServicesDescription(): string {
    const selectedServices = this.availableServices
      .filter(service => service.selected)
      .map(service => service.label);
    
    return selectedServices.join(', ');
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
        type: this.selectedRequestType
      };
      
      // Add type-specific fields
      if (this.selectedRequestType === 'problem') {
        devisData.description = this.devisForm.get('description')?.value;
        devisData.preferredDate = this.devisForm.get('preferredDate')?.value;
        devisData.photoUrl = this.devisForm.get('photoUrl')?.value;
      } else {
        // For services, include the selected services and total
        devisData.selectedServices = this.availableServices
          .filter(service => service.selected)
          .map(service => service.id);
        
        devisData.selectedPack = this.servicePacks.find(pack => pack.selected)?.id;
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
    
    // Validate devis form based on request type
    if (this.selectedRequestType === 'problem') {
      if (!this.devisForm.get('description')?.value) {
        this.hasError = true;
        this.errorMessage = 'Veuillez décrire votre problème.';
        return false;
      }
    } else {
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
    
    // Vérifier si la barre doit être sticky (après avoir défilé au-delà de 50px)
    this.isProgressBarSticky = scrollPosition > 50;
  }
} 