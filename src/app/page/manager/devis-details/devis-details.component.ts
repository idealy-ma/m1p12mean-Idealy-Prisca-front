import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DevisService } from '../../../services/devis/devis.service';
import { Devis } from '../../../models/devis.model';

interface Piece {
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

  // Données mockées
  mockPieces: Piece[] = [
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private devisService: DevisService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDevisDetails(id);
    }
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
} 