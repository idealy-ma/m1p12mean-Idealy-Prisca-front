import { Component, OnInit } from '@angular/core';
import { StatistiqueService, CaTotalData, CaParTypeData, StatutsDevisData } from '../../../services/statistique.service';
import { forkJoin } from 'rxjs';
import { Color, ScaleType } from '@swimlane/ngx-charts';

// Interface pour les données formatées ngx-charts
interface NgxChartDataPoint {
  name: string;
  value: number;
}

@Component({
  selector: 'app-statistique',
  templateUrl: './statistique.component.html',
  styleUrls: ['./statistique.component.css']
})
export class StatistiqueComponent implements OnInit {

  // Date filters
  dateDebut: string = '';
  dateFin: string = '';

  // Data properties
  caTotalData: CaTotalData | null = null;
  caParTypeDataRaw: CaParTypeData[] = [];
  statutsDevisDataRaw: StatutsDevisData | null = null;

  // Chart data
  caParTypeChartData: NgxChartDataPoint[] = [];
  statutsDevisChartData: NgxChartDataPoint[] = [];

  // Chart options (basic example)
  // Pie chart for CA par Type
  caParTypeColorScheme: Color = {
    name: 'caParTypeScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA', '#3f51b5', '#ff9800'] // Ajout couleurs
  };
  // Pie chart for Devis Status
  devisColorScheme: Color = {
    name: 'devisScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5AA454', '#A10A28', '#AAAAAA', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'] // Plus de couleurs
  };
  showChartLabels: boolean = true;
  explodeSlices: boolean = false;
  doughnut: boolean = false; // Mode camembert simple

  // State management
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private statistiqueService: StatistiqueService) {
    // Initialiser les dates pour le mois en cours par défaut
    this.setDefaultDates();
  }

  ngOnInit(): void {
    this.loadStatistiques();
  }

  setDefaultDates(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.dateDebut = this.formatDate(firstDayOfMonth);
    this.dateFin = this.formatDate(lastDayOfMonth);
  }

  formatDate(date: Date): string {
    // Format YYYY-MM-DD pour input type="date"
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  loadStatistiques(): void {
    this.isLoading = true;
    this.error = null;
    this.caTotalData = null;
    this.caParTypeDataRaw = [];
    this.statutsDevisDataRaw = null;
    this.caParTypeChartData = []; // Réinitialiser les données de graph
    this.statutsDevisChartData = [];

    // Utiliser forkJoin pour lancer les appels en parallèle
    forkJoin({
      caTotal: this.statistiqueService.getChiffreAffairesTotal(this.dateDebut, this.dateFin),
      caParType: this.statistiqueService.getChiffreAffairesParType(this.dateDebut, this.dateFin),
      statutsDevis: this.statistiqueService.getStatutsDevis(this.dateDebut, this.dateFin)
    }).subscribe({
      next: (results) => {
        this.caTotalData = results.caTotal;
        this.caParTypeDataRaw = results.caParType;
        this.statutsDevisDataRaw = results.statutsDevis;

        // Préparer les données pour les graphiques
        this.prepareChartData();

        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Erreur lors du chargement des statistiques', err);
        this.error = err.message || 'Une erreur technique est survenue.';
        this.isLoading = false;
      }
    });
  }

  // Méthode appelée quand les dates changent dans le template
  onDateChange(): void {
    this.loadStatistiques();
  }

  prepareChartData(): void {
    // Préparer données pour CA par Type (Pie Chart)
    if (this.caParTypeDataRaw && this.caParTypeDataRaw.length > 0) {
      this.caParTypeChartData = this.caParTypeDataRaw.map((item: CaParTypeData): NgxChartDataPoint => ({
        name: this.formatTypeLabel(item.type), // Formatter le label
        value: item.totalCA
      }));
    }

    // Préparer données pour Statuts Devis (Pie Chart)
    if (this.statutsDevisDataRaw && this.statutsDevisDataRaw.detailsParStatut.length > 0) {
      this.statutsDevisChartData = this.statutsDevisDataRaw.detailsParStatut.map((item: { statut: string; count: number }): NgxChartDataPoint => ({
        name: this.formatStatusLabel(item.statut), // Formatter le label
        value: item.count
      }));
    }
  }

  // Helper pour formater les labels des types de service/ligne
  formatTypeLabel(type: string): string {
    switch (type) {
      case 'service': return 'Services';
      case 'pack': return 'Packs';
      case 'piece': return 'Pièces';
      case 'main_oeuvre': return 'Main d\'œuvre'; // Attention aux apostrophes
      default: return type;
    }
  }

  // Helper pour formater les labels des statuts de devis
  formatStatusLabel(status: string): string {
     switch (status?.toLowerCase()) { // Ajouter toLowerCase pour robustesse
      case 'en_attente': return 'En attente';
      case 'valide': return 'Validé';
      case 'accepte': return 'Accepté';
      case 'refuse': return 'Refusé';
      case 'annule': return 'Annulé';
      default: return status || 'Inconnu'; // Gérer cas null/undefined
    }
  }

  // Méthodes pour les événements de graphiques (optionnel)
  onSelect(event: any): void {
    console.log('Chart Select Event:', event);
  }
}
