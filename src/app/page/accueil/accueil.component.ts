import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Vehicule } from '../../models/vehicule.model';
import { AuthService } from '../../services/authentification/auth.service';
import { VehiculeService } from '../../services/vehicules/vehicule.service';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css']
})
export class AccueilComponent implements OnInit {

  constructor(private authService: AuthService,private router: Router,private vehiculeService: VehiculeService) {}
  vehicules: Vehicule[] = [];
  ngOnInit(): void {
    this.loadVehicules();
  }

  loadVehicules(): void {
    this.vehiculeService.getVehicules().subscribe({
      next: (response: any) => { // Mettre : any pour éviter l'erreur de typage
        if (response && Array.isArray(response.data)) {
          this.vehicules = response.data; // Extraire les véhicules de "data"
        } else {
          console.error('Données invalides :', response);
          this.vehicules = []; // Toujours assigner un tableau pour éviter d'autres erreurs
        }
      },
      error: (err) => console.error('Erreur lors du chargement des véhicules', err)
    });
  }  
  logout(): void {
    this.authService.logout();
  }
  goToAddVehicule(): void {
    this.router.navigate(['/client/addvehicules']);
  }
  voirProblemes(immatricule: string): void {
    this.router.navigate(['/problemes', immatricule]);
  }
}
