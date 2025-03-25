import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DevisService } from '../../../services/devis/devis.service';
import { Devis, DevisItem } from '../../../models/devis.model';
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

  // Filtres pour les todos
  filterType: 'tous' | 'piece' | 'service' | 'main_oeuvre' | 'autre' = 'tous';
  filterStatus: 'tous' | 'completed' | 'pending' = 'tous';
  filterPriority: 'tous' | 'basse' | 'moyenne' | 'haute' = 'tous';

  // Données mockées
  mockElements: Element[] = [
    { nom: 'Filtre à huile', quantite: 1, prixUnitaire: 25.00 },
    { nom: 'Plaquettes de frein', quantite: 2, prixUnitaire: 45.00 },
    { nom: 'Huile moteur', quantite: 1, prixUnitaire: 35.00 }
  ];

  mockServices: Service[] = [
    { nom: 'Diagnostic', prix: 50.00 },
    { nom: 'Vidange', prix: 25.00 }
  ];

  mockMecaniciens: Mecanicien[] = [
    { id: '1', nom: 'Dupont', prenom: 'Jean', specialite: 'Moteur', tauxHoraire: 45, tempsEstime: 2.5 },
    { id: '2', nom: 'Martin', prenom: 'Pierre', specialite: 'Carrosserie', tauxHoraire: 40, tempsEstime: 1.5 },
    { id: '3', nom: 'Bernard', prenom: 'Marie', specialite: 'Électronique', tauxHoraire: 50, tempsEstime: 3 }
  ];

  mecaniciensSelectionnes: Mecanicien[] = [];

  mockMessages: Message[] = [
    { contenu: 'Bonjour, j\'ai un problème avec mes freins qui font un bruit étrange.', date: new Date('2024-03-20T10:30:00'), type: 'client' },
    { contenu: 'Bonjour, je vais examiner votre véhicule et vous faire un devis détaillé.', date: new Date('2024-03-20T10:35:00'), type: 'manager' },
    { contenu: 'D\'accord, merci. Pouvez-vous me dire approximativement combien de temps ça va prendre ?', date: new Date('2024-03-20T10:40:00'), type: 'client' }
  ];

  // Items mockés (pièces et services sous forme de todos)
  mockItems: DevisItem[] = [
    { 
      nom: 'Filtre à huile', 
      type: 'piece', 
      quantite: 1, 
      prixUnitaire: 25.00,
      completed: false,
      priorite: 'haute'
    },
    { 
      nom: 'Plaquettes de frein', 
      type: 'piece', 
      quantite: 2, 
      prixUnitaire: 45.00,
      completed: false,
      priorite: 'moyenne',
      note: 'Côté avant uniquement'
    },
    { 
      nom: 'Huile moteur 5W30', 
      type: 'piece', 
      quantite: 5, 
      prixUnitaire: 12.00,
      completed: true,
      priorite: 'haute'
    },
    { 
      nom: 'Vidange', 
      type: 'service', 
      quantite: 1, 
      prixUnitaire: 40.00,
      completed: false,
      priorite: 'haute'
    },
    { 
      nom: 'Diagnostic électronique', 
      type: 'service', 
      quantite: 1, 
      prixUnitaire: 50.00,
      completed: true,
      priorite: 'basse'
    },
    { 
      nom: 'Main d\'oeuvre mécanicien', 
      type: 'main_oeuvre', 
      quantite: 2, 
      prixUnitaire: 45.00,
      completed: false,
      priorite: 'moyenne'
    }
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
    
    // Initialiser le formulaire avec les éléments mockés
    this.initElementsForm();
    this.initTodoItemsForm();
  }

  // Getters pour accéder facilement au FormArray
  get elementsArray(): FormArray {
    return this.elementsForm.get('elements') as FormArray;
  }

  // Initialiser le formulaire avec les éléments mockés
  initElementsForm(): void {
    // Vider le FormArray
    while (this.elementsArray.length) {
      this.elementsArray.removeAt(0);
    }
    
    // Ajouter les éléments mockés
    this.mockElements.forEach(element => {
      this.elementsArray.push(this.createElementFormGroup(element));
    });
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

  toggleChat(): void {
    this.isChatVisible = !this.isChatVisible;
  }

  sendToClient(): void {
    // Cette méthode sera implémentée plus tard avec le backend
    console.log('Envoi du devis au client');
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

  // Initialiser le formulaire des todos
  initTodoItemsForm(): void {
    // Vider le FormArray
    while (this.todoItemsArray.length) {
      this.todoItemsArray.removeAt(0);
    }
    
    // Ajouter les items mockés
    this.mockItems.forEach(item => {
      this.todoItemsArray.push(this.createTodoItemFormGroup(item));
    });
  }

  // Getter pour accéder au FormArray des todos
  get todoItemsArray(): FormArray {
    return this.todoItemsForm.get('items') as FormArray;
  }

  // Créer un FormGroup pour un nouvel item todo
  createTodoItemFormGroup(item?: DevisItem): FormGroup {
    return this.fb.group({
      _id: [item?._id || null],
      nom: [item?.nom || '', Validators.required],
      type: [item?.type || 'piece', Validators.required],
      quantite: [item?.quantite || 1, [Validators.required, Validators.min(1)]],
      prixUnitaire: [item?.prixUnitaire || 0, [Validators.required, Validators.min(0)]],
      completed: [item?.completed || false],
      priorite: [item?.priorite || 'moyenne'],
      note: [item?.note || ''],
      mecanicienId: [item?.mecanicienId || null],
      tauxStandard: [item?.tauxStandard || 0]
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
  
  // Obtenir le mécanicien avec l'ID spécifié
  getMecanicienById(id: string): Mecanicien | undefined {
    return this.mockMecaniciens.find(m => m.id === id);
  }

  // Sauvegarder les modifications d'un item
  saveTodoItem(): void {
    if (this.editingItemIndex !== null) {
      const item = this.todoItemsArray.at(this.editingItemIndex);
      
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
      total += item.quantite * item.prixUnitaire;
    }
    return total;
  }

  // Calculer le total des éléments todos par type
  calculerTotalParType(type: 'piece' | 'service' | 'main_oeuvre' | 'autre'): number {
    let total = 0;
    for (let i = 0; i < this.todoItemsArray.length; i++) {
      const item = this.todoItemsArray.at(i).value;
      if (item.type === type) {
        total += item.quantite * item.prixUnitaire;
      }
    }
    return total;
  }
} 