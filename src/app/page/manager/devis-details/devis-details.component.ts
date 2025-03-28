import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DevisService } from '../../../services/devis/devis.service';
import { Devis, DevisItem, ServiceChoisi, PackChoisi } from '../../../models/devis.model';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

interface Element {
  nom: string;
  quantite: number;
  prixUnitaire: number;
}

interface Service {
  nom: string;
  prix: number;
}

interface Message {
  contenu: string;
  date: Date;
  type: 'client' | 'manager';
}

interface Mecanicien {
  id: string;
  nom: string;
  prenom: string;
  specialite: string;
  tauxHoraire: number;
  tempsEstime: number;
}

@Component({
  selector: 'app-devis-details',
  templateUrl: './devis-details.component.html',
  styleUrls: ['./devis-details.component.css']
})
export class DevisDetailsComponent implements OnInit {
  devis: Devis | null = null;
  loading: boolean = true;
  error: string | null = null;
  isChatVisible = false;
  elementsForm: FormGroup;
  todoItemsForm: FormGroup;
  
  // Propriétés pour la gestion de la date d'intervention
  isEditingDate = false;
  dateInputValue = '';
  private originalDate: Date | null = null;

  // Filtres pour les todos
  filterType: 'tous' | 'piece' | 'service' | 'main_oeuvre' | 'autre' = 'tous';
  filterStatus: 'tous' | 'completed' | 'pending' = 'tous';
  filterPriority: 'tous' | 'basse' | 'moyenne' | 'haute' = 'tous';

  mockMecaniciens: Mecanicien[] = [
    { id: '1', nom: 'Dupont', prenom: 'Jean', specialite: 'Moteur', tauxHoraire: 45, tempsEstime: 2.5 },
    { id: '2', nom: 'Martin', prenom: 'Pierre', specialite: 'Carrosserie', tauxHoraire: 40, tempsEstime: 1.5 },
    { id: '3', nom: 'Bernard', prenom: 'Marie', specialite: 'Électronique', tauxHoraire: 50, tempsEstime: 3 }
  ];

  // Tableau vide pour les mécaniciens sélectionnés
  mecaniciensSelectionnes: Mecanicien[] = [];

  mockMessages: Message[] = [
    { contenu: 'Bonjour, j\'ai un problème avec mes freins qui font un bruit étrange.', date: new Date('2024-03-20T10:30:00'), type: 'client' },
    { contenu: 'Bonjour, je vais examiner votre véhicule et vous faire un devis détaillé.', date: new Date('2024-03-20T10:35:00'), type: 'manager' },
    { contenu: 'D\'accord, merci. Pouvez-vous me dire approximativement combien de temps ça va prendre ?', date: new Date('2024-03-20T10:40:00'), type: 'client' }
  ];


  // Propriété pour suivre l'élément en cours d'édition
  editingItemIndex: number | null = null;

