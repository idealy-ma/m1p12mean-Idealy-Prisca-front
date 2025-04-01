import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface CommentaireEtape {
  _id: string;
  texte: string;
  date: Date;
  auteur: string;
  isClient: boolean;
  expanded?: boolean;
}

interface Reparation {
  _id: string;
  vehicule: {
    marque: string;
    modele: string;
    immatricule: string;
    annee: number;
    kilometrage: number;
    photo?: string;
  };
  client: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
  garage: {
    nom: string;
    telephone: string;
    adresse: string;
  };
  mecanicien: {
    nom: string;
    prenom: string;
  };
  status: 'en_attente' | 'en_cours' | 'en_pause' | 'termine' | 'annule';
  dateDebut?: Date;
  dateFin?: Date;
  dateEstimee?: Date;
  description: string;
  etapes: {
    _id: string;
    nom: string;
    description: string;
    status: 'a_faire' | 'en_cours' | 'termine';
    dateDebut?: Date;
    dateFin?: Date;
    dateEstimee?: Date;
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
    detailPieces: {
      nom: string;
      quantite: number;
      prixUnitaire: number;
    }[];
    detailMain: {
      description: string;
      heures: number;
      tauxHoraire: number;
    }[];
  };
}

@Component({
  selector: 'app-client-reparation-details',
  templateUrl: './client-reparation-details.component.html',
  styleUrls: ['./client-reparation-details.component.css']
})
export class ClientReparationDetailsComponent implements OnInit {
  reparation: Reparation | null = null;
  loading: boolean = true;
  error: string | null = null;
  activeTab: string = 'timeline';
  newComment: string = '';
  commentairesVisibles: { [etapeId: string]: boolean } = {};
  etapeActive: string | null = null;
  filteredPhotos: any[] = [];
  photoFilterEtapeId: string = '';

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
      // Mock data pour la réparation
      this.reparation = {
        _id: id,
        vehicule: {
          marque: 'Renault',
          modele: 'Clio',
          immatricule: 'AB-123-CD',
          annee: 2018,
          kilometrage: 45000,
          photo: 'assets/mock/vehicles/clio.jpg'
        },
        client: {
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean.dupont@email.com',
          telephone: '06 12 34 56 78'
        },
        garage: {
          nom: 'Garage Central',
          telephone: '01 23 45 67 89',
          adresse: '15 rue des Mécaniciens, 75001 Paris'
        },
        mecanicien: {
          nom: 'Martin',
          prenom: 'Pierre'
        },
        status: 'en_cours',
        dateDebut: new Date('2024-03-20'),
        dateEstimee: new Date('2024-03-25'),
        description: 'Réparation suite à un problème de freinage. Vous avez signalé des bruits inhabituels lors du freinage.',
        etapes: [
          {
            _id: '1',
            nom: 'Diagnostic initial',
            description: 'Vérification complète du système de freinage',
            status: 'termine',
            dateDebut: new Date('2024-03-20T09:00:00'),
            dateFin: new Date('2024-03-20T10:30:00'),
            dateEstimee: new Date('2024-03-20T11:00:00'),
            commentaires: [
              {
                _id: '1',
                texte: 'Diagnostic terminé. Nous avons constaté une usure excessive des plaquettes de frein avant. Il est nécessaire de les remplacer pour votre sécurité.',
                date: new Date('2024-03-20T10:30:00'),
                auteur: 'Mécanicien',
                isClient: false,
                expanded: false
              },
              {
                _id: '2',
                texte: 'Est-ce que les disques doivent aussi être changés ou uniquement les plaquettes ?',
                date: new Date('2024-03-20T11:15:00'),
                auteur: 'Jean Dupont',
                isClient: true,
                expanded: false
              },
              {
                _id: '3',
                texte: 'Les disques présentent également des signes d\'usure, mais peuvent encore tenir quelques milliers de kilomètres. Nous recommandons toutefois de les changer en même temps pour un freinage optimal et une sécurité maximale.',
                date: new Date('2024-03-20T11:30:00'),
                auteur: 'Mécanicien',
                isClient: false,
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
            dateEstimee: new Date('2024-03-21T12:00:00'),
            commentaires: [
              {
                _id: '4',
                texte: 'Nous avons commencé le remplacement des plaquettes avant.',
                date: new Date('2024-03-20T11:00:00'),
                auteur: 'Mécanicien',
                isClient: false,
                expanded: false
              },
              {
                _id: '5',
                texte: 'Suite à votre accord, nous procédons également au remplacement des disques de frein avant.',
                date: new Date('2024-03-21T09:15:00'),
                auteur: 'Mécanicien',
                isClient: false,
                expanded: false
              }
            ]
          },
          {
            _id: '3',
            nom: 'Vérification des niveaux',
            description: 'Contrôle des niveaux de liquide de frein',
            status: 'a_faire',
            dateEstimee: new Date('2024-03-22T10:00:00'),
            commentaires: []
          },
          {
            _id: '4',
            nom: 'Test de route',
            description: 'Test de freinage sur route et vérification finale',
            status: 'a_faire',
            dateEstimee: new Date('2024-03-22T14:00:00'),
            commentaires: []
          }
        ],
        progression: 25,
        photos: [
          {
            _id: '1',
            url: 'assets/mock/photos/freins1.jpg',
            description: 'État des plaquettes avant - usure importante visible',
            date: new Date('2024-03-20T10:00:00'),
            type: 'probleme',
            etapeId: '1'
          },
          {
            _id: '2',
            url: 'assets/mock/photos/freins2.jpg',
            description: 'Disques de frein avant avec traces d\'usure',
            date: new Date('2024-03-20T10:15:00'),
            type: 'probleme',
            etapeId: '1'
          },
          {
            _id: '3',
            url: 'assets/mock/photos/freins3.jpg',
            description: 'Nouvelles plaquettes de frein avant installation',
            date: new Date('2024-03-21T09:30:00'),
            type: 'reparation',
            etapeId: '2'
          }
        ],
        devis: {
          montant: 450.00,
          date: new Date('2024-03-20'),
          status: 'valide',
          detailPieces: [
            {
              nom: 'Plaquettes de frein avant (paire)',
              quantite: 1,
              prixUnitaire: 120.00
            },
            {
              nom: 'Disques de frein avant (paire)',
              quantite: 1,
              prixUnitaire: 180.00
            }
          ],
          detailMain: [
            {
              description: 'Diagnostic système de freinage',
              heures: 0.5,
              tauxHoraire: 60.00
            },
            {
              description: 'Remplacement plaquettes et disques',
              heures: 2,
              tauxHoraire: 60.00
            }
          ]
        }
      };

      // Initialiser les commentaires visibles et les photos filtrées
      if (this.reparation) {
        // Par défaut, les commentaires sont masqués
        this.reparation.etapes.forEach(etape => {
          this.commentairesVisibles[etape._id] = false;
        });
        
        // Initialiser les photos filtrées
        this.filteredPhotos = [...this.reparation.photos];
        
        // Trouver l'étape active (en cours, ou la première à faire)
        const etapeEnCours = this.reparation.etapes.find(e => e.status === 'en_cours');
        if (etapeEnCours) {
          this.etapeActive = etapeEnCours._id;
        } else {
          const etapeAFaire = this.reparation.etapes.find(e => e.status === 'a_faire');
          if (etapeAFaire) {
            this.etapeActive = etapeAFaire._id;
          }
        }
      }
      
      this.loading = false;
    }, 1000);
  }

  addComment(etapeId: string): void {
    if (this.reparation && this.newComment.trim()) {
      const etape = this.reparation.etapes.find(e => e._id === etapeId);
      if (etape) {
        etape.commentaires.push({
          _id: Date.now().toString(),
          texte: this.newComment.trim(),
          date: new Date(),
          auteur: `${this.reparation.client.prenom} ${this.reparation.client.nom}`,
          isClient: true,
          expanded: false
        });
        this.newComment = '';
      }
    }
  }

  toggleCommentExpand(commentaire: CommentaireEtape): void {
    commentaire.expanded = !commentaire.expanded;
  }

  toggleCommentairesVisibilite(etapeId: string): void {
    this.commentairesVisibles[etapeId] = !this.commentairesVisibles[etapeId];
  }

  filterPhotosByEtape(etapeId: string): void {
    if (!this.reparation) return;
    
    this.photoFilterEtapeId = etapeId;
    
    if (!etapeId) {
      // Aucun filtre, afficher toutes les photos
      this.filteredPhotos = [...this.reparation.photos];
    } else {
      // Filtrer les photos par l'ID de l'étape
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

  getStatusLabel(status: string): string {
    switch (status) {
      case 'en_attente':
      case 'a_faire':
        return 'En attente';
      case 'en_cours':
        return 'En cours';
      case 'en_pause':
        return 'En pause';
      case 'termine':
        return 'Terminé';
      case 'annule':
        return 'Annulé';
      case 'valide':
        return 'Validé';
      case 'refuse':
        return 'Refusé';
      default:
        return status;
    }
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

  goBack(): void {
    this.router.navigate(['/client/reparations']);
  }

  calculateTotalPieces(): number {
    if (!this.reparation) return 0;
    return this.reparation.devis.detailPieces.reduce(
      (total, item) => total + (item.prixUnitaire * item.quantite), 0
    );
  }

  calculateTotalMainOeuvre(): number {
    if (!this.reparation) return 0;
    return this.reparation.devis.detailMain.reduce(
      (total, item) => total + (item.tauxHoraire * item.heures), 0
    );
  }
} 