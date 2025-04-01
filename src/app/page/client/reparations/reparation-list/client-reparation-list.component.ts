import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Reparation {
  _id: string;
  vehicule: {
    marque: string;
    modele: string;
    immatricule: string;
    annee: number;
    photo?: string;
  };
  status: 'en_attente' | 'en_cours' | 'en_pause' | 'termine' | 'annule';
  dateDebut?: Date;
  dateFin?: Date;
  dateEstimee?: Date;
  description: string;
  progression: number;
  derniereMiseAJour: Date;
  nouveauxMessages: number;
  nouveauxMedia: number;
}

@Component({
  selector: 'app-client-reparation-list',
  templateUrl: './client-reparation-list.component.html',
  styleUrls: ['./client-reparation-list.component.css']
})
export class ClientReparationListComponent implements OnInit {
  reparations: Reparation[] = [];
  filteredReparations: Reparation[] = [];
  loading: boolean = true;
  error: string | null = null;
  searchTerm: string = '';
  statusFilter: string = 'tous';
  dateFilter: string = 'toutes';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;
  totalPages: number = 0;

  constructor(private router: Router) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.loadReparations();
    }, 1000);
  }

  loadReparations(): void {
    // Mock data pour les réparations du client
    this.reparations = [
      {
        _id: '1',
        vehicule: {
          marque: 'Renault',
          modele: 'Clio',
          immatricule: 'AB-123-CD',
          annee: 2018,
          photo: 'assets/mock/vehicles/clio.jpg'
        },
        status: 'en_cours',
        dateDebut: new Date('2024-03-20'),
        dateEstimee: new Date('2024-03-25'),
        description: 'Réparation système de freinage',
        progression: 25,
        derniereMiseAJour: new Date('2024-03-21T10:30:00'),
        nouveauxMessages: 2,
        nouveauxMedia: 1
      },
      {
        _id: '2',
        vehicule: {
          marque: 'Peugeot',
          modele: '208',
          immatricule: 'EF-456-GH',
          annee: 2020,
          photo: 'assets/mock/vehicles/208.jpg'
        },
        status: 'en_attente',
        dateDebut: new Date('2024-03-22'),
        dateEstimee: new Date('2024-03-28'),
        description: 'Révision complète',
        progression: 0,
        derniereMiseAJour: new Date('2024-03-22T08:15:00'),
        nouveauxMessages: 0,
        nouveauxMedia: 0
      },
      {
        _id: '3',
        vehicule: {
          marque: 'Citroën',
          modele: 'C3',
          immatricule: 'IJ-789-KL',
          annee: 2019,
          photo: 'assets/mock/vehicles/c3.jpg'
        },
        status: 'en_pause',
        dateDebut: new Date('2024-03-15'),
        dateEstimee: new Date('2024-03-23'),
        description: 'Remplacement embrayage',
        progression: 75,
        derniereMiseAJour: new Date('2024-03-20T14:45:00'),
        nouveauxMessages: 1,
        nouveauxMedia: 3
      },
      {
        _id: '4',
        vehicule: {
          marque: 'Volkswagen',
          modele: 'Golf',
          immatricule: 'MN-012-OP',
          annee: 2017,
          photo: 'assets/mock/vehicles/golf.jpg'
        },
        status: 'termine',
        dateDebut: new Date('2024-03-10'),
        dateFin: new Date('2024-03-15'),
        dateEstimee: new Date('2024-03-16'),
        description: 'Changement courroie distribution',
        progression: 100,
        derniereMiseAJour: new Date('2024-03-15T17:30:00'),
        nouveauxMessages: 0,
        nouveauxMedia: 2
      },
      {
        _id: '5',
        vehicule: {
          marque: 'Toyota',
          modele: 'Yaris',
          immatricule: 'QR-345-ST',
          annee: 2021,
          photo: 'assets/mock/vehicles/yaris.jpg'
        },
        status: 'termine',
        dateDebut: new Date('2024-02-28'),
        dateFin: new Date('2024-03-05'),
        dateEstimee: new Date('2024-03-07'),
        description: 'Réparation climatisation',
        progression: 100,
        derniereMiseAJour: new Date('2024-03-05T11:20:00'),
        nouveauxMessages: 0,
        nouveauxMedia: 0
      }
    ];

    this.filteredReparations = [...this.reparations];
    this.totalItems = this.filteredReparations.length;
    this.calculateTotalPages();
    this.loading = false;
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get paginatedReparations(): Reparation[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredReparations.slice(startIndex, startIndex + this.itemsPerPage);
  }

  applyFilters(): void {
    let result = [...this.reparations];

    // Filtre par statut
    if (this.statusFilter !== 'tous') {
      result = result.filter(reparation => reparation.status === this.statusFilter);
    }

    // Filtre par date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    if (this.dateFilter === 'aujourd_hui') {
      result = result.filter(reparation => {
        const updateDate = new Date(reparation.derniereMiseAJour);
        updateDate.setHours(0, 0, 0, 0);
        return updateDate.getTime() === today.getTime();
      });
    } else if (this.dateFilter === 'cette_semaine') {
      result = result.filter(reparation => 
        reparation.derniereMiseAJour >= lastWeekStart
      );
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(reparation => 
        reparation.vehicule.marque.toLowerCase().includes(term) ||
        reparation.vehicule.modele.toLowerCase().includes(term) ||
        reparation.vehicule.immatricule.toLowerCase().includes(term) ||
        reparation.description.toLowerCase().includes(term)
      );
    }

    this.filteredReparations = result;
    this.totalItems = this.filteredReparations.length;
    this.calculateTotalPages();
    this.currentPage = 1; // Retour à la première page après filtrage
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

  viewDetails(id: string): void {
    this.router.navigate(['/client/reparations', id]);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'en_pause': return 'En pause';
      case 'termine': return 'Terminée';
      case 'annule': return 'Annulée';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'en_attente': return 'status-waiting';
      case 'en_cours': return 'status-in-progress';
      case 'en_pause': return 'status-paused';
      case 'termine': return 'status-completed';
      case 'annule': return 'status-cancelled';
      default: return '';
    }
  }

  // Pour les badges de notification
  hasNotifications(reparation: Reparation): boolean {
    return reparation.nouveauxMessages > 0 || reparation.nouveauxMedia > 0;
  }

  getTotalNotifications(reparation: Reparation): number {
    return reparation.nouveauxMessages + reparation.nouveauxMedia;
  }
} 