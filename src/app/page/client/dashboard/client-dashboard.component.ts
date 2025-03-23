import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Vehicule } from '../../../models/vehicule.model';
import { VehiculeService } from '../../../services/vehicules/vehicule.service';

@Component({
  selector: 'app-client-dashboard',
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.css']
})
export class ClientDashboardComponent implements OnInit {
  vehicules: Vehicule[] = [];
  totalVehicules: number = 0;
  totalDevis: number = 0;
  totalReparations: number = 0;
  totalFactures: number = 0;

  constructor(
    private router: Router,
    private vehiculeService: VehiculeService
  ) { }

  ngOnInit(): void {
    this.loadVehicules();
  }

  loadVehicules(): void {
    this.vehiculeService.getVehicules().subscribe({
      next: (response: any) => {
        if (response && Array.isArray(response.data)) {
          this.vehicules = response.data;
          this.totalVehicules = this.vehicules.length;
        } else {
          console.error('Données invalides :', response);
          this.vehicules = [];
          this.totalVehicules = 0;
        }
      },
      error: (err) => console.error('Erreur lors du chargement des véhicules', err)
    });
  }

  goToVehicules(): void {
    this.router.navigate(['/client/vehicules']);
  }

  goToAddVehicule(): void {
    this.router.navigate(['/client/addvehicules']);
  }

  goToDevis(): void {
    this.router.navigate(['/client/devis']);
  }

  goToReparations(): void {
    this.router.navigate(['/client/reparations']);
  }

  goToFactures(): void {
    this.router.navigate(['/client/factures']);
  }

  goToProfil(): void {
    this.router.navigate(['/client/profil']);
  }
}