  // Propriétés pour gérer le mécanicien sélectionné et son taux horaire
  selectedMecanicienId: string | null = null;
  originalHourlyRate: number = 0;
  hourlyRateDiff: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private devisService: DevisService,
    private fb: FormBuilder
  ) {
    this.elementsForm = this.fb.group({
      elements: this.fb.array([])
    });

    this.todoItemsForm = this.fb.group({
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDevisDetails(id);
    }
  }

  // Getters pour accéder facilement au FormArray
  get elementsArray(): FormArray {
    return this.elementsForm.get('elements') as FormArray;
  }


  // Créer un FormGroup pour un nouvel élément
  createElementFormGroup(element?: Element): FormGroup {
    return this.fb.group({
      nom: [element?.nom || '', Validators.required],
      quantite: [element?.quantite || 1, [Validators.required, Validators.min(1)]],
      prixUnitaire: [element?.prixUnitaire || 0, [Validators.required, Validators.min(0)]]
    });
  }

  // Ajouter un nouvel élément vide
  ajouterElement(): void {
    this.elementsArray.push(this.createElementFormGroup());
  }

  // Supprimer un élément à un index donné
  supprimerElement(index: number): void {
    this.elementsArray.removeAt(index);
  }

  // Calculer le total des éléments
  calculerTotalElements(): number {
    let total = 0;
    for (let i = 0; i < this.elementsArray.length; i++) {
      const element = this.elementsArray.at(i).value;
      total += element.quantite * element.prixUnitaire;
    }
    return total;
  }

  loadDevisDetails(id: string): void {
    this.loading = true;
    this.error = null;

    this.devisService.getDevisById(id).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.devis = response.data;
          
          // Initialiser les todos avec les données réelles du devis
          if (this.devis) {
            // Ajouter les services et packs choisis à la liste des items
            this.convertirServicesEtPacksEnItems();
            
            // Les champs photoUrl et secondPhotoUrl sont déjà ajoutés par la fonction mapDevisDTOToDevis
          }
        } else {
          this.error = 'Format de données invalide';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du devis', err);
        this.error = 'Erreur lors du chargement du devis';
        this.loading = false;
      }
    });
  }

  // Méthode pour convertir les services et packs choisis en items de devis
  convertirServicesEtPacksEnItems(): void {
    if (!this.devis) return;
    
    // Vider le FormArray
    while (this.todoItemsArray.length) {
      this.todoItemsArray.removeAt(0);
    }
    
    // Convertir les services choisis en items
    if (this.devis.servicesChoisis && this.devis.servicesChoisis.length > 0) {
      this.devis.servicesChoisis.forEach(serviceChoisi => {
        const service = serviceChoisi.service;
        const devisItem: DevisItem = {
          _id: serviceChoisi._id,
          nom: service.name,
          type: 'service',
          quantite: 0, // Pour service, c'est un forfait
          prixUnitaire: service.prix,
          completed: false,
          priorite: this.convertirPriorite(serviceChoisi.priorite),
          note: serviceChoisi.note || '',
          estPreselectionne: true
        };
        
        this.todoItemsArray.push(this.createTodoItemFormGroup(devisItem));
      });
    }
    
    // Convertir les packs choisis en items
    if (this.devis.packsChoisis && this.devis.packsChoisis.length > 0) {
      this.devis.packsChoisis.forEach(packChoisi => {
        const pack = packChoisi.servicePack;
        
        // Essayer de calculer un prix pour le pack
        // Normalement, ce prix devrait être fourni par l'API
        let prix = 0;
        
        // Comme on n'a pas le prix du pack dans l'API, on pourrait le calculer à partir des services
        // ou utiliser un prix par défaut. Pour l'instant, on met un prix de base fixe à 100
        prix = 10000; // 100 euros en centimes, à adapter selon votre système de prix
        
        const devisItem: DevisItem = {
          _id: packChoisi._id,
          nom: `Pack: ${pack.name}`,
          type: 'service',
          quantite: 0, // Pour service, c'est un forfait
          prixUnitaire: prix,
          completed: false,
          priorite: this.convertirPriorite(packChoisi.priorite),
          note: packChoisi.note || '',
          estPreselectionne: true
        };
        
        this.todoItemsArray.push(this.createTodoItemFormGroup(devisItem));
      });
    }
    
    // Ajouter les lignes supplémentaires s'il y en a
    if (this.devis.lignesSupplementaires && this.devis.lignesSupplementaires.length > 0) {
      this.devis.lignesSupplementaires.forEach(ligne => {
        const devisItem: DevisItem = {
          _id: ligne._id,
          nom: ligne.designation || 'Ligne supplémentaire',
          type: ligne.typeElement || 'piece',
          quantite: ligne.quantite || 1,
          prixUnitaire: ligne.prixUnitaire || 0,
          completed: ligne.completed || false,
          priorite: this.convertirPriorite(ligne.priorite),
          note: ligne.description || ''
        };
        
        this.todoItemsArray.push(this.createTodoItemFormGroup(devisItem));
      });
    }
    
    // Si on a des mécaniciens assignés, ajouter leurs lignes de main d'œuvre
    if (this.devis.mecaniciensTravaillant && this.devis.mecaniciensTravaillant.length > 0) {
      this.devis.mecaniciensTravaillant.forEach(mecTravail => {
        const mecanicien = mecTravail.mecanicien;
        if (mecanicien) {
          const devisItem: DevisItem = {
            _id: mecTravail._id,
            nom: `Main d'œuvre - ${mecanicien.prenom} ${mecanicien.nom}`,
            type: 'main_oeuvre',
            quantite: mecTravail.tempsEstime || 1,
            prixUnitaire: mecTravail.tauxHoraire || 0,
            completed: false,
            priorite: 'moyenne',
            mecanicienId: mecanicien._id
          };
          
          this.todoItemsArray.push(this.createTodoItemFormGroup(devisItem));
        }
      });
    }
  }
  
  // Méthode pour convertir la priorité du format API vers le format du modèle DevisItem
  convertirPriorite(priorite?: string): 'basse' | 'moyenne' | 'haute' {
    if (!priorite) return 'moyenne';
    
    switch(priorite.toLowerCase()) {
      case 'haute':
      case 'urgente':
      case 'critical':
        return 'haute';
      case 'basse':
      case 'faible':
      case 'low':
        return 'basse';
      case 'normale':
      case 'medium':
      case 'moyenne':
      default:
        return 'moyenne';
    }
  }

  toggleChat(): void {
    this.isChatVisible = !this.isChatVisible;
  }

  sendToClient(): void {
    if (!this.devis || !this.devis._id) {
      this.error = "Impossible d'envoyer le devis, identifiant manquant";
      return;
    }
    
    // Préparer les données à envoyer
    const devisData = {
      _id: this.devis._id,
      items: this.todoItemsArray.getRawValue(),
      total: this.calculerTotalTodos(),
      status: 'envoye'
    };
    
    // Appeler le service pour envoyer le devis au client
    this.devisService.sendDevisToClient(this.devis._id, devisData).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          // Mise à jour du statut local
          if (this.devis) {
            this.devis.status = 'envoye';
          }
          
          // Afficher un message de succès (à implémenter selon votre UI)
          alert('Devis envoyé au client avec succès!');
        } else {
          this.error = response?.message || 'Erreur lors de l\'envoi du devis';
        }
      },
      error: (error: Error) => {
        console.error('Erreur lors de l\'envoi du devis', error);
        this.error = 'Erreur lors de l\'envoi du devis au client';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/manager/devis']);
  }

  ajouterMecanicien(mecanicien: Mecanicien): void {
    if (!this.mecaniciensSelectionnes.find(m => m.id === mecanicien.id)) {
      this.mecaniciensSelectionnes.push({...mecanicien});
    }
  }

  retirerMecanicien(mecanicienId: string): void {
    this.mecaniciensSelectionnes = this.mecaniciensSelectionnes.filter(m => m.id !== mecanicienId);
  }

  calculerTotalMainOeuvre(): number {
    return this.mecaniciensSelectionnes.reduce((total, mecanicien) => {
      return total + (mecanicien.tauxHoraire * mecanicien.tempsEstime);
    }, 0);
  }

  // Getter pour accéder au FormArray des todos
  get todoItemsArray(): FormArray {
    return this.todoItemsForm.get('items') as FormArray;
  }

  // Créer un FormGroup pour un nouvel item todo
  createTodoItemFormGroup(item?: DevisItem): FormGroup {
    // Définir des valeurs par défaut en fonction du type
    let defaultQuantite = 1;
    let defaultType = item?.type || 'piece';
    
    // Si c'est un service, la quantité par défaut est 0 (forfait)
    if (defaultType === 'service' && !item) {
      defaultQuantite = 0;
    }
    
    return this.fb.group({
      _id: [item?._id || null],
      nom: [item?.nom || '', Validators.required],
      type: [defaultType, Validators.required],
      quantite: [item?.quantite !== undefined ? item.quantite : defaultQuantite, [Validators.required, Validators.min(0)]],
      prixUnitaire: [item?.prixUnitaire || 0, [Validators.required, Validators.min(0)]],
      completed: [item?.completed || false],
      priorite: [item?.priorite || 'moyenne'],
      note: [item?.note || ''],
      mecanicienId: [item?.mecanicienId || null],
      tauxStandard: [item?.tauxStandard || 0],
      estPreselectionne: [item?.estPreselectionne || false]
    });
  }

  // Ajouter un nouvel item todo et le mettre immédiatement en mode édition
  ajouterTodoItem(): void {
    const newIndex = this.todoItemsArray.length;
    this.todoItemsArray.push(this.createTodoItemFormGroup());
    this.editingItemIndex = newIndex;
    
    // Réinitialiser les propriétés liées au mécanicien
    this.selectedMecanicienId = null;
    this.originalHourlyRate = 0;
    this.hourlyRateDiff = 0;
  }
  
  // Activer le mode édition pour un item
  editTodoItem(index: number): void {
    this.editingItemIndex = index;
    
    // Réinitialiser les propriétés liées au mécanicien
    this.selectedMecanicienId = null;
    this.originalHourlyRate = 0;
    this.hourlyRateDiff = 0;
    
    // Si c'est un élément de type main d'oeuvre, récupérer les valeurs sauvegardées
    const item = this.todoItemsArray.at(index).value;
    if (item.type === 'main_oeuvre') {
      // Récupérer le taux horaire standard ou utiliser le prix unitaire comme fallback
      this.originalHourlyRate = item.tauxStandard || item.prixUnitaire;
      
      // Si un mécanicien était déjà sélectionné, le rétablir
      if (item.mecanicienId) {
        this.selectedMecanicienId = item.mecanicienId;
      }
      
      // Calculer la différence de taux
      this.hourlyRateDiff = item.prixUnitaire - this.originalHourlyRate;
    }
  }
  
  // Sélectionner un mécanicien pour l'élément en cours d'édition
  selectMecanicien(mecanicien: Mecanicien): void {
    if (this.editingItemIndex === null) return;
    
    this.selectedMecanicienId = mecanicien.id;
    this.originalHourlyRate = mecanicien.tauxHoraire;
    
    // Mettre à jour le formulaire avec le taux horaire du mécanicien
    const item = this.todoItemsArray.at(this.editingItemIndex);
    item.patchValue({
      nom: `Main d'œuvre - ${mecanicien.prenom} ${mecanicien.nom}`,
      prixUnitaire: mecanicien.tauxHoraire,
      mecanicienId: mecanicien.id,
      tauxStandard: mecanicien.tauxHoraire
    });
    
    // Calculer la différence de taux horaire
    this.updateHourlyRateDiff();
  }
  
  // Calculer la différence entre le taux horaire actuel et le taux original
  updateHourlyRateDiff(): void {
    if (this.editingItemIndex === null) return;
    
    const item = this.todoItemsArray.at(this.editingItemIndex);
    const currentRate = item.value.prixUnitaire;
    this.hourlyRateDiff = currentRate - this.originalHourlyRate;
  }
  
  // Mettre à jour la différence de taux horaire lorsque le taux change
  onHourlyRateChange(event: any): void {
    const value = parseFloat(event.target.value);
    if (!isNaN(value)) {
      this.updateHourlyRateDiff();
      
      // Si on est en train d'éditer un élément, mettre à jour le taux standard si nécessaire
      if (this.editingItemIndex !== null) {
        const item = this.todoItemsArray.at(this.editingItemIndex);
        if (item.value.type === 'main_oeuvre' && !item.value.tauxStandard && this.originalHourlyRate > 0) {
          item.patchValue({
            tauxStandard: this.originalHourlyRate
          });
        }
      }
    }
  }
  

  // Sauvegarder les modifications d'un item
  saveTodoItem(): void {
    if (this.editingItemIndex !== null) {
      const item = this.todoItemsArray.at(this.editingItemIndex);
      
      // Si c'est un service, définir la quantité à 0 pour indiquer un forfait
      if (item.value.type === 'service') {
        item.patchValue({
          quantite: 0
        });
      }
      
      // Si c'est un élément de type main d'oeuvre, sauvegarder les informations du mécanicien
      if (item.value.type === 'main_oeuvre') {
        // S'assurer que le taux standard est sauvegardé
        if (!item.value.tauxStandard && this.originalHourlyRate > 0) {
          item.patchValue({
            tauxStandard: this.originalHourlyRate
          });
        }
      }
    }
    
    this.editingItemIndex = null;
  }
  
  // Annuler l'édition d'un item
  cancelEditTodoItem(): void {
    // Si c'est un nouvel élément sans données significatives, le supprimer
    if (this.editingItemIndex !== null) {
      const item = this.todoItemsArray.at(this.editingItemIndex);
      const isEmpty = !item.value.nom && item.value.quantite === 1 && item.value.prixUnitaire === 0;
      
      if (isEmpty) {
        this.todoItemsArray.removeAt(this.editingItemIndex);
      }
    }
    
    this.editingItemIndex = null;
  }

  // Supprimer un item todo à un index donné
  supprimerTodoItem(index: number): void {
    this.todoItemsArray.removeAt(index);
    
    // Si l'élément supprimé était en cours d'édition, réinitialiser l'index d'édition
    if (this.editingItemIndex === index) {
      this.editingItemIndex = null;
    } else if (this.editingItemIndex !== null && this.editingItemIndex > index) {
      // Si l'élément supprimé était avant l'élément en cours d'édition, ajuster l'index
      this.editingItemIndex--;
    }
  }

  // Changer le statut d'un item todo
  toggleCompleted(index: number): void {
    const item = this.todoItemsArray.at(index);
    item.patchValue({
      completed: !item.value.completed
    });
  }

  // Filtrer les items todos selon les critères
  filteredTodoItems(): FormGroup[] {
    return this.todoItemsArray.controls.filter(control => {
      const item = control.value;
      
      // Filtre par type
      if (this.filterType !== 'tous' && item.type !== this.filterType) {
        return false;
      }
      
      // Filtre par statut
      if (this.filterStatus === 'completed' && !item.completed) {
        return false;
      }
      if (this.filterStatus === 'pending' && item.completed) {
        return false;
      }
      
      // Filtre par priorité
      if (this.filterPriority !== 'tous' && item.priorite !== this.filterPriority) {
        return false;
      }
      
      return true;
    }) as FormGroup[];
  }

  // Mettre à jour le filtre de type
  updateTypeFilter(type: 'tous' | 'piece' | 'service' | 'main_oeuvre' | 'autre'): void {
    this.filterType = type;
  }

  // Mettre à jour le filtre de statut
  updateStatusFilter(status: 'tous' | 'completed' | 'pending'): void {
    this.filterStatus = status;
  }

  // Mettre à jour le filtre de priorité
  updatePriorityFilter(priority: 'tous' | 'basse' | 'moyenne' | 'haute'): void {
    this.filterPriority = priority;
  }

  // Calculer le total des éléments todos
  calculerTotalTodos(): number {
    let total = 0;
    for (let i = 0; i < this.todoItemsArray.length; i++) {
      const item = this.todoItemsArray.at(i).value;
      
      // Pour les services avec quantité 0, le prix unitaire est le prix forfaitaire total
      if (item.type === 'service' && item.quantite === 0) {
        total += item.prixUnitaire;
      } else {
        total += item.quantite * item.prixUnitaire;
      }
    }
    return total;
  }

  // Calculer le total des éléments todos par type
  calculerTotalParType(type: 'piece' | 'service' | 'main_oeuvre' | 'autre'): number {
    let total = 0;
    for (let i = 0; i < this.todoItemsArray.length; i++) {
      const item = this.todoItemsArray.at(i).value;
      if (item.type === type) {
        // Pour les services avec quantité 0, le prix unitaire est le prix forfaitaire total
        if (type === 'service' && item.quantite === 0) {
          total += item.prixUnitaire;
        } else {
          total += item.quantite * item.prixUnitaire;
        }
      }
    }
    return total;
  }

  // Méthodes pour gérer la date d'intervention souhaitée
  startEditDate(): void {
    this.isEditingDate = true;
    this.originalDate = this.devis?.preferredDate || null;
    
    // Formater la date pour l'input de type date (YYYY-MM-DD)
    if (this.devis?.preferredDate) {
      const date = new Date(this.devis.preferredDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      this.dateInputValue = `${year}-${month}-${day}`;
    } else {
      // Si pas de date, utiliser la date actuelle
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      this.dateInputValue = `${year}-${month}-${day}`;
    }
  }
  
  onDateChange(dateString: string): void {
    this.dateInputValue = dateString;
  }
  
  savePreferredDate(): void {
    if (this.devis && this.dateInputValue) {
      this.devis.preferredDate = new Date(this.dateInputValue);
    }
    this.isEditingDate = false;
    
    // En production, appeler le service pour mettre à jour la date sur le serveur
    // this.devisService.updatePreferredDate(this.devis._id, this.devis.preferredDate)...
  }
  
  cancelEditDate(): void {
    // Restaurer la date originale
    if (this.devis) {
      if (this.originalDate) {
        this.devis.preferredDate = this.originalDate;
      } else {
        this.devis.preferredDate = undefined;
      }
    }
    this.isEditingDate = false;
  }
  
  removePreferredDate(): void {
    if (this.devis) {
      this.devis.preferredDate = undefined;
    }
    
    // En production, appeler le service pour mettre à jour la date sur le serveur
    // this.devisService.updatePreferredDate(this.devis._id, null)...
  }

  // Méthode pour ouvrir l'image en plein écran dans un modal
  openImageModal(imageUrl: string): void {
    if (!imageUrl) return;
    
    // Récupérer toutes les URLs d'images disponibles
    const images = [this.devis?.photoUrl, this.devis?.secondPhotoUrl].filter(url => !!url) as string[];
    if (images.length === 0) return;
    
    // Trouver l'index de l'image actuelle
    let currentIndex = images.indexOf(imageUrl);
    if (currentIndex === -1) currentIndex = 0;
    
    // Créer un élément div pour le modal
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    
    // Ajouter des styles inline pour s'assurer que le modal s'affiche correctement
    Object.assign(modal.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10000'
    });
    
    // Créer l'élément image
    const img = document.createElement('img');
    img.src = images[currentIndex];
    img.className = 'modal-image';
    img.alt = 'Photo du problème';
    
    // Ajouter des styles inline pour l'image
    Object.assign(img.style, {
      maxWidth: '80%',
      maxHeight: '80%',
      objectFit: 'contain',
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
    });
    
    // Créer le bouton de fermeture
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      border: 'none',
      color: 'white',
      fontSize: '1.5rem',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    });
    
    // Ajouter les boutons de navigation si plus d'une image
    let prevBtn: HTMLButtonElement | null = null;
    let nextBtn: HTMLButtonElement | null = null;
    
    if (images.length > 1) {
      // Bouton précédent
      prevBtn = document.createElement('button');
      prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
      Object.assign(prevBtn.style, {
        position: 'absolute',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: 'none',
        color: 'white',
        fontSize: '1.5rem',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        visibility: currentIndex > 0 ? 'visible' : 'hidden'
      });
      
      // Bouton suivant
      nextBtn = document.createElement('button');
      nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
      Object.assign(nextBtn.style, {
        position: 'absolute',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: 'none',
        color: 'white',
        fontSize: '1.5rem',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        visibility: currentIndex < images.length - 1 ? 'visible' : 'hidden'
      });
      
      modal.appendChild(prevBtn);
      modal.appendChild(nextBtn);
    }
    
    // Ajouter les éléments au modal
    modal.appendChild(img);
    modal.appendChild(closeBtn);
    
    // Ajouter le modal au body
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Fonction pour mettre à jour l'image
    const updateImage = (newIndex: number) => {
      if (newIndex >= 0 && newIndex < images.length) {
        currentIndex = newIndex;
        img.src = images[currentIndex];
        
        // Mettre à jour la visibilité des boutons de navigation
        if (prevBtn) prevBtn.style.visibility = currentIndex > 0 ? 'visible' : 'hidden';
        if (nextBtn) nextBtn.style.visibility = currentIndex < images.length - 1 ? 'visible' : 'hidden';
      }
    };
    
    // Fonction pour fermer le modal
    const closeModal = () => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
        document.removeEventListener('keydown', keyHandler);
      }
    };
    
    // Événements pour les boutons
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });
    
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateImage(currentIndex - 1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateImage(currentIndex + 1);
      });
    }
    
    // Empêcher la fermeture du modal lors du clic sur l'image
    img.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Fermer le modal lors du clic en dehors
    modal.addEventListener('click', closeModal);
    
    // Gérer les événements clavier
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        updateImage(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        updateImage(currentIndex + 1);
      }
    };
    
    document.addEventListener('keydown', keyHandler);
  }

  // Méthode pour ajouter les services présélectionnés à la liste des éléments
  ajouterServicesPreselectionnes(): void {
    if (!this.devis?.servicesPreselectionnes?.length) return;
    
    // Convertir les services présélectionnés en items de devis
    const servicesItems = this.devis.servicesPreselectionnes.map(service => {
      // Pour les services, on n'utilise pas de prix unitaire mais un prix forfaitaire
      const isService = service.type === 'service';
      
      return {
        nom: service.type === 'pack' ? `Pack: ${service.nom}` : service.nom,
        type: 'service' as 'piece' | 'service' | 'main_oeuvre' | 'autre',
        // Pour les services, la quantité est 0 (forfait sans prix unitaire)
        quantite: isService ? 0 : 1,
        // Pour les services, le prix total est stocké dans prixUnitaire si la quantité est 0
        prixUnitaire: service.prix,
        completed: false,
        priorite: 'haute' as 'basse' | 'moyenne' | 'haute',
        note: isService 
          ? `Prix forfaitaire: ${service.prix}€${service.description ? ' - ' + service.description : ''}`
          : service.description || '',
        estPreselectionne: true
      } as DevisItem;
    });
    
    // Ajouter les items au FormArray des todos
    servicesItems.forEach(item => {
      this.todoItemsArray.push(this.createTodoItemFormGroup(item));
    });
  }

  // Calculer le prix d'un pack
  getPrixPack(packChoisi: any): number {
    if (!packChoisi) return 0;
    
    // Dans une implémentation réelle, il faudrait calculer le prix 
    // en fonction des services contenus dans le pack et de la remise
    const prixBase = 10000; // Prix de base fixe à 100 euros (en centimes)
    
    // Appliquer la remise si elle existe
    if (packChoisi.servicePack.remise) {
      return prixBase * (1 - packChoisi.servicePack.remise / 100);
    }
    
    return prixBase;
  }

  // Méthode pour ouvrir le chat avec un message concernant un service présélectionné
  discuterAvecClient(serviceOuPack: any, isPack: boolean = false): void {
    // Ouvrir le chat s'il n'est pas déjà visible
    if (!this.isChatVisible) {
      this.toggleChat();
    }
    
    // Préparer le message en fonction du type d'objet
    let message: string;
    
    if (isPack) {
      // Pour un pack
      message = `Je souhaite discuter avec vous concernant le pack "${serviceOuPack.servicePack.name}" que vous avez sélectionné. Avez-vous des questions ou des besoins spécifiques à ce sujet ?`;
    } else {
      // Pour un service
      message = `Je souhaite discuter avec vous concernant le service "${serviceOuPack.service.name}" que vous avez sélectionné. Avez-vous des questions ou des besoins spécifiques à ce sujet ?`;
    }
    
    // Ajouter le message dans le chat
    const chatMessage = {
      contenu: message,
      date: new Date(),
      type: 'manager' as 'client' | 'manager'
    };
    
    this.mockMessages.push(chatMessage);
    
    // Faire défiler jusqu'au dernier message
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  // Gérer le changement de type dans le formulaire d'édition
  onTypeChange(event: any): void {
    if (this.editingItemIndex === null) return;
    
    const item = this.todoItemsArray.at(this.editingItemIndex);
    const newType = event.target.value;
    
    // Si le type est changé en "service", mettre à jour la quantité à 0 (forfait)
    if (newType === 'service') {
      item.patchValue({
        quantite: 0
      });
    } 
    // Si le type est changé d'un "service" vers autre chose, remettre une quantité à 1
    else if (item.value.quantite === 0) {
      item.patchValue({
        quantite: 1
      });
    }
  }

  // Méthode pour mettre à jour le statut du devis
  updateDevisStatus(newStatus: string): void {
    if (!this.devis || !this.devis._id) {
      this.error = "Impossible de mettre à jour le statut, identifiant manquant";
      return;
    }
    
    const updateData = {
      status: newStatus
    };
    
    this.devisService.updateDevis(this.devis._id, updateData).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          // Mise à jour du statut local
          if (this.devis) {
            this.devis.status = newStatus;
          }
          
          // Afficher un message de succès
          alert(`Statut mis à jour : ${this.formatStatus(newStatus)}`);
        } else {
          this.error = response?.message || 'Erreur lors de la mise à jour du statut';
        }
      },
      error: (error: Error) => {
        console.error('Erreur lors de la mise à jour du statut', error);
        this.error = 'Erreur lors de la mise à jour du statut';
      }
    });
  }
  
  // Méthode pour formater l'affichage du statut
  formatStatus(status: string): string {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'envoye': return 'Envoyé';
      case 'accepte': return 'Accepté';
      case 'refuse': return 'Refusé';
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      default: return status;
    }
  }
  
  // Méthode pour sauvegarder toutes les modifications du devis
  saveDevis(): void {
    if (!this.devis || !this.devis._id) {
      this.error = "Impossible de sauvegarder le devis, identifiant manquant";
      return;
    }
    
    // Récupérer les données du formulaire
    const items = this.todoItemsArray.getRawValue();
    
    // Préparer les données à envoyer
    const updateData = {
      // Regrouper les items par type pour les envoyer au backend
      lignesSupplementaires: items.filter(item => item.type !== 'main_oeuvre')
        .map(item => ({
          _id: item._id,
          designation: item.nom,
          description: item.note,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
          typeElement: item.type,
          priorite: item.priorite,
          completed: item.completed
        })),
      // Gérer les mécaniciens séparément
      mecaniciensTravaillant: items.filter(item => item.type === 'main_oeuvre')
        .map(item => ({
          _id: item._id,
          mecanicien: item.mecanicienId,
          tempsEstime: item.quantite,
          tauxHoraire: item.prixUnitaire
        })),
      total: this.calculerTotalTodos()
    };
    
    this.devisService.updateDevis(this.devis._id, updateData).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          // Mise à jour des données locales
          if (this.devis) {
            this.devis.total = updateData.total;
          }
          
          // Afficher un message de succès
          alert('Devis sauvegardé avec succès!');
        } else {
          this.error = response?.message || 'Erreur lors de la sauvegarde du devis';
        }
      },
      error: (error: Error) => {
        console.error('Erreur lors de la sauvegarde du devis', error);
        this.error = 'Erreur lors de la sauvegarde du devis';
      }
    });
  }
} 