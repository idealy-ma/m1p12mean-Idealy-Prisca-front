import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DevisService } from '../../../services/devis/devis.service';
import { MecanicienService, Mecanicien } from '../../../services/mecanicien/mecanicien.service';
import { Devis, DevisItem, ServiceChoisi, PackChoisi } from '../../../models/devis.model';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Mecanicien as MecanicienModel } from '../../../models/mecanicien.model';
import { Mecanicien as MecanicienServiceModel } from '../../../services/mecanicien/mecanicien.service';
import { ChatService, ChatMessage } from '../../../services/chat/chat.service';
import { Subscription } from 'rxjs';

// Définir l'interface pour les données à envoyer
interface FinaliserDevisData {
  services: {
    service: string;
    prix: number;
    note?: string;
  }[];
  packs: {
    servicePack: string;
    prix: number;
  }[];
  lignesSupplementaires: {
    nom: string;
    prix: number;
    quantite: number;
    type: string;
  }[];
  mecaniciens: {
    mecanicien: string;
    heureDeTravail: number;
  }[];
  dateIntervention: Date;
}

interface Element {
  nom: string;
  quantite: number;
  prixUnitaire: number;
}

interface Service {
  nom: string;
  prix: number;
}

@Component({
  selector: 'app-devis-details',
  templateUrl: './devis-details.component.html',
  styleUrls: ['./devis-details.component.css']
})
export class DevisDetailsComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatMessagesContainer') private chatMessagesContainer: ElementRef | undefined;
  chatMessages: ChatMessage[] = [];
  newChatMessage: string = '';
  chatError: string | null = null;
  private chatSubscription: Subscription | undefined;
  private errorSubscription: Subscription | undefined;
  private devisId: string | null = null;

  devis: Devis | null = null;
  loading: boolean = true;
  error: string | null = null;
  isChatVisible = false;
  isSending: boolean = false;
  elementsForm: FormGroup;
  todoItemsForm: FormGroup;
  
  // Propriétés pour la gestion de la date d'intervention
  isEditingDate = false;
  dateInputValue = '';
  private originalDate: Date | null = null;

  // Propriété pour compter les mécaniciens non disponibles
  mecaniciensNonDisponiblesCount = 0;

  // Filtres pour les todos
  filterType: 'tous' | 'piece' | 'service' | 'main_oeuvre' | 'autre' = 'tous';
  filterStatus: 'tous' | 'completed' | 'pending' = 'tous';
  filterPriority: 'tous' | 'basse' | 'moyenne' | 'haute' = 'tous';

  // Remplacer mockMecaniciens par mecaniciens
  mecaniciens: MecanicienServiceModel[] = [];

  editingItemIndex: number | null = null;
  selectedMecanicienId: string | null = null;
  originalHourlyRate: number = 0;
  hourlyRateDiff: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private devisService: DevisService,
    private mecanicienService: MecanicienService,
    private fb: FormBuilder,
    private chatService: ChatService
  ) {
    this.elementsForm = this.fb.group({
      elements: this.fb.array([])
    });

    this.todoItemsForm = this.fb.group({
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.devisId = this.route.snapshot.paramMap.get('id');
    if (this.devisId) {
      this.loadDevisDetails(this.devisId);
      this.setupChat(this.devisId);
    } else {
      this.error = "ID de devis manquant dans l'URL.";
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.chatSubscription?.unsubscribe();
    this.errorSubscription?.unsubscribe();
    this.chatService.disconnect();
  }
  
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  setupChat(devisId: string): void {
    this.chatService.connect(devisId);

    this.chatService.loadInitialMessages(devisId).subscribe({
      next: (messages) => {
        this.chatMessages = messages;
        this.chatError = null;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error("Erreur chargement historique chat:", err);
        this.chatError = "Impossible de charger l'historique du chat.";
      }
    });

    this.chatSubscription = this.chatService.getMessages().subscribe((message) => {
      this.chatMessages.push(message);
      this.scrollToBottom();
    });

    this.errorSubscription = this.chatService.chatError$.subscribe(errorMsg => {
      this.chatError = errorMsg;
      console.error('Erreur ChatService:', errorMsg);
    });
  }

  sendChatMessage(): void {
    if (this.newChatMessage.trim() && this.devisId) {
      this.chatService.sendMessage(this.devisId, this.newChatMessage.trim());
      this.newChatMessage = '';
      this.chatError = null;
    } else if (!this.devisId) {
        this.chatError = "Impossible d'envoyer : ID du devis inconnu.";
    }
  }
  
  private scrollToBottom(): void {
    try {
        if (this.chatMessagesContainer) {
           this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
        }
    } catch(err) { 
        console.error("Erreur lors du défilement du chat:", err);
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
            
            // Charger les mécaniciens disponibles à la date d'intervention
            if (this.devis.preferredDate) {
              this.loadMecaniciensDisponibles();
            } else {
              // Si pas de date préférée, charger avec la date du jour
              this.loadMecaniciensDisponibles();
            }
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

  // Ajouter une méthode pour charger les mécaniciens disponibles
  loadMecaniciensDisponibles(dateStr?: string): void {
    // Si aucune date n'est fournie, utiliser la date d'intervention du devis
    // ou la date actuelle formatée en YYYY-MM-DD
    if (!dateStr && this.devis?.preferredDate) {
      const preferredDate = new Date(this.devis.preferredDate);
      dateStr = preferredDate.toISOString().split('T')[0];
    } else if (!dateStr) {
      const today = new Date();
      dateStr = today.toISOString().split('T')[0];
    }

    this.mecanicienService.getMecaniciensDisponibles(dateStr).subscribe({
      next: (mecaniciens) => {
        this.mecaniciens = mecaniciens;
        
        // Vérifier les mécaniciens déjà assignés et mettre à jour le compteur
        this.verifierMecaniciensAssignes(mecaniciens);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des mécaniciens disponibles', err);
        this.error = "Impossible de charger la liste des mécaniciens disponibles";
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
          _id: service._id,
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
          _id: pack._id,
          nom: `Pack: ${pack.name}`,
          type: 'pack',
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
          _id: ligne.id,
          nom: ligne.nom ?? '',
          type: ligne.type || 'piece',
          quantite: ligne.quantite ?? 0,
          prixUnitaire: ligne.prix ?? 0,
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
            quantite: mecTravail.heureDeTravail || 1,
            prixUnitaire: mecTravail.mecanicien.tarifHoraire || 0,
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

  goBack(): void {
    this.router.navigate(['/manager/devis']);
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
  
  // Méthode pour mettre à jour la différence de taux horaire lorsque le taux change
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
    
    if (this.devis?.preferredDate) {
      const date = new Date(this.devis.preferredDate);
      this.dateInputValue = date.toISOString().split('T')[0];
    } else {
      this.dateInputValue = '';
    }
    
    // Charger les mécaniciens disponibles à la date sélectionnée
    if (this.dateInputValue) {
      this.loadMecaniciensDisponibles(this.dateInputValue);
    }
  }
  
  onDateChange(event: any): void {
    this.dateInputValue = event;
    // Charger les mécaniciens disponibles à la nouvelle date
    this.loadMecaniciensDisponibles(this.dateInputValue);
  }
  
  savePreferredDate(): void {
    this.isEditingDate = false;
    if (this.devis && this.dateInputValue) {
      const previousDate = this.devis.preferredDate ? new Date(this.devis.preferredDate) : undefined;
      this.devis.preferredDate = new Date(this.dateInputValue);
      
      // Charger les mécaniciens disponibles à la nouvelle date
      this.mecanicienService.getMecaniciensDisponibles(this.dateInputValue).subscribe({
        next: (mecaniciens) => {
          this.mecaniciens = mecaniciens;
          
          // Vérifier les mécaniciens déjà assignés
          const mecaniciensNonDisponibles = this.verifierMecaniciensAssignes(mecaniciens);
          
          if (mecaniciensNonDisponibles.length > 0) {
            // Alerter l'utilisateur que certains mécaniciens ne sont plus disponibles
            const confirmation = confirm(`Attention : ${mecaniciensNonDisponibles.length} mécanicien(s) assigné(s) ne sont plus disponibles à cette nouvelle date. Souhaitez-vous conserver cette date et réassigner ces tâches à d'autres mécaniciens ?`);
            
            if (!confirmation) {
              // L'utilisateur refuse la nouvelle date, revenir à la date précédente
              this.devis!.preferredDate = previousDate;
              if (previousDate) {
                const dateStr = previousDate.toISOString().split('T')[0];
                this.loadMecaniciensDisponibles(dateStr);
              }
              return;
            }
            
            // L'utilisateur accepte, marquer visuellement les éléments à réaffecter
            mecaniciensNonDisponibles.forEach(index => {
              const item = this.todoItemsArray.at(index);
              item.patchValue({
                note: (item.value.note ? item.value.note + ' ' : '') + '[ATTENTION: Mécanicien non disponible à la nouvelle date]'
              });
            });
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement des mécaniciens disponibles', err);
          this.error = "Impossible de charger la liste des mécaniciens disponibles";
        }
      });
    }
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
  
  // Méthode pour vérifier les mécaniciens assignés
  private verifierMecaniciensAssignes(mecaniciens: MecanicienServiceModel[]): number[] {
    const mecaniciensNonDisponibles: number[] = [];
    
    // Parcourir tous les éléments de type main_oeuvre
    this.todoItemsArray.controls.forEach((control, index) => {
      const item = control.value;
      if (item.type === 'main_oeuvre' && item.mecanicienId) {
        // Vérifier si le mécanicien est dans la liste des disponibles
        const mecanicienDisponible = mecaniciens.some(m => m._id === item.mecanicienId);
        
        if (!mecanicienDisponible) {
          // Le mécanicien n'est pas disponible, l'ajouter à la liste
          mecaniciensNonDisponibles.push(index);
        } else {
          // Le mécanicien est disponible, vérifier s'il était marqué comme indisponible avant
          const note = item.note || '';
          if (note.includes('[ATTENTION: Mécanicien non disponible à la nouvelle date]')) {
            // Supprimer la note d'indisponibilité
            const newNote = note.replace('[ATTENTION: Mécanicien non disponible à la nouvelle date]', '').trim();
            control.get('note')?.setValue(newNote);
          }
        }
      }
    });
    
    // Mettre à jour le compteur global pour l'affichage de l'alerte
    this.mecaniciensNonDisponiblesCount = mecaniciensNonDisponibles.length;
    
    return mecaniciensNonDisponibles;
  }

  // Méthode pour mettre à jour la différence de taux horaire
  private updateHourlyRateDiff(): void {
    if (this.editingItemIndex === null) return;
    
    const item = this.todoItemsArray.at(this.editingItemIndex);
    const currentRate = item.value.prixUnitaire;
    this.hourlyRateDiff = currentRate - this.originalHourlyRate;
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
    console.log("Discuter à propos de:", serviceOuPack, "Est-ce un pack?", isPack);
    // Ouvrir le chat ou mettre en évidence l'élément dans le chat
    this.isChatVisible = true;
    
    let messageText = '';
    if (isPack) {
      messageText = `Parlons du pack: ${serviceOuPack.servicePack.name}`;
    } else {
      messageText = `Parlons du service: ${serviceOuPack.service.name}`;
    }
    
    // Créer un message avec la nouvelle interface ChatMessage
    // const chatMessage: ChatMessage = {
    //   senderName: 'Système', // Ou 'Manager'
    //   message: messageText,
    //   timestamp: new Date(),
    //   isMe: true // Indique que c'est un message généré localement
    // };
    
    // Commenter l'ajout direct pour l'instant, car sendChatMessage devrait être utilisé
    // this.chatMessages.push(chatMessage);
    
    // Faire défiler jusqu'au dernier message ou à la zone de saisie
    setTimeout(() => this.scrollToBottom(), 100);
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
      case 'accepte': return 'Accepté';
      case 'refuse': return 'Refusé';
      case 'termine': return 'Terminé'; // Assumer que 'termine' existe
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
    
    // Préparer les données selon le format attendu par l'API
    const devisData: FinaliserDevisData = {
      services: [],
      packs: [],
      lignesSupplementaires: [],
      mecaniciens: [],
      dateIntervention: this.devis.preferredDate || new Date()
    };

    // Récupérer les services du devis
    if (this.devis.servicesChoisis && this.devis.servicesChoisis.length > 0) {
      this.devis.servicesChoisis.forEach(service => {
        devisData.services.push({
          service: service.service._id || '',
          prix: service.service.prix,
          note: service.note
        });
      });
    }

    // Récupérer les packs du devis
    if (this.devis.packsChoisis && this.devis.packsChoisis.length > 0) {
      this.devis.packsChoisis.forEach(pack => {
        if (pack.servicePack?._id) {
          // Trouver le FormGroup correspondant dans todoItemsArray (si on veut utiliser son prix)
          const itemFormGroup = this.todoItemsArray.controls.find(ctrl => ctrl.value._id === pack._id && ctrl.value.type === 'pack');
          const prix = itemFormGroup ? itemFormGroup.value.prixUnitaire : this.getPrixPack(pack); // Fallback sur ancienne logique si besoin

          devisData.packs.push({
            servicePack: pack.servicePack._id,
            prix: prix // Utiliser le prix du FormGroup ou fallback
          });
        }
      });
    }

    // Récupérer les lignes supplémentaires
    items.forEach(item => {
      if (item.type !== 'main_oeuvre') {
        devisData.lignesSupplementaires.push({
          nom: item.nom,
          prix: item.prixUnitaire,
          quantite: item.quantite,
          type: item.type
        });
      }
    });

    // Récupérer les mécaniciens
    const mecanicienItems = items.filter(item => item.type === 'main_oeuvre' && item.mecanicienId);
    mecanicienItems.forEach(item => {
      devisData.mecaniciens.push({
        mecanicien: item.mecanicienId,
        heureDeTravail: item.quantite
      });
    });
    
    // Utiliser le même endpoint que sendToClient
    this.devisService.sendDevisToClient(this.devis._id, devisData).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          // Mise à jour des données locales
          if (this.devis) {
            this.devis = response.data;
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

  // Mettre à jour la méthode selectMecanicien pour utiliser le nouveau format de données
  selectMecanicien(mecanicien: MecanicienServiceModel): void {
    if (this.editingItemIndex === null) return;
    
    this.selectedMecanicienId = mecanicien._id;
    this.originalHourlyRate = mecanicien.tarifHoraire;
    
    // Mettre à jour le formulaire avec le taux horaire du mécanicien
    const item = this.todoItemsArray.at(this.editingItemIndex);
    item.patchValue({
      nom: `Main d'œuvre - ${mecanicien.prenom} ${mecanicien.nom}`,
      prixUnitaire: mecanicien.tarifHoraire,
      mecanicienId: mecanicien._id,
      tauxStandard: mecanicien.tarifHoraire
    });
    
    // Calculer la différence de taux horaire
    this.updateHourlyRateDiff();
  }

  // Méthode pour vérifier si un item a un mécanicien non disponible
  isMecanicienNonDisponible(index: number): boolean {
    if (this.todoItemsArray.length <= index) return false;
    
    const item = this.todoItemsArray.at(index).value;
    if (item.type !== 'main_oeuvre' || !item.mecanicienId) return false;
    
    // Vérifier si le mécanicien assigné est dans la liste des disponibles
    return !this.mecaniciens.some(m => m._id === item.mecanicienId);
  }

  // Méthode pour faire défiler vers les éléments avec des mécaniciens non disponibles
  scrollToMecaniciensNonDisponibles(): void {
    setTimeout(() => {
      const elements = document.querySelectorAll('.todo-warning');
      if (elements.length > 0) {
        elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  // Obtenir la liste des mécaniciens disponibles non assignés
  getMecaniciensDisponiblesNonAssignes(): MecanicienServiceModel[] {
    const mecanicienIdActuel = this.editingItemIndex !== null ? 
      this.todoItemsArray.at(this.editingItemIndex).value.mecanicienId : null;
    
    // Récupérer les IDs des mécaniciens déjà assignés (sauf celui de l'élément en cours d'édition)
    const mecaniciensAssignesIds: string[] = this.todoItemsArray.controls
      .filter(control => {
        const item = control.value;
        const indexControl = this.todoItemsArray.controls.indexOf(control);
        return item.type === 'main_oeuvre' && 
               item.mecanicienId && 
               // Ne pas filtrer le mécanicien de l'élément en cours d'édition
               (this.editingItemIndex === null || indexControl !== this.editingItemIndex);
      })
      .map(control => control.value.mecanicienId);
    
    // Retourner les mécaniciens qui ne sont pas déjà assignés à d'autres tâches
    return this.mecaniciens.filter(mecanicien => 
      !mecaniciensAssignesIds.includes(mecanicien._id)
    );
  }
} 