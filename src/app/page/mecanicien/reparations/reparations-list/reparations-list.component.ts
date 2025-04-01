import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Reparation {
  _id: string;
  vehicule: {
    marque: string;
    modele: string;
    immatricule: string;
  };
  client: {
    nom: string;
    prenom: string;
    telephone: string;
  };
  status: 'en_attente' | 'en_cours' | 'en_pause' | 'termine' | 'annule';
  dateDebut?: Date;
  dateFin?: Date;
  etapes: {
    _id: string;
    nom: string;
    status: 'a_faire' | 'en_cours' | 'termine';
  }[];
  progression: number;
}

@Component({
  selector: 'app-reparations-list',
  templateUrl: './reparations-list.component.html',
  styleUrls: ['./reparations-list.component.css']
})
export class ReparationsListComponent implements OnInit {
  reparations: Reparation[] = [];
  filteredReparations: Reparation[] = [];
  loading: boolean = true;
  error: string | null = null;
  filterStatus: string = 'tous';
  filterDate: string = 'tous';
  searchTerm: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 1;
  totalItems: number = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.loadReparations();
    }, 1000);
  }

  loadReparations(): void {
    // Données mockées
    this.reparations = [
      {
        _id: '1',
        vehicule: {
          marque: 'Renault',
          modele: 'Clio',
          immatricule: 'AB-123-CD'
        },
        client: {
          nom: 'Dupont',
          prenom: 'Jean',
          telephone: '0123456789'
        },
        status: 'en_cours',
        dateDebut: new Date('2024-03-20'),
        etapes: [
          { _id: '1', nom: 'Diagnostic initial', status: 'termine' },
          { _id: '2', nom: 'Remplacement des freins', status: 'en_cours' },
          { _id: '3', nom: 'Vérification des niveaux', status: 'a_faire' },
          { _id: '4', nom: 'Test de route', status: 'a_faire' }
        ],
        progression: 25
      },
      {
        _id: '2',
        vehicule: {
          marque: 'Peugeot',
          modele: '208',
          immatricule: 'XY-789-ZW'
        },
        client: {
          nom: 'Martin',
          prenom: 'Sophie',
          telephone: '0123456789'
        },
        status: 'en_attente',
        dateDebut: new Date('2024-03-21'),
        etapes: [
          { _id: '1', nom: 'Diagnostic initial', status: 'a_faire' },
          { _id: '2', nom: 'Remplacement de la batterie', status: 'a_faire' },
          { _id: '3', nom: 'Test de charge', status: 'a_faire' }
        ],
        progression: 0
      },
      {
        _id: '3',
        vehicule: {
          marque: 'Citroën',
          modele: 'C3',
          immatricule: 'DE-456-FG'
        },
        client: {
          nom: 'Bernard',
          prenom: 'Marie',
          telephone: '0123456789'
        },
        status: 'en_pause',
        dateDebut: new Date('2024-03-19'),
        dateFin: new Date('2024-03-22'),
        etapes: [
          { _id: '1', nom: 'Diagnostic initial', status: 'termine' },
          { _id: '2', nom: 'Remplacement des plaquettes', status: 'termine' },
          { _id: '3', nom: 'Vérification des disques', status: 'termine' },
          { _id: '4', nom: 'Test de freinage', status: 'en_cours' }
        ],
        progression: 75
      },
      {
        _id: '4',
        vehicule: {
          marque: 'Volkswagen',
          modele: 'Golf',
          immatricule: 'GH-789-IJ'
        },
        client: {
          nom: 'Petit',
          prenom: 'Lucas',
          telephone: '0123456789'
        },
        status: 'termine',
        dateDebut: new Date('2024-03-18'),
        dateFin: new Date('2024-03-20'),
        etapes: [
          { _id: '1', nom: 'Diagnostic initial', status: 'termine' },
          { _id: '2', nom: 'Remplacement du filtre à huile', status: 'termine' },
          { _id: '3', nom: 'Vidange', status: 'termine' },
          { _id: '4', nom: 'Test moteur', status: 'termine' }
        ],
        progression: 100
      }
    ];
    this.filteredReparations = [...this.reparations];
    this.totalItems = this.filteredReparations.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.loading = false;
  }

  applyFilters(): void {
    this.filteredReparations = this.reparations.filter(reparation => {
      // Filtre par statut
      if (this.filterStatus !== 'tous' && reparation.status !== this.filterStatus) {
        return false;
      }

      // Filtre par date
      if (this.filterDate !== 'tous') {
        const today = new Date();
        const reparationDate = new Date(reparation.dateDebut || '');
        const diffTime = Math.abs(today.getTime() - reparationDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (this.filterDate) {
          case 'aujourdhui':
            if (diffDays > 1) return false;
            break;
          case 'semaine':
            if (diffDays > 7) return false;
            break;
          case 'mois':
            if (diffDays > 30) return false;
            break;
        }
      }

      // Recherche
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return (
          reparation.vehicule.marque.toLowerCase().includes(searchLower) ||
          reparation.vehicule.modele.toLowerCase().includes(searchLower) ||
          reparation.vehicule.immatricule.toLowerCase().includes(searchLower) ||
          reparation.client.nom.toLowerCase().includes(searchLower) ||
          reparation.client.prenom.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    this.totalItems = this.filteredReparations.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1; // Réinitialiser à la première page lors d'un nouveau filtre
  }

  get paginatedReparations(): Reparation[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredReparations.slice(startIndex, endIndex);
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'en_attente':
        return 'status-waiting';
      case 'en_cours':
        return 'status-in-progress';
      case 'en_pause':
        return 'status-paused';
      case 'termine':
        return 'status-completed';
      case 'annule':
        return 'status-cancelled';
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

  viewDetails(id: string): void {
    this.router.navigate(['/mecanicien/reparations', id]);
  }

  viewReparation(id: string): void {
    this.viewDetails(id);
  }

  updateStatus(id: string, newStatus: string): void {
    const reparation = this.reparations.find(r => r._id === id);
    if (reparation) {
      reparation.status = newStatus as Reparation['status'];
      if (newStatus === 'en_cours' && !reparation.dateDebut) {
        reparation.dateDebut = new Date();
      } else if (newStatus === 'termine') {
        reparation.dateFin = new Date();
      }
    }
  }

  calculateProgress(etapes: any[]): number {
    if (!etapes || etapes.length === 0) return 0;
    const completedSteps = etapes.filter(etape => etape.status === 'termine').length;
    return Math.round((completedSteps / etapes.length) * 100);
  }
} 