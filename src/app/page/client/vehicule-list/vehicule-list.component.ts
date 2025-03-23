import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Vehicule } from '../../../models/vehicule.model';
import { AuthService } from '../../../services/authentification/auth.service';
import { VehiculeService } from '../../../services/vehicules/vehicule.service';

@Component({
  selector: 'app-vehicule-list',
  templateUrl: './vehicule-list.component.html',
  styleUrls: ['./vehicule-list.component.css']
})
export class VehiculeListComponent implements OnInit {
  vehicules: Vehicule[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private vehiculeService: VehiculeService
  ) {}

  ngOnInit(): void {
    this.loadVehicules();
  }

  loadVehicules(): void {
    this.vehiculeService.getVehicules().subscribe({
      next: (response: any) => {
        if (response && Array.isArray(response.data)) {
          this.vehicules = response.data;
        } else {
          console.error('Données invalides :', response);
          this.vehicules = [];
        }
      },
      error: (err) => console.error('Erreur lors du chargement des véhicules', err)
    });
  }
  
  goToAddVehicule(): void {
    this.router.navigate(['/client/addvehicules']);
  }
  
  voirProblemes(immatricule: string): void {
    this.router.navigate(['/client/problemes', immatricule]);
  }
}
