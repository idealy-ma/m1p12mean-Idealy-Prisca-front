import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Service } from '../../../models/service.model';
import { ServiceService } from '../../../services/service/service.service';

@Component({
  selector: 'app-add-service',
  templateUrl: './add-service.component.html',
  styleUrls: ['./add-service.component.css']
})
export class AddServiceComponent implements OnInit{
  serviceForm: FormGroup;
  packForm: FormGroup;
  serviceTypes: string[] = ['Standard', 'Premium'];
  activeTab: string = 'service'; // Par défaut, on affiche le formulaire "Créer un service"
  availableServices: Service[] = []; // Liste des services disponibles pour les packs
  selectedServices: string[] = []; // Stocker les services sélectionnés
  isLoadingService = false;
  isLoadingPack = false;

  constructor(private fb: FormBuilder, private serviceService: ServiceService) {
    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      prix: ['', [Validators.required, Validators.min(0)]],
      descri:[''],
    });
    

    this.packForm = this.fb.group({
      name: ['', Validators.required],
      remise: [0],
    });
  }
  ngOnInit(): void {
    this.loadServices();
    console.log('availableServices:', this.availableServices);

  }

  // Charger les services disponibles
  loadServices() {
    this.serviceService.getServices().subscribe({
      next: (services) => {
        this.availableServices = services;
      },
      error: (error) => console.error('Erreur lors du chargement des services', error)
    });
  }

  // Gérer la sélection des services pour le pack
  toggleServiceSelection(serviceId: string) {
    const index = this.selectedServices.indexOf(serviceId);
    if (index === -1) {
      this.selectedServices.push(serviceId);
    } else {
      this.selectedServices.splice(index, 1);
    }
  }
 // Soumettre le formulaire de service
 onSubmitService(): void {
  if (this.serviceForm.valid) {
    this.isLoadingService = true;
    const newService: Service = this.serviceForm.value;
    this.serviceService.createService(newService).subscribe({
      next: (response) => {
        alert('Service créé avec succès !');
        this.serviceForm.reset();
        this.loadServices(); // Recharger la liste après ajout
        this.isLoadingService = false;
      },
      error: (error) => {
        alert('Erreur lors de la création du service');
        console.error(error);
        this.isLoadingService = false;
      }
    });
  }
}

// Soumettre le formulaire de pack
onSubmitPack(): void {
  if (this.packForm.valid && this.selectedServices.length >= 2) {
    this.isLoadingPack = true;
    const newPack = {
      name: this.packForm.value.name,
      remise: this.packForm.value.remise,
      services: this.selectedServices,
    };

    this.serviceService.createServicePack(newPack).subscribe({
      next: (response) => {
        alert('Pack créé avec succès !');
        this.packForm.reset();
        this.selectedServices = [];
        this.isLoadingPack = false;
      },
      error: (error) => {
        alert('Erreur lors de la création du pack');
        console.error(error);
        this.isLoadingPack = false;
      }
    });
  } else {
    alert("Un pack doit contenir au moins 2 services.");
  }
}
}
