import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface Reparation {
  _id: string;
  vehicule: {
    marque: string;
    modele: string;
    immatricule: string;
    annee: number;
    kilometrage: number;
  };
  client: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
  status: 'en_attente' | 'en_cours' | 'en_pause' | 'termine' | 'annule';
  dateDebut?: Date;
  dateFin?: Date;
  description: string;
  etapes: {
    _id: string;
    nom: string;
    description: string;
    status: 'a_faire' | 'en_cours' | 'termine';
    dateDebut?: Date;
    dateFin?: Date;
    commentaires: CommentaireEtape[];
  }[];
  progression: number;
  photos: {
    _id: string;
    url: string;
    description: string;
    date: Date;
    type: string;
    etapeId?: string;
  }[];
  devis: {
    montant: number;
    date: Date;
    status: 'en_attente' | 'valide' | 'refuse';
  };
}

interface CommentaireEtape {
  _id: string;
  texte: string;
  date: Date;
  auteur: string;
  expanded?: boolean; // Propriété pour suivre l'état d'expansion
}

@Component({
  selector: 'app-reparation-details',
  templateUrl: './reparation-details.component.html',
  styleUrls: ['./reparation-details.component.css']
})
export class ReparationDetailsComponent implements OnInit {
  reparation: Reparation | null = null;
  loading: boolean = true;
  error: string | null = null;
  activeTab: string = 'etapes';
  newComment: string = '';
  newPhoto: File | null = null;
  photoDescription: string = '';
  photoType: string = 'probleme';
  photoEtapeId: string = '';
  filteredPhotos: any[] = [];
  photoFilterEtapeId: string = '';
  filterStatus: string = 'tous';
  commentairesVisibles: { [etapeId: string]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReparation(id);
    }
  }

  loadReparation(id: string): void {
    setTimeout(() => {
      this.reparation = {
        _id: id,
        vehicule: {
          marque: 'Renault',
          modele: 'Clio',
          immatricule: 'AB-123-CD',
          annee: 2018,
          kilometrage: 45000
        },
        client: {
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean.dupont@email.com',
          telephone: '06 12 34 56 78'
        },
        status: 'en_cours',
        dateDebut: new Date('2024-03-20'),
        description: 'Réparation suite à un problème de freinage. Le client a signalé des bruits inhabituels lors du freinage.',
        etapes: [
          {
            _id: '1',
            nom: 'Diagnostic initial',
            description: 'Vérification complète du système de freinage',
            status: 'termine',
            dateDebut: new Date('2024-03-20T09:00:00'),
            dateFin: new Date('2024-03-20T10:30:00'),
            commentaires: [
              {
                _id: '1',
                texte: 'Diagnostic terminé. Usure excessive des plaquettes de frein avant.',
                date: new Date('2024-03-20T10:30:00'),
                auteur: 'Mécanicien',
                expanded: false
              }
            ]
          },
          {
            _id: '2',
            nom: 'Remplacement des freins',
            description: 'Remplacement des plaquettes et des disques de frein avant',
            status: 'en_cours',
            dateDebut: new Date('2024-03-20T11:00:00'),
            commentaires: [
              {
                _id: '2',
                texte: 'Début du remplacement des plaquettes avant.',
                date: new Date('2024-03-20T11:00:00'),
                auteur: 'Mécanicien',
                expanded: false
              }
            ]
          },
          {
            _id: '3',
            nom: 'Vérification des niveaux',
            description: 'Contrôle des niveaux de liquide de frein',
            status: 'a_faire',
            commentaires: []
          },
          {
            _id: '4',
            nom: 'Test de route',
            description: 'Test de freinage sur route',
            status: 'a_faire',
            commentaires: []
          }
        ],
        progression: 25,
        photos: [
          {
            _id: '1',
            url: 'assets/mock/photos/freins1.jpg',
            description: 'État des plaquettes avant',
            date: new Date('2024-03-20T10:00:00'),
            type: 'probleme',
            etapeId: '1'
          }
        ],
        devis: {
          montant: 450.00,
          date: new Date('2024-03-20'),
          status: 'valide'
        }
      };
      
      if (this.reparation) {
        this.reparation.etapes.forEach(etape => {
          this.commentairesVisibles[etape._id] = false;
        });
        
        this.filteredPhotos = [...this.reparation.photos];
      }
      
      this.loading = false;
    }, 1000);
  }

  updateStatus(newStatus: string): void {
    if (this.reparation) {
      this.reparation.status = newStatus as Reparation['status'];
      if (newStatus === 'en_cours' && !this.reparation.dateDebut) {
        this.reparation.dateDebut = new Date();
      } else if (newStatus === 'termine') {
        this.reparation.dateFin = new Date();
      }
    }
  }

  updateEtapeStatus(etapeId: string, newStatus: string): void {
    if (this.reparation) {
      const etape = this.reparation.etapes.find(e => e._id === etapeId);
      if (etape) {
        etape.status = newStatus as 'a_faire' | 'en_cours' | 'termine';
        if (newStatus === 'en_cours' && !etape.dateDebut) {
          etape.dateDebut = new Date();
        } else if (newStatus === 'termine') {
          etape.dateFin = new Date();
        }
        this.reparation.progression = this.calculateProgress();
      }
    }
  }

  addComment(etapeId: string): void {
    if (this.reparation && this.newComment.trim()) {
      const etape = this.reparation.etapes.find(e => e._id === etapeId);
      if (etape) {
        etape.commentaires.push({
          _id: Date.now().toString(),
          texte: this.newComment.trim(),
          date: new Date(),
          auteur: 'Mécanicien',
          expanded: false
        });
        this.newComment = '';
      }
    }
  }

  uploadPhoto(): void {
    if (this.newPhoto && this.photoDescription.trim()) {
      setTimeout(() => {
        if (this.reparation) {
          this.reparation.photos.push({
            _id: Date.now().toString(),
            url: 'assets/mock/photos/new-photo.jpg',
            description: this.photoDescription.trim(),
            date: new Date(),
            type: this.photoType,
            etapeId: this.photoEtapeId || undefined
          });
          
          this.filterPhotosByEtape(this.photoFilterEtapeId);
          
          this.newPhoto = null;
          this.photoDescription = '';
          this.photoType = 'probleme';
          this.photoEtapeId = '';
        }
      }, 1000);
    } else if (!this.photoDescription.trim()) {
      this.error = "Veuillez ajouter une description pour la photo";
      setTimeout(() => this.error = null, 3000);
    }
  }

  calculateProgress(): number {
    if (!this.reparation || !this.reparation.etapes.length) return 0;
    const completedSteps = this.reparation.etapes.filter(etape => etape.status === 'termine').length;
    return Math.round((completedSteps / this.reparation.etapes.length) * 100);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'en_attente':
      case 'a_faire':
        return 'status-waiting';
      case 'en_cours':
        return 'status-in-progress';
      case 'en_pause':
        return 'status-paused';
      case 'termine':
        return 'status-completed';
      case 'annule':
        return 'status-cancelled';
      case 'valide':
        return 'status-approved';
      case 'refuse':
        return 'status-rejected';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'en_attente':
        return 'En attente';
      case 'en_cours':
        return 'En cours';
      case 'en_pause':
        return 'En pause';
      case 'termine':
        return 'Terminé';
      case 'annule':
        return 'Annulé';
      default:
        return status;
    }
  }

  goBack(): void {
    this.router.navigate(['/mecanicien/reparations']);
  }

  handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.newPhoto = input.files[0];
    }
  }

  updateStatusFilter(status: string): void {
    this.filterStatus = status;
  }

  toggleCommentairesVisibilite(etapeId: string): void {
    this.commentairesVisibles[etapeId] = !this.commentairesVisibles[etapeId];
  }

  toggleCommentExpand(commentaire: CommentaireEtape): void {
    commentaire.expanded = !commentaire.expanded;
  }
  
  getEtapeProgressThreshold(index: number): number {
    if (!this.reparation || this.reparation.etapes.length === 0) return 0;
    
    const totalEtapes = this.reparation.etapes.length;
    
    const segmentSize = 100 / (totalEtapes + 1);
    
    return Math.round((index + 1) * segmentSize);
  }

  filterPhotosByEtape(etapeId: string): void {
    if (!this.reparation) return;
    
    this.photoFilterEtapeId = etapeId;
    
    if (!etapeId) {
      this.filteredPhotos = [...this.reparation.photos];
    } else {
      this.filteredPhotos = this.reparation.photos.filter(photo => photo.etapeId === etapeId);
    }
  }

  countPhotosForEtape(etapeId: string): number {
    if (!this.reparation) return 0;
    return this.reparation.photos.filter(photo => photo.etapeId === etapeId).length;
  }
  
  getEtapeNomById(etapeId: string): string {
    if (!this.reparation) return '';
    const etape = this.reparation.etapes.find(e => e._id === etapeId);
    return etape ? etape.nom : '';
  }
} 